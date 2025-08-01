use axum::{
    extract::{Path, State, Json as ExtractJson},
    http::{HeaderMap, StatusCode, header::CONTENT_DISPOSITION},
    response::Json,
    routing::{delete, get, post, put},
    Router,
};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path as StdPath, PathBuf},
    sync::Arc,
    time::SystemTime,
};
use tokio::sync::RwLock;
use tokio_util::io::ReaderStream;
use tokio::fs::File;

use crate::backend::{auth::AuthService, config::Config};

#[derive(Debug, Serialize)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub file_type: String, // "file" or "folder"
    pub size: Option<u64>,
    pub modified: String,
    pub items: Option<usize>, // 文件夹中的项目数量
}

#[derive(Debug, Serialize)]
pub struct FilesResponse {
    pub success: bool,
    pub files: Vec<FileInfo>,
    pub current_path: String,
    pub message: Option<String>,
}


#[derive(Debug, Serialize)]
pub struct StorageInfo {
    pub used_bytes: u64,
    pub total_bytes: u64,
    pub used_percentage: f64,
}

#[derive(Debug, Serialize)]
pub struct StorageResponse {
    pub success: bool,
    pub storage: StorageInfo,
    pub message: Option<String>,
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



pub struct FileService {
    config: Arc<RwLock<Config>>,
    auth_service: Arc<AuthService>,
}

impl FileService {
    pub fn new(config: Arc<RwLock<Config>>, auth_service: Arc<AuthService>) -> Self {
        Self {
            config,
            auth_service,
        }
    }

