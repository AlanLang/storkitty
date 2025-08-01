use axum::{
    body::Body,
    extract::{Path, State, Json as ExtractJson},
    http::{HeaderMap, StatusCode, header::CONTENT_DISPOSITION},
    response::{Json, Response},
    routing::{delete, get, post, put},
    Router,
};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::PathBuf,
    sync::Arc,
    time::SystemTime,
};
use tokio::sync::RwLock;
use tokio_util::io::ReaderStream;

use crate::backend::{auth::AuthService, config::Config};

// 重用原文件中的结构体定义
#[derive(Debug, Serialize)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub file_type: String,
    pub size: Option<u64>,
    pub modified: String,
    pub items: Option<usize>,
}

#[derive(Debug, Serialize)]  
pub struct FilesResponse {
    pub success: bool,
    pub files: Vec<FileInfo>,
    pub current_path: String,
    pub message: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct StorageResponse {
    pub success: bool,
    pub storage: StorageInfo,
    pub message: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct StorageInfo {
    pub used_bytes: u64,
    pub total_bytes: u64,
    pub used_percentage: f64,
}

#[derive(Debug, Serialize)]
pub struct DeleteResponse {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct CreateDirectoryResponse {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct RenameResponse {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct RenameRequest {
    pub new_name: String,
}

#[derive(Debug, Serialize)]
pub struct ReadmeResponse {
    pub success: bool,
    pub content: Option<String>,
    pub message: Option<String>,
}

pub struct FileService {
    config: Arc<RwLock<Config>>,
    auth_service: Arc<AuthService>,
}

impl FileService {
    pub fn new(config: Arc<RwLock<Config>>, auth_service: Arc<AuthService>) -> Self {
        Self { config, auth_service }
    }

    async fn verify_auth(&self, headers: &HeaderMap) -> Result<(), StatusCode> {
        let auth_header = headers
            .get("Authorization")
            .and_then(|value| value.to_str().ok())
            .and_then(|value| value.strip_prefix("Bearer "));

        let token = match auth_header {
            Some(token) => token,
            None => return Err(StatusCode::UNAUTHORIZED),
        };

        self.auth_service.verify_token(token).await
            .map_err(|_| StatusCode::UNAUTHORIZED)?;
        
        Ok(())
    }

    fn is_system_file(&self, name: &str) -> bool {
        matches!(name, ".DS_Store" | ".chunks" | "Thumbs.db" | ".gitkeep" | "desktop.ini" | ".tmp" | ".temp" | "__pycache__" | ".git" | ".svn" | "node_modules")
    }

    fn format_modified_time(time: SystemTime) -> String {
        let datetime = time.duration_since(SystemTime::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        chrono::DateTime::from_timestamp(datetime as i64, 0)
            .unwrap_or_default()
            .format("%Y-%m-%d %H:%M:%S")
            .to_string()
    }

    // 只保留多目录版本的方法

    pub async fn list_files_with_directory(&self, headers: &HeaderMap, directory_id: &str, file_path: Option<String>) -> Result<Json<FilesResponse>, StatusCode> {
        // 验证认证
        self.verify_auth(headers).await?;

        let config = self.config.read().await;
        let directory_config = config.get_directory_by_id(directory_id)
            .ok_or(StatusCode::NOT_FOUND)?;

        let directory_path = PathBuf::from(directory_config.path.as_ref().unwrap());
        let target_path = if let Some(ref path) = file_path {
            directory_path.join(path)
        } else {
            directory_path.clone()
        };

        log::info!("Listing files for directory {} path: {:?}", directory_id, file_path);

        if !target_path.exists() || !target_path.is_dir() {
            return Ok(Json(FilesResponse {
                success: false,
                files: vec![],
                current_path: file_path.unwrap_or_default(),
                message: Some("目录不存在".to_string()),
            }));
        }

        let mut files = Vec::new();
        
        match fs::read_dir(&target_path) {
            Ok(entries) => {
                for entry in entries {
                    if let Ok(entry) = entry {
                        let path = entry.path();
                        let metadata = match entry.metadata() {
                            Ok(metadata) => metadata,
                            Err(_) => continue,
                        };

                        let name = match path.file_name() {
                            Some(name) => name.to_string_lossy().to_string(),
                            None => continue,
                        };

                        if self.is_system_file(&name) {
                            continue;
                        }

                        let relative_path = match path.strip_prefix(&directory_path) {
                            Ok(rel_path) => rel_path.to_string_lossy().to_string(),
                            Err(_) => continue,
                        };

                        let (file_type, size, items) = if metadata.is_dir() {
                            let item_count = fs::read_dir(&path)
                                .map(|entries| {
                                    entries
                                        .filter_map(|entry| entry.ok())
                                        .filter(|entry| {
                                            if let Some(name) = entry.file_name().to_str() {
                                                !self.is_system_file(name)
                                            } else {
                                                false
                                            }
                                        })
                                        .count()
                                })
                                .unwrap_or(0);
                            ("folder".to_string(), None, Some(item_count))
                        } else {
                            ("file".to_string(), Some(metadata.len()), None)
                        };

                        let modified = Self::format_modified_time(
                            metadata.modified().unwrap_or(SystemTime::UNIX_EPOCH)
                        );

                        files.push(FileInfo {
                            name: name.clone(),
                            path: relative_path,
                            file_type,
                            size,
                            modified,
                            items,
                        });
                    }
                }

                files.sort_by(|a, b| {
                    match (a.file_type.as_str(), b.file_type.as_str()) {
                        ("folder", "file") => std::cmp::Ordering::Less,
                        ("file", "folder") => std::cmp::Ordering::Greater,
                        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
                    }
                });

                log::info!("Successfully read directory: {:?}", target_path);
                Ok(Json(FilesResponse {
                    success: true,
                    files,
                    current_path: file_path.unwrap_or_default(),
                    message: None,
                }))
            }
            Err(e) => {
                log::error!("Failed to read directory {:?}: {}", target_path, e);
                Ok(Json(FilesResponse {
                    success: false,
                    files: vec![],
                    current_path: file_path.unwrap_or_default(),
                    message: Some("无法读取目录".to_string()),
                }))
            }
        }
    }

    pub async fn get_storage_info_with_directory(&self, headers: &HeaderMap, directory_id: &str) -> Result<Json<StorageResponse>, StatusCode> {
        self.verify_auth(headers).await?;

        let config = self.config.read().await;
        let directory_config = config.get_directory_by_id(directory_id)
            .ok_or(StatusCode::NOT_FOUND)?;

        let directory_path = PathBuf::from(directory_config.path.as_ref().unwrap());

        let used_bytes = Self::calculate_directory_size(&directory_path);
        let total_bytes = 1024u64 * 1024 * 1024 * 100; // 100GB placeholder
        let used_percentage = (used_bytes as f64 / total_bytes as f64) * 100.0;

        Ok(Json(StorageResponse {
            success: true,
            storage: StorageInfo {
                used_bytes,
                total_bytes,
                used_percentage,
            },
            message: None,
        }))
    }

    fn calculate_directory_size(path: &PathBuf) -> u64 {
        let mut size = 0;
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if let Ok(metadata) = entry.metadata() {
                    if metadata.is_dir() {
                        size += Self::calculate_directory_size(&path);
                    } else {
                        size += metadata.len();
                    }
                }
            }
        }
        size
    }

    pub async fn delete_file_with_directory(&self, headers: &HeaderMap, directory_id: &str, file_path: String) -> Result<Json<DeleteResponse>, StatusCode> {
        self.verify_auth(headers).await?;

        let config = self.config.read().await;
        let directory_config = config.get_directory_by_id(directory_id)
            .ok_or(StatusCode::NOT_FOUND)?;

        let directory_path = PathBuf::from(directory_config.path.as_ref().unwrap());
        let target_path = directory_path.join(&file_path);

        if !target_path.exists() {
            return Ok(Json(DeleteResponse {
                success: false,
                message: "文件或目录不存在".to_string(),
            }));
        }

        let result = if target_path.is_dir() {
            fs::remove_dir_all(&target_path)
        } else {
            fs::remove_file(&target_path)
        };

        match result {
            Ok(_) => Ok(Json(DeleteResponse {
                success: true,
                message: "删除成功".to_string(),
            })),
            Err(_) => Ok(Json(DeleteResponse {
                success: false,
                message: "删除失败".to_string(),
            })),
        }
    }

    pub async fn create_directory_with_directory(&self, headers: &HeaderMap, directory_id: &str, directory_path: String) -> Result<Json<CreateDirectoryResponse>, StatusCode> {
        self.verify_auth(headers).await?;

        let config = self.config.read().await;
        let directory_config = config.get_directory_by_id(directory_id)
            .ok_or(StatusCode::NOT_FOUND)?;

        let base_path = PathBuf::from(directory_config.path.as_ref().unwrap());
        let target_path = base_path.join(&directory_path);

        if target_path.exists() {
            return Ok(Json(CreateDirectoryResponse {
                success: false,
                message: "目录已存在".to_string(),
            }));
        }

        match fs::create_dir_all(&target_path) {
            Ok(_) => Ok(Json(CreateDirectoryResponse {
                success: true,
                message: "创建成功".to_string(),
            })),
            Err(_) => Ok(Json(CreateDirectoryResponse {
                success: false,
                message: "创建失败".to_string(),
            })),
        }
    }

    pub async fn rename_file_with_directory(&self, headers: &HeaderMap, directory_id: &str, file_path: String, new_name: String) -> Result<(StatusCode, Json<RenameResponse>), StatusCode> {
        self.verify_auth(headers).await?;

        let config = self.config.read().await;
        let directory_config = config.get_directory_by_id(directory_id)
            .ok_or(StatusCode::NOT_FOUND)?;

        let base_path = PathBuf::from(directory_config.path.as_ref().unwrap());
        let old_path = base_path.join(&file_path);
        let parent = old_path.parent().unwrap_or(&base_path);
        let new_path = parent.join(&new_name);

        if !old_path.exists() {
            return Ok((StatusCode::NOT_FOUND, Json(RenameResponse {
                success: false,
                message: "文件不存在".to_string(),
            })));
        }

        if new_path.exists() {
            return Ok((StatusCode::CONFLICT, Json(RenameResponse {
                success: false,
                message: "目标文件名已存在".to_string(),
            })));
        }

        match fs::rename(&old_path, &new_path) {
            Ok(_) => Ok((StatusCode::OK, Json(RenameResponse {
                success: true,
                message: "重命名成功".to_string(),
            }))),
            Err(_) => Ok((StatusCode::INTERNAL_SERVER_ERROR, Json(RenameResponse {
                success: false,
                message: "重命名失败".to_string(),
            }))),
        }
    }

    pub async fn download_file_with_directory(&self, directory_id: &str, file_path: String) -> Result<axum::response::Response, StatusCode> {
        log::info!("Attempting to download file from directory {}: {}", directory_id, file_path);
        
        let directory_config = {
            let config = self.config.read().await;
            match config.get_directory_by_id(directory_id) {
                Some(dir) => dir,
                None => {
                    log::error!("Directory not found: {}", directory_id);
                    return Err(StatusCode::NOT_FOUND);
                }
            }
        };

        let directory_path = match &directory_config.path {
            Some(path) => PathBuf::from(path),
            None => {
                log::error!("Directory path not configured for: {}", directory_id);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        };

        let full_file_path = directory_path.join(&file_path);
        log::info!("Full file path resolved to: {:?}", full_file_path);
        
        if !full_file_path.exists() || !full_file_path.is_file() {
            log::error!("File not found: {:?}", full_file_path);
            return Err(StatusCode::NOT_FOUND);
        }

        let canonical_file_path = match full_file_path.canonicalize() {
            Ok(path) => path,
            Err(e) => {
                log::error!("Failed to canonicalize file path {:?}: {}", full_file_path, e);
                return Err(StatusCode::NOT_FOUND);
            }
        };

        let canonical_directory_path = match directory_path.canonicalize() {
            Ok(path) => path,
            Err(e) => {
                log::error!("Failed to canonicalize directory path {:?}: {}", directory_path, e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        };

        if !canonical_file_path.starts_with(&canonical_directory_path) {
            log::error!("Security violation: file path outside directory scope");
            return Err(StatusCode::FORBIDDEN);
        }

        let file = match tokio::fs::File::open(&full_file_path).await {
            Ok(file) => file,
            Err(e) => {
                log::error!("Failed to open file {:?}: {}", full_file_path, e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        };

        let file_size = match file.metadata().await {
            Ok(metadata) => metadata.len(),
            Err(e) => {
                log::error!("Failed to get file metadata: {}", e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        };

        let file_name = full_file_path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("download");

        let reader_stream = ReaderStream::new(file);
        let body = Body::from_stream(reader_stream);
        let content_disposition = format!("attachment; filename=\"{}\"", file_name);

        log::info!("Successfully serving file: {:?} (size: {} bytes)", full_file_path, file_size);

        Ok(Response::builder()
            .status(StatusCode::OK)
            .header("Content-Type", "application/octet-stream")
            .header(CONTENT_DISPOSITION, content_disposition)
            .header("Content-Length", file_size.to_string())
            .header("Cache-Control", "no-cache")
            .body(body)
            .unwrap())
    }

    pub async fn show_file_content_with_directory(&self, headers: &HeaderMap, directory_id: &str, file_path: String) -> Result<Json<ReadmeResponse>, StatusCode> {
        self.verify_auth(headers).await?;

        let config = self.config.read().await;
        let directory_config = config.get_directory_by_id(directory_id)
            .ok_or(StatusCode::NOT_FOUND)?;

        let directory_path = PathBuf::from(directory_config.path.as_ref().unwrap());
        let target_path = directory_path.join(&file_path);

        // 检查文件是否存在
        if !target_path.exists() {
            return Ok(Json(ReadmeResponse {
                success: false,
                content: None,
                message: Some("文件不存在".to_string()),
            }));
        }

        // 只处理文件，不处理目录
        if !target_path.is_file() {
            return Ok(Json(ReadmeResponse {
                success: false,
                content: None,
                message: Some("不是文件".to_string()),
            }));
        }

        // 检查文件扩展名是否为 markdown
        let file_name = target_path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");
        
        if !file_name.to_lowercase().ends_with(".md") {
            return Ok(Json(ReadmeResponse {
                success: false,
                content: None,
                message: Some("不是 Markdown 文件".to_string()),
            }));
        }

        // 读取并返回文件内容
        match fs::read_to_string(&target_path) {
            Ok(content) => {
                Ok(Json(ReadmeResponse {
                    success: true,
                    content: Some(content),
                    message: None,
                }))
            }
            Err(e) => {
                log::error!("Failed to read markdown file {:?}: {}", target_path, e);
                Ok(Json(ReadmeResponse {
                    success: false,
                    content: None,
                    message: Some("无法读取文件".to_string()),
                }))
            }
        }
    }
}

// Handler functions
pub async fn list_files_with_directory_handler(
    State(file_service): State<Arc<FileService>>,
    headers: HeaderMap,
    Path(directory_id): Path<String>,
) -> Result<Json<FilesResponse>, StatusCode> {
    file_service.list_files_with_directory(&headers, &directory_id, None).await
}

pub async fn list_files_with_directory_path_handler(
    State(file_service): State<Arc<FileService>>,
    headers: HeaderMap,
    Path((directory_id, file_path)): Path<(String, String)>,
) -> Result<Json<FilesResponse>, StatusCode> {
    file_service.list_files_with_directory(&headers, &directory_id, Some(file_path)).await
}

pub async fn storage_info_with_directory_handler(
    State(file_service): State<Arc<FileService>>,
    headers: HeaderMap,
    Path(directory_id): Path<String>,
) -> Result<Json<StorageResponse>, StatusCode> {
    file_service.get_storage_info_with_directory(&headers, &directory_id).await
}

pub async fn delete_file_with_directory_handler(
    State(file_service): State<Arc<FileService>>,
    headers: HeaderMap,
    Path((directory_id, file_path)): Path<(String, String)>,
) -> Result<Json<DeleteResponse>, StatusCode> {
    file_service.delete_file_with_directory(&headers, &directory_id, file_path).await
}

pub async fn create_directory_with_directory_handler(
    State(file_service): State<Arc<FileService>>,
    headers: HeaderMap,
    Path((directory_id, directory_path)): Path<(String, String)>,
) -> Result<Json<CreateDirectoryResponse>, StatusCode> {
    file_service.create_directory_with_directory(&headers, &directory_id, directory_path).await
}

pub async fn rename_file_with_directory_handler(
    State(file_service): State<Arc<FileService>>,
    headers: HeaderMap,
    Path((directory_id, file_path)): Path<(String, String)>,
    ExtractJson(request): ExtractJson<RenameRequest>,
) -> Result<(StatusCode, Json<RenameResponse>), StatusCode> {
    file_service.rename_file_with_directory(&headers, &directory_id, file_path, request.new_name).await
}

pub async fn download_file_with_directory_handler(
    State(file_service): State<Arc<FileService>>,
    Path((directory_id, file_path)): Path<(String, String)>,
) -> Result<axum::response::Response, StatusCode> {
    file_service.download_file_with_directory(&directory_id, file_path).await
}

pub async fn show_file_with_directory_handler(
    State(file_service): State<Arc<FileService>>,
    headers: HeaderMap,
    Path((directory_id, file_path)): Path<(String, String)>,
) -> Result<Json<ReadmeResponse>, StatusCode> {
    file_service.show_file_content_with_directory(&headers, &directory_id, file_path).await
}

// Router
pub fn files_router(file_service: Arc<FileService>) -> Router {
    Router::new()
        .route("/{directory_id}/list", get(list_files_with_directory_handler))
        .route("/{directory_id}/list/{*file_path}", get(list_files_with_directory_path_handler)) 
        .route("/{directory_id}/storage", get(storage_info_with_directory_handler))
        .route("/{directory_id}/delete/{*file_path}", delete(delete_file_with_directory_handler))
        .route("/{directory_id}/mkdir/{*directory_path}", post(create_directory_with_directory_handler))
        .route("/{directory_id}/rename/{*file_path}", put(rename_file_with_directory_handler))
        .route("/{directory_id}/download/{*file_path}", get(download_file_with_directory_handler))
        .route("/{directory_id}/show/{*file_path}", get(show_file_with_directory_handler))
        .with_state(file_service)
}