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
  pub icon: String,
  pub kind: String,
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
  pub icon: String,
  pub kind: String,
  pub max_file_size: u64,
  pub allow_extensions: String,
  pub block_extensions: String,
  pub sort_index: i64,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateStorageDto {
  pub name: String,
  pub path: String,
  pub local_path: String,
  pub icon: String,
  pub kind: String,
}

pub fn create_storage_database(conn: &Connection) -> anyhow::Result<()> {
  // path 唯一
  conn.execute(
    "CREATE TABLE IF NOT EXISTS storage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      local_path TEXT NOT NULL,
      icon TEXT DEFAULT '',
      kind TEXT DEFAULT 'local',
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
    "INSERT INTO storage (name, path, local_path, icon, kind, max_file_size, allow_extensions, block_extensions, sort_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    (storage.name, storage.path, storage.local_path, storage.icon, storage.kind, storage.max_file_size, storage.allow_extensions, storage.block_extensions, storage.sort_index),
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
        icon: row.get("icon")?,
        kind: row.get("kind")?,
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

pub fn get_all_storage(conn: &Connection) -> anyhow::Result<Vec<StorageDatabase>> {
  let mut stmt = conn
    .prepare("SELECT * FROM storage")
    .context("获取存储失败")?;

  let storages = stmt
    .query_map([], |row| {
      Ok(StorageDatabase {
        id: row.get("id")?,
        name: row.get("name")?,
        path: row.get("path")?,
        local_path: row.get("local_path")?,
        icon: row.get("icon")?,
        kind: row.get("kind")?,
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
      icon: row.get("icon")?,
      kind: row.get("kind")?,
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

pub fn delete(conn: &Connection, id: i64) -> anyhow::Result<()> {
  let all_storages = get_all_enabled_storage(conn)?;
  if all_storages.len() <= 1 {
    return Err(anyhow::anyhow!("至少保留一个存储"));
  }
  conn.execute("DELETE FROM storage WHERE id = ?", (id,))?;
  Ok(())
}

pub fn update_storage(conn: &Connection, id: i64, storage: UpdateStorageDto) -> anyhow::Result<()> {
  conn.execute(
    "UPDATE storage SET name = ?, path = ?, local_path = ?, icon = ? updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    (
      storage.name,
      storage.path,
      storage.local_path,
      storage.icon,
      storage.kind,
      id,
    ),
  )?;
  Ok(())
}

pub fn disable_storage(conn: &Connection, id: i64) -> anyhow::Result<()> {
  let all_storages = get_all_enabled_storage(conn)?;
  if all_storages.len() <= 1 {
    return Err(anyhow::anyhow!("至少保留一个存储"));
  }
  if all_storages.iter().any(|s| s.id == id) {
    return Err(anyhow::anyhow!("存储不存在"));
  }
  conn.execute("UPDATE storage SET disabled = TRUE WHERE id = ?", (id,))?;
  Ok(())
}
