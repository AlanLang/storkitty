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

pub fn create_link_router() -> Router<AppState> {
  Router::<AppState>::new()
    .route("/", get(get_link_list))
    .route("/", post(create_link))
    .route("/{id}", delete(delete_link))
}

#[axum::debug_handler(state = AppState)]
async fn get_link_list(
  State(state): State<AppState>,
) -> Result<Json<Vec<db::link::LinkDatabase>>, AppError> {
  let conn = state.conn.lock().await;
  let links = db::link::get_all_links(&conn)?;
  Ok(Json(links))
}

#[axum::debug_handler(state = AppState)]
async fn create_link(
  State(state): State<AppState>,
  Json(dto): Json<db::link::CreateLinkDto>,
) -> Result<Json<()>, AppError> {
  let conn = state.conn.lock().await;
  db::link::create_link(&conn, dto)?;
  Ok(Json(()))
}

#[axum::debug_handler(state = AppState)]
async fn delete_link(
  State(state): State<AppState>,
  Path(id): Path<i64>,
) -> Result<Json<()>, AppError> {
  let conn = state.conn.lock().await;
  db::link::delete_link(&conn, id)?;
  Ok(Json(()))
}
