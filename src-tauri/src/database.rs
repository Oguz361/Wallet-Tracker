use rusqlite::{Connection, params};
use std::sync::Mutex;
use crate::error::{SentinelError, Result};

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(path: &str) -> Result<Self> {
        let conn = Connection::open(path)?;
        
        Self::init_tables(&conn)?;
        
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
    
    fn init_tables(conn: &Connection) -> Result<()> {
                conn.execute(
            "CREATE TABLE IF NOT EXISTS wallets (
                id INTEGER PRIMARY KEY,
                pubkey TEXT UNIQUE NOT NULL,
                encrypted_private_key BLOB NOT NULL,
                label TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        // Target wallets to copy
        conn.execute(
            "CREATE TABLE IF NOT EXISTS target_wallets (
                id INTEGER PRIMARY KEY,
                pubkey TEXT UNIQUE NOT NULL,
                label TEXT,
                win_rate REAL,
                active BOOLEAN DEFAULT 1,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        // Trade history
        conn.execute(
            "CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY,
                wallet_id INTEGER REFERENCES wallets(id),
                signature TEXT UNIQUE,
                target_wallet TEXT,
                token_mint TEXT,
                action TEXT CHECK(action IN ('BUY', 'SELL')),
                amount_sol REAL,
                price REAL,
                profit_loss REAL,
                status TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        Ok(())
    }
    
    pub fn save_wallet(&self, pubkey: &str, encrypted_key: &[u8], label: Option<&str>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO wallets (pubkey, encrypted_private_key, label) VALUES (?1, ?2, ?3)",
            params![pubkey, encrypted_key, label],
        )?;
        Ok(())
    }
}