use rusqlite::Connection;
use serde::{Deserialize, Serialize};


#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FavoriteDatabase {
  pub id: i64,
  pub name: String,
  pub user_id: i64,
  pub storage_id: i64,
  pub path: String,
  pub icon: String,
  pub created_at: String,
  pub updated_at: String,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFavoriteDto {
  pub name: String,
  pub path: String,
  pub icon: String,
  pub user_id: i64,
  pub storage_id: i64,
}

pub fn create_favorite_database(conn: &Connection) -> anyhow::Result<()> {
  // path 唯一
  conn.execute(
    "CREATE TABLE IF NOT EXISTS favorite (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      storage_id INTEGER NOT NULL,
      name TEXT NOT NULL UNIQUE,
      path TEXT NOT NULL,
      icon TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      FOREIGN KEY (storage_id) REFERENCES storage(id) ON DELETE CASCADE
    )",
    (),
  )?;
  Ok(())
}

pub fn create_favorite(conn: &Connection, favorite: CreateFavoriteDto) -> anyhow::Result<()> {
  if conn.query_row(
    "SELECT COUNT(*) FROM link WHERE name = ?",
    (favorite.name.clone(),),
    |row| row.get::<_, i64>(0),
  )? > 0
  {
    return Err(anyhow::anyhow!("链接名称已存在"));
  }
  conn.execute(
    "INSERT INTO favorite (name, path, icon, user_id, storage_id) VALUES (?, ?, ?, ?, ?)",
    (
      favorite.name,
      favorite.path,
      favorite.icon,
      favorite.user_id,
      favorite.storage_id,
    ),
  )?;
  Ok(())
}

pub fn get_all_favorites(conn: &Connection) -> anyhow::Result<Vec<FavoriteDatabase>> {
  let mut stmt = conn.prepare("SELECT * FROM favorite")?;
  let favorites = stmt.query_map([], |row| {
    Ok(FavoriteDatabase {
      id: row.get("id")?,
      name: row.get("name")?,
      user_id: row.get("user_id")?,
      storage_id: row.get("storage_id")?,
      path: row.get("path")?,
      icon: row.get("icon")?,
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
