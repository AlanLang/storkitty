use std::path::PathBuf;

use anyhow::Context;
use axum::{
  body::Body,
  extract::{FromRef, FromRequestParts, Path},
  http::{StatusCode, request::Parts},
  response::Response,
};

use crate::backend::{
  db::{self, DBConnection},
  error::AppError,
  utils::{self, path::split_path},
};

// -------------------------------------------
// SafePath
// -------------------------------------------

pub struct SafePath(pub PathBuf);

impl SafePath {
  pub fn new(path: PathBuf) -> Self {
    Self(path)
  }

  pub fn safe_join(&self, input: &str) -> Result<PathBuf, AppError> {
    if !utils::validate::validate_path(input) {
      return Err(AppError::new("路径不合法"));
    }
    Ok(self.0.join(input))
  }

  pub fn get_path(&self) -> PathBuf {
    self.0.clone()
  }
}

// -------------------------------------------
// 提取公共逻辑：解析 path + 查库 + 校验
// -------------------------------------------

struct StorageResolved {
  pub root: PathBuf,
  pub full: SafePath,
}

async fn resolve_storage<S>(parts: &mut Parts, state: &S) -> Result<StorageResolved, Response>
where
  DBConnection: FromRef<S>,
  S: Send + Sync,
{
  // 1. 解析 {*path}
  let Path(raw_path) = Path::<String>::from_request_parts(parts, state)
    .await
    .map_err(|err| {
      Response::builder()
        .status(StatusCode::BAD_REQUEST)
        .body(Body::from(err.to_string()))
        .unwrap()
    })?;

  if !utils::validate::validate_path(&raw_path) {
    return Err(
      Response::builder()
        .status(StatusCode::BAD_REQUEST)
        .body(Body::from("存储路径不合法"))
        .unwrap(),
    );
  }

  // 2. 分割 path: storage_path + relative_path
  let conn = DBConnection::from_ref(state);
  let conn = conn.lock().await;

  let (storage_path, path) = split_path(&raw_path);

  let storage = db::storage::get_storage_by_path(&conn, &storage_path)
    .context("存储不存在")
    .map_err(|_| {
      Response::builder()
        .status(StatusCode::NOT_FOUND)
        .body(Body::from("存储不存在"))
        .unwrap()
    })?;

  if storage.disabled {
    return Err(
      Response::builder()
        .status(StatusCode::FORBIDDEN)
        .body(Body::from("存储已禁用"))
        .unwrap(),
    );
  }

  // 3. 拼接真实路径
  let root_path = PathBuf::from(&storage.local_path);
  let full_path = SafePath::new(root_path.clone().join(path.unwrap_or_default()));

  Ok(StorageResolved {
    root: root_path,
    full: full_path,
  })
}

// -------------------------------------------
// StoragePath Extractor
// -------------------------------------------

pub struct StoragePath(pub SafePath);

impl<S> FromRequestParts<S> for StoragePath
where
  DBConnection: FromRef<S>,
  S: Send + Sync,
{
  type Rejection = Response;

  async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
    let resolved = resolve_storage(parts, state).await?;
    Ok(Self(resolved.full))
  }
}

// -------------------------------------------
// Storage Extractor
// -------------------------------------------

pub struct Storage {
  pub path: SafePath,
  pub root: PathBuf,
}

impl<S> FromRequestParts<S> for Storage
where
  DBConnection: FromRef<S>,
  S: Send + Sync,
{
  type Rejection = Response;

  async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
    let resolved = resolve_storage(parts, state).await?;

    Ok(Self {
      path: resolved.full,
      root: resolved.root,
    })
  }
}
