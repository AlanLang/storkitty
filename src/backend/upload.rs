use axum::{
    extract::{DefaultBodyLimit, Multipart, Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::Json,
    routing::{delete, get, post},
    Router,
};
use bytes::Bytes;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    path::PathBuf,
    sync::{Arc, Mutex},
};
use tokio::sync::RwLock;
use tokio::{fs, io::AsyncWriteExt};
use uuid::Uuid;
use serde_json;

#[derive(Debug)]
struct ReassembledFileInfo {
    original_name: String,
    file_size: u64,
    relative_path: String,
}

use crate::backend::{auth::AuthService, config::Config};

// Upload session data
#[derive(Debug, Clone)]
pub struct UploadSession {
    pub id: Uuid,
    pub file_name: String,
    pub file_size: u64,
    pub mime_type: String,
    pub target_path: String,
    pub chunk_size: usize,
    pub total_chunks: usize,
    pub received_chunks: Vec<bool>,
    pub temp_dir: PathBuf,
    pub created_at: DateTime<Utc>,
    pub user_id: String,
}

// In-memory upload session store
pub type UploadStore = Arc<Mutex<HashMap<Uuid, UploadSession>>>;

// Request/Response types
#[derive(Deserialize)]
pub struct InitUploadRequest {
    pub file_name: String,
    pub file_size: u64,
    pub mime_type: String,
    pub target_path: Option<String>,
}

#[derive(Serialize)]
pub struct InitUploadResponse {
    pub upload_id: Uuid,
    pub chunk_size: usize,
    pub total_chunks: usize,
}

#[derive(Serialize)]
pub struct ChunkUploadResponse {
    pub success: bool,
    pub received_chunks: usize,
    pub total_chunks: usize,
}

#[derive(Serialize)]
pub struct CompleteUploadResponse {
    pub file_path: String,
    pub file_info: FileInfo,
}

#[derive(Deserialize)]
pub struct ChunkParams {
    pub upload_id: Uuid,
    pub chunk_index: usize,
}

#[derive(Serialize)]
pub struct FileInfo {
    pub name: String,
    pub size: u64,
    pub mime_type: String,
}

// Constants
const DEFAULT_CHUNK_SIZE: usize = 1024 * 1024; // 1MB
const MAX_FILE_SIZE: u64 = 1024 * 1024 * 1024; // 1GB
const SESSION_TIMEOUT_HOURS: i64 = 24;

// Security validation
fn validate_file_name(file_name: &str) -> Result<(), String> {
    if file_name.is_empty() {
        return Err("File name cannot be empty".to_string());
    }
    
    if file_name.len() > 255 {
        return Err("File name too long".to_string());
    }
    
    // Check for path traversal attempts
    if file_name.contains("..") || file_name.contains('/') || file_name.contains('\\') {
        return Err("Invalid file name: contains path traversal sequences".to_string());
    }
    
    // Check for dangerous characters
    let dangerous_chars = ['<', '>', ':', '"', '|', '?', '*', '\0'];
    if file_name.chars().any(|c| dangerous_chars.contains(&c)) {
        return Err("Invalid file name: contains dangerous characters".to_string());
    }
    
    Ok(())
}

fn validate_mime_type(mime_type: &str) -> Result<(), String> {
    // Parse MIME type
    match mime_type.parse::<mime::Mime>() {
        Ok(_) => Ok(()),
        Err(_) => Err("Invalid MIME type format".to_string()),
    }
}

fn validate_path(path: &str) -> Result<(), String> {
    if path.contains("..") {
        return Err("Path traversal not allowed".to_string());
    }
    Ok(())
}

