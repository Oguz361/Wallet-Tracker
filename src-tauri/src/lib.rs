pub mod config;
pub mod database;
pub mod error;
pub mod wallet;
// pub mod websocket;  // Kommt als nächstes
// pub mod trader;     // Kommt als nächstes

use tauri::Manager;
use solana_sdk::signature::Signer; // WICHTIG: Signer trait importieren!

#[tauri::command]
async fn create_wallet(password: String) -> Result<(String, String), String> {
    let manager = wallet::WalletManager::new(&password)
        .map_err(|e| e.to_string())?;
    
    let (keypair, mnemonic) = manager.create_wallet()
        .map_err(|e| e.to_string())?;
    
    let pubkey = keypair.pubkey().to_string(); // Jetzt funktioniert pubkey()
    let seed_phrase = mnemonic.to_string();
    
    // TODO: Save to database
    
    Ok((pubkey, seed_phrase))
}

#[tauri::command]
async fn get_config() -> Result<config::SentinelConfig, String> {
    let config = config::CONFIG.read()
        .map_err(|e| e.to_string())?;
    
    Ok(config.clone())
}

#[tauri::command]
async fn get_wallet_balance(pubkey: String) -> Result<f64, String> {
    use solana_client::rpc_client::RpcClient;
    use solana_sdk::pubkey::Pubkey;
    use std::str::FromStr;
    
    let config = config::CONFIG.read()
        .map_err(|e| e.to_string())?;
    
    let client = RpcClient::new(config.helius.rpc_endpoint.clone());
    let wallet_pubkey = Pubkey::from_str(&pubkey)
        .map_err(|e| e.to_string())?;
    
    let balance = client.get_balance(&wallet_pubkey)
        .map_err(|e| e.to_string())?;
    
    // Convert lamports to SOL
    Ok(balance as f64 / 1_000_000_000.0)
}

// Test-Command um zu verifizieren dass alles funktioniert
#[tauri::command]
async fn test_connection() -> Result<String, String> {
    use solana_client::rpc_client::RpcClient;
    
    let config = config::CONFIG.read()
        .map_err(|e| e.to_string())?;
    
    let client = RpcClient::new(config.helius.rpc_endpoint.clone());
    
    // Get latest blockhash als Test
    let blockhash = client.get_latest_blockhash()
        .map_err(|e| e.to_string())?;
    
    Ok(format!("Connected! Latest blockhash: {}", blockhash))
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            create_wallet,
            get_config,
            get_wallet_balance,
            test_connection,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}