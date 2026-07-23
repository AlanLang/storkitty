use anyhow::Context;
use axum::{
  extract::{Multipart, Path, State},
  http::{HeaderMap, StatusCode, header::AUTHORIZATION},
  response::{IntoResponse, Response},
};
use tokio::fs;

use crate::backend::{db, error::AppError, state::AppState, utils::path::split_path};

#[axum::debug_handler(state = AppState)]
pub async fn cli_upload(
  State(state): State<AppState>,
  Path(path): Path<String>,
  headers: HeaderMap,
  mut multipart: Multipart,
) -> Result<Response, AppError> {
  let token = match headers
    .get(AUTHORIZATION)
    .and_then(|h| h.to_str().ok())
    .and_then(|h| h.strip_prefix("Bearer "))
  {
    Some(t) => t.to_string(),
    None => return Ok(StatusCode::UNAUTHORIZED.into_response()),
  };

  let target_path = {
    let mut tokens = state.upload_tokens.lock().await;
    let entry = match tokens.get_mut(&token) {
      Some(e) => e,
      None => return Ok(StatusCode::UNAUTHORIZED.into_response()),
    };

    if entry.used || entry.created_at.elapsed().as_secs() > 3600 || entry.path != path {
      return Ok(StatusCode::UNAUTHORIZED.into_response());
    }

    entry.used = true;
    entry.path.clone()
  };

  let (storage_key, rel_path) = split_path(&target_path);
  let dir_path = {
    let conn = state.conn.lock().await;
    let storage = db::storage::get_storage_by_path(&conn, &storage_key)
      .context("存储不存在")?;

    if storage.disabled {
      return Ok(StatusCode::FORBIDDEN.into_response());
    }

    let mut p = std::path::PathBuf::from(&storage.local_path);
    if let Some(rel) = rel_path {
      p = p.join(rel);
    }
    p
  };

  while let Some(field) = multipart.next_field().await? {
    if field.name() == Some("file") {
      let filename = match field.file_name() {
        Some(n) => n.to_string(),
        None => continue,
      };
      let data = field.bytes().await?;
      fs::write(dir_path.join(&filename), data).await?;
      return Ok(StatusCode::OK.into_response());
    }
  }

  Ok((StatusCode::BAD_REQUEST, "No file field in request").into_response())
}
