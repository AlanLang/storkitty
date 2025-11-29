use anyhow::Context;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageDatabase {
  pub id: i64,
  pub name: String,
  pub path: String,
  pub local_path: String,
  pub max_file_size: u64,
  pub allow_extensions: String,
  pub block_extensions: String,
  pub disabled: bool,
  pub sort_index: i64,
  pub created_at: String,
  pub updated_at: String,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateStorageDto {
  pub name: String,
  pub path: String,
  pub local_path: String,
  pub max_file_size: u64,
  pub allow_extensions: String,
  pub block_extensions: String,
  pub sort_index: i64,
}

pub fn create_storage_database(conn: &Connection) -> anyhow::Result<()> {
  // path 唯一
  conn.execute(
    "CREATE TABLE IF NOT EXISTS storage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      local_path TEXT NOT NULL,
      max_file_size INTEGER DEFAULT 0,
      allow_extensions TEXT DEFAULT '',
      block_extensions TEXT DEFAULT '',
      disabled BOOLEAN NOT NULL DEFAULT FALSE,
      sort_index INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )",
    (),
  )?;
  Ok(())
}

pub fn create_storage(conn: &Connection, storage: CreateStorageDto) -> anyhow::Result<()> {
  // 校验 storage.path 只能包含英文或数字
  if !storage
    .path
    .chars()
    .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
  {
    return Err(anyhow::anyhow!("应用路径只能包含英文或数字"));
  }

  conn.execute(
    "INSERT INTO storage (name, path, local_path, max_file_size, allow_extensions, block_extensions, sort_index) VALUES (?, ?, ?, ?, ?, ?, ?)",
    (storage.name, storage.path, storage.local_path, storage.max_file_size, storage.allow_extensions, storage.block_extensions, storage.sort_index),
  )?;
  Ok(())
}

pub fn get_all_enabled_storage(conn: &Connection) -> anyhow::Result<Vec<StorageDatabase>> {
  let mut stmt = conn
    .prepare("SELECT * FROM storage WHERE disabled = FALSE")
    .context("获取存储失败")?;

  let storages = stmt
    .query_map([], |row| {
      Ok(StorageDatabase {
        id: row.get("id")?,
        name: row.get("name")?,
        path: row.get("path")?,
        local_path: row.get("local_path")?,
        max_file_size: row.get("max_file_size")?,
        allow_extensions: row.get("allow_extensions")?,
        block_extensions: row.get("block_extensions")?,
        disabled: row.get("disabled")?,
        sort_index: row.get("sort_index")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
      })
    })?
    .collect::<Result<Vec<_>, _>>()?;

  Ok(storages)
}

pub fn get_storage_by_path(conn: &Connection, path: &str) -> anyhow::Result<StorageDatabase> {
  let mut stmt = conn
    .prepare("SELECT * FROM storage WHERE path = ?")
    .context("获取存储失败")?;
  let storage = stmt.query_one((path,), |row| {
    Ok(StorageDatabase {
      id: row.get("id")?,
      name: row.get("name")?,
      path: row.get("path")?,
      local_path: row.get("local_path")?,
      max_file_size: row.get("max_file_size")?,
      allow_extensions: row.get("allow_extensions")?,
      block_extensions: row.get("block_extensions")?,
      disabled: row.get("disabled")?,
      sort_index: row.get("sort_index")?,
      created_at: row.get("created_at")?,
      updated_at: row.get("updated_at")?,
    })
  })?;
  Ok(storage)
}
