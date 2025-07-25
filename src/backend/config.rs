use serde::Deserialize;
use std::fs;
use std::path::Path;

#[derive(Debug, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub user: UserConfig,
    pub jwt: JwtConfig,
    pub files: FilesConfig,
    pub security: SecurityConfig,
}

#[derive(Debug, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Deserialize)]
pub struct UserConfig {
    pub username: String,
    pub password_hash: String,
    pub email: String,
}

#[derive(Debug, Deserialize)]
pub struct JwtConfig {
    pub secret_key: String,
    pub expiration_hours: u64,
}

#[derive(Debug, Deserialize)]
pub struct FilesConfig {
    pub root_directory: String,
    pub max_file_size: u64,
    pub allowed_extensions: Vec<String>,
    pub blocked_extensions: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct SecurityConfig {
    pub allow_mkdir: bool,
    pub allow_delete: bool,
    pub allow_download: bool,
}

impl Config {
    pub fn load() -> anyhow::Result<Self> {
        let config_path = "config.toml";
        
        // 检查配置文件是否存在
        if !Path::new(config_path).exists() {
            eprintln!("❌ 配置文件未找到: {}", config_path);
            eprintln!("💡 请先创建配置文件 config.toml");
            return Err(anyhow::anyhow!("配置文件不存在"));
        }
        
        // 读取并解析配置文件
        let config_content = fs::read_to_string(config_path)
            .map_err(|e| anyhow::anyhow!("无法读取配置文件 {}: {}", config_path, e))?;
            
        let config: Config = toml::from_str(&config_content)
            .map_err(|e| anyhow::anyhow!("配置文件格式错误: {}", e))?;
            
        Ok(config)
    }
}