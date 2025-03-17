import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface TokenPurchase {
  mint: string;
  tokenName: string | null;
  totalValueUSD: number;
}

export function TopTokensTable() {
  const [timeframe, setTimeframe] = useState("day");
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<TokenPurchase[]>([]);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      
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
      
      // Generate simulated top tokens based on selected timeframe
      // Convert timeframe to days for calculation
      let days: number;
      switch(timeframe) {
        case "day": days = 1; break;
        case "3days": days = 3; break;
        case "week": days = 7; break;
        case "month": days = 30; break;
        case "6months": days = 180; break;
        default: days = 1;
      }
      
      // Generate example data for top tokens
      const topTokens: TokenPurchase[] = [];
      
      // Generate mock data based on known tokens
      const tokenAddresses = Object.keys(knownTokens);
      for (let i = 0; i < Math.min(10, tokenAddresses.length); i++) {
        const mint = tokenAddresses[i];
        const tokenName = knownTokens[mint];
        
        // Generate a random value based on timeframe - more days = higher values
        const totalValueUSD = Math.random() * 10000 * Math.sqrt(days);
        
        topTokens.push({
          mint,
          tokenName,
          totalValueUSD
        });
      }
      
      // Sort by value, highest first
      topTokens.sort((a, b) => b.totalValueUSD - a.totalValueUSD);
      
      setTokens(topTokens);
    } catch (error) {
      console.error("Error fetching token data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [timeframe]);

  // Format value as currency
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Shorten address for display
  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs value={timeframe} onValueChange={setTimeframe} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="day">1 Day</TabsTrigger>
            <TabsTrigger value="3days">3 Days</TabsTrigger>
            <TabsTrigger value="week">1 Week</TabsTrigger>
            <TabsTrigger value="month">1 Month</TabsTrigger>
            <TabsTrigger value="6months">6 Months</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTokens}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium">Rank</th>
                <th className="px-4 py-3 text-left font-medium">Token</th>
                <th className="px-4 py-3 text-left font-medium">Address</th>
                <th className="px-4 py-3 text-right font-medium">Value Purchased</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Loading token data...</p>
                    </div>
                  </td>
                </tr>
              ) : tokens.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">No token purchase data available</p>
                  </td>
                </tr>
              ) : (
                tokens.map((token, index) => (
                  <tr key={token.mint} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3 text-center">{index + 1}</td>
                    <td className="px-4 py-3 font-medium">
                      {token.tokenName || 'Unknown Token'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {shortenAddress(token.mint)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatValue(token.totalValueUSD)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
