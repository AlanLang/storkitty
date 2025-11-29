mod content;
mod create;
mod delete;
mod list;
mod rename;
mod upload;
use axum::{
  Router,
  routing::{delete, get, patch, post, put},
};

use crate::backend::db::DBConnection;

pub fn create_file_router() -> Router<DBConnection> {
  Router::<DBConnection>::new()
    .route("/{*path}", delete(delete::delete_file))
    .route("/{*path}", get(content::get_content))
    .route("/{*path}", put(content::save_content))
    .route("/{*path}", patch(rename::rename))
    .route("/{*path}", post(create::create_file))
    .route("/upload/{*path}", post(upload::upload_file))
    .route("/abort/{*path}", post(upload::abort_file))
    .route("/list/{*path}", get(list::list_files))
}
