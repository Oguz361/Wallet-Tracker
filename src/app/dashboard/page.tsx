"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { isValidSolanaAddress } from "@/lib/solana";
import {
  BarChart,
  WalletIcon,
  Plus,
  X,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  Trash2,
  PencilLine,
  Check,
  Star,
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
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [newWalletLabel, setNewWalletLabel] = useState("");
  const [addingWallet, setAddingWallet] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

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

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidSolanaAddress(newWalletAddress)) {
      setError("Invalid Solana wallet address");
      return;
    }
    
    try {
      setAddingWallet(true);
      setError(null);
      
      const response = await fetch("/api/wallets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: newWalletAddress,
          label: newWalletLabel || null,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add wallet");
      }
      
      // Reset form
      setNewWalletAddress("");
      setNewWalletLabel("");
      setShowAddForm(false);
      
      // Refresh wallets
      fetchWallets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add wallet");
    } finally {
      setAddingWallet(false);
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
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Wallet Dashboard</h1>
        <p className="text-muted-foreground">
          Track your Solana wallets and monitor their activity
        </p>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Add Wallet Card */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Add Wallet
            </CardTitle>
            <CardDescription>
              Connect a new Solana wallet to track
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showAddForm ? (
              <form onSubmit={handleAddWallet} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Wallet Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter Solana wallet address"
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label">Label (Optional)</Label>
                  <Input
                    id="label"
                    placeholder="My Wallet"
                    value={newWalletLabel}
                    onChange={(e) => setNewWalletLabel(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={addingWallet || !newWalletAddress}
                    className="flex-1"
                  >
                    {addingWallet ? "Adding..." : "Add Wallet"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewWalletAddress("");
                      setNewWalletLabel("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Wallet
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Wallet Cards */}
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
                      No balance data
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
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
              <div className="flex gap-2">
                <Button size="sm" variant="outline" title="View Transactions" asChild>
                  <Link href={`/dashboard/transactions?address=${wallet.address}`}>
                    <BarChart className="mr-2 h-4 w-4" />
                    Transactions
                  </Link>
                </Button>
                <Button size="sm" variant="outline" title="View on Explorer" asChild>
                  <a
                    href={`https://explorer.solana.com/address/${wallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Explorer
                  </a>
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading your wallets...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && wallets.length === 0 && !showAddForm && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>No Wallets Found</CardTitle>
            <CardDescription>
              You haven't added any Solana wallets yet. Add one to start tracking.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setShowAddForm(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Wallet
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}