use anyhow::Context;
use axum::{Json, Router, extract::State, http::HeaderMap, routing::get};
use serde::Serialize;

use crate::backend::{
  api::login::StorageDto,
  db::{DBConnection, storage, user},
  error::AppError,
  utils::auth,
};

pub fn create_app_router() -> Router<DBConnection> {
  Router::<DBConnection>::new().route("/info", get(get_app_info))
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
pub struct AppInfoDto {
  version: String,
  initialed: bool,
  logged_in: bool,
  user: Option<UserResponse>,
  storages: Vec<StorageDto>,
}

pub async fn get_app_info(
  State(conn): State<DBConnection>,
  headers: HeaderMap,
) -> Result<Json<AppInfoDto>, AppError> {
  log::info!("get_app_info");

  let user_id = auth::verify_token(&headers).ok();
  let conn = conn.lock().await;
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
      })
      .collect(),
  }))
}
