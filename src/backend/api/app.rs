use anyhow::Context;
use axum::{Json, Router, extract::State, http::HeaderMap, routing::get};
use serde::Serialize;

use crate::backend::{
  api::login::StorageDto,
  db::{favorite, storage, user},
  error::AppError,
  state::AppState,
  utils::auth,
};

pub fn create_app_router() -> Router<AppState> {
  Router::<AppState>::new().route("/info", get(get_app_info))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserResponse {
  pub id: i64,
  pub name: String,
  pub avatar: String,
  pub email: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FavoriteDto {
  pub id: i64,
  pub name: String,
  pub path: String,
  pub icon: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfoDto {
  version: String,
  initialed: bool,
  logged_in: bool,
  user: Option<UserResponse>,
  storages: Vec<StorageDto>,
  has_favorites: bool,
}

pub async fn get_app_info(
  State(state): State<AppState>,
  headers: HeaderMap,
) -> Result<Json<AppInfoDto>, AppError> {
  log::info!("get_app_info");

  let conn = state.conn.lock().await;
  let user_id = auth::verify_token(&headers).ok();
  let is_no_user = user::is_no_user(&conn)?;

  let logged_user = if let Some(user_id) = user_id {
    match user::get_user_by_id(&conn, user_id) {
      Ok(user) => Some(UserResponse {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        email: user.email,
      }),
      Err(_) => None,
    }
  } else {
    None
  };

  let storages = storage::get_all_enabled_storage(&conn).context("获取存储失败")?;
  let has_favorites = if let Some(user_id) = user_id {
    !favorite::get_all_favorites(&conn, user_id)
      .unwrap_or_default().is_empty()
  } else {
    false
  };
  Ok(Json(AppInfoDto {
    version: env!("CARGO_PKG_VERSION").to_string(),
    initialed: !is_no_user,
    logged_in: logged_user.is_some(),
    user: logged_user,
    storages: storages
      .into_iter()
      .map(|storage| StorageDto {
        id: storage.id,
        name: storage.name,
        path: storage.path,
        sort_index: storage.sort_index,
        icon: storage.icon,
      })
      .collect(),
    has_favorites,
  }))
}
