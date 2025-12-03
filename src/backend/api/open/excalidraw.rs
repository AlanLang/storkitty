use std::path::Path;

use askama::Template;
use axum::{body::Body, response::Response};
use reqwest::{StatusCode, header::CONTENT_TYPE};

use crate::backend::error::AppError;

// 定义模板数据结构：与 templates/index.html 绑定
#[derive(Template)]
#[template(path = "excalidraw.html")]
struct IndexTemplate<'a> {
  title: &'a str,
  data: &'a str,
}

pub fn is_excalidraw_file(path: &Path) -> bool {
  path
    .extension()
    .and_then(|ext| ext.to_str())
    .map(|ext| ext.to_lowercase())
    == Some("excalidraw".to_string())
}

pub async fn open_excalidraw_file(path: &Path) -> Result<axum::response::Response, AppError> {
  let template = IndexTemplate {
    title: "Excalidraw",
    data: "{}",
  };
  let html = template.render().unwrap();
  Ok(
    Response::builder()
      .status(StatusCode::OK)
      .header(CONTENT_TYPE, "text/html")
      .body(Body::from(html))
      .unwrap(),
  )
}
