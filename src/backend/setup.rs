use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use bcrypt;
use serde::{Deserialize, Serialize};
use std::{fs, sync::Arc};
use tokio::sync::RwLock;

use crate::backend::{config::Config, auth::AuthService};

#[derive(Debug, Deserialize)]
pub struct SetupRequest {
    pub username: String,
    pub password: String,
    pub email: String,
}

#[derive(Debug, Serialize)]
pub struct SetupResponse {
    pub success: bool,
    pub message: String,
    pub token: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SetupStatusResponse {
    pub needs_setup: bool,
}

pub struct SetupService {
    config: Arc<RwLock<Config>>,
    auth_service: Arc<AuthService>,
}

impl SetupService {
    pub fn new(config: Arc<RwLock<Config>>, auth_service: Arc<AuthService>) -> Self {
        Self { config, auth_service }
    }

    pub async fn needs_setup(&self) -> bool {
        let config = self.config.read().await;
        config.user.username.trim().is_empty() || config.user.password_hash.trim().is_empty()
    }

    pub async fn setup_user(&self, username: &str, password: &str, email: &str) -> anyhow::Result<String> {
        if !self.needs_setup().await {
            return Err(anyhow::anyhow!("系统已经初始化完成"));
        }

        // 生成密码哈希
        let password_hash = bcrypt::hash(password, bcrypt::DEFAULT_COST)
            .map_err(|e| anyhow::anyhow!("密码哈希生成失败: {}", e))?;

        // 获取配置文件路径（支持环境变量）
        let config_path = std::env::var("CONFIG_PATH").unwrap_or_else(|_| "config.toml".to_string());

        // 读取当前配置文件
        let config_content = fs::read_to_string(&config_path)
            .map_err(|e| anyhow::anyhow!("无法读取配置文件: {}", e))?;

        // 替换用户信息
        let updated_content = config_content
            .replace("username = \"\"", &format!("username = \"{}\"", username))
            .replace("password_hash = \"\"", &format!("password_hash = \"{}\"", password_hash))
            .replace("email = \"\"", &format!("email = \"{}\"", email));

        // 写回配置文件
        fs::write(&config_path, updated_content)
            .map_err(|e| anyhow::anyhow!("无法写入配置文件: {}", e))?;

        // 热重载配置到内存
        let new_config = Config::load()
            .map_err(|e| anyhow::anyhow!("重载配置失败: {}", e))?;
        
        {
            let mut config = self.config.write().await;
            *config = new_config;
        }

        // 立即生成登录 token
        self.auth_service.generate_token(username).await
    }
}

pub async fn setup_status_handler(
    State(setup_service): State<Arc<SetupService>>,
) -> Json<SetupStatusResponse> {
    Json(SetupStatusResponse {
        needs_setup: setup_service.needs_setup().await,
    })
}

pub async fn setup_handler(
    State(setup_service): State<Arc<SetupService>>,
    Json(request): Json<SetupRequest>,
) -> Result<Json<SetupResponse>, StatusCode> {
    // 验证输入
    if request.username.trim().is_empty() {
        return Ok(Json(SetupResponse {
            success: false,
            message: "用户名不能为空".to_string(),
            token: None,
        }));
    }

    if request.password.len() < 6 {
        return Ok(Json(SetupResponse {
            success: false,
            message: "密码长度至少6位".to_string(),
            token: None,
        }));
    }

    if request.email.trim().is_empty() {
        return Ok(Json(SetupResponse {
            success: false,
            message: "邮箱不能为空".to_string(),
            token: None,
        }));
    }

    // 设置用户
    match setup_service.setup_user(&request.username, &request.password, &request.email).await {
        Ok(token) => Ok(Json(SetupResponse {
            success: true,
            message: "初始化成功，系统已就绪".to_string(),
            token: Some(token),
        })),
        Err(e) => Ok(Json(SetupResponse {
            success: false,
            message: e.to_string(),
            token: None,
        })),
    }
}

pub fn setup_router(setup_service: Arc<SetupService>) -> Router {
    Router::new()
        .route("/status", get(setup_status_handler))
        .route("/init", post(setup_handler))
        .with_state(setup_service)
}