import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// You can choose from 'mainnet-beta', 'testnet', 'devnet'
const SOLANA_NETWORK = 'mainnet-beta';

// Use public RPC endpoint for development
// For production, consider using a dedicated RPC provider like QuickNode, Helius, etc.
export const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));

/**
 * Get SOL balance for a wallet address
 */
export async function getWalletBalance(walletAddress: string): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL; // Convert lamports to SOL
  } catch (error) {
    console.error('Error fetching SOL balance:', error);
    throw error;
  }
}

/**
 * Get token accounts and balances for a wallet
 */
export async function getTokenBalances(walletAddress: string) {
  try {
    const publicKey = new PublicKey(walletAddress);
    
    // Get all token accounts for this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: TOKEN_PROGRAM_ID }
    );
    
    // Extract token information
    return tokenAccounts.value.map(account => {
      const accountData = account.account.data.parsed.info;
      const mintAddress = accountData.mint;
      const tokenBalance = accountData.tokenAmount;
      
      return {
        mint: mintAddress,
        balance: tokenBalance.uiAmount,
        decimals: tokenBalance.decimals,
        address: account.pubkey.toString(),
      };
    }).filter(token => token.balance > 0); // Only include tokens with non-zero balance
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return [];
  }
}

/**
 * Get recent transactions for a wallet
 */
export async function getRecentTransactions(walletAddress: string, limit = 10) {
  try {
    const publicKey = new PublicKey(walletAddress);
    
    // Get signatures of recent transactions
    const signatures = await connection.getSignaturesForAddress(
      publicKey,
      { limit }
    );
    
    // Get detailed transaction information
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        try {
          const tx = await connection.getTransaction(sig.signature);
          return {
            signature: sig.signature,
            blockTime: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
            slot: sig.slot,
            status: tx?.meta?.err ? 'failed' : 'success',
            fee: tx?.meta?.fee ? tx.meta.fee / LAMPORTS_PER_SOL : null,
          };
        } catch (err) {
          console.error(`Error fetching transaction ${sig.signature}:`, err);
          return {
            signature: sig.signature,
            blockTime: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
            slot: sig.slot,
            status: 'unknown',
            fee: null,
          };
        }
      })
    );
    
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

/**
 * Validate a Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
}