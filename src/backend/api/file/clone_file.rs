use chrono::Utc;
use tokio::fs;

use crate::backend::{error::AppError, extractor::storage::StoragePath};

pub async fn clone_file(StoragePath(local_path): StoragePath) -> Result<(), AppError> {
  let local_path = local_path.get_path();
  if !local_path.exists() {
    return Err(AppError::new("文件不存在"));
  }
  if !local_path.is_file() {
    return Err(AppError::new("不是文件"));
  }

  // 分割文件名和扩展名
  let file_name = local_path.file_name().unwrap_or_default();
  let extension = local_path.extension().unwrap_or_default();
  let new_file_name = format!(
    "{}_{}.{}",
    file_name.to_string_lossy(),
    Utc::now().format("%Y%m%d%H%M%S"),
    extension.to_string_lossy()
  );
  let new_file_path = local_path.with_file_name(new_file_name);
  if new_file_path.exists() {
    return Err(AppError::new("文件已存在"));
  }
  fs::copy(&local_path, &new_file_path).await?;
  Ok(())
}
