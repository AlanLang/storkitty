use serde::Deserialize;
use std::fs;
use std::path::Path;
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub user: UserConfig,
    pub jwt: JwtConfig,
    pub files: FilesConfig,
    pub storage: Option<StorageConfig>,
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

#[derive(Debug, Deserialize)]
pub struct StorageConfig {
    pub directories: Vec<DirectoryConfig>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DirectoryConfig {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub storage_type: String,
    pub path: Option<String>, // 本地存储路径
    pub config: Option<HashMap<String, String>>, // 云存储配置
    #[serde(default = "default_disable")]
    pub disable: bool, // 是否禁用此目录
}

fn default_disable() -> bool {
    false
}

impl Config {
    pub fn load() -> anyhow::Result<Self> {
        // 支持通过环境变量指定配置文件路径，默认为 config.toml
        let config_path = std::env::var("CONFIG_PATH").unwrap_or_else(|_| "config.toml".to_string());
        
        // 检查配置文件是否存在
        if !Path::new(&config_path).exists() {
            eprintln!("❌ 配置文件未找到: {}", config_path);
            eprintln!("💡 请先创建配置文件或设置正确的 CONFIG_PATH 环境变量");
            return Err(anyhow::anyhow!("配置文件不存在: {}", config_path));
        }
        
        // 读取并解析配置文件
        let config_content = fs::read_to_string(&config_path)
            .map_err(|e| anyhow::anyhow!("无法读取配置文件 {}: {}", config_path, e))?;
            
        let config: Config = toml::from_str(&config_content)
            .map_err(|e| anyhow::anyhow!("配置文件格式错误: {}", e))?;
            
        Ok(config)
    }
    
    /// 获取可用的存储目录列表（过滤被禁用的目录）
    pub fn get_storage_directories(&self) -> Vec<DirectoryConfig> {
        if let Some(storage) = &self.storage {
            storage.directories
                .iter()
                .filter(|dir| !dir.disable)
                .cloned()
                .collect()
        } else {
            // 如果没有配置多目录，返回空列表
            vec![]
        }
    }
    
    /// 获取第一个存储目录（作为默认目录）
    pub fn get_first_directory(&self) -> Option<DirectoryConfig> {
        self.get_storage_directories()
            .into_iter()
            .next()
    }
    
    /// 根据ID获取存储目录（仅返回未被禁用的目录）
    pub fn get_directory_by_id(&self, id: &str) -> Option<DirectoryConfig> {
        self.get_storage_directories()
            .into_iter()
            .find(|dir| dir.id == id)
    }
}