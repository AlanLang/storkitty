use axum::{Router, routing::get};
use std::env;

#[tokio::main]
async fn main() {
  // 设置默认日志级别
  if env::var("RUST_LOG").is_err() {
    unsafe {
      env::set_var("RUST_LOG", "info");
    }
  }
  env_logger::init();

  let app = Router::new().route("/", get(root));
  let listener = tokio::net::TcpListener::bind("0.0.0.0:3330").await.unwrap();
  log::info!("Starting storkitty on port 3330");
  axum::serve(listener, app).await.unwrap();
}

async fn root() -> &'static str {
  "Hello, World!"
}
