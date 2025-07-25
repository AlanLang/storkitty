mod backend;

use axum::{Router, routing::get_service};
use std::{net::SocketAddr, sync::Arc};
use tower_http::services::{ServeDir, ServeFile};
use tower_http::cors::{CorsLayer, Any};

use backend::{auth::AuthService, config::Config, files::FileService};

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
  let auth_service = Arc::new(AuthService::new(config.clone()));
  let file_service = Arc::new(FileService::new(config.clone(), auth_service.clone()));

  // 构建静态文件服务（用于 serve ./web 目录）
  let serve_dir = ServeDir::new("./web").not_found_service(ServeFile::new("./web/index.html"));

  // 创建API路由
  let api_router = Router::new()
    .nest("/auth", backend::auth::auth_router(auth_service))
    .nest("/files", backend::files::files_router(file_service));

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

  // 使用配置文件中的服务器设置
  let addr = format!("{}:{}", config.server.host, config.server.port)
    .parse::<SocketAddr>()
    .unwrap_or_else(|_| SocketAddr::from(([0, 0, 0, 0], config.server.port)));
  let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
  log::info!("Listening on {}", addr);
  axum::serve(listener, app).await.unwrap();
  
  Ok(())
}
