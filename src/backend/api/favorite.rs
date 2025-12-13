use anyhow::Context;
use axum::{
  Json, Router,
  extract::{Path, State},
  http::HeaderMap,
  routing::{delete, get, post},
};
use serde::{Deserialize, Serialize};

use crate::backend::{
  db::{self},
  error::AppError,
  state::AppState,
  utils,
};

pub fn create_favorite_router() -> Router<AppState> {
  Router::<AppState>::new()
    .route("/", get(get_favorite_list))
    .route("/", post(create_favorite))
    .route("/{id}", delete(delete_favorite))
}

#[axum::debug_handler(state = AppState)]
async fn get_favorite_list(
  State(state): State<AppState>,
) -> Result<Json<Vec<db::favorite::FavoriteDatabase>>, AppError> {
  let conn = state.conn.lock().await;
  let favorites = db::favorite::get_all_favorites(&conn)?;
  Ok(Json(favorites))
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFavorite {
  pub name: String,
  pub storage: String,
  pub path: String,
  pub icon: String,
}

#[axum::debug_handler(state = AppState)]
async fn create_favorite(
  State(state): State<AppState>,
  headers: HeaderMap,
  Json(dto): Json<CreateFavorite>,
) -> Result<Json<()>, AppError> {
  let user_id = utils::auth::verify_token(&headers).context("用户未登录")?;
  let conn = state.conn.lock().await;
  let storage = db::storage::get_storage_by_path(&conn, &dto.storage)?;
  let favorite = db::favorite::CreateFavoriteDto {
    name: dto.name,
    path: dto.path,
    icon: dto.icon,
    user_id,
    storage_id: storage.id,
  };
  db::favorite::create_favorite(&conn, favorite)?;
  Ok(Json(()))
}

#[axum::debug_handler(state = AppState)]
async fn delete_favorite(
  State(state): State<AppState>,
  Path(id): Path<i64>,
) -> Result<Json<()>, AppError> {
  let conn = state.conn.lock().await;
  db::favorite::delete_favorite(&conn, id)?;
  Ok(Json(()))
}
