"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { isValidSolanaAddress } from "@/lib/solana";
import { WalletAddModal } from "@/components/wallet-add-modal";
import { ProfitLossTable } from "@/components/profit-loss-table";
import { TopTokensTable } from "@/components/top-tokens-table";
import {
  BarChart,
  WalletIcon,
  Plus,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  Trash2,
} from "lucide-react";

interface Wallet {
  id: string;
  address: string;
  label: string | null;
  createdAt: string;
  balance?: number;
}

interface Token {
  mint: string;
  balance: number;
  decimals: number;
}

interface WalletBalance {
  address: string;
  solBalance: number;
  tokens: Token[];
  lastTransactionDate: string | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<Record<string, WalletBalance>>({});
  const [loadingBalances, setLoadingBalances] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch user's wallets
  useEffect(() => {
    if (status === "authenticated") {
      fetchWallets();
    }
  }, [status]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      console.log("Fetching wallets...");
      
      // Die korrekte API-Route für Wallets
      const response = await fetch("/api/auth/wallets");
      
      if (!response.ok) {
        // Log more details about the error
        console.error("Failed to fetch wallets, status:", response.status);
        try {
          const errorData = await response.json();
          console.error("Error details:", errorData);
        } catch (e) {
          console.error("Could not parse error response");
        }
        setWallets([]);
      } else {
        const data = await response.json();
        console.log("Wallets fetched successfully:", data);
        setWallets(data);
        
        // Initialize loading state for each wallet
        const initialLoadingState: Record<string, boolean> = {};
        data.forEach((wallet: Wallet) => {
          initialLoadingState[wallet.address] = false;
        });
        setLoadingBalances(initialLoadingState);
        
        // Fetch balances for all wallets
        data.forEach((wallet: Wallet) => {
          fetchWalletBalance(wallet.address);
        });
      }
    } catch (err) {
      console.error("Error fetching wallets:", err);
      setWallets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async (walletAddress: string) => {
    if (!walletAddress || typeof walletAddress !== 'string') {
      console.error("Invalid wallet address");
      return;
    }
    
    try {
      setLoadingBalances(prev => ({ ...prev, [walletAddress]: true }));
      
      const response = await fetch(`/api/auth/wallets/balance?address=${encodeURIComponent(walletAddress)}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }
      
      const data = await response.json();
      setBalances(prev => ({ ...prev, [walletAddress]: data }));
    } catch (err) {
      console.error("Error fetching balance:", err);
    } finally {
      setLoadingBalances(prev => ({ ...prev, [walletAddress]: false }));
    }
  };

  const handleDeleteWallet = async (walletId: string) => {
    if (!walletId || typeof walletId !== 'string') {
      console.error("Invalid wallet ID");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this wallet?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/auth/wallets/${walletId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to delete wallet:", errorData.error || "Unknown error");
        return;
      }
      
      console.log("Wallet deleted successfully");
      
      // Remove from state
      setWallets(wallets.filter(wallet => wallet.id !== walletId));
    } catch (err) {
      console.error("Failed to delete wallet:", err);
    }
  };

  const onWalletAdded = () => {
    fetchWallets();
    setShowAddModal(false);
  };

  if (status === "loading") {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
            <CardDescription>
              You need to be signed in to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No activity";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>
          <Button 
            className="mt-4 md:mt-0" 
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Wallet
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <h2 className="text-xl font-bold mb-4">Your Wallets</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wallets.map((wallet) => (
                <Card key={wallet.id} className="relative overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate mr-2">{wallet.label || wallet.address.substring(0, 8) + "..."}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteWallet(wallet.id)}
                          title="Delete wallet"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription className="font-mono text-xs truncate">
                      {wallet.address}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {balances[wallet.address] ? (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">SOL Balance:</span>
                            <span className="font-semibold">
                              {balances[wallet.address].solBalance.toFixed(4)} SOL
                            </span>
                          </div>
                          {balances[wallet.address].tokens.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tokens:</span>
                              <span className="font-semibold">
                                {balances[wallet.address].tokens.length}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Activity:</span>
                            <span className="font-semibold">
                              {balances[wallet.address].lastTransactionDate 
                                ? formatDate(balances[wallet.address].lastTransactionDate)
                                : "No activity"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-muted-foreground text-sm mb-2">
                            {loadingBalances[wallet.address] ? "Loading balance..." : "No balance data"}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <div className="px-6 py-4 border-t flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingBalances[wallet.address]}
                      onClick={() => fetchWalletBalance(wallet.address)}
                    >
                      {loadingBalances[wallet.address] ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      {loadingBalances[wallet.address] ? "Loading..." : "Refresh"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setActiveTab("analytics")}>
                      <BarChart className="mr-2 h-4 w-4" />
                      Analyze
                    </Button>
                  </div>
                </Card>
              ))}

              {loading && (
                <div className="col-span-full text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-lg">Loading your wallets...</p>
                </div>
              )}
              
              {!loading && wallets.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <WalletIcon className="h-12 w-12 opacity-20" />
                    <p className="text-lg text-muted-foreground">No wallets added yet</p>
                    <Button onClick={() => setShowAddModal(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add your first wallet
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profit/Loss Rankings</CardTitle>
                  <CardDescription>View profit and loss rankings for your wallets across different time periods</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfitLossTable />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Tokens Purchased</CardTitle>
                  <CardDescription>View the most purchased tokens across your wallets</CardDescription>
                </CardHeader>
                <CardContent>
                  <TopTokensTable />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Manage your account and notification preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Settings features coming soon. Stay tuned for updates!
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <WalletAddModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onWalletAdded={onWalletAdded} 
      />
    </div>
  );
}