async fn handle_pseudo_chunked_upload(
    marker_data: &[u8],
    target_dir: &PathBuf,
    root_dir: &PathBuf,
    marker_file_name: &str,
) -> Result<Option<ReassembledFileInfo>, String> {
    // Parse the marker file to get upload info
    let marker_content = String::from_utf8(marker_data.to_vec())
        .map_err(|_| "Invalid marker file content")?;
    
    let upload_info: serde_json::Value = serde_json::from_str(&marker_content)
        .map_err(|_| "Invalid JSON in marker file")?;
    
    let original_name = upload_info["originalName"]
        .as_str()
        .ok_or("Missing originalName in marker")?;
    let total_chunks = upload_info["totalChunks"]
        .as_u64()
        .ok_or("Missing totalChunks in marker")? as usize;
    let file_size = upload_info["fileSize"]
        .as_u64()
        .ok_or("Missing fileSize in marker")?;
    let upload_id = upload_info["uploadId"]
        .as_str()
        .ok_or("Missing uploadId in marker")?;
    
    // Find the chunks directory - always in root .chunks directory
    let chunks_dir = root_dir.join(".chunks").join(upload_id);
    if !chunks_dir.exists() {
        return Ok(None); // No chunks directory found
    }
    
    // Build expected chunk pattern
    let base_name = original_name.replace(&format!(".{}", original_name.split('.').last().unwrap_or("")), "");
    let extension = original_name.split('.').last().unwrap_or("");
    
    // Collect and sort chunk files
    let mut chunk_files = Vec::new();
    let mut entries = fs::read_dir(&chunks_dir).await
        .map_err(|_| "Failed to read chunks directory")?;
    
    while let Some(entry) = entries.next_entry().await
        .map_err(|_| "Failed to read chunk entry")? {
        let file_name = entry.file_name().to_string_lossy().to_string();
        if file_name.starts_with(&format!("{}_chunk_", base_name)) && 
           file_name.contains(&format!("_{}", upload_id)) {
            chunk_files.push((file_name, entry.path()));
        }
    }
    
    if chunk_files.len() != total_chunks {
        return Err(format!("Expected {} chunks, found {}", total_chunks, chunk_files.len()));
    }
    
    // Sort chunks by index
    chunk_files.sort_by_key(|(name, _)| {
        // Extract chunk index from filename like "base_chunk_0001_uuid.ext"
        let parts: Vec<&str> = name.split('_').collect();
        if parts.len() >= 3 {
            parts[2].parse::<u32>().unwrap_or(0)
        } else {
            0
        }
    });
    
    // Reassemble the file
    let reassembled_path = target_dir.join(original_name);
    let mut final_file = fs::File::create(&reassembled_path).await
        .map_err(|_| "Failed to create final file")?;
    
    let mut total_written = 0u64;
    for (_, chunk_path) in &chunk_files {
        let chunk_data = fs::read(chunk_path).await
            .map_err(|_| "Failed to read chunk file")?;
        final_file.write_all(&chunk_data).await
            .map_err(|_| "Failed to write chunk to final file")?;
        total_written += chunk_data.len() as u64;
    }
    
    // Verify file size matches expected
    if total_written != file_size {
        return Err(format!("File size mismatch: expected {}, got {}", file_size, total_written));
    }
    
    // Clean up chunks directory and marker file
    let _ = fs::remove_dir_all(&chunks_dir).await;
    let marker_path = target_dir.join(marker_file_name);
    let _ = fs::remove_file(&marker_path).await;
    
    // Calculate relative path for the reassembled file
    let relative_path = reassembled_path
        .strip_prefix(root_dir)
        .unwrap_or(&reassembled_path)
        .to_string_lossy()
        .to_string();
    
    Ok(Some(ReassembledFileInfo {
        original_name: original_name.to_string(),
        file_size,
        relative_path,
    }))
}

// Magic number validation for common file types
fn validate_magic_bytes(mime_type: &str, data: &[u8]) -> bool {
    if data.len() < 4 {
        return false;
    }
    
    match mime_type {
        // Images
        "image/jpeg" => data.starts_with(&[0xFF, 0xD8, 0xFF]),
        "image/png" => data.starts_with(&[0x89, 0x50, 0x4E, 0x47]),
        "image/gif" => data.starts_with(b"GIF87a") || data.starts_with(b"GIF89a"),
        "image/webp" => data.len() >= 12 && &data[0..4] == b"RIFF" && &data[8..12] == b"WEBP",
        
        // Documents
        "application/pdf" => data.starts_with(b"%PDF"),
        "application/zip" => data.starts_with(&[0x50, 0x4B, 0x03, 0x04]) || data.starts_with(&[0x50, 0x4B, 0x05, 0x06]),
        
        // Text files - no magic bytes needed
        t if t.starts_with("text/") => true,
        
        // For other types, skip magic byte validation
        _ => true,
    }
}

