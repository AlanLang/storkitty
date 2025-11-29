use crate::backend::{error::AppError, extractor::storage::StoragePath};
use axum::{Json, body::Body, http::header, response::Response};
use serde::Deserialize;
use tokio::fs;
use tokio_util::io::ReaderStream;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveFileContentDto {
  pub content: String,
}

pub async fn get_content(StoragePath(local_path): StoragePath) -> Result<Response, AppError> {
  let local_path = local_path.get_path();
  if !local_path.exists() {
    return Err(AppError::new("文件不存在"));
  }
  if local_path.is_dir() {
    return Err(AppError::new("目标是文件夹"));
  }

  let mime_type = match local_path.extension().and_then(|ext| ext.to_str()) {
    Some("jpg") | Some("jpeg") => "image/jpeg",
    Some("png") => "image/png",
    Some("gif") => "image/gif",
    Some("webp") => "image/webp",
    Some("svg") => "image/svg+xml",
    Some("ico") => "image/x-icon",
    Some("bmp") => "image/bmp",
    _ => "text/plain",
  };

  let file = tokio::fs::File::open(&local_path).await?;
  let stream = ReaderStream::new(file);
  let body = Body::from_stream(stream);

  let response = Response::builder()
    .header(header::CONTENT_TYPE, mime_type)
    .body(body)
    .map_err(|e| AppError::new(&e.to_string()))?;

  Ok(response)
}

pub async fn save_content(
  StoragePath(local_path): StoragePath,
  Json(dto): Json<SaveFileContentDto>,
) -> Result<(), AppError> {
  let local_path = local_path.get_path();
  if !local_path.exists() {
    return Err(AppError::new("文件不存在"));
  }
  if local_path.is_dir() {
    return Err(AppError::new("目标是文件夹"));
  }
  fs::write(&local_path, dto.content).await?;
  Ok(())
}
