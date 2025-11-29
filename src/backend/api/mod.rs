mod app;
mod download;
mod file;
mod folder;
mod login;
mod setup;
use axum::{
  Router, middleware,
  routing::{self, get_service},
};
use std::net::SocketAddr;
use tower_http::services::{ServeDir, ServeFile};

use crate::backend::{
  db::{DBConnection, init_db},
  extractor::auth::auth_middleware,
};

pub async fn start_server() -> anyhow::Result<()> {
  // 构建静态文件服务（用于 serve ./web 目录）
  let serve_dir = ServeDir::new("./web").not_found_service(ServeFile::new("./web/index.html"));
  let conn = init_db()?;

  let app = Router::<DBConnection>::new()
    .nest("/api", create_api_router())
    .route("/download/{*path}", routing::get(download::download_file))
    .fallback_service(get_service(serve_dir))
    .layer(axum::extract::DefaultBodyLimit::disable())
    .with_state(conn);

  let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
  let port = std::env::var("PORT")
    .unwrap_or_else(|_| "3330".to_string())
    .parse::<u16>()
    .unwrap_or(3330);
  let addr = format!("{}:{}", host, port)
    .parse::<SocketAddr>()
    .unwrap_or_else(|_| SocketAddr::from(([0, 0, 0, 0], port)));
  let listener = tokio::net::TcpListener::bind(addr).await?;
  log::info!("Server starting on port {}", port);
  axum::serve(listener, app).await?;

  Ok(())
}

fn create_api_router() -> Router<DBConnection> {
  Router::<DBConnection>::new()
    .nest("/app", app::create_app_router())
    .route("/setup", routing::post(setup::setup))
    .route("/login", routing::post(login::login))
    .route("/test", routing::get(|| async { "Hello, World!" }))
    .nest(
      "/file",
      file::create_file_router().layer(middleware::from_fn(auth_middleware)),
    )
    .nest(
      "/folder",
      folder::create_folder_router().layer(middleware::from_fn(auth_middleware)),
    )
}
