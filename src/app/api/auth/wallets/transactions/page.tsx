"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { ArrowLeft, RefreshCw, ArrowUpRight, Check, X, AlertTriangle } from "lucide-react";

interface Transaction {
  signature: string;
  blockTime: string | null;
  slot: number;
  status: string;
  fee: number | null;
}

export default function TransactionsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const walletAddress = searchParams.get("address");
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === "authenticated" && walletAddress) {
      fetchTransactions();
    }
  }, [sessionStatus, walletAddress]);

  const fetchTransactions = async () => {
    if (!walletAddress) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/wallets/transactions?address=${walletAddress}&limit=20`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch transactions");
      }
      
      const data = await response.json();
      setTransactions(data.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp
  const formatDate = (timestamp: string | null) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Shorten signature for display
  const shortenSignature = (signature: string) => {
    return signature.substring(0, 8) + "..." + signature.substring(signature.length - 8);
  };

  if (sessionStatus === "loading") {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
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

  if (!walletAddress) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>No wallet address specified</AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold">Recent Transactions</h1>
          <p className="text-muted-foreground">
            Wallet: {walletAddress.substring(0, 4)}...{walletAddress.substring(walletAddress.length - 4)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button onClick={fetchTransactions} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Recent transactions for this wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-lg">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left font-medium">Signature</th>
                    <th className="px-4 py-2 text-left font-medium">Time</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-left font-medium">Fee (SOL)</th>
                    <th className="px-4 py-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.signature} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono">{shortenSignature(tx.signature)}</td>
                      <td className="px-4 py-3">{formatDate(tx.blockTime)}</td>
                      <td className="px-4 py-3">
                        {tx.status === "success" ? (
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-green-500/10 text-green-500">
                            <Check className="mr-1 h-3 w-3" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-red-500/10 text-red-500">
                            <X className="mr-1 h-3 w-3" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{tx.fee !== null ? tx.fee.toFixed(6) : "—"}</td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2"
                          asChild
                        >
                          <a
                            href={`https://explorer.solana.com/tx/${tx.signature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center"
                          >
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            Explorer
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}