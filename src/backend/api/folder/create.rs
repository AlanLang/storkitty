use axum::Json;
use serde::Deserialize;
use tokio::fs;

use crate::backend::{db::DBConnection, error::AppError, extractor::storage::StoragePath, utils};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFolderDto {
  name: String,
}

#[axum::debug_handler(state = DBConnection)]
pub async fn create_folder(
  StoragePath(local_path): StoragePath,
  Json(dto): Json<CreateFolderDto>,
) -> Result<(), AppError> {
  let name = dto.name;

  if !utils::validate::validate_name(&name) {
    return Err(AppError::new("文件夹名称不合法"));
  }
  let local_path = local_path.safe_join(&name)?;
  if local_path.exists() {
    return Err(AppError::new("目录已存在"));
  }

  log::info!("create_folder: {}", local_path.display());

  fs::create_dir_all(&local_path).await?;

  Ok(())
}