// Upload handlers
pub async fn init_upload_handler(
    State(upload_service): State<Arc<UploadService>>,
    headers: HeaderMap,
    Json(req): Json<InitUploadRequest>,
) -> Result<Json<InitUploadResponse>, StatusCode> {
    // Verify authentication
    let username = upload_service.verify_auth(&headers).await?;
    
    // Validate request
    validate_file_name(&req.file_name).map_err(|_| StatusCode::BAD_REQUEST)?;
    validate_mime_type(&req.mime_type).map_err(|_| StatusCode::BAD_REQUEST)?;
    
    if let Some(ref path) = req.target_path {
        validate_path(path).map_err(|_| StatusCode::BAD_REQUEST)?;
    }
    
    if req.file_size > MAX_FILE_SIZE {
        return Err(StatusCode::PAYLOAD_TOO_LARGE);
    }
    
    // Create upload session
    let upload_id = Uuid::new_v4();
    let chunk_size = DEFAULT_CHUNK_SIZE;
    let total_chunks = ((req.file_size as f64) / (chunk_size as f64)).ceil() as usize;
    
    // Create temporary directory
    let temp_dir = { let config = upload_service.config.read().await; PathBuf::from(&config.files.root_directory) }.join("temp").join(upload_id.to_string());
    fs::create_dir_all(&temp_dir).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let session = UploadSession {
        id: upload_id,
        file_name: req.file_name,
        file_size: req.file_size,
        mime_type: req.mime_type,
        target_path: req.target_path.unwrap_or_default(),
        chunk_size,
        total_chunks,
        received_chunks: vec![false; total_chunks],
        temp_dir,
        created_at: Utc::now(),
        user_id: username,
    };
    
    upload_service.upload_store.lock().unwrap().insert(upload_id, session);
    
    Ok(Json(InitUploadResponse {
        upload_id,
        chunk_size,
        total_chunks,
    }))
}

// New chunk upload handler that uses query parameters and request body
pub async fn chunk_upload_handler(
    State(upload_service): State<Arc<UploadService>>,
    Query(params): Query<ChunkParams>,
    headers: HeaderMap,
    body: axum::body::Body,
) -> Result<Json<ChunkUploadResponse>, StatusCode> {
    let upload_id = params.upload_id;
    let chunk_index = params.chunk_index;
    // Verify authentication
    let _username = upload_service.verify_auth(&headers).await?;
    
    // Read chunk data from request body
    use axum::body::to_bytes;
    let chunk_data = to_bytes(body, DEFAULT_CHUNK_SIZE + 1024).await.map_err(|_| StatusCode::BAD_REQUEST)?;
    
    // Get upload session
    let mut store = upload_service.upload_store.lock().unwrap();
    let session = store.get_mut(&upload_id).ok_or(StatusCode::NOT_FOUND)?;
    
    // Validate chunk index
    if chunk_index >= session.total_chunks {
        return Err(StatusCode::BAD_REQUEST);
    }
    
    // Validate chunk data for first chunk (magic bytes)
    if chunk_index == 0 && !chunk_data.is_empty() {
        if !validate_magic_bytes(&session.mime_type, &chunk_data) {
            return Err(StatusCode::UNSUPPORTED_MEDIA_TYPE);
        }
    }
    
    // Save chunk to temporary file
    let chunk_path = session.temp_dir.join(format!("chunk_{:04}", chunk_index));
    fs::write(&chunk_path, &chunk_data).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // Mark chunk as received
    session.received_chunks[chunk_index] = true;
    let received_count = session.received_chunks.iter().filter(|&&x| x).count();
    
    Ok(Json(ChunkUploadResponse {
        success: true,
        received_chunks: received_count,
        total_chunks: session.total_chunks,
    }))
}