    // 判断是否为系统文件或目录，需要过滤掉
    fn is_system_file(&self, name: &str) -> bool {
        // 定义需要过滤的系统文件和目录
        const SYSTEM_FILES: &[&str] = &[
            ".DS_Store",      // macOS 系统文件
            ".chunks",        // 分片上传临时目录
            "Thumbs.db",      // Windows 缩略图缓存
            ".gitkeep",       // Git 保持空目录文件
            "desktop.ini",    // Windows 桌面配置
            ".tmp",           // 临时文件目录
            ".temp",          // 临时文件目录
            "__pycache__",    // Python 缓存目录
            ".git",           // Git 版本控制目录
            ".svn",           // SVN 版本控制目录
            "node_modules",   // Node.js 依赖目录（可选）
        ];

        // 只检查精确匹配
        SYSTEM_FILES.contains(&name)
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

    async fn get_safe_path(&self, requested_path: Option<String>) -> Result<PathBuf, StatusCode> {
        let config = self.config.read().await;
        
        // 获取默认目录配置
        let default_dir = config.get_first_directory()
            .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
        
        let root_dir = StdPath::new(default_dir.path.as_ref().ok_or(StatusCode::INTERNAL_SERVER_ERROR)?);
        
        // 确保根目录存在
        if !root_dir.exists() {
            if let Err(_) = fs::create_dir_all(root_dir) {
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        }

        let target_path = match requested_path {
            Some(path) if !path.is_empty() => {
                let clean_path = path.trim_start_matches('/');
                root_dir.join(clean_path)
            }
            _ => root_dir.to_path_buf(),
        };

        // 安全检查：确保路径在根目录内
        match target_path.canonicalize() {
            Ok(canonical_path) => {
                let canonical_root = root_dir.canonicalize().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
                if canonical_path.starts_with(canonical_root) {
                    Ok(canonical_path)
                } else {
                    Err(StatusCode::FORBIDDEN)
                }
            }
            Err(_) => {
                // 如果路径不存在，检查父目录是否安全
                if let Some(parent) = target_path.parent() {
                    if parent.starts_with(root_dir) {
                        Ok(target_path)
                    } else {
                        Err(StatusCode::FORBIDDEN)
                    }
                } else {
                    Err(StatusCode::BAD_REQUEST)
                }
            }
        }
    }

    fn format_file_size(bytes: u64) -> String {
        const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
        let mut size = bytes as f64;
        let mut unit_index = 0;

        while size >= 1024.0 && unit_index < UNITS.len() - 1 {
            size /= 1024.0;
            unit_index += 1;
        }

        if unit_index == 0 {
            format!("{} {}", bytes, UNITS[unit_index])
        } else {
            format!("{:.1} {}", size, UNITS[unit_index])
        }
    }

    fn format_modified_time(system_time: SystemTime) -> String {
        match system_time.duration_since(SystemTime::UNIX_EPOCH) {
            Ok(duration) => {
                let timestamp = duration.as_secs();
                // 简单格式化为 YYYY-MM-DD
                let datetime = chrono::DateTime::from_timestamp(timestamp as i64, 0);
                match datetime {
                    Some(dt) => dt.format("%Y-%m-%d").to_string(),
                    None => "未知".to_string(),
                }
            }
            Err(_) => "未知".to_string(),
        }
    }


    // 根据目录ID获取安全路径
    async fn get_safe_path_with_directory(&self, directory_id: &str, requested_path: Option<String>) -> Result<PathBuf, StatusCode> {
        let config = self.config.read().await;
        
        // 获取指定目录配置
        let directory_config = config.get_directory_by_id(directory_id)
            .ok_or(StatusCode::NOT_FOUND)?;
        
        // 目前仅支持本地存储
        if directory_config.storage_type != "local" {
            return Err(StatusCode::NOT_IMPLEMENTED);
        }
        
        let root_dir = PathBuf::from(directory_config.path.ok_or(StatusCode::INTERNAL_SERVER_ERROR)?);
        
        // 确保根目录存在
        if !root_dir.exists() {
            if let Err(_) = fs::create_dir_all(&root_dir) {
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        }

        let target_path = match requested_path {
            Some(path) if !path.is_empty() => {
                let clean_path = path.trim_start_matches('/');
                root_dir.join(clean_path)
            }
            _ => root_dir.to_path_buf(),
        };

        // 安全检查：确保路径在根目录内
        match target_path.canonicalize() {
            Ok(canonical_path) => {
                let canonical_root = root_dir.canonicalize().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
                if canonical_path.starts_with(canonical_root) {
                    Ok(canonical_path)
                } else {
                    Err(StatusCode::FORBIDDEN)
                }
            }
            Err(_) => {
                // 如果路径不存在，检查父目录是否安全
                if let Some(parent) = target_path.parent() {
                    if parent.starts_with(root_dir) {
                        Ok(target_path)
                    } else {
                        Err(StatusCode::FORBIDDEN)
                    }
                } else {
                    Err(StatusCode::BAD_REQUEST)
                }
            }
        }
    }

    pub async fn list_files(&self, headers: &HeaderMap, file_path: Option<String>) -> Result<Json<FilesResponse>, StatusCode> {
        // 验证认证
        self.verify_auth(headers).await?;

        let requested_path = file_path.clone();
        log::info!("Listing files for path: {:?}", requested_path);
        
        let safe_path = self.get_safe_path(requested_path.clone()).await?;
        log::info!("Safe path resolved to: {:?}", safe_path);
        
        if !safe_path.exists() {
            return Ok(Json(FilesResponse {
                success: false,
                files: vec![],
                current_path: requested_path.unwrap_or_default(),
                message: Some("路径不存在".to_string()),
            }));
        }

        if !safe_path.is_dir() {
            return Ok(Json(FilesResponse {
                success: false,
                files: vec![],
                current_path: requested_path.unwrap_or_default(),
                message: Some("不是有效的目录".to_string()),
            }));
        }

        let mut files = Vec::new();
        
        match fs::read_dir(&safe_path) {
            Ok(entries) => {
                log::info!("Successfully opened directory: {:?}", safe_path);
                for entry in entries {
                    if let Ok(entry) = entry {
                        let path = entry.path();
                        log::info!("Processing entry: {:?}", path);
                        let metadata = match entry.metadata() {
                            Ok(metadata) => metadata,
                            Err(e) => {
                                log::warn!("Failed to get metadata for {:?}: {}", path, e);
                                continue;
                            }
                        };

                        let name = match path.file_name() {
                            Some(name) => name.to_string_lossy().to_string(),
                            None => continue,
                        };

                        // 过滤系统文件
                        if self.is_system_file(&name) {
                            log::debug!("Filtering out system file: {}", name);
                            continue;
                        }

                        let config = self.config.read().await;
                        let default_dir = config.get_first_directory()
                            .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
                        let root_dir = StdPath::new(default_dir.path.as_ref().unwrap()).canonicalize().unwrap_or_else(|_| {
                            StdPath::new(default_dir.path.as_ref().unwrap()).to_path_buf()
                        });
                        
                        let relative_path = match path.strip_prefix(&root_dir) {
                            Ok(rel_path) => rel_path.to_string_lossy().to_string(),
                            Err(e) => {
                                log::warn!("Failed to strip prefix for {:?} with root {:?}: {}", path, root_dir, e);
                                continue;
                            }
                        };

                        let (file_type, size, items) = if metadata.is_dir() {
                            // 统计文件夹中的项目数量，排除系统文件
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

                        let file_info = FileInfo {
                            name: name.clone(),
                            path: relative_path.clone(),
                            file_type: file_type.clone(),
                            size,
                            modified: modified.clone(),
                            items,
                        };
                        log::info!("Adding file: {:?}", file_info);
                        files.push(file_info);
                    }
                }

                // 按名称排序，文件夹在前
                files.sort_by(|a, b| {
                    match (a.file_type.as_str(), b.file_type.as_str()) {
                        ("folder", "file") => std::cmp::Ordering::Less,
                        ("file", "folder") => std::cmp::Ordering::Greater,
                        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
                    }
                });

                Ok(Json(FilesResponse {
                    success: true,
                    files,
                    current_path: requested_path.unwrap_or_default(),
                    message: None,
                }))
            }
            Err(_) => Ok(Json(FilesResponse {
                success: false,
                files: vec![],
                current_path: requested_path.unwrap_or_default(),
                message: Some("无法读取目录".to_string()),
            })),
        }
    }

    // 带目录ID的文件列表
    pub async fn list_files_with_directory(&self, headers: &HeaderMap, directory_id: &str, file_path: Option<String>) -> Result<Json<FilesResponse>, StatusCode> {
        // 验证认证
        self.verify_auth(headers).await?;

        let requested_path = file_path.clone();
        log::info!("Listing files for directory {} path: {:?}", directory_id, requested_path);
        
        let safe_path = self.get_safe_path_with_directory(directory_id, requested_path.clone()).await?;
        log::info!("Safe path resolved to: {:?}", safe_path);
        
        if !safe_path.exists() {
            return Ok(Json(FilesResponse {
                success: false,
                files: vec![],
                current_path: requested_path.unwrap_or_default(),
                message: Some("路径不存在".to_string()),
            }));
        }

        if !safe_path.is_dir() {
            return Ok(Json(FilesResponse {
                success: false,
                files: vec![],
                current_path: requested_path.unwrap_or_default(),
                message: Some("不是有效的目录".to_string()),
            }));
        }

        match fs::read_dir(&safe_path) {
            Ok(entries) => {
                log::info!("Successfully read directory: {:?}", safe_path);
                let mut files = Vec::new();

                for entry in entries {
                    if let Ok(entry) = entry {
                        let path = entry.path();
                        let name = match entry.file_name().to_str() {
                            Some(name) => name.to_string(),
                            None => continue,
                        };

                        let metadata = match entry.metadata() {
                            Ok(metadata) => metadata,
                            Err(_) => continue,
                        };

                        // 过滤系统文件
                        if self.is_system_file(&name) {
                            log::debug!("Filtering out system file: {}", name);
                            continue;
                        }

                        // 获取目录配置以计算相对路径
                        let config = self.config.read().await;
                        let directory_config = config.get_directory_by_id(directory_id)
                            .ok_or(StatusCode::NOT_FOUND)?;
                        let root_dir = StdPath::new(directory_config.path.as_ref().unwrap()).canonicalize().unwrap_or_else(|_| {
                            StdPath::new(directory_config.path.as_ref().unwrap()).to_path_buf()
                        });
                        
                        let relative_path = match path.strip_prefix(&root_dir) {
                            Ok(rel_path) => rel_path.to_string_lossy().to_string(),
                            Err(e) => {
                                log::warn!("Failed to strip prefix for {:?} with root {:?}: {}", path, root_dir, e);
                                continue;
                            }
                        };

                        let (file_type, size, items) = if metadata.is_dir() {
                            // 统计文件夹中的项目数量，排除系统文件
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

                        let file_info = FileInfo {
                            name: name.clone(),
                            path: relative_path.clone(),
                            file_type: file_type.clone(),
                            size,
                            modified,
                            items,
                        };

                        files.push(file_info);
                    }
                }

                // 按类型排序：文件夹在前，然后按名称排序
                files.sort_by(|a, b| {
                    match (a.file_type.as_str(), b.file_type.as_str()) {
                        ("folder", "file") => std::cmp::Ordering::Less,
                        ("file", "folder") => std::cmp::Ordering::Greater,
                        _ => a.name.cmp(&b.name),
                    }
                });

                Ok(Json(FilesResponse {
                    success: true,
                    files,
                    current_path: requested_path.unwrap_or_default(),
                    message: None,
                }))
            }
            Err(_) => Ok(Json(FilesResponse {
                success: false,
                files: vec![],
                current_path: requested_path.unwrap_or_default(),
                message: Some("无法读取目录".to_string()),
            })),
        }
    }

    pub async fn get_storage_info(&self, headers: &HeaderMap) -> Result<Json<StorageResponse>, StatusCode> {
        // 验证认证
        self.verify_auth(headers).await?;

        let config = self.config.read().await;
        let default_dir = config.get_first_directory()
            .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
        let root_path = StdPath::new(default_dir.path.as_ref().ok_or(StatusCode::INTERNAL_SERVER_ERROR)?);
        
        // 计算已使用空间
        let used_bytes = self.calculate_directory_size(root_path).unwrap_or(0);
        
        // 获取磁盘总空间（简化实现，使用固定值或从配置读取）
        let total_bytes = 64 * 1024 * 1024 * 1024; // 64GB 作为示例
        
        let used_percentage = if total_bytes > 0 {
            (used_bytes as f64 / total_bytes as f64) * 100.0
        } else {
            0.0
        };

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

    // 带目录ID的存储信息
    pub async fn get_storage_info_with_directory(&self, headers: &HeaderMap, directory_id: &str) -> Result<Json<StorageResponse>, StatusCode> {
        // 验证认证
        self.verify_auth(headers).await?;

        let config = self.config.read().await;
        
        // 获取指定目录配置
        let directory_config = config.get_directory_by_id(directory_id)
            .ok_or(StatusCode::NOT_FOUND)?;
        
        // 目前仅支持本地存储
        if directory_config.storage_type != "local" {
            return Err(StatusCode::NOT_IMPLEMENTED);
        }
        
        let root_path = StdPath::new(directory_config.path.as_ref().unwrap());
        
        // 计算已使用空间
        let used_bytes = self.calculate_directory_size(root_path).unwrap_or(0);
        
        // 获取磁盘总空间（简化实现，使用固定值或从配置读取）
        let total_bytes = 64 * 1024 * 1024 * 1024; // 64GB 作为示例
        
        let used_percentage = if total_bytes > 0 {
            (used_bytes as f64 / total_bytes as f64) * 100.0
        } else {
            0.0
        };

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

    fn calculate_directory_size(&self, path: &StdPath) -> Result<u64, std::io::Error> {
        let mut total_size = 0;
        
        if path.is_dir() {
            for entry in fs::read_dir(path)? {
                let entry = entry?;
                let path = entry.path();
                
                // 检查是否为系统文件，如果是则跳过
                if let Some(name) = path.file_name() {
                    let name_str = name.to_string_lossy();
                    if self.is_system_file(&name_str) {
                        continue;
                    }
                }
                
                if path.is_dir() {
                    total_size += self.calculate_directory_size(&path).unwrap_or(0);
                } else {
                    total_size += entry.metadata()?.len();
                }
            }
        } else {
            total_size += fs::metadata(path)?.len();
        }
        
        Ok(total_size)
    }

    pub async fn delete_file(&self, headers: &HeaderMap, file_path: String) -> Result<Json<DeleteResponse>, StatusCode> {
        // 验证认证
        self.verify_auth(headers).await?;

        // 检查删除权限
        let config = self.config.read().await;
        if !config.security.allow_delete {
            return Ok(Json(DeleteResponse {
                success: false,
                message: "文件删除功能已被禁用".to_string(),
            }));
        }

        log::info!("Attempting to delete file: {}", file_path);
        
        let safe_path = self.get_safe_path(Some(file_path.clone())).await?;
        log::info!("Safe path resolved to: {:?}", safe_path);
        
        if !safe_path.exists() {
            return Ok(Json(DeleteResponse {
                success: false,
                message: "文件或目录不存在".to_string(),
            }));
        }

        // 执行删除操作
        let result = if safe_path.is_dir() {
            // 删除目录及其所有内容
            fs::remove_dir_all(&safe_path)
        } else {
            // 删除单个文件
            fs::remove_file(&safe_path)
        };

        match result {
            Ok(_) => {
                log::info!("Successfully deleted: {:?}", safe_path);
                Ok(Json(DeleteResponse {
                    success: true,
                    message: "删除成功".to_string(),
                }))
            }
            Err(e) => {
                log::error!("Failed to delete {:?}: {}", safe_path, e);
                Ok(Json(DeleteResponse {
                    success: false,
                    message: format!("删除失败: {}", e),
                }))
            }
        }
    }

    // 带目录ID的删除文件
    pub async fn delete_file_with_directory(&self, headers: &HeaderMap, directory_id: &str, file_path: String) -> Result<Json<DeleteResponse>, StatusCode> {
        // 验证认证
        self.verify_auth(headers).await?;

        // 检查删除权限
        let config = self.config.read().await;
        if !config.security.allow_delete {
            return Ok(Json(DeleteResponse {
                success: false,
                message: "文件删除功能已被禁用".to_string(),
            }));
        }

        log::info!("Attempting to delete file: {} in directory: {}", file_path, directory_id);
        
        let safe_path = self.get_safe_path_with_directory(directory_id, Some(file_path.clone())).await?;
        log::info!("Safe path resolved to: {:?}", safe_path);
        
        if !safe_path.exists() {
            return Ok(Json(DeleteResponse {
                success: false,
                message: "文件或目录不存在".to_string(),
            }));
        }

        // 尝试删除文件或目录
        let result = if safe_path.is_dir() {
            fs::remove_dir_all(&safe_path)
        } else {
            fs::remove_file(&safe_path)
        };

        match result {
            Ok(_) => {
                log::info!("Successfully deleted: {:?}", safe_path);
                Ok(Json(DeleteResponse {
                    success: true,
                    message: "删除成功".to_string(),
                }))
            }
            Err(e) => {
                log::error!("Failed to delete {:?}: {}", safe_path, e);
                Ok(Json(DeleteResponse {
                    success: false,
                    message: format!("删除失败: {}", e),
                }))
            }
        }
    }

    pub async fn create_directory(&self, headers: &HeaderMap, directory_path: String) -> Result<Json<CreateDirectoryResponse>, StatusCode> {
        // 验证认证
        self.verify_auth(headers).await?;

        // 检查创建目录权限
        let config = self.config.read().await;
        if !config.security.allow_mkdir {
            return Ok(Json(CreateDirectoryResponse {
                success: false,
                message: "目录创建功能已被禁用".to_string(),
            }));
        }

        log::info!("Attempting to create directory: {}", directory_path);
        
        let safe_path = self.get_safe_path(Some(directory_path.clone())).await?;
        log::info!("Safe path resolved to: {:?}", safe_path);
        
        // 检查目录是否已存在
        if safe_path.exists() {
            return Ok(Json(CreateDirectoryResponse {
                success: false,
                message: "目录已存在".to_string(),
            }));
        }

        // 验证目录名是否合法
        if let Some(dir_name) = safe_path.file_name() {
            let dir_name_str = dir_name.to_string_lossy();
            
            // 检查是否包含非法字符
            if dir_name_str.contains('/') || dir_name_str.contains('\\') || 
               dir_name_str.contains(':') || dir_name_str.contains('*') ||
               dir_name_str.contains('?') || dir_name_str.contains('"') ||
               dir_name_str.contains('<') || dir_name_str.contains('>') ||
               dir_name_str.contains('|') {
                return Ok(Json(CreateDirectoryResponse {
                    success: false,
                    message: "目录名包含非法字符".to_string(),
                }));
            }

            // 检查是否为空或只包含空格
            if dir_name_str.trim().is_empty() {
                return Ok(Json(CreateDirectoryResponse {
                    success: false,
                    message: "目录名不能为空".to_string(),
                }));
            }

            // 检查是否为系统文件名
            if self.is_system_file(&dir_name_str) {
                return Ok(Json(CreateDirectoryResponse {
                    success: false,
                    message: "不能创建系统保留的目录名".to_string(),
                }));
            }
        }

        // 执行创建目录操作
        match fs::create_dir_all(&safe_path) {
            Ok(_) => {
                log::info!("Successfully created directory: {:?}", safe_path);
                Ok(Json(CreateDirectoryResponse {
                    success: true,
                    message: "目录创建成功".to_string(),
                }))
            }
            Err(e) => {
                log::error!("Failed to create directory {:?}: {}", safe_path, e);
                Ok(Json(CreateDirectoryResponse {
                    success: false,
                    message: format!("目录创建失败: {}", e),
                }))
            }
        }
    }

    // 带目录ID的创建目录
    pub async fn create_directory_with_directory(&self, headers: &HeaderMap, directory_id: &str, directory_path: String) -> Result<Json<CreateDirectoryResponse>, StatusCode> {
        // 验证认证
        self.verify_auth(headers).await?;

        // 检查创建目录权限
        let config = self.config.read().await;
        if !config.security.allow_mkdir {
            return Ok(Json(CreateDirectoryResponse {
                success: false,
                message: "目录创建功能已被禁用".to_string(),
            }));
        }

        log::info!("Attempting to create directory: {} in directory: {}", directory_path, directory_id);
        
        let safe_path = self.get_safe_path_with_directory(directory_id, Some(directory_path.clone())).await?;
        log::info!("Safe path resolved to: {:?}", safe_path);
        
        // 检查目录是否已存在
        if safe_path.exists() {
            return Ok(Json(CreateDirectoryResponse {
                success: false,
                message: "目录已存在".to_string(),
            }));
        }

        // 验证目录名是否合法
        if let Some(dir_name) = safe_path.file_name() {
            let dir_name_str = dir_name.to_string_lossy();
            
            // 检查是否包含非法字符
            if dir_name_str.contains('/') || dir_name_str.contains('\\') || 
               dir_name_str.contains(':') || dir_name_str.contains('*') ||
               dir_name_str.contains('?') || dir_name_str.contains('"') ||
               dir_name_str.contains('<') || dir_name_str.contains('>') ||
               dir_name_str.contains('|') {
                return Ok(Json(CreateDirectoryResponse {
                    success: false,
                    message: "目录名包含非法字符".to_string(),
                }));
            }
            
            // 检查是否为系统目录名
            if self.is_system_file(&dir_name_str) {
                return Ok(Json(CreateDirectoryResponse {
                    success: false,
                    message: "不能创建系统保留的目录名".to_string(),
                }));
            }
        }

        // 执行创建目录操作
        match fs::create_dir_all(&safe_path) {
            Ok(_) => {
                log::info!("Successfully created directory: {:?}", safe_path);
                Ok(Json(CreateDirectoryResponse {
                    success: true,
                    message: "目录创建成功".to_string(),
                }))
            }
            Err(e) => {
                log::error!("Failed to create directory {:?}: {}", safe_path, e);
                Ok(Json(CreateDirectoryResponse {
                    success: false,
                    message: format!("目录创建失败: {}", e),
                }))
            }
        }
    }

    pub async fn rename_file(&self, headers: &HeaderMap, file_path: String, new_name: String) -> Result<(StatusCode, Json<RenameResponse>), StatusCode> {
        // 验证认证
        self.verify_auth(headers).await?;

        log::info!("Attempting to rename file: {} to {}", file_path, new_name);
        
        let safe_path = self.get_safe_path(Some(file_path.clone())).await?;
        log::info!("Safe path resolved to: {:?}", safe_path);
        
        // 检查源文件/目录是否存在
        if !safe_path.exists() {
            return Ok((StatusCode::NOT_FOUND, Json(RenameResponse {
                success: false,
                message: "文件或目录不存在".to_string(),
            })));
        }

        // 验证新名称是否合法
        if new_name.trim().is_empty() {
            return Ok((StatusCode::BAD_REQUEST, Json(RenameResponse {
                success: false,
                message: "文件名不能为空".to_string(),
            })));
        }

        // 检查是否包含非法字符
        if new_name.contains('/') || new_name.contains('\\') || 
           new_name.contains(':') || new_name.contains('*') ||
           new_name.contains('?') || new_name.contains('"') ||
           new_name.contains('<') || new_name.contains('>') ||
           new_name.contains('|') {
            return Ok((StatusCode::BAD_REQUEST, Json(RenameResponse {
                success: false,
                message: "文件名包含非法字符".to_string(),
            })));
        }

        // 检查是否为系统文件名
        if self.is_system_file(&new_name) {
            return Ok((StatusCode::BAD_REQUEST, Json(RenameResponse {
                success: false,
                message: "不能使用系统保留的文件名".to_string(),
            })));
        }

        // 构建新的文件路径
        let parent_dir = match safe_path.parent() {
            Some(parent) => parent,
            None => {
                return Ok((StatusCode::INTERNAL_SERVER_ERROR, Json(RenameResponse {
                    success: false,
                    message: "无法确定父目录".to_string(),
                })));
            }
        };

        let new_path = parent_dir.join(&new_name);
        
        // 检查新文件名是否已存在（但排除自身）
        if new_path.exists() && new_path != safe_path {
            return Ok((StatusCode::CONFLICT, Json(RenameResponse {
                success: false,
                message: "目标文件名已存在".to_string(),
            })));
        }

        // 确保新路径在安全范围内
        let config = self.config.read().await;
        let default_dir = config.get_first_directory()
            .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
        let root_dir = StdPath::new(default_dir.path.as_ref().unwrap()).canonicalize().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        // 检查新路径是否在安全范围内
        if let Some(parent) = new_path.parent() {
            let canonical_parent = parent.canonicalize().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            if !canonical_parent.starts_with(&root_dir) {
                return Err(StatusCode::FORBIDDEN);
            }
        } else {
            return Err(StatusCode::BAD_REQUEST);
        }

        // 执行重命名操作
        match fs::rename(&safe_path, &new_path) {
            Ok(_) => {
                log::info!("Successfully renamed {:?} to {:?}", safe_path, new_path);
                Ok((StatusCode::OK, Json(RenameResponse {
                    success: true,
                    message: "重命名成功".to_string(),
                })))
            }
            Err(e) => {
                log::error!("Failed to rename {:?} to {:?}: {}", safe_path, new_path, e);
                Ok((StatusCode::INTERNAL_SERVER_ERROR, Json(RenameResponse {
                    success: false,
                    message: format!("重命名失败: {}", e),
                })))
            }
        }
    }

    // 带目录ID的重命名文件
    pub async fn rename_file_with_directory(&self, headers: &HeaderMap, directory_id: &str, file_path: String, new_name: String) -> Result<(StatusCode, Json<RenameResponse>), StatusCode> {
        // 验证认证
        self.verify_auth(headers).await?;

        log::info!("Attempting to rename file: {} to {} in directory: {}", file_path, new_name, directory_id);
        
        let safe_path = self.get_safe_path_with_directory(directory_id, Some(file_path.clone())).await?;
        log::info!("Safe path resolved to: {:?}", safe_path);
        
        if !safe_path.exists() {
            return Ok((StatusCode::NOT_FOUND, Json(RenameResponse {
                success: false,
                message: "文件或目录不存在".to_string(),
            })));
        }

        // 验证新文件名格式
        if new_name.trim().is_empty() {
            return Ok((StatusCode::BAD_REQUEST, Json(RenameResponse {
                success: false,
                message: "文件名不能为空".to_string(),
            })));
        }

        // 检查文件名长度
        if new_name.len() > 255 {
            return Ok((StatusCode::BAD_REQUEST, Json(RenameResponse {
                success: false,
                message: "文件名过长".to_string(),
            })));
        }

        // 检查是否包含非法字符
        if new_name.contains('/') || new_name.contains('\\') || 
           new_name.contains(':') || new_name.contains('*') ||
           new_name.contains('?') || new_name.contains('"') ||
           new_name.contains('<') || new_name.contains('>') ||
           new_name.contains('|') {
            return Ok((StatusCode::BAD_REQUEST, Json(RenameResponse {
                success: false,
                message: "文件名包含非法字符".to_string(),
            })));
        }

        // 检查是否为系统文件名
        if self.is_system_file(&new_name) {
            return Ok((StatusCode::BAD_REQUEST, Json(RenameResponse {
                success: false,
                message: "不能使用系统保留的文件名".to_string(),
            })));
        }

        // 构建新的文件路径
        let parent_dir = match safe_path.parent() {
            Some(parent) => parent,
            None => {
                return Ok((StatusCode::INTERNAL_SERVER_ERROR, Json(RenameResponse {
                    success: false,
                    message: "无法确定父目录".to_string(),
                })));
            }
        };

        let new_path = parent_dir.join(&new_name);
        
        // 检查新文件名是否已存在（但排除自身）
        if new_path.exists() && new_path != safe_path {
            return Ok((StatusCode::CONFLICT, Json(RenameResponse {
                success: false,
                message: "目标文件名已存在".to_string(),
            })));
        }

        // 确保新路径在安全范围内
        let config = self.config.read().await;
        let directory_config = config.get_directory_by_id(directory_id)
            .ok_or(StatusCode::NOT_FOUND)?;
        let root_dir = StdPath::new(directory_config.path.as_ref().unwrap()).canonicalize().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        // 检查新路径是否在安全范围内
        if let Some(parent) = new_path.parent() {
            let canonical_parent = parent.canonicalize().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            if !canonical_parent.starts_with(&root_dir) {
                return Err(StatusCode::FORBIDDEN);
            }
        }

        // 执行重命名操作
        match fs::rename(&safe_path, &new_path) {
            Ok(_) => {
                log::info!("Successfully renamed {:?} to {:?}", safe_path, new_path);
                Ok((StatusCode::OK, Json(RenameResponse {
                    success: true,
                    message: "重命名成功".to_string(),
                })))
            }
            Err(e) => {
                log::error!("Failed to rename {:?} to {:?}: {}", safe_path, new_path, e);
                Ok((StatusCode::INTERNAL_SERVER_ERROR, Json(RenameResponse {
                    success: false,
                    message: format!("重命名失败: {}", e),
                })))
            }
        }
    }

    pub async fn download_file(&self, file_path: String) -> Result<axum::response::Response, StatusCode> {
        log::info!("Attempting to download file: {}", file_path);
        
        let safe_path = self.get_safe_path(Some(file_path.clone())).await?;
        log::info!("Safe path resolved to: {:?}", safe_path);
        
        // 检查文件是否存在
        if !safe_path.exists() {
            log::warn!("Download failed: file not found at {:?}", safe_path);
            return Err(StatusCode::NOT_FOUND);
        }

        // 检查是否为文件（不是目录）
        if !safe_path.is_file() {
            log::warn!("Download failed: path is not a file: {:?}", safe_path);
            return Err(StatusCode::BAD_REQUEST);
        }

        // 获取文件名用于下载
        let file_name = safe_path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("download");

        // 检查下载权限
        let config = self.config.read().await;
        if !config.security.allow_download {
            log::warn!("Download failed: download functionality is disabled");
            return Err(StatusCode::FORBIDDEN);
        }

        // 打开文件
        let file = match File::open(&safe_path).await {
            Ok(file) => file,
            Err(e) => {
                log::error!("Failed to open file {:?}: {}", safe_path, e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        };

        // 获取文件大小
        let file_size = match file.metadata().await {
            Ok(metadata) => metadata.len(),
            Err(e) => {
                log::error!("Failed to get file metadata {:?}: {}", safe_path, e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        };

        // 创建流
        let stream = ReaderStream::new(file);
        let body = axum::body::Body::from_stream(stream);

        // 构建响应头
        let content_disposition = format!("attachment; filename=\"{}\"", file_name);
        
        log::info!("Successfully started download for: {:?} (size: {} bytes)", safe_path, file_size);
        
        Ok(axum::response::Response::builder()
            .status(StatusCode::OK)
            .header("Content-Type", "application/octet-stream")
            .header(CONTENT_DISPOSITION, content_disposition)
            .header("Content-Length", file_size.to_string())
            .header("Cache-Control", "no-cache")
            .body(body)
            .unwrap())
    }

}

pub async fn list_files_handler(
    State(file_service): State<Arc<FileService>>,
    headers: HeaderMap,
) -> Result<Json<FilesResponse>, StatusCode> {
    file_service.list_files(&headers, None).await
}

pub async fn list_files_with_path_handler(
    State(file_service): State<Arc<FileService>>,
    headers: HeaderMap,
    Path(file_path): Path<String>,
) -> Result<Json<FilesResponse>, StatusCode> {
    file_service.list_files(&headers, Some(file_path)).await
}

pub async fn storage_info_handler(
    State(file_service): State<Arc<FileService>>,
    headers: HeaderMap,
) -> Result<Json<StorageResponse>, StatusCode> {
    file_service.get_storage_info(&headers).await
}

pub async fn delete_file_handler(
    State(file_service): State<Arc<FileService>>,
    headers: HeaderMap,
    Path(file_path): Path<String>,
) -> Result<Json<DeleteResponse>, StatusCode> {
    file_service.delete_file(&headers, file_path).await
}

pub async fn create_directory_handler(
    State(file_service): State<Arc<FileService>>,
    headers: HeaderMap,
    Path(directory_path): Path<String>,
) -> Result<Json<CreateDirectoryResponse>, StatusCode> {
    file_service.create_directory(&headers, directory_path).await
}

pub async fn rename_file_handler(
    State(file_service): State<Arc<FileService>>,
    headers: HeaderMap,
    Path(file_path): Path<String>,
    ExtractJson(request): ExtractJson<RenameRequest>,
) -> Result<(StatusCode, Json<RenameResponse>), StatusCode> {
    file_service.rename_file(&headers, file_path, request.new_name).await
}

// Temporarily disabled due to compilation issue
// pub async fn download_file_handler(
//     State(file_service): State<Arc<FileService>>,
//     Path(file_path): Path<String>,
// ) -> Result<axum::response::Response, StatusCode> {
//     file_service.download_file(file_path).await
// }


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


// Unified directory-based files router
pub fn files_router(file_service: Arc<FileService>) -> Router {
    Router::new()
        // File operations (directory-scoped)
        .route("/dir/{directory_id}/list", get(list_files_with_directory_handler))
        .route("/dir/{directory_id}/list/{*file_path}", get(list_files_with_directory_path_handler)) 
        .route("/dir/{directory_id}/storage", get(storage_info_with_directory_handler))
        .route("/dir/{directory_id}/delete/{*file_path}", delete(delete_file_with_directory_handler))
        .route("/dir/{directory_id}/mkdir/{*directory_path}", post(create_directory_with_directory_handler))
        .route("/dir/{directory_id}/rename/{*file_path}", put(rename_file_with_directory_handler))
        
        // Note: Download endpoints are handled by static file server for public access
        .with_state(file_service)
}