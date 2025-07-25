use serde::Deserialize;
use std::fs;

#[derive(Debug, Deserialize)]
pub struct Config {
    pub user: UserConfig,
    pub jwt: JwtConfig,
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

impl Config {
    pub fn load() -> anyhow::Result<Self> {
        let config_content = fs::read_to_string("config/users.toml")?;
        let config: Config = toml::from_str(&config_content)?;
        Ok(config)
    }
}