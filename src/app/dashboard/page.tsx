"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { isValidSolanaAddress } from "@/lib/solana";
import { Particles } from "@/components/ui/particles";
import { WalletAddModal } from "@/components/wallet-add-modal";
import {
  BarChart,
  WalletIcon,
  Plus,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  Trash2,
  Star,
  ActivityIcon,
} from "lucide-react";

interface Wallet {
  id: string;
  address: string;
  label: string | null;
  isMain: boolean;
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
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<Record<string, WalletBalance>>({});
  const [loadingBalances, setLoadingBalances] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
      const response = await fetch("/api/wallets");
      
      if (!response.ok) {
        throw new Error("Failed to fetch wallets");
      }
      
      const data = await response.json();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async (walletAddress: string) => {
    try {
      setLoadingBalances(prev => ({ ...prev, [walletAddress]: true }));
      
      const response = await fetch(`/api/wallets/balance?address=${walletAddress}`);
      
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
    if (!confirm("Are you sure you want to delete this wallet?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/wallets/${walletId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete wallet");
      }
      
      // Remove from state
      setWallets(wallets.filter(wallet => wallet.id !== walletId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete wallet");
    }
  };

  const handleSetMainWallet = async (walletId: string) => {
    try {
      const response = await fetch(`/api/wallets/${walletId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isMain: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update wallet");
      }
      
      // Update state
      setWallets(wallets.map(wallet => ({
        ...wallet,
        isMain: wallet.id === walletId,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update wallet");
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

  // Generate sample data for chart
  const chartData = [
    { month: '01\nJanuar', value: 4200 },
    { month: '02\nJanuar', value: 6800 },
    { month: '03\nJanuar', value: 5000 },
    { month: '04\nJanuar', value: 7900 },
    { month: '05\nJanuar', value: 6300 },
    { month: '06\nJanuar', value: 3700 },
    { month: '07\nJanuar', value: 5800 },
  ];

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0">
        <Particles />
      </div>
      
      <div className="container mx-auto p-4 relative z-10 pt-6">
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

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end justify-between gap-2">
                    {chartData.map((item, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="w-10 bg-white rounded-sm" 
                          style={{ height: `${item.value / 100}px` }}
                        ></div>
                        <div className="text-xs mt-2 text-center whitespace-pre-line">
                          {item.month}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {wallets.slice(0, 5).map((wallet) => (
                      <div key={wallet.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <WalletIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{wallet.label || `Wallet ${wallet.address.substring(0, 4)}...`}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 8)}
                            </div>
                          </div>
                        </div>
                        <div className={`text-right ${balances[wallet.address]?.solBalance > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {balances[wallet.address] ? 
                            `${balances[wallet.address].solBalance.toFixed(4)} SOL` : 
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          }
                        </div>
                      </div>
                    ))}

                    {wallets.length === 0 && !loading && (
                      <div className="text-center py-8 text-muted-foreground">
                        No wallets added yet. Add your first wallet to get started.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <h2 className="text-xl font-bold mt-8 mb-4">Your Wallets</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wallets.map((wallet) => (
                <Card key={wallet.id} className="relative overflow-hidden">
                  {wallet.isMain && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl">
                      Main Wallet
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate mr-2">{wallet.label || wallet.address.substring(0, 8) + "..."}</span>
                      <div className="flex gap-1">
                        {!wallet.isMain && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSetMainWallet(wallet.id)}
                            title="Set as main wallet"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
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
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Tokens: {balances[wallet.address].tokens.length}
                              </p>
                              <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                                {balances[wallet.address].tokens.map((token, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span className="truncate mr-2">{token.mint.substring(0, 8)}...</span>
                                    <span>{token.balance}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard/transactions?address=${wallet.address}`}>
                        <ActivityIcon className="mr-2 h-4 w-4" />
                        Transactions
                      </Link>
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
              
              
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>View detailed analytics of your wallets and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Analytics features coming soon. Stay tuned for updates!
                </p>
              </CardContent>
            </Card>
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