use crate::backend::{
  db::{self},
  error::AppError,
  state::AppState,
  utils,
};
use axum::{Json, extract::State};
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetupDto {
  user: db::user::CreateUserDto,
  storage: db::storage::CreateStorageDto,
}

pub async fn setup(
  State(state): State<AppState>,
  Json(setup): Json<SetupDto>,
) -> Result<(), AppError> {
  let mut conn = state.conn.lock().await;
  let no_user = db::user::is_no_user(&conn).unwrap_or(true);
  if !no_user {
    return Err(AppError::from(anyhow::anyhow!("用户已存在")));
  }
  let tx = conn.transaction()?;
  utils::file::create_dir(&setup.storage.local_path)?;

  db::user::create_user(&tx, setup.user)?;
  db::storage::create_storage(&tx, setup.storage)?;

  tx.commit()?;
  Ok(())
}
