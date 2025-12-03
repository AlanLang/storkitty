use std::path::PathBuf;

use anyhow::Context;
use axum::{body::Body, response::Response};
use reqwest::{
  StatusCode,
  header::{CONTENT_DISPOSITION, CONTENT_TYPE},
};
use tokio_util::io::ReaderStream;

use crate::backend::error::AppError;

/// 获取可在浏览器中直接预览的文件的 MIME 类型
pub fn get_previewable_mime_type(extension: &str) -> Option<&str> {
  match extension {
    // 图片文件
    "jpg" | "jpeg" => Some("image/jpeg"),
    "png" => Some("image/png"),
    "gif" => Some("image/gif"),
    "webp" => Some("image/webp"),
    "svg" => Some("image/svg+xml"),
    "bmp" => Some("image/bmp"),
    "ico" => Some("image/x-icon"),
    "avif" => Some("image/avif"),

    // PDF 文件
    "pdf" => Some("application/pdf"),

    // 视频文件
    "mp4" => Some("video/mp4"),
    "webm" => Some("video/webm"),
    "ogg" | "ogv" => Some("video/ogg"),
    "mov" => Some("video/quicktime"),

    // 音频文件
    "mp3" => Some("audio/mpeg"),
    "wav" => Some("audio/wav"),
    "oga" => Some("audio/ogg"),
    "m4a" => Some("audio/mp4"),
    "aac" => Some("audio/aac"),
    "flac" => Some("audio/flac"),
    "opus" => Some("audio/opus"),

    // 纯文本文件
    "txt" => Some("text/plain; charset=utf-8"),
    "md" => Some("text/markdown; charset=utf-8"),
    "log" => Some("text/plain; charset=utf-8"),
    "csv" => Some("text/csv; charset=utf-8"),

    // 代码文件
    "json" => Some("application/json; charset=utf-8"),
    "xml" => Some("application/xml; charset=utf-8"),
    "html" | "htm" => Some("text/html; charset=utf-8"),
    "css" => Some("text/css; charset=utf-8"),
    "js" | "mjs" => Some("text/javascript; charset=utf-8"),
    "ts" => Some("text/typescript; charset=utf-8"),
    "jsx" => Some("text/jsx; charset=utf-8"),
    "tsx" => Some("text/tsx; charset=utf-8"),
    "yaml" | "yml" => Some("text/yaml; charset=utf-8"),
    "toml" => Some("text/toml; charset=utf-8"),
    "ini" => Some("text/plain; charset=utf-8"),
    "conf" => Some("text/plain; charset=utf-8"),

    // 编程语言源代码
    "py" => Some("text/x-python; charset=utf-8"),
    "rs" => Some("text/x-rust; charset=utf-8"),
    "go" => Some("text/x-go; charset=utf-8"),
    "java" => Some("text/x-java; charset=utf-8"),
    "c" => Some("text/x-c; charset=utf-8"),
    "cpp" | "cc" | "cxx" => Some("text/x-c++; charset=utf-8"),
    "h" | "hpp" => Some("text/x-c++; charset=utf-8"),
    "sh" | "bash" => Some("text/x-shellscript; charset=utf-8"),
    "php" => Some("text/x-php; charset=utf-8"),
    "rb" => Some("text/x-ruby; charset=utf-8"),
    "swift" => Some("text/x-swift; charset=utf-8"),
    "kt" | "kts" => Some("text/x-kotlin; charset=utf-8"),
    "lua" => Some("text/x-lua; charset=utf-8"),
    "r" => Some("text/x-r; charset=utf-8"),
    "sql" => Some("text/x-sql; charset=utf-8"),

    _ => None,
  }
}

/// 打开可在浏览器中预览的文件
pub async fn open_previewable_file(
  file_path: &PathBuf,
  content_type: &str,
) -> Result<axum::response::Response, AppError> {
  // 打开文件
  let file = tokio::fs::File::open(&file_path)
    .await
    .context("无法打开文件")?;

  // 获取文件大小
  let file_size = file.metadata().await.context("无法获取文件元数据")?.len();

  // 获取文件名
  let file_name = file_path
    .file_name()
    .and_then(|name| name.to_str())
    .unwrap_or("file");

  // 创建流式响应
  let reader_stream = ReaderStream::new(file);
  let body = Body::from_stream(reader_stream);

  // 设置 inline 使浏览器直接显示文件，而不是下载
  let content_disposition = format!("inline; filename=\"{}\"", file_name);

  // 构建响应
  let response = Response::builder()
    .status(StatusCode::OK)
    .header(CONTENT_TYPE, content_type)
    .header(CONTENT_DISPOSITION, content_disposition)
    .header("Content-Length", file_size.to_string())
    .header("Cache-Control", "public, max-age=31536000") // 缓存一年
    .body(body)
    .context("无法构建响应")?;

  Ok(response)
}
