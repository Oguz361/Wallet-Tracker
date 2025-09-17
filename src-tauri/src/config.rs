use serde::{Deserialize, Serialize};
use config::{Config, ConfigError, File};
use once_cell::sync::Lazy;
use std::sync::RwLock;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct SentinelConfig {
    pub helius: HeliusConfig,
    pub trading: TradingConfig,
    pub execution: ExecutionConfig,
    pub monitoring: MonitoringConfig,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct HeliusConfig {
    pub api_key: String,
    pub rpc_endpoint: String,
    pub ws_endpoint: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct TradingConfig {
    pub max_position_sol: f64,
    pub min_copy_trade_sol: f64,
    pub position_multiplier: f64,
    pub max_daily_loss_sol: f64,
    pub stop_loss_percentage: f64,
    pub take_profit_multiplier: f64,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ExecutionConfig {
    pub base_priority_fee: u64,
    pub high_congestion_multiplier: u64,
    pub max_priority_fee: u64,
    pub max_retries: u32,
    pub retry_delay_ms: u64,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MonitoringConfig {
    pub target_wallets: Vec<String>,
    pub dashboard_refresh_ms: u64,
    pub database_path: String,
}

pub static CONFIG: Lazy<RwLock<SentinelConfig>> = Lazy::new(|| {
    RwLock::new(load_config().expect("Failed to load config"))
});

pub fn load_config() -> Result<SentinelConfig, ConfigError> {
    let config = Config::builder()
        .add_source(File::with_name("config.toml"))
        .build()?;
    
    config.try_deserialize()
}