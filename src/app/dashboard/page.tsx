"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { isValidSolanaAddress } from "@/lib/solana";
import { WalletAddModal } from "@/components/wallet-add-modal";
import {
  WalletIcon,
  Plus,
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
      const response = await fetch("/api/wallets");
      
      if (!response.ok) {
        // We're silently handling the error instead of showing an error message
        console.error("Failed to fetch wallets");
        setWallets([]);
      } else {
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
      }
    } catch (err) {
      console.error("Error fetching wallets:", err);
      setWallets([]);
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
        console.error("Failed to delete wallet");
        return;
      }
      
      // Remove from state
      setWallets(wallets.filter(wallet => wallet.id !== walletId));
    } catch (err) {
      console.error("Failed to delete wallet:", err);
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
        console.error("Failed to update wallet");
        return;
      }
      
      // Update state
      setWallets(wallets.map(wallet => ({
        ...wallet,
        isMain: wallet.id === walletId,
      })));
    } catch (err) {
      console.error("Failed to update wallet:", err);
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

        <Tabs defaultValue="overview" className="w-full">
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