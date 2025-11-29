use axum::{
  Json,
  http::StatusCode,
  response::{IntoResponse, Response},
};
use serde::Deserialize;
use tokio::{
  fs::{self, OpenOptions},
  io::AsyncWriteExt,
};

use crate::backend::{db::DBConnection, error::AppError, extractor::storage::Storage};

#[axum::debug_handler(state = DBConnection)]
pub async fn upload_file(
  Storage {
    path: local_path,
    root,
  }: Storage,
  headers: axum::http::HeaderMap,
  body: axum::body::Bytes,
) -> Result<impl IntoResponse, AppError> {
  if !local_path.0.exists() {
    if let Some(parent) = local_path.0.parent() {
      if !parent.exists() {
        return Err(AppError::new("Target directory does not exist"));
      }
    }
  }

  let chunk_index: usize = headers
    .get("X-Chunk-Index")
    .and_then(|h| h.to_str().ok())
    .and_then(|s| s.parse().ok())
    .ok_or_else(|| AppError::new("Missing X-Chunk-Index header"))?;

  let total_chunks: usize = headers
    .get("X-Total-Chunks")
    .and_then(|h| h.to_str().ok())
    .and_then(|s| s.parse().ok())
    .ok_or_else(|| AppError::new("Missing X-Total-Chunks header"))?;

  let filename_encoded = headers
    .get("X-Filename")
    .and_then(|h| h.to_str().ok())
    .ok_or_else(|| AppError::new("Missing X-Filename header"))?;

  // Decode filename
  let filename = urlencoding::decode(filename_encoded)
    .map_err(|_| AppError::new("Failed to decode filename"))?
    .to_string();

  // Calculate chunk hash
  use sha2::{Digest, Sha256};
  let mut hasher = Sha256::new();
  hasher.update(&body);
  let chunk_hash = hex::encode(hasher.finalize());

  // 1. Prepare temp directory: root/.storkitty/chunks/{filename}
  let storkitty_dir = root.join(".storkitty");
  let chunks_root = storkitty_dir.join("chunks");
  let file_chunks_dir = chunks_root.join(&filename);

  if !file_chunks_dir.exists() {
    fs::create_dir_all(&file_chunks_dir).await?;
  }

  // 2. Save chunk: {index}_{chunk_hash}
  let chunk_filename = format!("{}_{}", chunk_index, chunk_hash);
  let chunk_path = file_chunks_dir.join(&chunk_filename);

  if !chunk_path.exists() {
    fs::write(&chunk_path, body).await?;
    log::info!("Saved chunk: {}", chunk_filename);
  }

  // 3. Check completion
  // We need to find if we have files for all indices 0..total_chunks
  let mut found_chunks = vec![None; total_chunks];
  let mut entries = fs::read_dir(&file_chunks_dir).await?;

  while let Some(entry) = entries.next_entry().await? {
    let name = entry.file_name().to_string_lossy().to_string();
    // name format: {index}_{hash}
    if let Some((idx_str, _)) = name.split_once('_') {
      if let Ok(idx) = idx_str.parse::<usize>() {
        if idx < total_chunks {
          found_chunks[idx] = Some(entry.path());
        }
      }
    }
  }

  if found_chunks.iter().all(|c| c.is_some()) {
    let save_file_path = local_path.0.join(&filename);
    log::info!(
      "All chunks received, merging to {}",
      save_file_path.display()
    );

    let mut final_file = OpenOptions::new()
      .create(true)
      .write(true)
      .truncate(true)
      .open(&save_file_path)
      .await?;

    for path in found_chunks.iter().flatten() {
      let chunk_data = fs::read(path).await?;
      final_file.write_all(&chunk_data).await?;
    }

    // Cleanup
    fs::remove_dir_all(&file_chunks_dir).await?;
    log::info!("Merge complete");
  }

  Ok(
    Response::builder()
      .status(StatusCode::OK)
      .body(axum::body::Body::from(chunk_hash))
      .unwrap_or_default(),
  )
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AbortFileDto {
  file: String,
}

#[axum::debug_handler(state = DBConnection)]
pub async fn abort_file(
  Storage { path: _, root }: Storage,
  Json(dto): Json<AbortFileDto>,
) -> Result<impl IntoResponse, AppError> {
  let storkitty_dir = root.join(".storkitty");
  let chunks_root = storkitty_dir.join("chunks");
  let file_chunks_dir = chunks_root.join(&dto.file);
  log::info!("Abort file: {}", file_chunks_dir.display());
  // 等待 3 秒钟
  tokio::time::sleep(tokio::time::Duration::from_millis(3000)).await;
  fs::remove_dir_all(&file_chunks_dir).await?;
  Ok(())
}
