use std::{fs, path::PathBuf};

use anyhow::Context;
use axum::{Json, extract::State};
use serde::Deserialize;

use crate::backend::{
  db::{DBConnection, storage},
  error::AppError,
  utils::path::split_path,
};

#[derive(Deserialize)]
pub struct MoveFileDto {
  pub from: String,
  pub to: String,
}

pub async fn copy_file(
  State(conn): State<DBConnection>,
  Json(dto): Json<MoveFileDto>,
) -> Result<(), AppError> {
  let conn = conn.lock().await;

  // Resolve source path
  let (from_storage_path, from_path) = split_path(&dto.from);
  let from_storage =
    storage::get_storage_by_path(&conn, &from_storage_path).context("源存储不存在")?;
  let from_local_path = PathBuf::from(&from_storage.local_path).join(from_path.unwrap_or_default());

  // Resolve destination path
  let (to_storage_path, to_path) = split_path(&dto.to);
  let to_storage =
    storage::get_storage_by_path(&conn, &to_storage_path).context("目标存储不存在")?;
  let to_local_path = PathBuf::from(&to_storage.local_path).join(to_path.unwrap_or_default());

  if !from_local_path.exists() {
    return Err(AppError::new("源文件不存在"));
  }

  // If source is a directory, use recursive copy
  if from_local_path.is_dir() {
    // For directories, we need to append the directory name to the destination
    // e.g. copy /a/b to /c/d -> /c/d/b
    let dir_name = from_local_path
      .file_name()
      .ok_or(AppError::new("无效的源路径"))?;
    let target_dir = to_local_path.join(dir_name);

    copy_dir_recursive(&from_local_path, &target_dir)?;
  } else {
    // For files, we also need to append the file name if the destination is a directory (which it usually is for "copy to folder")
    // But based on the requirement "copy to this directory", the `to` path is the target directory.
    // So we should append the filename to `to_local_path`.
    let file_name = from_local_path
      .file_name()
      .ok_or(AppError::new("无效的源路径"))?;
    let target_file = to_local_path.join(file_name);

    fs::copy(&from_local_path, &target_file).map_err(|e| AppError::new(&e.to_string()))?;
  }

  Ok(())
}

pub async fn move_file(
  State(conn): State<DBConnection>,
  Json(dto): Json<MoveFileDto>,
) -> Result<(), AppError> {
  let conn = conn.lock().await;

  // Resolve source path
  let (from_storage_path, from_path) = split_path(&dto.from);
  let from_storage =
    storage::get_storage_by_path(&conn, &from_storage_path).context("源存储不存在")?;
  let from_local_path = PathBuf::from(&from_storage.local_path).join(from_path.unwrap_or_default());

  // Resolve destination path
  let (to_storage_path, to_path) = split_path(&dto.to);
  let to_storage =
    storage::get_storage_by_path(&conn, &to_storage_path).context("目标存储不存在")?;
  let to_local_path = PathBuf::from(&to_storage.local_path).join(to_path.unwrap_or_default());

  if !from_local_path.exists() {
    return Err(AppError::new("源文件不存在"));
  }

  // Determine target path
  let file_name = from_local_path
    .file_name()
    .ok_or(AppError::new("无效的源路径"))?;
  let target_path = to_local_path.join(file_name);

  // Try rename first (fast move on same FS)
  if fs::rename(&from_local_path, &target_path).is_err() {
    // If rename fails (e.g. cross-device), try copy and delete
    if from_local_path.is_dir() {
      copy_dir_recursive(&from_local_path, &target_path)?;
      fs::remove_dir_all(&from_local_path).map_err(|e| AppError::new(&e.to_string()))?;
    } else {
      fs::copy(&from_local_path, &target_path).map_err(|e| AppError::new(&e.to_string()))?;
      fs::remove_file(&from_local_path).map_err(|e| AppError::new(&e.to_string()))?;
    }
  }

  Ok(())
}

fn copy_dir_recursive(src: &PathBuf, dst: &PathBuf) -> Result<(), AppError> {
  if !dst.exists() {
    fs::create_dir_all(dst).map_err(|e| AppError::new(&e.to_string()))?;
  }

  for entry in fs::read_dir(src).map_err(|e| AppError::new(&e.to_string()))? {
    let entry = entry.map_err(|e| AppError::new(&e.to_string()))?;
    let ty = entry
      .file_type()
      .map_err(|e| AppError::new(&e.to_string()))?;
    let src_path = entry.path();
    let dst_path = dst.join(entry.file_name());

    if ty.is_dir() {
      copy_dir_recursive(&src_path, &dst_path)?;
    } else {
      fs::copy(&src_path, &dst_path).map_err(|e| AppError::new(&e.to_string()))?;
    }
  }
  Ok(())
}
