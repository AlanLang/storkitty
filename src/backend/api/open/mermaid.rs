use std::path::Path;

use askama::Template;
use axum::{body::Body, response::Response};
use reqwest::{StatusCode, header::CONTENT_TYPE};

use crate::backend::error::AppError;

// 定义模板数据结构：与 templates/index.html 绑定
#[derive(Template)]
#[template(path = "mermaid.html.askama")]
struct IndexTemplate<'a> {
  title: &'a str,
  data: &'a str,
}

pub fn is_mermaid_file(path: &Path) -> bool {
  path
    .extension()
    .and_then(|ext| ext.to_str())
    .map(|ext| ext.to_lowercase())
    == Some("mermaid".to_string())
}

pub async fn open_mermaid_file(path: &Path) -> Result<axum::response::Response, AppError> {
  let content = tokio::fs::read_to_string(path).await.map_err(|e| {
    log::error!("Failed to read excalidraw file: {}", e);
    AppError::new("Failed to read excalidraw file")
  })?;

  let template = IndexTemplate {
    title: path
      .file_name()
      .unwrap_or_default()
      .to_str()
      .unwrap_or("mermaid"),
    data: &content,
  };
  let html = template.render().map_err(|e| {
    log::error!("Failed to render excalidraw template: {}", e);
    AppError::new("Failed to render excalidraw template")
  })?;
  Ok(
    Response::builder()
      .status(StatusCode::OK)
      .header(CONTENT_TYPE, "text/html")
      .body(Body::from(html))
      .unwrap(),
  )
}
