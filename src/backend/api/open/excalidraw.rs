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
  let content = tokio::fs::read_to_string(path).await.map_err(|e| {
    log::error!("Failed to read excalidraw file: {}", e);
    AppError::new("Failed to read excalidraw file")
  })?;

  let template = IndexTemplate {
    title: "Excalidraw",
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

#[cfg(test)]
mod tests {
  use super::*;
  use std::env;
  use uuid::Uuid;

  #[tokio::test]
  async fn test_open_excalidraw_file() {
    // Create a temporary file with some JSON content
    let mut path = env::temp_dir();
    path.push(format!("{}.excalidraw", Uuid::new_v4()));

    let json_content =
      r#"{"type": "excalidraw", "version": 2, "source": "https://excalidraw.com"}"#;
    tokio::fs::write(&path, json_content).await.unwrap();

    // Call the function
    let result = open_excalidraw_file(&path).await;

    // Clean up
    let _ = tokio::fs::remove_file(&path).await;

    let response = result.map_err(|_| "failed").unwrap();

    // Check status code
    assert_eq!(response.status(), StatusCode::OK);

    // Check content type
    assert_eq!(response.headers().get(CONTENT_TYPE).unwrap(), "text/html");

    // Read body
    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
      .await
      .unwrap();
    let body_str = String::from_utf8(body_bytes.to_vec()).unwrap();

    // Verify the JSON content is injected
    assert!(body_str.contains(json_content));
  }
}
