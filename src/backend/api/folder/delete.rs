use axum::Json;
use serde::Deserialize;
use tokio::fs;

use crate::backend::{error::AppError, extractor::storage::StoragePath, state::AppState};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteFolderDto {
  targets: Vec<String>,
}

#[axum::debug_handler(state = AppState)]
pub async fn delete_folder(
  StoragePath(local_path): StoragePath,
  Json(dto): Json<DeleteFolderDto>,
) -> Result<(), AppError> {
  for target in dto.targets {
    let local_path = local_path.safe_join(&target)?;
    if !local_path.exists() {
      log::error!("folder not found: {}", local_path.display());
      continue;
    }
    if local_path.is_file() {
      log::error!("folder is a file: {}", local_path.display());
      continue;
    }
    fs::remove_dir_all(&local_path).await?;
  }
  Ok(())
}
