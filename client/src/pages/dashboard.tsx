import { useState, useEffect, useCallback } from "react";
import { PumpFunToken, LaunchTokenRequest, WSMessage } from "@shared/schema";
import { TokenCard } from "@/components/token-card";
import { LaunchForm } from "@/components/launch-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioTower, RefreshCw, Rocket } from "lucide-react";
import { SiSolana } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [tokens, setTokens] = useState<PumpFunToken[]>([]);
  const [selectedToken, setSelectedToken] = useState<Partial<LaunchTokenRequest> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const { toast } = useToast();

  const connectWebSocket = useCallback(() => {
    setIsConnecting(true);
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      toast({
        title: "Connected",
        description: "Monitoring live token launches from pump.fun",
      });
    };

    socket.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        
        if (message.type === 'token' && message.data) {
          setTokens((prev) => {
            // Check if token already exists (it's an update with metadata)
            const existingIndex = prev.findIndex(t => t.mint === message.data!.mint);
            
            if (existingIndex !== -1) {
              // Update existing token with new metadata
              const updated = [...prev];
              updated[existingIndex] = { ...updated[existingIndex], ...message.data };
              return updated;
            } else {
              // Add new token to the beginning and limit to 50 tokens
              const newTokens = [message.data!, ...prev];
              return newTokens.slice(0, 50);
            }
          });
        } else if (message.type === 'error') {
          console.error('WebSocket error:', message.error);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnecting(false);
    };

    socket.onclose = () => {
      setIsConnected(false);
      setIsConnecting(false);
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        connectWebSocket();
      }, 5000);
    };

    return socket;
  }, [toast]);

  useEffect(() => {
    const socket = connectWebSocket();
    return () => {
      socket.close();
    };
  }, [connectWebSocket]);

  const handleCopyToken = (token: PumpFunToken) => {
    // Use proxy URL for images
    const imageUrl = token.mint 
      ? `https://api-main.uxento.io/api/v1/proxy/image?url=${encodeURIComponent(`https://thumbnails.padre.gg/SOLANA-${token.mint}`)}`
      : token.image;

    const launchData: Partial<LaunchTokenRequest> = {
      name: token.name,
      symbol: token.symbol,
      description: token.description,
      imageUrl: imageUrl,
      twitter: token.twitter,
      telegram: token.telegram,
      website: token.website,
    };

    setSelectedToken(launchData);

    // Scroll to launch form
    setTimeout(() => {
      const launchSection = document.getElementById('launch-section');
      if (launchSection) {
        launchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    toast({
      title: "Token Details Copied",
      description: `Ready to launch ${token.name} (${token.symbol})`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <SiSolana className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Pump.fun Monitor</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Copy & Launch Tokens
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="gap-1.5 bg-primary/10 text-primary border-primary/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                LIVE
              </Badge>
            ) : isConnecting ? (
              <Badge variant="outline" className="gap-1.5">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Connecting...
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                <RadioTower className="h-3 w-3" />
                Disconnected
              </Badge>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Token Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Latest Launches</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time token launches from pump.fun
                </p>
              </div>
              <Badge variant="secondary" className="font-mono">
                {tokens.length} tokens
              </Badge>
            </div>

            {/* Loading State */}
            {isConnecting && tokens.length === 0 && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 border border-border rounded-lg">
                    <div className="flex gap-4">
                      <Skeleton className="w-20 h-20 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-9 w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isConnecting && tokens.length === 0 && (
              <div className="text-center py-16 border border-dashed border-border rounded-lg">
                <RadioTower className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Tokens Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Waiting for new token launches on pump.fun...
                </p>
              </div>
            )}

            {/* Token List */}
            <div className="space-y-4" data-testid="token-list">
              {tokens.map((token) => (
                <TokenCard
                  key={token.mint}
                  token={token}
                  onCopy={handleCopyToken}
                />
              ))}
            </div>
          </div>

          {/* Launch Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24" id="launch-section">
              {selectedToken ? (
                <LaunchForm initialData={selectedToken} />
              ) : (
                <div className="border border-dashed border-border rounded-lg p-8 text-center">
                  <Rocket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Launch</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click "Copy to Launch" on any token to get started
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedToken({})}
                    data-testid="button-launch-custom"
                  >
                    Or Launch Custom Token
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
