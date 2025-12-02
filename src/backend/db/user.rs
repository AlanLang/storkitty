use rusqlite::Connection;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateUserDto {
  pub name: String,
  pub email: String,
  pub password: String,
}

pub struct User {
  pub id: i64,
  pub name: String,
  pub email: String,
  pub password: String,
  pub avatar: String,
  pub disabled: bool,
  pub login_failure_count: i64,
  pub created_at: String,
  pub updated_at: String,
}

pub fn create_user_database(conn: &Connection) -> anyhow::Result<()> {
  conn.execute(
    "CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT NOT NULL DEFAULT '',
      disabled BOOLEAN NOT NULL DEFAULT FALSE,
      login_failure_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )",
    (),
  )?;
  Ok(())
}

pub fn is_no_user(conn: &Connection) -> anyhow::Result<bool> {
  let user = conn
    .query_row("SELECT COUNT(*) FROM user", (), |row| row.get(0))
    .map(|count: i64| count == 0)
    .unwrap_or(true);
  Ok(user)
}

pub fn create_user(conn: &Connection, user: CreateUserDto) -> anyhow::Result<()> {
  let password_hash = bcrypt::hash(user.password, bcrypt::DEFAULT_COST)?;

  conn.execute(
    "INSERT INTO user (name, email, password) VALUES (?, ?, ?)",
    (user.name, user.email, password_hash),
  )?;
  Ok(())
}

pub fn get_user_by_email(conn: &Connection, email: &str) -> anyhow::Result<User> {
  let user = conn.query_row("SELECT * FROM user WHERE email = ?", (email,), |row| {
    Ok(User {
      id: row.get("id")?,
      name: row.get("name")?,
      email: row.get("email")?,
      password: row.get("password")?,
      avatar: row.get("avatar")?,
      disabled: row.get("disabled")?,
      login_failure_count: row.get("login_failure_count").unwrap_or(0),
      created_at: row.get("created_at")?,
      updated_at: row.get("updated_at")?,
    })
  })?;
  Ok(user)
}

pub fn get_user_by_id(conn: &Connection, user_id: i64) -> anyhow::Result<User> {
  let user = conn.query_row("SELECT * FROM user WHERE id = ?", (user_id,), |row| {
    Ok(User {
      id: row.get("id")?,
      name: row.get("name")?,
      email: row.get("email")?,
      password: row.get("password")?,
      avatar: row.get("avatar")?,
      disabled: row.get("disabled")?,
      login_failure_count: row.get("login_failure_count").unwrap_or(0),
      created_at: row.get("created_at")?,
      updated_at: row.get("updated_at")?,
    })
  })?;
  Ok(user)
}

pub fn increment_login_failure(conn: &Connection, user_id: i64) -> anyhow::Result<()> {
  conn.execute(
    "UPDATE user SET login_failure_count = login_failure_count + 1 WHERE id = ?",
    (user_id,),
  )?;
  Ok(())
}

pub fn reset_login_failure(conn: &Connection, user_id: i64) -> anyhow::Result<()> {
  conn.execute(
    "UPDATE user SET login_failure_count = 0 WHERE id = ?",
    (user_id,),
  )?;
  Ok(())
}

pub fn update_user_profile(
  conn: &Connection,
  user_id: i64,
  name: &str,
  avatar: &str,
) -> anyhow::Result<()> {
  conn.execute(
    "UPDATE user SET name = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    (name, avatar, user_id),
  )?;
  Ok(())
}

pub fn update_user_password(
  conn: &Connection,
  user_id: i64,
  new_password: &str,
) -> anyhow::Result<()> {
  let password_hash = bcrypt::hash(new_password, bcrypt::DEFAULT_COST)?;
  conn.execute(
    "UPDATE user SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    (password_hash, user_id),
  )?;
  Ok(())
}

// Passkey credential storage
pub fn create_passkey_table(conn: &Connection) -> anyhow::Result<()> {
  conn.execute(
    "CREATE TABLE IF NOT EXISTS passkey (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      credential_id TEXT NOT NULL UNIQUE,
      public_key BLOB NOT NULL,
      counter INTEGER NOT NULL DEFAULT 0,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_used_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )",
    (),
  )?;
  Ok(())
}

pub struct Passkey {
  pub id: i64,
  pub user_id: i64,
  pub credential_id: String,
  pub public_key: Vec<u8>,
  pub counter: u32,
  pub name: String,
  pub created_at: String,
  pub last_used_at: String,
}

pub fn save_passkey(
  conn: &Connection,
  user_id: i64,
  credential_id: &str,
  public_key: &[u8],
  name: &str,
) -> anyhow::Result<()> {
  conn.execute(
    "INSERT INTO passkey (user_id, credential_id, public_key, name) VALUES (?, ?, ?, ?)",
    (user_id, credential_id, public_key, name),
  )?;
  Ok(())
}

pub fn get_passkeys_by_user_id(conn: &Connection, user_id: i64) -> anyhow::Result<Vec<Passkey>> {
  let mut stmt = conn.prepare(
    "SELECT id, user_id, credential_id, public_key, counter, name, created_at, last_used_at
     FROM passkey WHERE user_id = ? ORDER BY created_at DESC",
  )?;

  let passkeys = stmt
    .query_map([user_id], |row| {
      Ok(Passkey {
        id: row.get("id")?,
        user_id: row.get("user_id")?,
        credential_id: row.get("credential_id")?,
        public_key: row.get("public_key")?,
        counter: row.get("counter")?,
        name: row.get("name")?,
        created_at: row.get("created_at")?,
        last_used_at: row.get("last_used_at")?,
      })
    })?
    .collect::<Result<Vec<_>, _>>()?;

  Ok(passkeys)
}

pub fn get_passkey_by_credential_id(
  conn: &Connection,
  credential_id: &str,
) -> anyhow::Result<Passkey> {
  let passkey = conn.query_row(
    "SELECT id, user_id, credential_id, public_key, counter, name, created_at, last_used_at
     FROM passkey WHERE credential_id = ?",
    [credential_id],
    |row| {
      Ok(Passkey {
        id: row.get("id")?,
        user_id: row.get("user_id")?,
        credential_id: row.get("credential_id")?,
        public_key: row.get("public_key")?,
        counter: row.get("counter")?,
        name: row.get("name")?,
        created_at: row.get("created_at")?,
        last_used_at: row.get("last_used_at")?,
      })
    },
  )?;
  Ok(passkey)
}

pub fn update_passkey_counter(
  conn: &Connection,
  credential_id: &str,
  counter: u32,
) -> anyhow::Result<()> {
  conn.execute(
    "UPDATE passkey SET counter = ?, last_used_at = CURRENT_TIMESTAMP WHERE credential_id = ?",
    (counter, credential_id),
  )?;
  Ok(())
}

pub fn delete_passkey(conn: &Connection, id: i64, user_id: i64) -> anyhow::Result<()> {
  conn.execute(
    "DELETE FROM passkey WHERE id = ? AND user_id = ?",
    (id, user_id),
  )?;
  Ok(())
}
