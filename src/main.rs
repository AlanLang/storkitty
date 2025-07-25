mod backend;

use axum::{Router, routing::get_service};
use std::{net::SocketAddr, sync::Arc};
use tower_http::services::{ServeDir, ServeFile};
use tower_http::cors::{CorsLayer, Any};

use backend::{auth::AuthService, config::Config};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
  // 设置日志级别
  if std::env::var("RUST_LOG").is_err() {
    unsafe {
      std::env::set_var("RUST_LOG", "info");
    }
  }
  env_logger::init();

  // 加载配置
  let config = Arc::new(Config::load()?);
  let auth_service = Arc::new(AuthService::new(config));

  // 构建静态文件服务（用于 serve ./web 目录）
  let serve_dir = ServeDir::new("./web").not_found_service(ServeFile::new("./web/index.html"));

  // 创建API路由
  let api_router = Router::new()
    .nest("/auth", backend::auth::auth_router(auth_service));

  // 主应用路由
  let app = Router::new()
    .nest("/api", api_router)
    .fallback_service(get_service(serve_dir))
    .layer(
      CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any),
    );

  let addr = SocketAddr::from(([0, 0, 0, 0], 3330));
  let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
  log::info!("Listening on {}", addr);
  axum::serve(listener, app).await.unwrap();
  
  Ok(())
}
