use crate::backend::api::remote_download::{REMOTE_DOWNLOAD_STATE, RemoteDownloadTaskDto};
use axum::{Json, extract::Path};

pub async fn list_remote_download(Path(_path): Path<String>) -> Json<Vec<RemoteDownloadTaskDto>> {
  let state = REMOTE_DOWNLOAD_STATE.lock().unwrap();
  // Return tasks sorted by creation time descending, convert to DTO
  let mut tasks: Vec<RemoteDownloadTaskDto> = state
    .iter()
    .map(|task| RemoteDownloadTaskDto {
      id: task.id.clone(),
      url: task.url.clone(),
      path: task.path.clone(),
      name: task.name.clone(),
      size: task.size,
      downloaded: task.downloaded,
      status: task.status.clone(),
      created_at: task.created_at,
      error: task.error.clone(),
    })
    .collect();
  tasks.sort_by(|a, b| b.created_at.cmp(&a.created_at));
  Json(tasks)
}
