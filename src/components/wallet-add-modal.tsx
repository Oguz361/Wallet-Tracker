"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { isValidSolanaAddress } from "@/lib/solana";
import { AlertTriangle } from "lucide-react";

interface WalletAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletAdded: () => void;
}

export function WalletAddModal({ isOpen, onClose, onWalletAdded }: WalletAddModalProps) {
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [newWalletLabel, setNewWalletLabel] = useState("");
  const [addingWallet, setAddingWallet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidSolanaAddress(newWalletAddress)) {
      setError("Invalid Solana wallet address");
      return;
    }
    
    try {
      setAddingWallet(true);
      setError(null);
      
      const response = await fetch("/api/auth/wallets", {
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
      
      // Notify parent component
      onWalletAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add wallet");
    } finally {
      setAddingWallet(false);
    }
  };

  const handleDialogClose = () => {
    setNewWalletAddress("");
    setNewWalletLabel("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Wallet</DialogTitle>
          <DialogDescription>
            Enter a Solana wallet address to track and monitor.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleAddWallet}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4 py-2">
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
          </div>
          
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleDialogClose}
              disabled={addingWallet}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addingWallet || !newWalletAddress}
            >
              {addingWallet ? "Adding..." : "Add Wallet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}