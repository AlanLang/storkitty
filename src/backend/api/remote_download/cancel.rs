use crate::backend::api::remote_download::REMOTE_DOWNLOAD_STATE;
use axum::{Json, extract::Path};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct CancelRemoteDownloadRequest {
  pub id: String,
}

pub async fn cancel_remote_download(
  Path(_path): Path<String>,
  Json(payload): Json<CancelRemoteDownloadRequest>,
) -> Json<()> {
  let mut state = REMOTE_DOWNLOAD_STATE.lock().unwrap();

  // Find the task
  if let Some(pos) = state.iter().position(|t| t.id == payload.id) {
    let task = &state[pos];

    // If task is active (downloading or pending), cancel it
    if task.status == "downloading" || task.status == "pending" {
      // Abort the task if it has an abort handle
      if let Some(abort_handle) = &state[pos].abort_handle {
        abort_handle.abort();
      }
      state[pos].status = "cancelled".to_string();
      state[pos].abort_handle = None;
    } else {
      // If task is finished (completed, failed, or cancelled), remove it
      state.remove(pos);
    }
  }

  Json(())
}
