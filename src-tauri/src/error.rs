use thiserror::Error;

#[derive(Error, Debug)]
pub enum SentinelError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),
    
    #[error("Async database error: {0}")]
    AsyncDatabase(#[from] tokio_rusqlite::Error),
    
    #[error("Wallet error: {0}")]
    Wallet(String),
    
    #[error("RPC error: {0}")]
    Rpc(#[from] solana_client::client_error::ClientError),
    
    #[error("WebSocket error: {0}")]
    WebSocket(#[from] tokio_tungstenite::tungstenite::Error),
    
    #[error("Configuration error: {0}")]
    Config(String),
    
    #[error("Trading error: {0}")]
    Trading(String),
}

pub type Result<T> = std::result::Result<T, SentinelError>;