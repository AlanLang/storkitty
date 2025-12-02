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
use std::{
  collections::HashMap,
  sync::Mutex,
  time::{SystemTime, UNIX_EPOCH},
};
use webauthn_rs::prelude::*;

use crate::backend::{
  db::{self},
  error::AppError,
  state::AppState,
  utils::auth,
};

// State wrappers with expiration
#[derive(Clone)]
struct RegistrationStateEntry {
  state: PasskeyRegistration,
  expires_at: u64,
}

#[derive(Clone)]
struct AuthenticationStateEntry {
  state: DiscoverableAuthentication,
  expires_at: u64,
}

lazy_static! {
  static ref REGISTRATION_STATE: Mutex<HashMap<i64, RegistrationStateEntry>> =
    Mutex::new(HashMap::new());
  static ref AUTHENTICATION_STATE: Mutex<HashMap<String, AuthenticationStateEntry>> =
    Mutex::new(HashMap::new());
}

// Session timeout in seconds
const SESSION_TIMEOUT_SECS: u64 = 300; // 5 minutes

// UUID namespace for WebAuthn user IDs
const WEBAUTHN_NAMESPACE: uuid::Uuid = uuid::Uuid::from_bytes([
  0x6b, 0xa7, 0xb8, 0x10, 0x9d, 0xad, 0x11, 0xd1, 0x80, 0xb4, 0x00, 0xc0, 0x4f, 0xd4, 0x30, 0xc8,
]);

// Helper function to get current timestamp
fn current_timestamp() -> u64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .expect("Time went backwards")
    .as_secs()
}

// Helper function to clean expired states
fn clean_expired_registration_states() {
  let now = current_timestamp();
  let mut states = REGISTRATION_STATE
    .lock()
    .expect("Failed to lock registration state for cleanup");
  states.retain(|_, entry| entry.expires_at > now);
}

fn clean_expired_authentication_states() {
  let now = current_timestamp();
  let mut states = AUTHENTICATION_STATE
    .lock()
    .expect("Failed to lock authentication state for cleanup");
  states.retain(|_, entry| entry.expires_at > now);
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

  // Clean expired states periodically
  clean_expired_registration_states();

  // Check for existing registration in progress
  {
    let states = REGISTRATION_STATE
      .lock()
      .expect("Failed to lock registration state");
    if states.contains_key(&user_id) {
      return Err(AppError::new(
        "Registration already in progress. Please complete or wait for the current registration to expire.",
      ));
    }
  }

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

  // Generate user UUID using UUID v5 (namespace-based)
  let user_unique_id = uuid::Uuid::new_v5(&WEBAUTHN_NAMESPACE, user_id.to_string().as_bytes());

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

  let expires_at = current_timestamp() + SESSION_TIMEOUT_SECS;
  REGISTRATION_STATE
    .lock()
    .expect("Failed to lock registration state")
    .insert(
      user_id,
      RegistrationStateEntry {
        state: reg_state,
        expires_at,
      },
    );

  log::info!("Started passkey registration for user {}", user_id);

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
  let reg_entry = REGISTRATION_STATE
    .lock()
    .expect("Failed to lock registration state")
    .remove(&user_id)
    .ok_or_else(|| AppError::new("No registration in progress"))?;

  // Check if session has expired
  if reg_entry.expires_at < current_timestamp() {
    return Err(AppError::new("Registration session has expired"));
  }

  let passkey = state
    .webauthn
    .finish_passkey_registration(&req.credential, &reg_entry.state)
    .map_err(|e| AppError::new(&format!("Registration verification failed: {}", e)))?;

  let credential_id = BASE64.encode(passkey.cred_id().as_ref());
  let public_key = serde_json::to_vec(&passkey)
    .map_err(|e| AppError::new(&format!("Failed to serialize passkey: {}", e)))?;

  let conn = state.conn.lock().await;
  db::user::save_passkey(&conn, user_id, &credential_id, &public_key, &req.name)?;

  log::info!(
    "User {} successfully registered passkey '{}'",
    user_id,
    req.name
  );

  Ok(())
}

// Authentication handlers
#[axum::debug_handler(state = AppState)]
pub async fn authenticate_start(
  State(state): State<AppState>,
) -> Result<Json<AuthenticateStartResponse>, AppError> {
  // Clean expired states periodically
  clean_expired_authentication_states();

  // Use discoverable authentication for usernameless login
  // This requires the conditional-ui feature to be enabled
  let (rcr, auth_state) = state
    .webauthn
    .start_discoverable_authentication()
    .map_err(|e| AppError::new(&format!("Failed to start authentication: {}", e)))?;

  let session_id = uuid::Uuid::new_v4().to_string();
  let expires_at = current_timestamp() + SESSION_TIMEOUT_SECS;

  AUTHENTICATION_STATE
    .lock()
    .expect("Failed to lock authentication state")
    .insert(
      session_id.clone(),
      AuthenticationStateEntry {
        state: auth_state,
        expires_at,
      },
    );

  log::debug!(
    "Started discoverable authentication with session {}",
    session_id
  );

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
  let auth_entry = AUTHENTICATION_STATE
    .lock()
    .expect("Failed to lock authentication state")
    .remove(&req.session_id)
    .ok_or_else(|| AppError::new("Invalid or expired session"))?;

  // Check if session has expired
  if auth_entry.expires_at < current_timestamp() {
    log::warn!(
      "Authentication attempt with expired session: {}",
      req.session_id
    );
    return Err(AppError::new("Authentication session has expired"));
  }

  // First, identify which credential was used (extract credential_id)
  // This allows us to load only the specific passkey instead of all passkeys
  let (_user_unique_id, credential_id_bytes) = state
    .webauthn
    .identify_discoverable_authentication(&req.credential)
    .map_err(|e| {
      log::warn!("Failed to identify credential: {}", e);
      AppError::new("Authentication failed")
    })?;

  let credential_id = BASE64.encode(credential_id_bytes);
  
  // Load only the specific passkey that was used
  let conn = state.conn.lock().await;
  let passkey_db = db::user::get_passkey_by_credential_id(&conn, &credential_id).map_err(|e| {
    log::warn!(
      "Passkey lookup failed for credential {}: {}",
      credential_id,
      e
    );
    AppError::new("Authentication failed")
  })?;

  // Deserialize the passkey
  let passkey = serde_json::from_slice::<DiscoverableKey>(&passkey_db.public_key)
    .map_err(|e| {
      log::error!("Corrupted passkey id={}: {}", passkey_db.id, e);
      AppError::new("Authentication failed")
    })?;

  drop(conn);

  // Now verify the authentication with only the specific passkey
  let auth_result = state
    .webauthn
    .finish_discoverable_authentication(&req.credential, auth_entry.state, &[passkey])
    .map_err(|e| {
      log::warn!("Authentication verification failed: {}", e);
      AppError::new("Authentication failed")
    })?;

  // Update the passkey counter
  let conn = state.conn.lock().await;
  db::user::update_passkey_counter(&conn, &credential_id, auth_result.counter())?;

  let user = db::user::get_user_by_id(&conn, passkey_db.user_id)?;

  if user.disabled {
    log::warn!("Authentication attempt for disabled user: {}", user.id);
    return Err(AppError::new("User account is disabled"));
  }

  db::user::reset_login_failure(&conn, user.id)?;

  let token = auth::generate_token(user.id)?;
  let storages = db::storage::get_all_enabled_storage(&conn).context("Failed to get storages")?;

  log::info!("User {} authenticated successfully via passkey", user.id);

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
