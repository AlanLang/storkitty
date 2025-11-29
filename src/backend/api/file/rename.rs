use axum::Json;
use serde::Deserialize;
use tokio::fs;

use crate::backend::{error::AppError, extractor::storage::StoragePath};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenameFileDto {
  from: String,
  to: String,
}

pub async fn rename(
  StoragePath(local_path): StoragePath,
  Json(dto): Json<RenameFileDto>,
) -> Result<(), AppError> {
  let old_file_path = local_path.safe_join(&dto.from)?;
  // 判断文件是否存在
  if !old_file_path.exists() {
    return Err(AppError::new("文件不存在"));
  }
  // 判断文件是否是文件
  if !old_file_path.is_file() {
    return Err(AppError::new("目标不是文件"));
  }

  let new_file_path = local_path.safe_join(&dto.to)?;

  if new_file_path.exists() {
    return Err(AppError::new("文件已存在"));
  }

  fs::rename(&old_file_path, &new_file_path).await?;

  Ok(())
}
