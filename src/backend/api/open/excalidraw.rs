use askama::Template;
use axum::{Router, response::Html, routing::get};

// 定义模板数据结构：与 templates/index.html 绑定
#[derive(Template)]
#[template(path = "excalidraw.html")]
struct IndexTemplate<'a> {
  title: &'a str,
  name: &'a str,
}

pub fn is_excalidraw_file(path: &Path) -> bool {
  path
    .extension()
    .and_then(|ext| ext.to_str())
    .map(|ext| ext.to_lowercase())
    == Some("excalidraw")
}

pub async fn open_excalidraw_file(path: &Path) -> Result<axum::response::Response, AppError> {
  let template = IndexTemplate {
    title: "Excalidraw",
    name: path
      .file_name()
      .unwrap_or_default()
      .to_str()
      .unwrap_or_default(),
  };
  let html = template.render().unwrap();
  Ok(
    Response::builder()
      .status(StatusCode::OK)
      .header(CONTENT_TYPE, "text/html")
      .body(html)
      .unwrap(),
  )
}
