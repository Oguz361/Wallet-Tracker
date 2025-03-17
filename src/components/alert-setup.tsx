import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertTriangle, Check, DollarSign, Wallet, 
  Coins, TrendingUp, TrendingDown, Plus, 
  Bell
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WalletOption {
  id: string;
  address: string;
  label: string | null;
}

interface Alert {
  id: string;
  type: string;
  walletAddress: string | null;
  tokenAddress: string | null;
  threshold: number | null;
  isActive: boolean;
}

export function AlertSetup() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  
  // New alert form state
  const [alertType, setAlertType] = useState("transaction");
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState("");
  const [threshold, setThreshold] = useState("");
  const [creating, setCreating] = useState(false);

  // Fetch current alerts and wallet options
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch alerts
      const alertsResponse = await fetch("/api/notifications/alerts");
      
      if (!alertsResponse.ok) {
        throw new Error("Failed to fetch alerts");
      }
      
      const alertsData = await alertsResponse.json();
      setAlerts(alertsData);
      
      // Fetch wallets for dropdown
      const walletsResponse = await fetch("/api/auth/wallets");
      
      if (!walletsResponse.ok) {
        throw new Error("Failed to fetch wallets");
      }
      
      const walletsData = await walletsResponse.json();
      setWallets(walletsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load alerts or wallets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create a new alert
  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setCreating(true);
      setError(null);
      
      const alertData: any = {
        type: alertType,
      };
      
      // Add conditional fields
      if (selectedWallet) alertData.walletAddress = selectedWallet;
      if (tokenAddress) alertData.tokenAddress = tokenAddress;
      if (threshold) alertData.threshold = parseFloat(threshold);
      
      const response = await fetch("/api/notifications/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(alertData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create alert");
      }
      
      const newAlert = await response.json();
      
      // Update alerts state
      setAlerts([...alerts, newAlert]);
      
      // Reset form
      setAlertType("transaction");
      setSelectedWallet(null);
      setTokenAddress("");
      setThreshold("");
      
      // Close dialog
      setShowDialog(false);
    } catch (err) {
      console.error("Error creating alert:", err);
      setError(err instanceof Error ? err.message : "Failed to create alert");
    } finally {
      setCreating(false);
    }
  };

  // Get alert type display
  const getAlertTypeDisplay = (type: string) => {
    switch (type) {
      case "transaction": return "New Transaction";
      case "profit": return "Profit Alert";
      case "loss": return "Loss Alert";
      case "token_purchase": return "Token Purchase";
      case "high_value": return "High Value Transaction";
      default: return type;
    }
  };

  // Get alert icon
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "transaction": return <Wallet className="h-4 w-4" />;
      case "profit": return <TrendingUp className="h-4 w-4" />;
      case "loss": return <TrendingDown className="h-4 w-4" />;
      case "token_purchase": return <Coins className="h-4 w-4" />;
      case "high_value": return <DollarSign className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Notification Alerts</CardTitle>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Alert</DialogTitle>
                <DialogDescription>
                  Configure a new alert to get notified when specific events occur.
                </DialogDescription>
              </DialogHeader>
              
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={createAlert} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="alertType">Alert Type</Label>
                  <Select
                    value={alertType}
                    onValueChange={setAlertType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select alert type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transaction">New Transaction</SelectItem>
                      <SelectItem value="profit">Profit Alert</SelectItem>
                      <SelectItem value="loss">Loss Alert</SelectItem>
                      <SelectItem value="token_purchase">Token Purchase</SelectItem>
                      <SelectItem value="high_value">High Value Transaction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wallet">Wallet (Optional)</Label>
                  <Select
                    value={selectedWallet || ""}
                    onValueChange={setSelectedWallet}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All wallets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All wallets</SelectItem>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.address}>
                          {wallet.label || wallet.address.substring(0, 8) + "..."}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {["token_purchase"].includes(alertType) && (
                  <div className="space-y-2">
                    <Label htmlFor="tokenAddress">Token Address (Optional)</Label>
                    <Input
                      id="tokenAddress"
                      placeholder="Enter token address"
                      value={tokenAddress}
                      onChange={(e) => setTokenAddress(e.target.value)}
                    />
                  </div>
                )}
                
                {["profit", "loss", "high_value"].includes(alertType) && (
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Threshold Value (SOL)</Label>
                    <Input
                      id="threshold"
                      type="number"
                      step="0.01"
                      placeholder="Enter threshold value"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                    />
                  </div>
                )}
                
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create Alert"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Configure alerts for different wallet activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No alerts configured yet</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setShowDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Create your first alert
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex justify-between items-center p-4 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div>
                    <h4 className="font-medium">{getAlertTypeDisplay(alert.type)}</h4>
                    <p className="text-sm text-muted-foreground">
                      {alert.walletAddress ? (
                        <>Wallet: {alert.walletAddress.substring(0, 6)}...{alert.walletAddress.substring(alert.walletAddress.length - 4)}</>
                      ) : (
                        "All wallets"
                      )}
                      {alert.threshold && <> | Threshold: {alert.threshold} SOL</>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className={`h-2 w-2 rounded-full ${alert.isActive ? "bg-green-500" : "bg-red-500"} mr-2`}></div>
                  <span className="text-sm">{alert.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}