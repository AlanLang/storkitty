use std::sync::Arc;

use webauthn_rs::Webauthn;

use crate::backend::db::DBConnection;

#[derive(Clone)]
pub struct AppState {
  pub conn: DBConnection,
  pub webauthn: Arc<Webauthn>,
}
