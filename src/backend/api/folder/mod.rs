mod create;
mod delete;
mod rename;
use axum::{
  Router,
  routing::{delete, patch, post},
};

use crate::backend::db::DBConnection;

pub fn create_folder_router() -> Router<DBConnection> {
  Router::<DBConnection>::new()
    .route("/{*path}", post(create::create_folder))
    .route("/{*path}", delete(delete::delete_folder))
    .route("/{*path}", patch(rename::rename))
}
