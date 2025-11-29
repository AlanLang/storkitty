use crate::backend::{error::AppError, extractor::storage::StoragePath, utils};
use axum::Json;
use serde::Deserialize;
use tokio::fs;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFileDto {
  pub name: String,
}

pub async fn create_file(
  StoragePath(local_path): StoragePath,
  Json(dto): Json<CreateFileDto>,
) -> Result<(), AppError> {
  let name = dto.name;
  if !utils::validate::validate_name(&name) {
    return Err(AppError::new("文件名称不合法"));
  }
  let local_path = local_path.safe_join(&name)?;
  if local_path.exists() {
    return Err(AppError::new("文件已存在"));
  }
  fs::File::create(&local_path).await?;
  Ok(())
}
