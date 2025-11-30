use crate::backend::api::remote_download::{REMOTE_DOWNLOAD_STATE, RemoteDownloadTask};
use crate::backend::extractor::storage::StoragePath;
use anyhow::Context;
use axum::Json;
use futures_util::StreamExt;
use serde::Deserialize;
use tokio::io::AsyncWriteExt;

#[derive(Deserialize)]
pub struct CreateRemoteDownloadRequest {
  pub urls: Vec<String>,
}

pub async fn create_remote_download(
  StoragePath(local_path): StoragePath,
  Json(payload): Json<CreateRemoteDownloadRequest>,
) -> Json<Vec<String>> {
  let mut ids = Vec::new();

  // local_path is the directory where files should be downloaded
  let target_dir = local_path.get_path();

  // Ensure the target directory exists
  let _ = tokio::fs::create_dir_all(&target_dir)
    .await
    .context("Failed to create directory");

  for url in payload.urls {
    let file_name = url
      .split('/')
      .next_back()
      .unwrap_or("unknown_file")
      .to_string();
    let file_path = target_dir.join(&file_name);

    let id = uuid::Uuid::new_v4().to_string();
    ids.push(id.clone());

    let task = RemoteDownloadTask {
      id: id.clone(),
      url: url.clone(),
      path: target_dir.to_string_lossy().to_string(),
      name: file_name.clone(),
      size: None,
      downloaded: 0,
      status: "pending".to_string(),
      created_at: chrono::Utc::now().timestamp_millis(),
      error: None,
      abort_handle: None,
    };

    {
      let mut state = REMOTE_DOWNLOAD_STATE.lock().unwrap();
      state.push(task);
    }

    let state = REMOTE_DOWNLOAD_STATE.clone();
    let url = url.clone();
    let file_path = file_path.clone();
    let id_clone = id.clone();

    let task_handle = tokio::spawn(async move {
      let client = reqwest::Client::new();

      // Update status to downloading
      {
        let mut state = state.lock().unwrap();
        if let Some(task) = state.iter_mut().find(|t| t.id == id_clone) {
          task.status = "downloading".to_string();
        }
      }

      match client.get(&url).send().await {
        Ok(response) => {
          let total_size = response.content_length();

          {
            let mut state = state.lock().unwrap();
            if let Some(task) = state.iter_mut().find(|t| t.id == id_clone) {
              task.size = total_size.map(|s| s as i64);
            }
          }

          let mut file = match tokio::fs::File::create(&file_path).await {
            Ok(f) => f,
            Err(e) => {
              let mut state = state.lock().unwrap();
              if let Some(task) = state.iter_mut().find(|t| t.id == id_clone) {
                task.status = "failed".to_string();
                task.error = Some(e.to_string());
                task.abort_handle = None;
              }
              return;
            }
          };

          let mut stream = response.bytes_stream();
          let mut downloaded: u64 = 0;

          while let Some(item) = stream.next().await {
            match item {
              Ok(chunk) => {
                if let Err(e) = file.write_all(&chunk).await {
                  let mut state = state.lock().unwrap();
                  if let Some(task) = state.iter_mut().find(|t| t.id == id_clone) {
                    task.status = "failed".to_string();
                    task.error = Some(e.to_string());
                    task.abort_handle = None;
                  }
                  return;
                }
                downloaded += chunk.len() as u64;

                // Update progress periodically
                if downloaded % (1024 * 1024) < chunk.len() as u64 {
                  let mut state = state.lock().unwrap();
                  if let Some(task) = state.iter_mut().find(|t| t.id == id_clone) {
                    if task.status == "cancelled" {
                      return; // Stop downloading
                    }
                    task.downloaded = downloaded as i64;
                  }
                }
              }
              Err(e) => {
                let mut state = state.lock().unwrap();
                if let Some(task) = state.iter_mut().find(|t| t.id == id_clone) {
                  task.status = "failed".to_string();
                  task.error = Some(e.to_string());
                  task.abort_handle = None;
                }
                return;
              }
            }
          }

          let mut state = state.lock().unwrap();
          if let Some(task) = state.iter_mut().find(|t| t.id == id_clone) {
            if task.status == "cancelled" {
              return;
            }
            task.status = "completed".to_string();
            task.downloaded = downloaded as i64;
            task.abort_handle = None;
          }
        }
        Err(e) => {
          let mut state = state.lock().unwrap();
          if let Some(task) = state.iter_mut().find(|t| t.id == id_clone) {
            task.status = "failed".to_string();
            task.error = Some(e.to_string());
            task.abort_handle = None;
          }
        }
      }
    });

    // Store the abort handle
    {
      let mut state = REMOTE_DOWNLOAD_STATE.lock().unwrap();
      if let Some(task) = state.iter_mut().find(|t| t.id == id) {
        task.abort_handle = Some(task_handle.abort_handle());
      }
    }
  }

  Json(ids)
}
