use std::path::PathBuf;

use crate::backend::{
  db::storage::{self, CreateStorageDto, StorageDatabase, UpdateStorageDto},
  error::AppError,
  state::AppState,
};
use anyhow::Context;
use axum::{
  Json,
  extract::{Path, State},
  routing::{post, put},
};

use axum::{
  Router,
  routing::{delete, get},
};
use tokio::fs;

pub fn create_storage_router() -> Router<AppState> {
  Router::<AppState>::new()
    .route("/", get(get_storage_list))
    .route("/", post(create_storage))
    .route("/{id}", delete(delete_storage))
    .route("/{id}", put(update_storage))
    .route("/disable/{id}", post(disable_storage))
}

#[axum::debug_handler(state = AppState)]
async fn get_storage_list(
  State(state): State<AppState>,
) -> Result<Json<Vec<StorageDatabase>>, AppError> {
  let conn = state.conn.lock().await;
  let storages = storage::get_all_storage(&conn).context("获取存储失败")?;
  Ok(Json(storages))
}

#[axum::debug_handler(state = AppState)]
async fn delete_storage(
  State(state): State<AppState>,
  Path(id): Path<i64>,
) -> Result<Json<()>, AppError> {
  let conn = state.conn.lock().await;
  storage::delete(&conn, id)?;
  Ok(Json(()))
}

#[axum::debug_handler(state = AppState)]
async fn create_storage(
  State(state): State<AppState>,
  Json(dto): Json<CreateStorageDto>,
) -> Result<Json<()>, AppError> {
  let local_path = dto.local_path.clone();
  // 判断路径是否存在
  if !PathBuf::from(&local_path).exists() {
    fs::create_dir_all(&local_path).await?;
  }

  let conn = state.conn.lock().await;
  storage::create_storage(&conn, dto)?;
  Ok(Json(()))
}

#[axum::debug_handler(state = AppState)]
async fn update_storage(
  State(state): State<AppState>,
  Path(id): Path<i64>,
  Json(dto): Json<UpdateStorageDto>,
) -> Result<Json<()>, AppError> {
  let conn = state.conn.lock().await;
  storage::update_storage(&conn, id, dto)?;
  Ok(Json(()))
}

#[axum::debug_handler(state = AppState)]
async fn disable_storage(
  State(state): State<AppState>,
  Path(id): Path<i64>,
) -> Result<Json<()>, AppError> {
  let conn = state.conn.lock().await;
  storage::disable_storage(&conn, id)?;
  Ok(Json(()))
}
