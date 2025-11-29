use axum::Json;
use serde::Deserialize;
use tokio::fs;

use crate::backend::{db::DBConnection, error::AppError, extractor::storage::StoragePath};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteFileDto {
  targets: Vec<String>,
}

#[axum::debug_handler(state = DBConnection)]
pub async fn delete_file(
  StoragePath(local_path): StoragePath,
  Json(dto): Json<DeleteFileDto>,
) -> Result<(), AppError> {
  for target in dto.targets {
    let local_path = local_path.safe_join(&target)?;
    if !local_path.exists() {
      log::error!("file not found: {}", local_path.display());
      continue;
    }
    if local_path.is_dir() {
      log::error!("file is a directory: {}", local_path.display());
      continue;
    }
    fs::remove_file(&local_path).await?;
  }
  Ok(())
}
