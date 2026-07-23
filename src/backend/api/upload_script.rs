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
      uploading_filename: None,
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
CHUNK_SIZE=$((50 * 1024 * 1024))   # 50MB per chunk
THRESHOLD=$((100 * 1024 * 1024))   # files >= 100MB use chunked upload

url_encode() {{
  python3 -c "import sys,urllib.parse; print(urllib.parse.quote(sys.argv[1]))" "$1" 2>/dev/null || printf '%s' "$1"
}}

upload_single() {{
  local file="$1" filename="$2"
  echo "正在上传 $filename..."
  local http_code
  http_code=$(curl -# -o /dev/null -w "%{{http_code}}" \
    -X POST "$UPLOAD_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@$file")
  if [ "$http_code" = "200" ]; then
    echo "✓ $filename 上传成功"
  else
    echo "✗ $filename 上传失败 (HTTP $http_code)" >&2
    exit 1
  fi
}}

upload_chunked() {{
  local file="$1" filename="$2" file_size="$3"
  local total_chunks=$(( (file_size + CHUNK_SIZE - 1) / CHUNK_SIZE ))
  local size_mb=$(( file_size / 1024 / 1024 ))
  local encoded_name
  encoded_name=$(url_encode "$filename")
  echo "正在上传 $filename (${{size_mb}}MB，分 $total_chunks 片上传)..."
  for i in $(seq 0 $((total_chunks - 1))); do
    printf "  片段 [%d/%d]..." "$((i + 1))" "$total_chunks"
    local http_code
    http_code=$(dd if="$file" bs="$CHUNK_SIZE" skip="$i" count=1 2>/dev/null | \
      curl -s -o /dev/null -w "%{{http_code}}" \
        -X POST "$UPLOAD_URL" \
        -H "Authorization: Bearer $TOKEN" \
        -H "X-Chunk-Index: $i" \
        -H "X-Total-Chunks: $total_chunks" \
        -H "X-Filename: $encoded_name" \
        -H "Content-Type: application/octet-stream" \
        --data-binary @-)
    if [ "$http_code" = "200" ]; then
      echo " ✓"
    else
      echo " ✗ (HTTP $http_code)" >&2
      exit 1
    fi
  done
  echo "✓ $filename 上传成功"
}}

upload_file() {{
  local file="$1"
  if [ ! -f "$file" ]; then
    echo "错误: 文件不存在: $file" >&2
    exit 1
  fi
  local filename
  filename=$(basename "$file")
  local file_size
  file_size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
  if [ "$file_size" -ge "$THRESHOLD" ]; then
    upload_chunked "$file" "$filename" "$file_size"
  else
    upload_single "$file" "$filename"
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
