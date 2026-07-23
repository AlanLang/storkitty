use std::collections::HashMap;
use std::sync::Arc;
use std::time::Instant;

use tokio::sync::Mutex;
use webauthn_rs::Webauthn;

use crate::backend::db::DBConnection;

pub struct UploadTokenEntry {
  pub path: String,
  pub created_at: Instant,
  pub used: bool,
  /// 分片上传时记录文件名，防止同一 token 被用于不同文件
  pub uploading_filename: Option<String>,
}

pub type UploadTokens = Arc<Mutex<HashMap<String, UploadTokenEntry>>>;

#[derive(Clone)]
pub struct AppState {
  pub conn: DBConnection,
  pub webauthn: Arc<Webauthn>,
  pub upload_tokens: UploadTokens,
}
