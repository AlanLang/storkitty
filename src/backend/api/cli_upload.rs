use anyhow::Context;
use axum::{
  extract::{FromRequest, Multipart, Path, State},
  http::{HeaderMap, StatusCode, header::AUTHORIZATION},
  response::{IntoResponse, Response},
};
use sha2::{Digest, Sha256};
use tokio::{
  fs::{self, OpenOptions},
  io::AsyncWriteExt,
};

use crate::backend::{db, error::AppError, state::AppState, utils::path::split_path};

#[axum::debug_handler(state = AppState)]
pub async fn cli_upload(
  State(state): State<AppState>,
  Path(path): Path<String>,
  headers: HeaderMap,
  request: axum::extract::Request,
) -> Result<Response, AppError> {
  let token = match headers
    .get(AUTHORIZATION)
    .and_then(|h| h.to_str().ok())
    .and_then(|h| h.strip_prefix("Bearer "))
  {
    Some(t) => t.to_string(),
    None => return Ok(StatusCode::UNAUTHORIZED.into_response()),
  };

  let content_type = headers
    .get("Content-Type")
    .and_then(|h| h.to_str().ok())
    .unwrap_or("")
    .to_string();

  if content_type.starts_with("application/octet-stream") {
    handle_chunk(State(state), path, token, headers, request).await
  } else {
    let mut multipart = match Multipart::from_request(request, &state).await {
      Ok(m) => m,
      Err(_) => return Ok(StatusCode::BAD_REQUEST.into_response()),
    };
    handle_multipart(State(state), path, token, &mut multipart).await
  }
}

async fn validate_token_single_use(
  state: &AppState,
  token: &str,
  path: &str,
) -> Result<String, Response> {
  let mut tokens = state.upload_tokens.lock().await;
  let entry = match tokens.get_mut(token) {
    Some(e) => e,
    None => return Err(StatusCode::UNAUTHORIZED.into_response()),
  };
  if entry.used || entry.created_at.elapsed().as_secs() > 3600 || entry.path != path {
    return Err(StatusCode::UNAUTHORIZED.into_response());
  }
  entry.used = true;
  Ok(entry.path.clone())
}

