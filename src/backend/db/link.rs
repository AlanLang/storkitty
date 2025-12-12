use rusqlite::Connection;
use serde::{Deserialize, Serialize};

use crate::backend::utils;

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LinkDatabase {
  pub id: i64,
  pub name: String,
  pub path: String,
  pub icon: String,
  pub created_at: String,
  pub updated_at: String,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateLinkDto {
  pub name: String,
  pub path: String,
  pub icon: String,
}

pub fn create_link_database(conn: &Connection) -> anyhow::Result<()> {
  // path 唯一
  conn.execute(
    "CREATE TABLE IF NOT EXISTS link (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      path TEXT NOT NULL,
      icon TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )",
    (),
  )?;
  Ok(())
}

pub fn create_link(conn: &Connection, link: CreateLinkDto) -> anyhow::Result<()> {
  if !utils::validate::validate_name(&link.name) {
    return Err(anyhow::anyhow!("链接名称不能包含特殊字符"));
  }

  if conn.query_row(
    "SELECT COUNT(*) FROM link WHERE name = ?",
    (link.name.clone(),),
    |row| row.get::<_, i64>(0),
  )? > 0
  {
    return Err(anyhow::anyhow!("链接名称已存在"));
  }
  conn.execute(
    "INSERT INTO link (name, path, icon) VALUES (?, ?, ?)",
    (link.name, link.path, link.icon),
  )?;
  Ok(())
}

pub fn get_all_links(conn: &Connection) -> anyhow::Result<Vec<LinkDatabase>> {
  let mut stmt = conn.prepare("SELECT * FROM link")?;
  let links = stmt.query_map([], |row| {
    Ok(LinkDatabase {
      id: row.get("id")?,
      name: row.get("name")?,
      path: row.get("path")?,
      icon: row.get("icon")?,
      created_at: row.get("created_at")?,
      updated_at: row.get("updated_at")?,
    })
  })?;
  Ok(links.collect::<Result<Vec<_>, _>>()?.into_iter().collect())
}

pub fn delete_link(conn: &Connection, id: i64) -> anyhow::Result<()> {
  conn.execute("DELETE FROM link WHERE id = ?", (id,))?;
  Ok(())
}
