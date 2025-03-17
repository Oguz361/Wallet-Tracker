import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Bell, Check, Send } from "lucide-react";

interface TelegramConfig {
  configured: boolean;
  active: boolean;
  chatId?: string;
}

export function TelegramSetup() {
  const [config, setConfig] = useState<TelegramConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatId, setChatId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch current configuration
  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/notifications/telegram");
      
      if (!response.ok) {
        throw new Error("Failed to fetch Telegram configuration");
      }
      
      const data = await response.json();
      setConfig(data);
      
      if (data.chatId) {
        setChatId(data.chatId);
      }
    } catch (err) {
      console.error("Error fetching Telegram config:", err);
      setError("Failed to load Telegram configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Save Telegram configuration
  const saveTelegramConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatId) {
      setError("Chat ID is required");
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch("/api/notifications/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save Telegram configuration");
      }
      
      const result = await response.json();
      
      setConfig({
        configured: true,
        active: true,
        chatId
      });
      
      setSuccess(result.messageSent 
        ? "Telegram configured successfully! A test message has been sent." 
        : "Telegram configured successfully!");
    } catch (err) {
      console.error("Error saving Telegram config:", err);
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setSaving(false);
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
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Telegram Notifications
        </CardTitle>
        <CardDescription>
          Get real-time alerts via Telegram when certain events occur with your wallets
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 border-green-500 text-green-500">
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={saveTelegramConfig} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chatId">Telegram Chat ID</Label>
            <div className="flex space-x-2">
              <Input
                id="chatId"
                placeholder="Enter your Telegram chat ID"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                disabled={saving}
              />
              <Button type="submit" disabled={saving || !chatId}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Start a chat with <code>@SentinelSolanaBot</code> and use the <code>/start</code> command to get your Chat ID.
            </p>
          </div>
        </form>
        
        {config?.configured && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Status</h3>
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${config.active ? "bg-green-500" : "bg-red-500"}`}></div>
              <span>{config.active ? "Active" : "Inactive"}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}