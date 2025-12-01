use anyhow::Context;
use axum::{Json, extract::State};
use serde::{Deserialize, Serialize};

use crate::backend::{
  db::{self},
  error::AppError,
  state::AppState,
  utils::auth,
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginResponseDto {
  user: UserDto,
  token: String,
  storages: Vec<StorageDto>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserDto {
  pub id: i64,
  pub name: String,
  pub avatar: String,
  pub email: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginDto {
  pub email: String,
  pub password: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageDto {
  pub id: i64,
  pub name: String,
  pub path: String,
  pub sort_index: i64,
}

pub async fn login(
  State(state): State<AppState>,
  Json(user): Json<LoginDto>,
) -> Result<Json<LoginResponseDto>, AppError> {
  let conn = state.conn.lock().await;
  let user_info = db::user::get_user_by_email(&conn, &user.email).context("用户不存在")?;

  if user_info.login_failure_count >= 5 {
    return Err(AppError::new("账户已被锁定，请联系管理员"));
  }

  let is_valid = bcrypt::verify(&user.password, &user_info.password).unwrap_or(false);

  if !is_valid {
    db::user::increment_login_failure(&conn, user_info.id).context("更新登录失败次数失败")?;
    if user_info.login_failure_count >= 2 {
      return Err(AppError::new(&format!(
        "密码错误，失败{}次后将锁定账户",
        5 - user_info.login_failure_count
      )));
    }
    return Err(AppError::new("密码错误"));
  }

  db::user::reset_login_failure(&conn, user_info.id).context("重置登录失败次数失败")?;

  let token = auth::generate_token(user_info.id)?;
  let storages = db::storage::get_all_enabled_storage(&conn).context("获取存储失败")?;

  Ok(Json(LoginResponseDto {
    user: UserDto {
      id: user_info.id,
      name: user_info.name,
      avatar: user_info.avatar,
      email: user_info.email,
    },
    token,
    storages: storages
      .into_iter()
      .map(|storage| StorageDto {
        id: storage.id,
        name: storage.name,
        path: storage.path,
        sort_index: storage.sort_index,
      })
      .collect(),
  }))
}
