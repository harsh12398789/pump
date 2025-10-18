import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Twitter, Send, Globe, Copy, CheckCheck } from "lucide-react";
import { SiSolana } from "react-icons/si";
import { PumpFunToken } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface TokenCardProps {
  token: PumpFunToken;
  onCopy: (token: PumpFunToken) => void;
}

export function TokenCard({ token, onCopy }: TokenCardProps) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCopy = () => {
    onCopy(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeAgo = formatDistanceToNow(new Date(token.timestamp), { addSuffix: true });
  const isNew = Date.now() - token.timestamp < 5 * 60 * 1000; // 5 minutes

  return (
    <Card className="overflow-hidden hover-elevate transition-all duration-200" data-testid={`card-token-${token.mint}`}>
      <div className="p-6">
        <div className="flex gap-4">
          {/* Token Image */}
          <div className="flex-shrink-0">
            {!imageError && token.image ? (
              <img
                src={token.image}
                alt={token.name}
                className="w-20 h-20 rounded-lg object-cover bg-muted"
                onError={() => setImageError(true)}
                data-testid={`img-token-${token.mint}`}
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center">
                <span className="text-2xl font-bold font-mono text-primary">
                  {token.symbol?.charAt(0) || "?"}
                </span>
              </div>
            )}
          </div>

          {/* Token Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-semibold truncate" data-testid={`text-name-${token.mint}`}>
                    {token.name}
                  </h3>
                  {isNew && (
                    <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/30 text-xs animate-pulse">
                      NEW
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-mono uppercase tracking-wider text-muted-foreground" data-testid={`text-symbol-${token.mint}`}>
                  ${token.symbol}
                </p>
              </div>
            </div>

            {token.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                {token.description}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {token.marketCapSol && (
                <div className="flex items-center gap-1 text-xs">
                  <SiSolana className="w-3 h-3 text-primary" />
                  <span className="font-mono text-muted-foreground">
                    {token.marketCapSol.toFixed(2)} SOL
                  </span>
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {timeAgo}
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {token.twitter && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                  data-testid={`button-twitter-${token.mint}`}
                >
                  <a href={token.twitter} target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {token.telegram && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                  data-testid={`button-telegram-${token.mint}`}
                >
                  <a href={token.telegram} target="_blank" rel="noopener noreferrer">
                    <Send className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {token.website && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                  data-testid={`button-website-${token.mint}`}
                >
                  <a href={token.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>

            {/* Copy & Launch Button */}
            <Button
              onClick={handleCopy}
              className="w-full gap-2"
              variant={copied ? "outline" : "default"}
              data-testid={`button-copy-${token.mint}`}
            >
              {copied ? (
                <>
                  <CheckCheck className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy to Launch
                </>
              )}
            </Button>

            {/* Contract Address */}
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground font-mono truncate" title={token.mint}>
                {token.mint}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
