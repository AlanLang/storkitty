use axum::http::StatusCode;
use axum::{extract::Request, middleware::Next, response::Response};

pub async fn auth_middleware(mut req: Request, next: Next) -> Result<Response, StatusCode> {
  let uer_id = crate::backend::utils::auth::verify_token(req.headers())
    .map_err(|_| StatusCode::UNAUTHORIZED)?;

  req.extensions_mut().insert(uer_id);
  Ok(next.run(req).await)
}