pub async fn complete_upload_handler(
    State(upload_service): State<Arc<UploadService>>,
    headers: HeaderMap,
    Json(upload_id): Json<Uuid>,
) -> Result<Json<CompleteUploadResponse>, StatusCode> {
    // Verify authentication
    let _username = upload_service.verify_auth(&headers).await?;
    // Get and remove upload session
    let session = {
        let mut store = upload_service.upload_store.lock().unwrap();
        store.remove(&upload_id).ok_or(StatusCode::NOT_FOUND)?
    };
    
    // Check all chunks received
    if !session.received_chunks.iter().all(|&x| x) {
        return Err(StatusCode::BAD_REQUEST);
    }
    
    // Use original file name (allow overwrite)
    let final_file_name = &session.file_name;
    
    // Determine final file path
    let root_dir = { let config = upload_service.config.read().await; PathBuf::from(&config.files.root_directory) };
    let target_dir = if session.target_path.is_empty() {
        root_dir.clone()
    } else {
        root_dir.join(&session.target_path)
    };
    
    fs::create_dir_all(&target_dir).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let final_path = target_dir.join(final_file_name);
    
    // Reassemble file from chunks
    let mut final_file = fs::File::create(&final_path).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    for i in 0..session.total_chunks {
        let chunk_path = session.temp_dir.join(format!("chunk_{:04}", i));
        let chunk_data = fs::read(&chunk_path).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        final_file.write_all(&chunk_data).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }
    
    // Cleanup temporary directory
    let _ = fs::remove_dir_all(&session.temp_dir).await;
    
    let relative_path = final_path
        .strip_prefix(&root_dir)
        .unwrap_or(&final_path)
        .to_string_lossy()
        .to_string();
    
    Ok(Json(CompleteUploadResponse {
        file_path: relative_path,
        file_info: FileInfo {
            name: session.file_name,
            size: session.file_size,
            mime_type: session.mime_type,
        },
    }))
}

pub async fn cancel_upload_handler(
    Path(upload_id): Path<Uuid>,
    State(upload_service): State<Arc<UploadService>>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Verify authentication
    let _username = upload_service.verify_auth(&headers).await?;
    // Get and remove upload session
    let session = {
        let mut store = upload_service.upload_store.lock().unwrap();
        store.remove(&upload_id).ok_or(StatusCode::NOT_FOUND)?
    };
    
    // Cleanup temporary directory
    let _ = fs::remove_dir_all(&session.temp_dir).await;
    
    Ok(Json(serde_json::json!({ "success": true })))
}

// Get upload status for resumable uploads
pub async fn get_upload_status_handler(
    Path(upload_id): Path<Uuid>,
    State(upload_service): State<Arc<UploadService>>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Verify authentication
    let _username = upload_service.verify_auth(&headers).await?;
    
    // Get upload session
    let store = upload_service.upload_store.lock().unwrap();
    let session = store.get(&upload_id).ok_or(StatusCode::NOT_FOUND)?;
    
    let received_chunks: Vec<usize> = session.received_chunks
        .iter()
        .enumerate()
        .filter_map(|(i, &received)| if received { Some(i) } else { None })
        .collect();
    
    Ok(Json(serde_json::json!({
        "upload_id": upload_id,
        "file_name": session.file_name,
        "file_size": session.file_size,
        "chunk_size": session.chunk_size,
        "total_chunks": session.total_chunks,
        "received_chunks": received_chunks,
        "completed_chunks": received_chunks.len(),
        "progress": (received_chunks.len() as f64 / session.total_chunks as f64) * 100.0
    })))
}

// Cleanup expired sessions
pub async fn cleanup_expired_sessions(upload_store: UploadStore) {
    let mut to_remove = Vec::new();
    
    {
        let store = upload_store.lock().unwrap();
        let now = Utc::now();
        
        for (id, session) in store.iter() {
            let hours_elapsed = now.signed_duration_since(session.created_at).num_hours();
            if hours_elapsed > SESSION_TIMEOUT_HOURS {
                to_remove.push((*id, session.temp_dir.clone()));
            }
        }
    }
    
    for (id, temp_dir) in to_remove {
        upload_store.lock().unwrap().remove(&id);
        let _ = fs::remove_dir_all(&temp_dir).await;
    }
}

// Upload service to manage state
pub struct UploadService {
    config: Arc<RwLock<Config>>,
    auth_service: Arc<AuthService>,
    upload_store: UploadStore,
}

impl UploadService {
    pub fn new(config: Arc<RwLock<Config>>, auth_service: Arc<AuthService>) -> Self {
        Self {
            config,
            auth_service,
            upload_store: Arc::new(Mutex::new(HashMap::new())),
        }
    }
    
    pub fn get_store(&self) -> UploadStore {
        self.upload_store.clone()
    }
    
    async fn verify_auth(&self, headers: &HeaderMap) -> Result<String, StatusCode> {
        let auth_header = headers
            .get("Authorization")
            .and_then(|value| value.to_str().ok())
            .and_then(|value| value.strip_prefix("Bearer "));

        let token = match auth_header {
            Some(token) => token,
            None => return Err(StatusCode::UNAUTHORIZED),
        };

        match self.auth_service.verify_token(token).await {
            Ok(token_data) => Ok(token_data.claims.sub),
            Err(_) => Err(StatusCode::UNAUTHORIZED),
        }
    }
}

