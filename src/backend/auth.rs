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
pub struct VerifyResponse {
    pub user: UserInfo,
    pub file_config: FileConfigInfo,
}

pub struct AuthService {
    config: Arc<Config>,
}

impl AuthService {
    pub fn new(config: Arc<Config>) -> Self {
        Self { config }
    }

    pub fn verify_password(&self, password: &str) -> bool {
        bcrypt::verify(password, &self.config.user.password_hash).unwrap_or(false)
    }

    pub fn generate_token(&self, username: &str) -> anyhow::Result<String> {
        let now = Utc::now();
        let exp = now + Duration::hours(self.config.jwt.expiration_hours as i64);

        let claims = Claims {
            sub: username.to_string(),
            exp: exp.timestamp() as usize,
            iat: now.timestamp() as usize,
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.config.jwt.secret_key.as_ref()),
        )?;

        Ok(token)
    }

    pub fn verify_token(&self, token: &str) -> anyhow::Result<TokenData<Claims>> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.config.jwt.secret_key.as_ref()),
            &Validation::default(),
        )?;

        Ok(token_data)
    }
}

pub async fn login_handler(
    State(auth_service): State<Arc<AuthService>>,
    Json(request): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, StatusCode> {
    // 验证用户名
    if request.username != auth_service.config.user.username {
        return Ok(Json(LoginResponse {
            success: false,
            token: None,
            message: "用户名或密码错误".to_string(),
        }));
    }

    // 验证密码
    if !auth_service.verify_password(&request.password) {
        return Ok(Json(LoginResponse {
            success: false,
            token: None,
            message: "用户名或密码错误".to_string(),
        }));
    }

    // 生成 JWT token
    match auth_service.generate_token(&request.username) {
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

    match auth_service.verify_token(token) {
        Ok(token_data) => {
            let user_info = UserInfo {
                username: token_data.claims.sub,
                email: auth_service.config.user.email.clone(),
            };
            
            let file_config = FileConfigInfo {
                max_file_size_mb: auth_service.config.files.max_file_size,
                allowed_extensions: auth_service.config.files.allowed_extensions.clone(),
                blocked_extensions: auth_service.config.files.blocked_extensions.clone(),
            };
            
            let response = VerifyResponse {
                user: user_info,
                file_config,
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