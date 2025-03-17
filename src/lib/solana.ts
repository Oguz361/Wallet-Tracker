import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL, 
  clusterApiUrl,
  TransactionResponse,
  VersionedTransactionResponse 
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';


interface TokenPurchase {
  mint: string;
  tokenName: string | null;
  totalValueUSD: number;
}

// You can choose from 'mainnet-beta', 'testnet', 'devnet'
const SOLANA_NETWORK = "mainnet-beta";

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
    console.error("Error fetching SOL balance:", error);
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
    return tokenAccounts.value
      .map((account) => {
        const accountData = account.account.data.parsed.info;
        const mintAddress = accountData.mint;
        const tokenBalance = accountData.tokenAmount;

        return {
          mint: mintAddress,
          balance: tokenBalance.uiAmount,
          decimals: tokenBalance.decimals,
          address: account.pubkey.toString(),
        };
      })
      .filter((token) => token.balance > 0); // Only include tokens with non-zero balance
  } catch (error) {
    console.error("Error fetching token balances:", error);
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
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit,
    });

    // Get detailed transaction information
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        try {
          const tx = await connection.getTransaction(sig.signature);
          return {
            signature: sig.signature,
            blockTime: sig.blockTime
              ? new Date(sig.blockTime * 1000).toISOString()
              : null,
            slot: sig.slot,
            status: tx?.meta?.err ? "failed" : "success",
            fee: tx?.meta?.fee ? tx.meta.fee / LAMPORTS_PER_SOL : null,
          };
        } catch (err) {
          console.error(`Error fetching transaction ${sig.signature}:`, err);
          return {
            signature: sig.signature,
            blockTime: sig.blockTime
              ? new Date(sig.blockTime * 1000).toISOString()
              : null,
            slot: sig.slot,
            status: "unknown",
            fee: null,
          };
        }
      })
    );

    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
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

/**
 * Get last transaction date for a wallet
 */
export async function getLastTransactionDate(walletAddress: string): Promise<string | null> {
  try {
    const publicKey = new PublicKey(walletAddress);
    
    // Get signature of the most recent transaction with retry logic
    try {
      const signatures = await connection.getSignaturesForAddress(
        publicKey,
        { limit: 1 }
      );
      
      if (signatures.length === 0) {
        return null;
      }
      
      // Return the timestamp
      return signatures[0].blockTime 
        ? new Date(signatures[0].blockTime * 1000).toISOString()
        : null;
    } catch (error) {
      console.error("Error fetching signatures:", error);
      // Try again with fewer results if we hit a timeout
      console.log("Retrying with smaller query...");
      
      try {
        // Use a direct RPC call with smaller limit as fallback
        const signatures = await connection.getSignaturesForAddress(
          publicKey,
          { limit: 1 }
        );
        
        if (signatures.length === 0) {
          return null;
        }
        
        return signatures[0].blockTime 
          ? new Date(signatures[0].blockTime * 1000).toISOString()
          : null;
      } catch (retryError) {
        console.error("Retry also failed:", retryError);
        return null;
      }
    }
  } catch (error) {
    console.error('Error fetching last transaction date:', error);
    return null;
  }
}

/**
 * Get historical transactions for a wallet over a specified period with better error handling
 */
export async function getHistoricalTransactions(walletAddress: string, daysBack: number) {
  try {
    const publicKey = new PublicKey(walletAddress);
    
    // Calculate how many transactions to fetch based on days
    // This is an approximation - you might need to adjust this based on wallet activity
    const estimatedTxCount = Math.min(50, daysBack * 2); // Reduce number to avoid timeouts
    
    // Get signatures of recent transactions
    const signatures = await connection.getSignaturesForAddress(
      publicKey,
      { limit: estimatedTxCount }
    );
    
    // Get detailed transaction information with better error handling
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        try {
          // Use a timeout for each transaction fetch
          const txPromise = connection.getTransaction(sig.signature);
          const tx = await Promise.race([
            txPromise,
            new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error('Transaction fetch timeout')), 5000)
            )
          ]) as TransactionResponse | VersionedTransactionResponse | null;
          
          return {
            signature: sig.signature,
            blockTime: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
            slot: sig.slot,
            // Safely check if meta exists and has an err property
            status: tx && 'meta' in tx && tx.meta?.err ? 'failed' : 'success',
            // Safely check if meta exists and has a fee property
            fee: tx && 'meta' in tx && tx.meta?.fee ? tx.meta.fee / LAMPORTS_PER_SOL : null,
          };
        } catch (err) {
          console.error(`Error fetching transaction ${sig.signature}:`, err);
          // Return partial data instead of null
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
    console.error('Error fetching historical transactions:', error);
    return [];
  }
}

/**
 * Get top tokens purchased across multiple wallets in a timeframe
 */
export async function getTopTokensPurchased(walletAddresses: string[], daysBack: number): Promise<TokenPurchase[]> {
  try {
    // This is a simplified implementation - in a real application,
    // you would need to:
    // 1. Fetch all token transactions for the given wallets
    // 2. Filter for purchase transactions in the specified timeframe
    // 3. Calculate USD value at time of purchase
    // 4. Group by token and sum values
    // 5. Sort and return top 10
    
    // Sample token list - in production, you'd fetch real token metadata from a service
    const knownTokens: Record<string, string> = {
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "USDC",
      "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": "mSOL",
      "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj": "stSOL",
      "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "USDT",
      "rndshKFf48HhGaPbaCd3WhsYBrCqNr7jxXhiaxonstg": "RAY",
      "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": "RAY-USDT LP",
      "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt": "SRM",
      "Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1": "SBR",
      "AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB": "GST",
      "7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx": "GMT",
      "kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iAHJq6": "KIN"
    };
    
    // In a real implementation, you would use the blockchain data to calculate this
    // For now, we'll use placeholder data
    const topTokens: TokenPurchase[] = [];
    
    // Generate placeholder data based on known tokens
    const tokenAddresses = Object.keys(knownTokens);
    for (let i = 0; i < Math.min(10, tokenAddresses.length); i++) {
      const mint = tokenAddresses[i];
      const tokenName = knownTokens[mint];
      
      // Generate a random value based on timeframe - more days = higher values
      const totalValueUSD = Math.random() * 10000 * Math.sqrt(daysBack);
      
      topTokens.push({
        mint,
        tokenName,
        totalValueUSD
      });
    }
    
    // Sort by value, highest first
    topTokens.sort((a, b) => b.totalValueUSD - a.totalValueUSD);
    
    // Return top 10
    return topTokens.slice(0, 10);
  } catch (error) {
    console.error('Error fetching top tokens purchased:', error);
    return [];
  }
}
