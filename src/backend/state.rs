use crate::backend::db::DBConnection;

#[derive(Clone)]
pub struct AppState {
  pub conn: DBConnection,
}
