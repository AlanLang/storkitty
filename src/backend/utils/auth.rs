use anyhow::Context;
use axum::http::{HeaderMap, header::AUTHORIZATION};
use chrono::Utc;
use jsonwebtoken::{DecodingKey, EncodingKey, Header};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
  pub sub: String, // user_id
  pub exp: usize,  // expiration time
  pub iat: usize,  // issued at
}

pub fn generate_token(user_id: i64) -> anyhow::Result<String> {
  let now = Utc::now();
  let expiration_days = std::env::var("JWT_EXPIRATION_DAYS")
    .unwrap_or("7".to_string())
    .parse::<i64>()
    .unwrap_or(7);
  let exp = now
    .checked_add_signed(chrono::Duration::days(expiration_days))
    .context("生成token失败")?;
  let claims = Claims {
    sub: user_id.to_string(),
    exp: exp.timestamp() as usize,
    iat: now.timestamp() as usize,
  };

  let token = jsonwebtoken::encode(
    &Header::default(),
    &claims,
    &EncodingKey::from_secret(
      std::env::var("JWT_SECRET_KEY")
        .unwrap_or("storkitty-secret-key".to_string())
        .as_ref(),
    ),
  )?;

  Ok(token)
}

pub fn verify_token(headers: &HeaderMap) -> anyhow::Result<i64> {
  let token = headers
    .get(AUTHORIZATION)
    .and_then(|value| value.to_str().ok())
    .and_then(|value| value.strip_prefix("Bearer "))
    .ok_or(anyhow::anyhow!("No token provided"))?;
  let token_data: jsonwebtoken::TokenData<Claims> = jsonwebtoken::decode(
    token,
    &DecodingKey::from_secret(
      std::env::var("JWT_SECRET_KEY")
        .unwrap_or("storkitty-secret-key".to_string())
        .as_ref(),
    ),
    &jsonwebtoken::Validation::default(),
  )
  .map_err(|_| anyhow::anyhow!("Invalid token"))?;

  Ok(token_data.claims.sub.parse::<i64>().unwrap())
}
