use std::{fs, path::PathBuf, time::SystemTime};

use anyhow::Context;
use axum::{
  Json,
  extract::{Path, State},
};
use serde::Serialize;

use crate::backend::{
  db::{DBConnection, storage},
  error::AppError,
  utils::{self, path::split_path},
};

pub async fn list_files(
  State(conn): State<DBConnection>,
  Path(path): Path<String>,
) -> Result<Json<FileListResponse>, AppError> {
  let conn = conn.lock().await;
  let (storage_path, path) = split_path(&path);
  let storage = storage::get_storage_by_path(&conn, &storage_path).context("存储不存在")?;
  if storage.disabled {
    return Err(AppError::new("存储已禁用"));
  }
  let local_path = PathBuf::from(&storage.local_path).join(path.unwrap_or_default());
  log::info!("local_path: {}", &local_path.display());

  if !local_path.exists() {
    return Err(AppError::new(&format!(
      "目标不存在: {}",
      &local_path.display()
    )));
  }

  let mut files = Vec::new();

  let entries = match fs::read_dir(&local_path) {
    Ok(v) => v.flatten(),
    Err(err) => {
      log::warn!("Failed to read directory {:?}: {err}", &local_path);
      return Ok(Json(FileListResponse { files: Vec::new() }));
    }
  };

  for entry in entries {
    let path = entry.path();
    let file_name = match entry.file_name().into_string() {
      Ok(name) => name,
      Err(_) => continue, // 非 UTF-8 跳过
    };

    // 屏蔽指定文件
    if utils::file::is_system_file(&file_name) {
      continue;
    }

    let metadata = match entry.metadata() {
      Ok(m) => m,
      Err(err) => {
        log::warn!("Failed to read metadata for {:?}: {err}", path);
        continue;
      }
    };

    let relative_path = match path.strip_prefix(&local_path) {
      Ok(p) => p.to_string_lossy().to_string(),
      Err(_) => continue,
    };

    let (file_type, size, items) = if metadata.is_dir() {
      let count = fs::read_dir(&path)
        .map(|it| {
          it.flatten()
            .filter(|e| {
              e.file_name()
                .to_str()
                .is_some_and(|n| !storage.block_extensions.contains(n))
            })
            .count()
        })
        .unwrap_or(0);

      (FileType::Folder, None, Some(count))
    } else {
      (FileType::File, Some(metadata.len()), None)
    };

    let modified =
      utils::time::format_modified_time(metadata.modified().unwrap_or(SystemTime::UNIX_EPOCH));

    files.push(FileInfo {
      name: file_name,
      path: relative_path,
      file_type,
      size,
      modified,
      items,
    });
  }

  files.sort_by(|a, b| match (&a.file_type, &b.file_type) {
    (FileType::Folder, FileType::File) => std::cmp::Ordering::Less,
    (FileType::File, FileType::Folder) => std::cmp::Ordering::Greater,
    _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
  });

  Ok(Json(FileListResponse { files }))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileListResponse {
  pub files: Vec<FileInfo>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileInfo {
  pub name: String,
  pub path: String,
  pub file_type: FileType,
  pub size: Option<u64>,
  pub modified: String,
  pub items: Option<usize>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum FileType {
  File,
  Folder,
}
