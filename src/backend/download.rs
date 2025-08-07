use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::Json,
    routing::{get, post, delete},
    Router,
};
use chrono::{DateTime, Utc};
use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    path::PathBuf,
    sync::Arc,
    time::Duration,
};
use tokio::{
    fs::{File, create_dir_all},
    io::AsyncWriteExt,
    sync::RwLock,
    time::Instant,
};
use uuid::Uuid;

use crate::backend::{auth::AuthService, config::Config};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DownloadStatus {
    Pending,
    Downloading,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadTask {
    pub id: Uuid,
    pub url: String,
    pub filename: String,
    pub directory_id: String,
    pub target_path: String,
    pub status: DownloadStatus,
    pub downloaded_bytes: u64,
    pub total_bytes: Option<u64>,
    pub download_speed: u64, // bytes per second
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub error_message: Option<String>,
}


#[derive(Debug, Deserialize)]
pub struct CreateDownloadRequest {
    pub urls: Vec<String>,
    pub directory_id: String,
    pub target_path: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CreateDownloadResponse {
    pub success: bool,
    pub task_ids: Vec<Uuid>,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct DownloadListQuery {
    pub status: Option<String>,
    pub directory_id: Option<String>,
}

pub struct DownloadManager {
    tasks: Arc<RwLock<HashMap<Uuid, DownloadTask>>>,
    http_client: Client,
    config: Arc<RwLock<Config>>,
    auth_service: Arc<AuthService>,
}

impl DownloadManager {
    pub fn new(config: Arc<RwLock<Config>>, auth_service: Arc<AuthService>) -> Self {
        let http_client = Client::builder()
            .timeout(Duration::from_secs(300)) // 5 minutes timeout
            .build()
            .expect("Failed to create HTTP client");

        Self {
            tasks: Arc::new(RwLock::new(HashMap::new())),
            http_client,
            config,
            auth_service,
        }
    }

    pub async fn create_download_tasks(
        &self,
        request: CreateDownloadRequest,
    ) -> Result<Vec<Uuid>, String> {
        let mut task_ids = Vec::new();
        let target_path = request.target_path.unwrap_or_default();
        
        for url in request.urls {
            if let Ok(parsed_url) = url::Url::parse(&url) {
                let filename = self.extract_filename(&parsed_url);
                let task_id = Uuid::new_v4();
                
                let task = DownloadTask {
                    id: task_id,
                    url: url.clone(),
                    filename: filename.clone(),
                    directory_id: request.directory_id.clone(),
                    target_path: target_path.clone(),
                    status: DownloadStatus::Pending,
                    downloaded_bytes: 0,
                    total_bytes: None,
                    download_speed: 0,
                    created_at: Utc::now(),
                    completed_at: None,
                    error_message: None,
                };

                // 添加任务到管理器
                {
                    let mut tasks = self.tasks.write().await;
                    tasks.insert(task_id, task);
                }


                task_ids.push(task_id);

                // 启动下载任务
                self.start_download_task(task_id).await;
            } else {
                return Err(format!("无效的URL: {}", url));
            }
        }

        Ok(task_ids)
    }

    async fn start_download_task(&self, task_id: Uuid) {
        let tasks = self.tasks.clone();
        let http_client = self.http_client.clone();
        let config = self.config.clone();

        tokio::spawn(async move {
            Self::download_file_task(task_id, tasks, http_client, config).await;
        });
    }

    async fn download_file_task(
        task_id: Uuid,
        tasks: Arc<RwLock<HashMap<Uuid, DownloadTask>>>,
        http_client: Client,
        config: Arc<RwLock<Config>>,
    ) {
        // 获取任务信息
        let (url, directory_id, target_path, filename) = {
            let tasks_guard = tasks.read().await;
            if let Some(task) = tasks_guard.get(&task_id) {
                (
                    task.url.clone(),
                    task.directory_id.clone(),
                    task.target_path.clone(),
                    task.filename.clone(),
                )
            } else {
                return;
            }
        };

        // 更新状态为下载中
        {
            let mut tasks_guard = tasks.write().await;
            if let Some(task) = tasks_guard.get_mut(&task_id) {
                task.status = DownloadStatus::Downloading;
            }
        }


        // 构建完整文件路径
        let file_path = {
            let config_guard = config.read().await;
            let directories = config_guard.get_storage_directories();
            let directory = directories.iter().find(|d| d.id == directory_id);
            
            if let Some(dir) = directory {
                if let Some(dir_path) = &dir.path {
                    let mut path = PathBuf::from(dir_path);
                    if !target_path.is_empty() {
                        path.push(&target_path);
                    }
                    path.push(&filename);
                    path
                } else {
                    Self::update_task_error(
                        task_id,
                        &tasks,
                        "目录路径未配置".to_string(),
                    ).await;
                    return;
                }
            } else {
                Self::update_task_error(
                    task_id,
                    &tasks,
                    "目录不存在".to_string(),
                ).await;
                return;
            }
        };

        // 确保目录存在
        if let Some(parent) = file_path.parent() {
            if let Err(e) = create_dir_all(parent).await {
                Self::update_task_error(
                    task_id,
                    &tasks,
                    format!("创建目录失败: {}", e),
                ).await;
                return;
            }
        }

        // 开始下载
        match Self::perform_download(
            task_id,
            &url,
            &file_path,
            &tasks,
            &http_client,
        ).await {
            Ok(_) => {
                // 更新任务状态为完成
                {
                    let mut tasks_guard = tasks.write().await;
                    if let Some(task) = tasks_guard.get_mut(&task_id) {
                        task.status = DownloadStatus::Completed;
                        task.completed_at = Some(Utc::now());
                    }
                }

            }
            Err(e) => {
                Self::update_task_error(task_id, &tasks, e.to_string()).await;
            }
        }
    }

    async fn perform_download(
        task_id: Uuid,
        url: &str,
        file_path: &PathBuf,
        tasks: &Arc<RwLock<HashMap<Uuid, DownloadTask>>>,
        http_client: &Client,
    ) -> Result<(), String> {
        // 发送HTTP请求
        let response = http_client
            .get(url)
            .send()
            .await
            .map_err(|e| format!("请求失败: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("HTTP错误: {}", response.status()));
        }

        // 获取文件大小
        let total_bytes = response.content_length();

        // 更新任务的总大小
        {
            let mut tasks_guard = tasks.write().await;
            if let Some(task) = tasks_guard.get_mut(&task_id) {
                task.total_bytes = total_bytes;
            }
        }

        // 创建文件
        let mut file = File::create(file_path)
            .await
            .map_err(|e| format!("创建文件失败: {}", e))?;

        // 下载文件流
        let mut stream = response.bytes_stream();
        let mut downloaded_bytes = 0u64;
        let mut last_update = Instant::now();
        let mut speed_samples = Vec::new();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| format!("下载数据失败: {}", e))?;
            
            // 检查任务是否被取消
            {
                let tasks_guard = tasks.read().await;
                if let Some(task) = tasks_guard.get(&task_id) {
                    if matches!(task.status, DownloadStatus::Cancelled) {
                        return Err("下载已取消".to_string());
                    }
                }
            }

            // 写入文件
            file.write_all(&chunk)
                .await
                .map_err(|e| format!("写入文件失败: {}", e))?;

            downloaded_bytes += chunk.len() as u64;

            // 更新进度（每秒最多更新一次）
            let now = Instant::now();
            if now.duration_since(last_update) >= Duration::from_millis(500) {
                // 计算下载速度
                speed_samples.push((downloaded_bytes, now));
                if speed_samples.len() > 10 {
                    speed_samples.remove(0);
                }

                let download_speed = if speed_samples.len() >= 2 {
                    let (start_bytes, start_time) = speed_samples[0];
                    let duration = now.duration_since(start_time).as_secs_f64();
                    if duration > 0.0 {
                        ((downloaded_bytes - start_bytes) as f64 / duration) as u64
                    } else {
                        0
                    }
                } else {
                    0
                };

                // 更新任务进度
                {
                    let mut tasks_guard = tasks.write().await;
                    if let Some(task) = tasks_guard.get_mut(&task_id) {
                        task.downloaded_bytes = downloaded_bytes;
                        task.download_speed = download_speed;
                    }
                }

                // 计算进度百分比和ETA
                let (progress_percent, eta_seconds) = if let Some(total) = total_bytes {
                    let percent = (downloaded_bytes as f64 / total as f64 * 100.0).min(100.0);
                    let eta = if download_speed > 0 {
                        Some((total - downloaded_bytes) / download_speed)
                    } else {
                        None
                    };
                    (Some(percent), eta)
                } else {
                    (None, None)
                };

                last_update = now;
            }
        }

        // 确保文件写入完成
        file.flush().await.map_err(|e| format!("刷新文件失败: {}", e))?;

        Ok(())
    }

    async fn update_task_error(
        task_id: Uuid,
        tasks: &Arc<RwLock<HashMap<Uuid, DownloadTask>>>,
        error_message: String,
    ) {
        // 更新任务状态
        {
            let mut tasks_guard = tasks.write().await;
            if let Some(task) = tasks_guard.get_mut(&task_id) {
                task.status = DownloadStatus::Failed;
                task.error_message = Some(error_message.clone());
            }
        }

    }

    pub async fn get_tasks(&self, query: &DownloadListQuery) -> Vec<DownloadTask> {
        let tasks = self.tasks.read().await;
        tasks
            .values()
            .filter(|task| {
                if let Some(status) = &query.status {
                    let expected_status = match status.as_str() {
                        "pending" => DownloadStatus::Pending,
                        "downloading" => DownloadStatus::Downloading,
                        "completed" => DownloadStatus::Completed,
                        "failed" => DownloadStatus::Failed,
                        "cancelled" => DownloadStatus::Cancelled,
                        _ => return true,
                    };
                    task.status == expected_status
                } else {
                    true
                }
            })
            .filter(|task| {
                if let Some(directory_id) = &query.directory_id {
                    task.directory_id == *directory_id
                } else {
                    true
                }
            })
            .cloned()
            .collect()
    }

    pub async fn cancel_task(&self, task_id: Uuid) -> bool {
        let mut tasks = self.tasks.write().await;
        if let Some(task) = tasks.get_mut(&task_id) {
            if matches!(task.status, DownloadStatus::Pending | DownloadStatus::Downloading) {
                task.status = DownloadStatus::Cancelled;
                
                
                true
            } else {
                false
            }
        } else {
            false
        }
    }

    pub async fn clear_completed_tasks(&self, directory_id: &str) -> usize {
        let mut tasks = self.tasks.write().await;
        let initial_count = tasks.len();
        
        // 移除已完成、失败或取消的任务
        tasks.retain(|_, task| {
            if task.directory_id != directory_id {
                return true; // 保留其他目录的任务
            }
            
            !matches!(task.status, 
                DownloadStatus::Completed | 
                DownloadStatus::Failed | 
                DownloadStatus::Cancelled
            )
        });
        
        let final_count = tasks.len();
        initial_count - final_count
    }


    fn extract_filename(&self, url: &url::Url) -> String {
        // 从URL路径中提取文件名
        if let Some(segments) = url.path_segments() {
            if let Some(last_segment) = segments.last() {
                if !last_segment.is_empty() && last_segment.contains('.') {
                    return last_segment.to_string();
                }
            }
        }

        // 如果无法从URL提取文件名，生成一个默认文件名
        format!("download_{}.bin", Uuid::new_v4().to_string()[..8].to_string())
    }
}

// API handlers
async fn create_download_handler(
    State(download_manager): State<Arc<DownloadManager>>,
    headers: HeaderMap,
    Json(request): Json<CreateDownloadRequest>,
) -> Result<Json<CreateDownloadResponse>, StatusCode> {
    // 验证认证
    let auth_header = headers
        .get("Authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(token) => token,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    if download_manager.auth_service.verify_token(token).await.is_err() {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // 验证请求
    if request.urls.is_empty() {
        return Ok(Json(CreateDownloadResponse {
            success: false,
            task_ids: vec![],
            message: "URL列表不能为空".to_string(),
        }));
    }

    // 创建下载任务
    match download_manager.create_download_tasks(request).await {
        Ok(task_ids) => {
            let task_count = task_ids.len();
            Ok(Json(CreateDownloadResponse {
                success: true,
                task_ids,
                message: format!("成功创建{}个下载任务", task_count),
            }))
        },
        Err(e) => Ok(Json(CreateDownloadResponse {
            success: false,
            task_ids: vec![],
            message: e,
        })),
    }
}

async fn list_downloads_handler(
    State(download_manager): State<Arc<DownloadManager>>,
    headers: HeaderMap,
    Query(query): Query<DownloadListQuery>,
) -> Result<Json<Vec<DownloadTask>>, StatusCode> {
    // 验证认证
    let auth_header = headers
        .get("Authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(token) => token,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    if download_manager.auth_service.verify_token(token).await.is_err() {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let tasks = download_manager.get_tasks(&query).await;
    Ok(Json(tasks))
}

async fn cancel_download_handler(
    State(download_manager): State<Arc<DownloadManager>>,
    headers: HeaderMap,
    Path(task_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // 验证认证
    let auth_header = headers
        .get("Authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(token) => token,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    if download_manager.auth_service.verify_token(token).await.is_err() {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let success = download_manager.cancel_task(task_id).await;
    Ok(Json(serde_json::json!({
        "success": success,
        "message": if success { "任务已取消" } else { "无法取消任务" }
    })))
}

async fn clear_completed_handler(
    State(download_manager): State<Arc<DownloadManager>>,
    headers: HeaderMap,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // 验证认证
    let auth_header = headers
        .get("Authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(token) => token,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    if download_manager.auth_service.verify_token(token).await.is_err() {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // 获取目录ID参数
    let directory_id = match params.get("directory_id") {
        Some(id) => id,
        None => return Err(StatusCode::BAD_REQUEST),
    };

    let cleared_count = download_manager.clear_completed_tasks(directory_id).await;
    
    Ok(Json(serde_json::json!({
        "success": true,
        "cleared_count": cleared_count,
        "message": format!("已清理 {} 个完成的任务", cleared_count)
    })))
}


pub fn download_router(download_manager: Arc<DownloadManager>) -> Router {
    Router::new()
        .route("/start", post(create_download_handler))
        .route("/list", get(list_downloads_handler))
        .route("/cancel/{task_id}", delete(cancel_download_handler))
        .route("/clear", delete(clear_completed_handler))
        .with_state(download_manager)
}