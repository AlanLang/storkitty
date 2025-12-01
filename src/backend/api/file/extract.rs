use std::{fs, path::Path};

use axum::Json;
use serde::Deserialize;

use crate::backend::{db::DBConnection, error::AppError, extractor::storage::StoragePath};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractFileDto {
  name: String,
}

#[axum::debug_handler(state = DBConnection)]
pub async fn extract_file(
  StoragePath(local_path): StoragePath,
  Json(dto): Json<ExtractFileDto>,
) -> Result<(), AppError> {
  let file_path = local_path.safe_join(&dto.name)?;

  if !file_path.exists() {
    return Err(AppError::new("文件不存在"));
  }

  if !file_path.is_file() {
    return Err(AppError::new("不是文件"));
  }

  // Extract based on file extension directly to current directory
  let file_name_lower = dto.name.to_lowercase();
  let target_path = local_path.get_path();

  if file_name_lower.ends_with(".zip") {
    extract_zip(&file_path, &target_path)?;
  } else if file_name_lower.ends_with(".tar.gz") || file_name_lower.ends_with(".tgz") {
    extract_tar_gz(&file_path, &target_path)?;
  } else if file_name_lower.ends_with(".tar") {
    extract_tar(&file_path, &target_path)?;
  } else {
    return Err(AppError::new("不支持的压缩格式"));
  }

  Ok(())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompressDirectoryDto {
  name: String,
}

#[axum::debug_handler(state = DBConnection)]
pub async fn compress_directory(
  StoragePath(local_path): StoragePath,
  Json(dto): Json<CompressDirectoryDto>,
) -> Result<(), AppError> {
  let dir_path = local_path.safe_join(&dto.name)?;

  if !dir_path.exists() {
    return Err(AppError::new("目录不存在"));
  }

  if !dir_path.is_dir() {
    return Err(AppError::new("不是目录"));
  }

  // Create ZIP file path
  let zip_filename = format!("{}.zip", dto.name);
  let zip_path = local_path.safe_join(&zip_filename)?;

  // Check if ZIP file already exists
  if zip_path.exists() {
    return Err(AppError::new("压缩文件已存在"));
  }

  // Compress directory to ZIP in a blocking task to avoid blocking the async runtime
  tokio::task::spawn_blocking(move || compress_to_zip(&dir_path, &zip_path))
    .await
    .map_err(|e| AppError::new(&e.to_string()))??;

  Ok(())
}

fn compress_to_zip(dir_path: &Path, zip_path: &Path) -> Result<(), AppError> {
  let file = fs::File::create(zip_path).map_err(|e| AppError::new(&e.to_string()))?;
  let mut zip = zip::ZipWriter::new(file);

  let options =
    zip::write::FileOptions::<()>::default().compression_method(zip::CompressionMethod::Deflated);

  let walkdir = walkdir::WalkDir::new(dir_path);
  let it = walkdir.into_iter();

  for entry in it {
    let entry = entry.map_err(|e| AppError::new(&e.to_string()))?;
    let path = entry.path();
    let name = path
      .strip_prefix(dir_path)
      .map_err(|e| AppError::new(&e.to_string()))?;

    // Skip the root directory itself
    if name.as_os_str().is_empty() {
      continue;
    }

    let name_str = name
      .to_str()
      .ok_or_else(|| AppError::new("路径包含无效字符"))?;

    if path.is_file() {
      zip
        .start_file(name_str, options)
        .map_err(|e| AppError::new(&e.to_string()))?;
      let mut f = fs::File::open(path).map_err(|e| AppError::new(&e.to_string()))?;
      std::io::copy(&mut f, &mut zip).map_err(|e| AppError::new(&e.to_string()))?;
    } else if path.is_dir() {
      zip
        .add_directory(name_str, options)
        .map_err(|e| AppError::new(&e.to_string()))?;
    }
  }

  zip.finish().map_err(|e| AppError::new(&e.to_string()))?;
  Ok(())
}

fn extract_zip(file_path: &Path, target_dir: &Path) -> Result<(), AppError> {
  let file = fs::File::open(file_path).map_err(|e| AppError::new(&e.to_string()))?;
  let mut archive = zip::ZipArchive::new(file).map_err(|e| AppError::new(&e.to_string()))?;

  for i in 0..archive.len() {
    let mut file = archive
      .by_index(i)
      .map_err(|e| AppError::new(&e.to_string()))?;
    let outpath = match file.enclosed_name() {
      Some(path) => target_dir.join(path),
      None => continue,
    };

    if file.name().ends_with('/') {
      fs::create_dir_all(&outpath).map_err(|e| AppError::new(&e.to_string()))?;
    } else {
      if let Some(p) = outpath.parent() {
        if !p.exists() {
          fs::create_dir_all(p).map_err(|e| AppError::new(&e.to_string()))?;
        }
      }
      let mut outfile = fs::File::create(&outpath).map_err(|e| AppError::new(&e.to_string()))?;
      std::io::copy(&mut file, &mut outfile).map_err(|e| AppError::new(&e.to_string()))?;
    }
  }

  Ok(())
}

fn extract_tar_gz(file_path: &Path, target_dir: &Path) -> Result<(), AppError> {
  let file = fs::File::open(file_path).map_err(|e| AppError::new(&e.to_string()))?;
  let decoder = flate2::read::GzDecoder::new(file);
  let mut archive = tar::Archive::new(decoder);

  archive
    .unpack(target_dir)
    .map_err(|e| AppError::new(&e.to_string()))?;

  Ok(())
}

fn extract_tar(file_path: &Path, target_dir: &Path) -> Result<(), AppError> {
  let file = fs::File::open(file_path).map_err(|e| AppError::new(&e.to_string()))?;
  let mut archive = tar::Archive::new(file);

  archive
    .unpack(target_dir)
    .map_err(|e| AppError::new(&e.to_string()))?;

  Ok(())
}
