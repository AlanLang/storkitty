use axum::{Router, routing::get_service};
use std::net::SocketAddr;
use tower_http::services::{ServeDir, ServeFile};

#[tokio::main]
async fn main() {
  // 设置日志级别
  if std::env::var("RUST_LOG").is_err() {
    unsafe {
      std::env::set_var("RUST_LOG", "info");
    }
  }
  env_logger::init();

  // 构建静态文件服务（用于 serve ./web 目录）
  let serve_dir = ServeDir::new("./web").not_found_service(ServeFile::new("./web/index.html"));

  let app = Router::new().fallback_service(get_service(serve_dir));

  let addr = SocketAddr::from(([0, 0, 0, 0], 3330));
  let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
  log::info!("Listening on {}", addr);
  axum::serve(listener, app).await.unwrap();
}
