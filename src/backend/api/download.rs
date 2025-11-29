use crate::backend::{error::AppError, extractor::storage::StoragePath};
use anyhow::Context;
use axum::{
  body::Body,
  http::{StatusCode, header::CONTENT_DISPOSITION},
  response::Response,
};
use tokio_util::io::ReaderStream;

pub async fn download_file(
  StoragePath(path): StoragePath,
) -> Result<axum::response::Response, AppError> {
  let path = path.get_path();
  if !path.exists() || !path.is_file() {
    log::error!("File not found: {:?}", path);
    return Err(AppError::new("File not found"));
  }
  let file = tokio::fs::File::open(&path)
    .await
    .context("Failed to open file")?;

  let file_size = file
    .metadata()
    .await
    .context("Failed to get file metadata")?
    .len();

  let file_name = path
    .file_name()
    .and_then(|name| name.to_str())
    .unwrap_or("download");
  let reader_stream = ReaderStream::new(file);
  let body = Body::from_stream(reader_stream);
  let content_disposition = format!("attachment; filename=\"{}\"", file_name);
  let response = Response::builder()
    .status(StatusCode::OK)
    .header("Content-Type", "application/octet-stream")
    .header(CONTENT_DISPOSITION, content_disposition)
    .header("Content-Length", file_size.to_string())
    .header("Cache-Control", "no-cache")
    .body(body)
    .context("Failed to build response")?;

  Ok(response)
}
