import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

interface ProfitSummary {
  walletId: string;
  walletAddress: string;
  walletLabel: string | null;
  profitDay: number;
  profit3Days: number;
  profitWeek: number;
  profitMonth: number;
  profit6Months: number;
}

export function ProfitLossTable() {
  const [timeframe, setTimeframe] = useState("day");
  const [sortDirection, setSortDirection] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfitSummary[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Implement a simulated response until the actual API is available
      // Generate example data based on the wallets
      const walletsResponse = await fetch("/api/auth/wallets");
      if (!walletsResponse.ok) {
        throw new Error("Failed to fetch wallets");
      }
      
      const wallets = await walletsResponse.json();
      
      // Generate mock data for each wallet
      const mockProfitData: ProfitSummary[] = wallets.map((wallet: any) => {
        // Generate random profit values with consistent tendency
        const baseProfit = (Math.random() * 20) - 10;  // Between -10 and +10
        
        return {
          walletId: wallet.id,
          walletAddress: wallet.address,
          walletLabel: wallet.label,
          profitDay: +(baseProfit).toFixed(2),
          profit3Days: +(baseProfit * 2).toFixed(2),
          profitWeek: +(baseProfit * 3).toFixed(2),
          profitMonth: +(baseProfit * 6).toFixed(2), 
          profit6Months: +(baseProfit * 10).toFixed(2)
        };
      });
      
      // Sort by the selected timeframe
      let sortField: keyof ProfitSummary;
      switch (timeframe) {
        case "day": sortField = "profitDay"; break;
        case "3days": sortField = "profit3Days"; break;
        case "week": sortField = "profitWeek"; break;
        case "month": sortField = "profitMonth"; break;
        case "6months": sortField = "profit6Months"; break;
        default: sortField = "profitDay";
      }
      
      mockProfitData.sort((a, b) => {
        return sortDirection === "desc"
          ? b[sortField] - a[sortField]
          : a[sortField] - b[sortField];
      });
      
      setData(mockProfitData);
    } catch (error) {
      console.error("Error fetching profit data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe, sortDirection]);

  // Helper function to get profit value based on timeframe
  const getProfitValue = (item: ProfitSummary) => {
    switch (timeframe) {
      case "day": return item.profitDay;
      case "3days": return item.profit3Days;
      case "week": return item.profitWeek;
      case "month": return item.profitMonth;
      case "6months": return item.profit6Months;
      default: return item.profitDay;
    }
  };

  // Format profit/loss value as currency
  const formatProfit = (profit: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'always',
    }).format(profit);
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
        
        <div className="flex gap-2 self-end">
          <Button
            variant={sortDirection === "desc" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortDirection("desc")}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Top Profit
          </Button>
          <Button
            variant={sortDirection === "asc" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortDirection("asc")}
          >
            <TrendingDown className="mr-2 h-4 w-4" />
            Top Loss
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium">Rank</th>
                <th className="px-4 py-3 text-left font-medium">Wallet</th>
                <th className="px-4 py-3 text-right font-medium">Profit/Loss</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Loading profit data...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">No data available</p>
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item.walletId} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3 text-center">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.walletLabel || 'Unnamed Wallet'}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {item.walletAddress.substring(0, 4)}...{item.walletAddress.substring(item.walletAddress.length - 4)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-medium ${
                          getProfitValue(item) >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {formatProfit(getProfitValue(item))}
                      </span>
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