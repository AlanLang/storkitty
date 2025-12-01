mod cancel;
mod clear;
mod create;
mod list;

use crate::backend::state::AppState;
use axum::{
  Router,
  routing::{delete, get, post},
};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tokio::task::AbortHandle;

#[derive(Debug, Clone)]
pub struct RemoteDownloadTask {
  pub id: String,
  pub url: String,
  pub path: String,
  pub name: String,
  pub size: Option<i64>,
  pub downloaded: i64,
  pub status: String, // "pending", "downloading", "completed", "failed", "cancelled"
  pub created_at: i64,
  pub error: Option<String>,
  pub abort_handle: Option<AbortHandle>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RemoteDownloadTaskDto {
  pub id: String,
  pub url: String,
  pub path: String,
  pub name: String,
  pub size: Option<i64>,
  pub downloaded: i64,
  pub status: String,
  pub created_at: i64,
  pub error: Option<String>,
}

pub type RemoteDownloadState = Arc<Mutex<Vec<RemoteDownloadTask>>>;

lazy_static! {
  pub static ref REMOTE_DOWNLOAD_STATE: RemoteDownloadState = Arc::new(Mutex::new(Vec::new()));
}

pub fn create_remote_download_router() -> Router<AppState> {
  Router::<AppState>::new()
    .route("/{*path}", post(create::create_remote_download))
    .route("/{*path}", get(list::list_remote_download))
    .route("/{*path}", delete(cancel::cancel_remote_download))
    .route("/clear", post(clear::clear_remote_download))
}
