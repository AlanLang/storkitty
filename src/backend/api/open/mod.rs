mod excalidraw;
mod markdown;
mod mermaid;
mod previewable;

use crate::backend::{error::AppError, extractor::storage::StoragePath};
use anyhow::Context;

pub async fn file_open(
  StoragePath(path): StoragePath,
) -> Result<axum::response::Response, AppError> {
  let file_path = path.get_path();

  if excalidraw::is_excalidraw_file(&file_path) {
    return excalidraw::open_excalidraw_file(&file_path).await;
  }

  if markdown::is_markdown_file(&file_path) {
    return markdown::open_markdown_file(&file_path).await;
  }

  if mermaid::is_mermaid_file(&file_path) {
    return mermaid::open_mermaid_file(&file_path).await;
  }

  // 检查文件是否存在且是文件
  if !file_path.exists() || !file_path.is_file() {
    log::error!("文件不存在: {:?}", file_path);
    return Err(AppError::new("文件不存在"));
  }

  // 获取文件扩展名
  let extension = file_path
    .extension()
    .and_then(|ext| ext.to_str())
    .map(|s| s.to_lowercase())
    .context("无法识别的文件")?;

  // 检查是否为可预览的文件类型（图片、PDF 等）
  if let Some(mime_type) = previewable::get_previewable_mime_type(&extension) {
    return previewable::open_previewable_file(&file_path, mime_type).await;
  }

  // 其他不支持在浏览器中直接预览的文件类型
  log::error!("不支持的文件类型: {:?}", extension);
  Err(AppError::new("不支持的文件类型"))
}
