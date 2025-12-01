use anyhow::Context;
use axum::{
  Json, Router,
  extract::State,
  http::HeaderMap,
  routing::{get, post},
};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Mutex};
use webauthn_rs::prelude::*;

use crate::backend::{
  db::{self},
  error::AppError,
  state::AppState,
  utils::auth,
};

lazy_static! {
  static ref REGISTRATION_STATE: Mutex<HashMap<i64, PasskeyRegistration>> =
    Mutex::new(HashMap::new());
  static ref AUTHENTICATION_STATE: Mutex<HashMap<String, PasskeyAuthentication>> =
    Mutex::new(HashMap::new());
}

pub fn create_webauthn_router() -> Router<AppState> {
  Router::<AppState>::new()
    .route("/register/start", post(register_start))
    .route("/register/finish", post(register_finish))
    .route("/authenticate/start", post(authenticate_start))
    .route("/authenticate/finish", post(authenticate_finish))
    .route("/list", get(list_passkeys))
    .route("/delete/{id}", post(delete_passkey))
}

// Registration types
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterStartResponse {
  options: serde_json::Value,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterFinishRequest {
  name: String,
  credential: RegisterPublicKeyCredential,
}

// Authentication types
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthenticateStartResponse {
  options: RequestChallengeResponse,
  session_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthenticateFinishRequest {
  session_id: String,
  credential: PublicKeyCredential,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthenticateFinishResponse {
  token: String,
  user: UserDto,
  storages: Vec<StorageDto>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserDto {
  pub id: i64,
  pub name: String,
  pub avatar: String,
  pub email: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageDto {
  pub id: i64,
  pub name: String,
  pub path: String,
  pub sort_index: i64,
}

// List passkeys
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeyDto {
  id: i64,
  name: String,
  created_at: String,
}

// Registration handlers
#[axum::debug_handler(state = AppState)]
pub async fn register_start(
  State(state): State<AppState>,
  headers: HeaderMap,
) -> Result<Json<RegisterStartResponse>, AppError> {
  let user_id = auth::verify_token(&headers)?;
  let conn = state.conn.lock().await;
  let user = db::user::get_user_by_id(&conn, user_id)?;

  // Get existing credentials for this user
  let existing_passkeys = db::user::get_passkeys_by_user_id(&conn, user_id)?;
  let exclude_credentials: Vec<CredentialID> = existing_passkeys
    .iter()
    .filter_map(|pk| BASE64.decode(&pk.credential_id).ok())
    .map(CredentialID::from)
    .collect();

  drop(conn);

  // Generate user UUID from user_id for Resident Key
  use sha2::{Digest, Sha256};
  let mut hasher = Sha256::new();
  hasher.update(user_id.to_le_bytes());
  hasher.update(b"webauthn-user-id");
  let hash = hasher.finalize();
  let mut uuid_bytes = [0u8; 16];
  uuid_bytes.copy_from_slice(&hash[..16]);
  let user_unique_id = Uuid::from_bytes(uuid_bytes);

  let (ccr, reg_state) = state
    .webauthn
    .start_passkey_registration(
      user_unique_id,
      &user.email,
      &user.name,
      Some(exclude_credentials),
    )
    .map_err(|e| AppError::new(&format!("Failed to start registration: {}", e)))?;

  // Modify response to require Resident Key
  let mut ccr_json = serde_json::to_value(&ccr)
    .map_err(|e| AppError::new(&format!("Failed to serialize registration options: {}", e)))?;

  if let Some(public_key) = ccr_json.get_mut("publicKey") {
    if let Some(auth_sel) = public_key.get_mut("authenticatorSelection") {
      auth_sel["residentKey"] = serde_json::json!("required");
      auth_sel["requireResidentKey"] = serde_json::json!(true);
    } else {
      public_key["authenticatorSelection"] = serde_json::json!({
        "residentKey": "required",
        "requireResidentKey": true,
        "userVerification": "required"
      });
    }
  }

  REGISTRATION_STATE
    .lock()
    .unwrap()
    .insert(user_id, reg_state);

  Ok(Json(RegisterStartResponse { options: ccr_json }))
}

#[axum::debug_handler(state = AppState)]
pub async fn register_finish(
  State(state): State<AppState>,
  headers: HeaderMap,
  Json(req): Json<RegisterFinishRequest>,
) -> Result<(), AppError> {
  let user_id = auth::verify_token(&headers)?;

  // Retrieve registration state
  let reg_state = REGISTRATION_STATE
    .lock()
    .unwrap()
    .remove(&user_id)
    .ok_or_else(|| AppError::new("No registration in progress"))?;

  let passkey = state
    .webauthn
    .finish_passkey_registration(&req.credential, &reg_state)
    .map_err(|e| AppError::new(&format!("Registration verification failed: {}", e)))?;

  let credential_id = BASE64.encode(passkey.cred_id().as_ref());
  let public_key = serde_json::to_vec(&passkey)
    .map_err(|e| AppError::new(&format!("Failed to serialize passkey: {}", e)))?;

  let conn = state.conn.lock().await;
  db::user::save_passkey(&conn, user_id, &credential_id, &public_key, &req.name)?;

  Ok(())
}

// Authentication handlers
#[axum::debug_handler(state = AppState)]
pub async fn authenticate_start(
  State(state): State<AppState>,
) -> Result<Json<AuthenticateStartResponse>, AppError> {
  // Load all passkeys for verification (required by webauthn-rs)
  let conn = state.conn.lock().await;
  let passkeys_db = db::user::get_all_passkeys(&conn)?;

  let passkeys: Vec<webauthn_rs::prelude::Passkey> = passkeys_db
    .iter()
    .filter_map(|pk| {
      serde_json::from_slice::<webauthn_rs::prelude::Passkey>(&pk.public_key)
        .map_err(|e| log::error!("Failed to deserialize passkey: {}", e))
        .ok()
    })
    .collect();

  drop(conn);

  let (mut rcr, auth_state) = state
    .webauthn
    .start_passkey_authentication(&passkeys)
    .map_err(|e| AppError::new(&format!("Failed to start authentication: {}", e)))?;

  // Clear allowCredentials for Resident Key mode
  rcr.public_key.allow_credentials = Vec::new();

  let session_id = uuid::Uuid::new_v4().to_string();
  AUTHENTICATION_STATE
    .lock()
    .unwrap()
    .insert(session_id.clone(), auth_state);

  Ok(Json(AuthenticateStartResponse {
    options: rcr,
    session_id,
  }))
}

#[axum::debug_handler(state = AppState)]
pub async fn authenticate_finish(
  State(state): State<AppState>,
  Json(req): Json<AuthenticateFinishRequest>,
) -> Result<Json<AuthenticateFinishResponse>, AppError> {
  let auth_state = AUTHENTICATION_STATE
    .lock()
    .unwrap()
    .remove(&req.session_id)
    .ok_or_else(|| AppError::new("Invalid or expired session"))?;

  let auth_result = state
    .webauthn
    .finish_passkey_authentication(&req.credential, &auth_state)
    .map_err(|e| AppError::new(&format!("Authentication failed: {}", e)))?;

  let credential_id = BASE64.encode(auth_result.cred_id().as_ref());
  let conn = state.conn.lock().await;

  let passkey_db = db::user::get_passkey_by_credential_id(&conn, &credential_id)
    .map_err(|_| AppError::new("Authentication failed: passkey not found"))?;

  db::user::update_passkey_counter(&conn, &credential_id, auth_result.counter())?;

  let user = db::user::get_user_by_id(&conn, passkey_db.user_id)?;

  if user.disabled {
    return Err(AppError::new("User account is disabled"));
  }

  db::user::reset_login_failure(&conn, user.id)?;

  let token = auth::generate_token(user.id)?;
  let storages = db::storage::get_all_enabled_storage(&conn).context("Failed to get storages")?;

  Ok(Json(AuthenticateFinishResponse {
    token,
    user: UserDto {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      email: user.email,
    },
    storages: storages
      .into_iter()
      .map(|storage| StorageDto {
        id: storage.id,
        name: storage.name,
        path: storage.path,
        sort_index: storage.sort_index,
      })
      .collect(),
  }))
}

// Management handlers
#[axum::debug_handler(state = AppState)]
pub async fn list_passkeys(
  State(state): State<AppState>,
  headers: HeaderMap,
) -> Result<Json<Vec<PasskeyDto>>, AppError> {
  let user_id = auth::verify_token(&headers)?;
  let conn = state.conn.lock().await;
  let passkeys = db::user::get_passkeys_by_user_id(&conn, user_id)?;

  let passkey_dtos = passkeys
    .into_iter()
    .map(|pk| PasskeyDto {
      id: pk.id,
      name: pk.name,
      created_at: pk.created_at,
    })
    .collect();

  Ok(Json(passkey_dtos))
}

#[axum::debug_handler(state = AppState)]
pub async fn delete_passkey(
  State(state): State<AppState>,
  headers: HeaderMap,
  axum::extract::Path(id): axum::extract::Path<i64>,
) -> Result<(), AppError> {
  let user_id = auth::verify_token(&headers)?;
  let conn = state.conn.lock().await;
  db::user::delete_passkey(&conn, id, user_id)?;
  Ok(())
}
