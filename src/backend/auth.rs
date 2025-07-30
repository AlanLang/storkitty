use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::Json,
    routing::post,
    Router,
};
use bcrypt;
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, TokenData, Validation};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::backend::config::Config;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // username
    pub exp: usize,  // expiration time
    pub iat: usize,  // issued at
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub success: bool,
    pub token: Option<String>,
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub username: String,
    pub email: String,
}

#[derive(Debug, Serialize)]
pub struct FileConfigInfo {
    pub max_file_size_mb: u64,
    pub allowed_extensions: Vec<String>,
    pub blocked_extensions: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct DirectoryInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub default: bool,
    pub storage_type: String,
}

#[derive(Debug, Serialize)]
pub struct VerifyResponse {
    pub user: UserInfo,
    pub file_config: FileConfigInfo,
    pub directories: Vec<DirectoryInfo>,
}

pub struct AuthService {
    config: Arc<RwLock<Config>>,
}

impl AuthService {
    pub fn new(config: Arc<RwLock<Config>>) -> Self {
        Self { config }
    }

    pub async fn verify_password(&self, password: &str) -> bool {
        let config = self.config.read().await;
        bcrypt::verify(password, &config.user.password_hash).unwrap_or(false)
    }

    pub async fn generate_token(&self, username: &str) -> anyhow::Result<String> {
        let config = self.config.read().await;
        let now = Utc::now();
        let exp = now + Duration::hours(config.jwt.expiration_hours as i64);

        let claims = Claims {
            sub: username.to_string(),
            exp: exp.timestamp() as usize,
            iat: now.timestamp() as usize,
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(config.jwt.secret_key.as_ref()),
        )?;

        Ok(token)
    }

    pub async fn verify_token(&self, token: &str) -> anyhow::Result<TokenData<Claims>> {
        let config = self.config.read().await;
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(config.jwt.secret_key.as_ref()),
            &Validation::default(),
        )?;

        Ok(token_data)
    }
}

pub async fn login_handler(
    State(auth_service): State<Arc<AuthService>>,
    Json(request): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, StatusCode> {
    // 检查是否需要初始化设置
    let config = auth_service.config.read().await;
    if config.user.username.trim().is_empty() || 
       config.user.password_hash.trim().is_empty() {
        return Ok(Json(LoginResponse {
            success: false,
            token: None,
            message: "系统需要初始化，请先设置管理员账户".to_string(),
        }));
    }

    // 验证用户名
    if request.username != config.user.username {
        return Ok(Json(LoginResponse {
            success: false,
            token: None,
            message: "用户名或密码错误".to_string(),
        }));
    }
    drop(config); // 释放读锁

    // 验证密码
    if !auth_service.verify_password(&request.password).await {
        return Ok(Json(LoginResponse {
            success: false,
            token: None,
            message: "用户名或密码错误".to_string(),
        }));
    }

    // 生成 JWT token
    match auth_service.generate_token(&request.username).await {
        Ok(token) => Ok(Json(LoginResponse {
            success: true,
            token: Some(token),
            message: "登录成功".to_string(),
        })),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn verify_handler(
    State(auth_service): State<Arc<AuthService>>,
    headers: HeaderMap,
) -> Result<Json<VerifyResponse>, StatusCode> {
    let auth_header = headers
        .get("Authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(token) => token,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    match auth_service.verify_token(token).await {
        Ok(token_data) => {
            let config = auth_service.config.read().await;
            let user_info = UserInfo {
                username: token_data.claims.sub,
                email: config.user.email.clone(),
            };
            
            let file_config = FileConfigInfo {
                max_file_size_mb: config.files.max_file_size,
                allowed_extensions: config.files.allowed_extensions.clone(),
                blocked_extensions: config.files.blocked_extensions.clone(),
            };
            
            let directories = config.get_storage_directories()
                .into_iter()
                .map(|dir| DirectoryInfo {
                    id: dir.id,
                    name: dir.name,
                    description: dir.description,
                    icon: dir.icon,
                    default: dir.default,
                    storage_type: dir.storage_type,
                })
                .collect();
            
            let response = VerifyResponse {
                user: user_info,
                file_config,
                directories,
            };
            
            Ok(Json(response))
        }
        Err(_) => Err(StatusCode::UNAUTHORIZED),
    }
}

pub fn auth_router(auth_service: Arc<AuthService>) -> Router {
    Router::new()
        .route("/login", post(login_handler))
        .route("/verify", post(verify_handler))
        .with_state(auth_service)
}