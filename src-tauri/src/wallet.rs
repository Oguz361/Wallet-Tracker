// Alternative: Einfachere Version ohne Mnemonic
use solana_sdk::{
    signature::{Keypair, Signer},
    pubkey::Pubkey,
};
use ring::aead::{Aad, LessSafeKey, Nonce, UnboundKey, AES_256_GCM};
use crate::error::{SentinelError, Result};

pub struct WalletManager {
    master_key: LessSafeKey,
}

impl WalletManager {
    pub fn new(password: &str) -> Result<Self> {
        let salt = b"sentinel_salt_v1";
        let mut key_bytes = [0u8; 32];
        
        argon2::Argon2::default()
            .hash_password_into(password.as_bytes(), salt, &mut key_bytes)
            .map_err(|e| SentinelError::Wallet(e.to_string()))?;
        
        let unbound_key = UnboundKey::new(&AES_256_GCM, &key_bytes)
            .map_err(|e| SentinelError::Wallet(e.to_string()))?;
        
        Ok(Self {
            master_key: LessSafeKey::new(unbound_key),
        })
    }
    
    pub fn create_wallet(&self) -> Result<(Keypair, String)> {
        // Einfach neue Wallet ohne Mnemonic
        let keypair = Keypair::new();
        
        // Exportiere Private Key als Base58
        let private_key_base58 = bs58::encode(keypair.to_bytes()).into_string();
        
        Ok((keypair, private_key_base58))
    }
    
    pub fn import_wallet(&self, private_key_base58: &str) -> Result<Keypair> {
        // Importiere von Base58 Private Key
        let private_key_bytes = bs58::decode(private_key_base58)
            .into_vec()
            .map_err(|e| SentinelError::Wallet(e.to_string()))?;
        
        let keypair = Keypair::from_bytes(&private_key_bytes)
            .map_err(|e| SentinelError::Wallet(e.to_string()))?;
        
        Ok(keypair)
    }
    
    // encrypt_private_key und decrypt_private_key bleiben gleich...
}