mod app;
mod download;
mod favorite;
mod file;
mod folder;
mod login;
mod open;
mod remote_download;
mod setup;
mod storage;
mod user;
mod webauthn;
use axum::{
  Router, middleware,
  routing::{self, get_service},
};
use std::{net::SocketAddr, sync::Arc};
use tower_http::services::{ServeDir, ServeFile};

use crate::backend::{
  db::init_db, extractor::auth::auth_middleware, state::AppState, webauthn::init_webauthn,
};

pub async fn start_server() -> anyhow::Result<()> {
  let conn = init_db()?;
  let webauthn = init_webauthn()?;

  let state = AppState {
    conn,
    webauthn: Arc::new(webauthn),
  };

  let app = Router::<AppState>::new()
    .nest("/api", create_api_router())
    .route("/download/{*path}", routing::get(download::download_file))
    .route("/open/{*path}", routing::get(open::file_open))
    .fallback_service(
      get_service(ServeDir::new("./web").fallback(ServeFile::new("./web/index.html")))
        .handle_error(|_| async {
          (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            "Internal server error",
          )
        }),
    )
    .layer(axum::extract::DefaultBodyLimit::disable())
    .with_state(state);

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

fn create_api_router() -> Router<AppState> {
  Router::<AppState>::new()
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
    .nest(
      "/remote_download",
      remote_download::create_remote_download_router().layer(middleware::from_fn(auth_middleware)),
    )
    .nest(
      "/user",
      user::create_user_router().layer(middleware::from_fn(auth_middleware)),
    )
    .nest(
      "/storage",
      storage::create_storage_router().layer(middleware::from_fn(auth_middleware)),
    )
    .nest(
      "/favorite",
      favorite::create_favorite_router().layer(middleware::from_fn(auth_middleware)),
    )
    .nest("/webauthn", webauthn::create_webauthn_router())
}
