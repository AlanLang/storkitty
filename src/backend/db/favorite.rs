use rusqlite::Connection;
use serde::{Deserialize, Serialize};

use crate::backend::utils;

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FavoriteDatabase {
  pub id: i64,
  pub name: String,
  pub path: String,
  pub icon: String,
  pub disabled: bool,
  pub created_at: String,
  pub updated_at: String,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFavoriteDto {
  pub name: String,
  pub path: String,
  pub icon: String,
}

pub fn create_favorite_database(conn: &Connection) -> anyhow::Result<()> {
  // path 唯一
  conn.execute(
    "CREATE TABLE IF NOT EXISTS favorite (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      path TEXT NOT NULL,
      icon TEXT DEFAULT '',
      disabled BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )",
    (),
  )?;
  Ok(())
}

pub fn create_favorite(conn: &Connection, favorite: CreateFavoriteDto) -> anyhow::Result<()> {
  if !utils::validate::validate_name(&favorite.name) {
    return Err(anyhow::anyhow!("链接名称不能包含特殊字符"));
  }

  if conn.query_row(
    "SELECT COUNT(*) FROM link WHERE name = ?",
    (favorite.name.clone(),),
    |row| row.get::<_, i64>(0),
  )? > 0
  {
    return Err(anyhow::anyhow!("链接名称已存在"));
  }
  conn.execute(
    "INSERT INTO favorite (name, path, icon) VALUES (?, ?, ?)",
    (favorite.name, favorite.path, favorite.icon),
  )?;
  Ok(())
}

pub fn get_all_favorites(conn: &Connection) -> anyhow::Result<Vec<FavoriteDatabase>> {
  let mut stmt = conn.prepare("SELECT * FROM favorite")?;
  let favorites = stmt.query_map([], |row| {
    Ok(FavoriteDatabase {
      id: row.get("id")?,
      name: row.get("name")?,
      path: row.get("path")?,
      icon: row.get("icon")?,
      disabled: row.get("disabled")?,
      created_at: row.get("created_at")?,
      updated_at: row.get("updated_at")?,
    })
  })?;
  Ok(
    favorites
      .collect::<Result<Vec<_>, _>>()?
      .into_iter()
      .collect(),
  )
}

pub fn delete_favorite(conn: &Connection, id: i64) -> anyhow::Result<()> {
  conn.execute("DELETE FROM favorite WHERE id = ?", (id,))?;
  Ok(())
}
