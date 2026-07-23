use axum::{
  Json, Router,
  extract::{Path, State},
  http::{HeaderMap, StatusCode},
  middleware,
  response::Response,
  routing::{get, post},
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::backend::{
  error::AppError,
  extractor::auth::auth_middleware,
  state::{AppState, UploadTokenEntry},
};

pub fn create_upload_script_router() -> Router<AppState> {
  let authenticated = Router::new()
    .route("/", post(generate_upload_token))
    .layer(middleware::from_fn(auth_middleware));

  let public = Router::new().route("/{token}", get(get_upload_script));

  authenticated.merge(public)
}

#[derive(Deserialize)]
pub struct GenerateUploadTokenDto {
  path: String,
}

#[derive(Serialize)]
pub struct GenerateUploadTokenResponse {
  token: String,
}

#[axum::debug_handler(state = AppState)]
async fn generate_upload_token(
  State(state): State<AppState>,
  Json(dto): Json<GenerateUploadTokenDto>,
) -> Result<Json<GenerateUploadTokenResponse>, AppError> {
  let token = Uuid::new_v4().to_string();

  state.upload_tokens.lock().await.insert(
    token.clone(),
    UploadTokenEntry {
      path: dto.path,
      created_at: std::time::Instant::now(),
      used: false,
    },
  );

  Ok(Json(GenerateUploadTokenResponse { token }))
}

async fn get_upload_script(
  State(state): State<AppState>,
  Path(token): Path<String>,
  headers: HeaderMap,
) -> Response {
  let path = {
    let tokens = state.upload_tokens.lock().await;
    match tokens.get(&token) {
      Some(entry) if !entry.used && entry.created_at.elapsed().as_secs() <= 3600 => {
        Some(entry.path.clone())
      }
      _ => None,
    }
  };

  let script = match path {
    None => "#!/bin/bash\necho '错误: 上传链接已失效或已使用' >&2\nexit 1\n".to_string(),
    Some(path) => {
      let host = headers
        .get("host")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("localhost:3330");
      let proto = headers
        .get("x-forwarded-proto")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("http");
      let upload_url = format!("{}://{}/api/file/cli-upload/{}", proto, host, path);

      format!(
        r#"#!/bin/bash
UPLOAD_URL="{upload_url}"
TOKEN="{token}"

upload_file() {{
  local file="$1"
  if [ ! -f "$file" ]; then
    echo "错误: 文件不存在: $file" >&2
    exit 1
  fi
  local filename
  filename=$(basename "$file")
  printf "正在上传 %s..." "$filename"
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{{http_code}}" \
    -X POST "$UPLOAD_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@$file")
  if [ "$http_code" = "200" ]; then
    echo " ✓ 上传成功"
  else
    echo " ✗ 上传失败 (HTTP $http_code)" >&2
    exit 1
  fi
}}

if [ "$#" -gt 0 ]; then
  for file in "$@"; do
    upload_file "$file"
  done
else
  read -rp "请输入文件路径: " file_path
  upload_file "$file_path"
fi
"#
      )
    }
  };

  Response::builder()
    .status(StatusCode::OK)
    .header("Content-Type", "text/plain; charset=utf-8")
    .body(axum::body::Body::from(script))
    .unwrap()
}
