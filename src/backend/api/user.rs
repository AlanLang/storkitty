use axum::{
  Json, Router,
  extract::State,
  http::HeaderMap,
  routing::{get, put},
};
use serde::{Deserialize, Serialize};

use crate::backend::{
  db::user,
  error::AppError,
  state::AppState,
  utils::auth,
};

pub fn create_user_router() -> Router<AppState> {
  Router::<AppState>::new()
    .route("/profile", get(get_profile))
    .route("/profile", put(update_profile))
    .route("/password", put(update_password))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserProfileResponse {
  pub id: i64,
  pub name: String,
  pub email: String,
  pub avatar: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProfileDto {
  pub name: String,
  pub avatar: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePasswordDto {
  pub old_password: String,
  pub new_password: String,
}

#[axum::debug_handler(state = AppState)]
pub async fn get_profile(
  State(state): State<AppState>,
  headers: HeaderMap,
) -> Result<Json<UserProfileResponse>, AppError> {
  let user_id = auth::verify_token(&headers)?;
  let conn = state.conn.lock().await;
  let user = user::get_user_by_id(&conn, user_id)?;

  Ok(Json(UserProfileResponse {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  }))
}

#[axum::debug_handler(state = AppState)]
pub async fn update_profile(
  State(state): State<AppState>,
  headers: HeaderMap,
  Json(dto): Json<UpdateProfileDto>,
) -> Result<(), AppError> {
  let user_id = auth::verify_token(&headers)?;
  let conn = state.conn.lock().await;

  user::update_user_profile(&conn, user_id, &dto.name, &dto.avatar)?;

  Ok(())
}

#[axum::debug_handler(state = AppState)]
pub async fn update_password(
  State(state): State<AppState>,
  headers: HeaderMap,
  Json(dto): Json<UpdatePasswordDto>,
) -> Result<(), AppError> {
  let user_id = auth::verify_token(&headers)?;
  let conn = state.conn.lock().await;

  // Verify old password
  let user = user::get_user_by_id(&conn, user_id)?;
  let is_valid =
    bcrypt::verify(&dto.old_password, &user.password).map_err(|_| AppError::new("密码验证失败"))?;

  if !is_valid {
    return Err(AppError::new("当前密码不正确"));
  }

  // Update to new password
  user::update_user_password(&conn, user_id, &dto.new_password)?;

  Ok(())
}
