use axum::body::Body;
use axum::extract::{FromRef, FromRequestParts};
use axum::http::StatusCode;
use axum::http::request::Parts;
use axum::{extract::Request, middleware::Next, response::Response};

use crate::backend::state::AppState;
use crate::backend::utils;

pub async fn auth_middleware(mut req: Request, next: Next) -> Result<Response, StatusCode> {
  let uer_id = crate::backend::utils::auth::verify_token(req.headers())
    .map_err(|_| StatusCode::UNAUTHORIZED)?;

  req.extensions_mut().insert(uer_id);
  Ok(next.run(req).await)
}

pub struct AuthUser(pub i64);

impl<S> FromRequestParts<S> for AuthUser
where
  AppState: FromRef<S>,
  S: Send + Sync,
{
  type Rejection = Response;

  async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
    let user_id = utils::auth::verify_token(&parts.headers).map_err(|_| {
      Response::builder()
        .status(StatusCode::UNAUTHORIZED)
        .body(Body::from("未授权"))
        .unwrap()
    })?;
    Ok(Self(user_id))
  }
}