// Simplified single file upload handler
pub async fn simple_upload_handler(
    State(upload_service): State<Arc<UploadService>>,
    headers: HeaderMap,
    mut multipart: Multipart,
) -> Result<Json<CompleteUploadResponse>, StatusCode> {
    // Verify authentication
    let _username = upload_service.verify_auth(&headers).await?;
    
    let mut file_name: Option<String> = None;
    let mut file_data: Option<Bytes> = None;
    let mut target_path: Option<String> = None;
    
    // Parse multipart form data
    while let Some(field) = multipart.next_field().await.map_err(|_| StatusCode::BAD_REQUEST)? {
        match field.name() {
            Some("fileName") => {
                let data = field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?;
                file_name = Some(String::from_utf8(data.to_vec()).map_err(|_| StatusCode::BAD_REQUEST)?);
            }
            Some("targetPath") => {
                let data = field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?;
                target_path = Some(String::from_utf8(data.to_vec()).map_err(|_| StatusCode::BAD_REQUEST)?);
            }
            Some("file") => {
                file_data = Some(field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?);
            }
            _ => {}
        }
    }
    
    let file_name = file_name.ok_or(StatusCode::BAD_REQUEST)?;
    let file_data = file_data.ok_or(StatusCode::BAD_REQUEST)?;
    let target_path = target_path.unwrap_or_default();
    
    // Validate file name and path
    validate_file_name(&file_name).map_err(|_| StatusCode::BAD_REQUEST)?;
    if !target_path.is_empty() {
        validate_path(&target_path).map_err(|_| StatusCode::BAD_REQUEST)?;
    }
    
    // Check file size
    if file_data.len() as u64 > MAX_FILE_SIZE {
        return Err(StatusCode::PAYLOAD_TOO_LARGE);
    }
    
    // Use original file name (allow overwrite)
    let final_file_name = &file_name;
    
    // Determine final file path
    let root_dir = { let config = upload_service.config.read().await; PathBuf::from(&config.files.root_directory) };
    let target_dir = if target_path.is_empty() {
        root_dir.clone()
    } else {
        root_dir.join(&target_path)
    };
    
    fs::create_dir_all(&target_dir).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let final_path = target_dir.join(final_file_name);
    
    // Check if this is a pseudo-chunked upload completion marker
    if file_name.ends_with(".upload_complete") {
        match handle_pseudo_chunked_upload(&file_data, &target_dir, &root_dir, &file_name).await {
            Ok(Some(reassembled_info)) => {
                // Return info for the reassembled file instead of the marker
                return Ok(Json(CompleteUploadResponse {
                    file_path: reassembled_info.relative_path,
                    file_info: FileInfo {
                        name: reassembled_info.original_name,
                        size: reassembled_info.file_size,
                        mime_type: "application/octet-stream".to_string(),
                    },
                }));
            }
            Ok(None) => {
                // Not a valid pseudo-chunked upload, return error instead of saving marker file
                eprintln!("Upload completion marker found but no chunks available for: {}", file_name);
                return Err(StatusCode::BAD_REQUEST);
            }
            Err(e) => {
                eprintln!("Failed to handle pseudo-chunked upload: {}", e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        }
    }
    
    // Write file normally
    fs::write(&final_path, &file_data).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let relative_path = final_path
        .strip_prefix(&root_dir)
        .unwrap_or(&final_path)
        .to_string_lossy()
        .to_string();
    
    Ok(Json(CompleteUploadResponse {
        file_path: relative_path,
        file_info: FileInfo {
            name: file_name,
            size: file_data.len() as u64,
            mime_type: "application/octet-stream".to_string(),
        },
    }))
}

// Router setup
pub fn upload_router(upload_service: Arc<UploadService>, max_file_size_mb: u64) -> Router {
    let max_size_bytes = max_file_size_mb * 1024 * 1024;
    Router::new()
        .route("/simple", post(simple_upload_handler))
        .route("/init", post(init_upload_handler))
        // .route("/chunk", post(chunk_upload_handler))  // Temporarily disabled due to Axum compatibility
        .route("/complete", post(complete_upload_handler))
        .route("/status/{upload_id}", get(get_upload_status_handler))
        .route("/{upload_id}", delete(cancel_upload_handler))
        .layer(DefaultBodyLimit::max(max_size_bytes as usize))
        .with_state(upload_service)
}