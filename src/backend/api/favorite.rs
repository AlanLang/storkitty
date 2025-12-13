use axum::{
  Json, Router,
  extract::{Path, State},
  routing::{delete, get, post},
};

use crate::backend::{
  db::{self},
  error::AppError,
  state::AppState,
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

#[axum::debug_handler(state = AppState)]
async fn create_favorite(
  State(state): State<AppState>,
  Json(dto): Json<db::favorite::CreateFavoriteDto>,
) -> Result<Json<()>, AppError> {
  let conn = state.conn.lock().await;
  db::favorite::create_favorite(&conn, dto)?;
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