async fn handle_multipart(
  State(state): State<AppState>,
  path: String,
  token: String,
  multipart: &mut Multipart,
) -> Result<Response, AppError> {
  let target_path = match validate_token_single_use(&state, &token, &path).await {
    Ok(p) => p,
    Err(r) => return Ok(r),
  };

  let dir_path = resolve_dir(&state, &target_path).await?;
  if dir_path.is_none() {
    return Ok(StatusCode::FORBIDDEN.into_response());
  }
  let dir_path = dir_path.unwrap();

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

async fn handle_chunk(
  State(state): State<AppState>,
  path: String,
  token: String,
  headers: HeaderMap,
  request: axum::extract::Request,
) -> Result<Response, AppError> {
  let chunk_index: usize = match headers
    .get("X-Chunk-Index")
    .and_then(|h| h.to_str().ok())
    .and_then(|s| s.parse().ok())
  {
    Some(v) => v,
    None => return Ok((StatusCode::BAD_REQUEST, "Missing X-Chunk-Index").into_response()),
  };
  let total_chunks: usize = match headers
    .get("X-Total-Chunks")
    .and_then(|h| h.to_str().ok())
    .and_then(|s| s.parse().ok())
  {
    Some(v) => v,
    None => return Ok((StatusCode::BAD_REQUEST, "Missing X-Total-Chunks").into_response()),
  };
  let filename_encoded = match headers.get("X-Filename").and_then(|h| h.to_str().ok()) {
    Some(v) => v.to_string(),
    None => return Ok((StatusCode::BAD_REQUEST, "Missing X-Filename").into_response()),
  };
  let filename = urlencoding::decode(&filename_encoded)
    .map_err(|_| AppError::new("Failed to decode filename"))?
    .to_string();

  // 验证 token：分片上传期间不标记为 used，仅在最后一片合并后标记
  let target_path = {
    let mut tokens = state.upload_tokens.lock().await;
    let entry = match tokens.get_mut(&token) {
      Some(e) => e,
      None => return Ok(StatusCode::UNAUTHORIZED.into_response()),
    };
    if entry.used || entry.created_at.elapsed().as_secs() > 3600 || entry.path != path {
      return Ok(StatusCode::UNAUTHORIZED.into_response());
    }
    // 第一片时绑定文件名，后续片必须同名
    if let Some(ref uploading) = entry.uploading_filename {
      if *uploading != filename {
        return Ok(StatusCode::UNAUTHORIZED.into_response());
      }
    } else {
      entry.uploading_filename = Some(filename.clone());
    }
    entry.path.clone()
  };

  let (root_path, dir_path) = match resolve_root_and_dir(&state, &target_path).await? {
    Some(p) => p,
    None => return Ok(StatusCode::FORBIDDEN.into_response()),
  };

  // 读取 body
  let body = axum::body::to_bytes(request.into_body(), usize::MAX).await?;

  // 计算 hash，保存分片
  let mut hasher = Sha256::new();
  hasher.update(&body);
  let chunk_hash = hex::encode(hasher.finalize());

  let chunks_dir = root_path.join(".storkitty").join("chunks").join(&filename);
  if !chunks_dir.exists() {
    fs::create_dir_all(&chunks_dir).await?;
  }

  let chunk_path = chunks_dir.join(format!("{}_{}", chunk_index, chunk_hash));
  if !chunk_path.exists() {
    fs::write(&chunk_path, body).await?;
  }

  // 检查是否所有分片都已到齐
  let mut found = vec![None; total_chunks];
  let mut entries = fs::read_dir(&chunks_dir).await?;
  while let Some(entry) = entries.next_entry().await? {
    let name = entry.file_name().to_string_lossy().to_string();
    if let Some((idx_str, _)) = name.split_once('_')
      && let Ok(idx) = idx_str.parse::<usize>()
        && idx < total_chunks {
          found[idx] = Some(entry.path());
        }
  }

  if found.iter().all(|c| c.is_some()) {
    // 合并
    let final_path = dir_path.join(&filename);
    let mut final_file = OpenOptions::new()
      .create(true)
      .write(true)
      .truncate(true)
      .open(&final_path)
      .await?;
    for chunk in found.iter().flatten() {
      final_file.write_all(&fs::read(chunk).await?).await?;
    }
    fs::remove_dir_all(&chunks_dir).await?;

    // 最后一片合并完成后标记 token 为已用
    state.upload_tokens.lock().await.get_mut(&token).map(|e| e.used = true);

    log::info!("CLI chunked upload complete: {}", filename);
  }

  Ok(StatusCode::OK.into_response())
}

async fn resolve_dir(
  state: &AppState,
  target_path: &str,
) -> anyhow::Result<Option<std::path::PathBuf>> {
  let (storage_key, rel_path) = split_path(target_path);
  let conn = state.conn.lock().await;
  let storage = db::storage::get_storage_by_path(&conn, &storage_key).context("存储不存在")?;
  if storage.disabled {
    return Ok(None);
  }
  let mut p = std::path::PathBuf::from(&storage.local_path);
  if let Some(rel) = rel_path {
    p = p.join(rel);
  }
  Ok(Some(p))
}

async fn resolve_root_and_dir(
  state: &AppState,
  target_path: &str,
) -> anyhow::Result<Option<(std::path::PathBuf, std::path::PathBuf)>> {
  let (storage_key, rel_path) = split_path(target_path);
  let conn = state.conn.lock().await;
  let storage = db::storage::get_storage_by_path(&conn, &storage_key).context("存储不存在")?;
  if storage.disabled {
    return Ok(None);
  }
  let root = std::path::PathBuf::from(&storage.local_path);
  let mut dir = root.clone();
  if let Some(rel) = rel_path {
    dir = dir.join(rel);
  }
  Ok(Some((root, dir)))
}
