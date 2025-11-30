use crate::backend::api::remote_download::REMOTE_DOWNLOAD_STATE;
use axum::Json;

pub async fn clear_remote_download() -> Json<()> {
  let mut state = REMOTE_DOWNLOAD_STATE.lock().unwrap();
  state.retain(|task| task.status == "downloading" || task.status == "pending");
  Json(())
}
