mod content;
mod create;
mod delete;
mod extract;
mod list;
mod move_file;
mod rename;
mod upload;
use axum::{
  Router,
  routing::{delete, get, patch, post, put},
};

use crate::backend::state::AppState;

pub fn create_file_router() -> Router<AppState> {
  Router::<AppState>::new()
    .route("/{*path}", delete(delete::delete_file))
    .route("/{*path}", get(content::get_content))
    .route("/{*path}", put(content::save_content))
    .route("/{*path}", patch(rename::rename))
    .route("/{*path}", post(create::create_file))
    .route("/upload/{*path}", post(upload::upload_file))
    .route("/abort/{*path}", post(upload::abort_file))
    .route("/list/{*path}", get(list::list_files))
    .route("/copy", post(move_file::copy_file))
    .route("/move", post(move_file::move_file))
    .route("/extract/{*path}", post(extract::extract_file))
    .route("/compress/{*path}", post(extract::compress_directory))
}
