pub mod storage;
pub mod user;
use std::sync::Arc;

use rusqlite::Connection;
use tokio::sync::Mutex;

pub type DBConnection = Arc<Mutex<Connection>>;

pub fn init_db() -> anyhow::Result<DBConnection> {
  let conn = Connection::open("./data.db")?;

  user::create_user_database(&conn)?;
  storage::create_storage_database(&conn)?;
  Ok(Arc::new(Mutex::new(conn)))
}
