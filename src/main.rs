mod backend;

use axum::extract::Path;
use axum::{Router, routing::get_service};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::services::{ServeDir, ServeFile};
use tower_http::cors::{CorsLayer, Any};

use backend::{auth::AuthService, config::Config, files::FileService, upload::UploadService, setup::SetupService, download::DownloadManager};

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
  let config = Arc::new(RwLock::new(Config::load()?));
  let auth_service = Arc::new(AuthService::new(config.clone()));
  let file_service = Arc::new(FileService::new(config.clone(), auth_service.clone()));
  let download_file_service = Arc::new(FileService::new(config.clone(), auth_service.clone()));
  let upload_service = Arc::new(UploadService::new(config.clone(), auth_service.clone()));
  let setup_service = Arc::new(SetupService::new(config.clone(), auth_service.clone()));
  let download_manager = Arc::new(DownloadManager::new(config.clone(), auth_service.clone()));

  // 创建API路由
  let max_file_size = {
    let config = config.read().await;
    config.files.max_file_size
  };
  
  let api_router = Router::new()
    .nest("/auth", backend::auth::auth_router(auth_service))
    .nest("/files", backend::files::files_router(file_service))
    .nest("/upload", backend::upload::upload_router(upload_service.clone(), max_file_size))
    .nest("/setup", backend::setup::setup_router(setup_service))
    .nest("/download", backend::download::download_router(download_manager));



  // 主应用路由 - 使用 Axum 推荐的 SPA 模式
  let app = Router::new()
    .nest("/api", api_router)
    .route(
      "/download/{space}/{*file_path}",
      axum::routing::get({
        async move |Path((space, file_path)): Path<(String, String)>| {
          download_file_service.download_file_with_directory(&space, file_path).await
        }
      }),
    )
    .fallback_service(
      get_service(
        ServeDir::new("./web")
          .fallback(ServeFile::new("./web/index.html"))
      )
      .handle_error(|_| async {
        (axum::http::StatusCode::INTERNAL_SERVER_ERROR, "Internal server error")
      })
    )
    .layer(
      CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any),
    );

  // 启动清理任务
  let cleanup_store = upload_service.get_store();
  tokio::spawn(async move {
    let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(3600)); // 每小时清理一次
    loop {
      interval.tick().await;
      backend::upload::cleanup_expired_sessions(cleanup_store.clone()).await;
    }
  });

  // 使用配置文件中的服务器设置
  let (host, port) = {
    let config = config.read().await;
    (config.server.host.clone(), config.server.port)
  };
  let addr = format!("{}:{}", host, port)
    .parse::<SocketAddr>()
    .unwrap_or_else(|_| SocketAddr::from(([0, 0, 0, 0], port)));
  let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
  log::info!("Listening on {}", addr);
  axum::serve(listener, app).await.unwrap();
  
  Ok(())
}
