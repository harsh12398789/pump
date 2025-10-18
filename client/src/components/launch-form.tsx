import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { LaunchTokenRequest, launchTokenSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Rocket, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LaunchFormProps {
  initialData?: Partial<LaunchTokenRequest>;
}

export function LaunchForm({ initialData }: LaunchFormProps) {
  const { toast } = useToast();
  const [launchResult, setLaunchResult] = useState<{
    tokenAddress?: string;
    signature?: string;
  } | null>(null);

  const form = useForm<LaunchTokenRequest>({
    resolver: zodResolver(launchTokenSchema),
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      imageUrl: "",
      twitter: "",
      telegram: "",
      website: "",
      initialBuy: 0.1,
      slippage: 5,
      priorityFee: 0.001,
    },
  });

  // Update form when initialData changes (when token is copied)
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData?.name || "",
        symbol: initialData?.symbol || "",
        description: initialData?.description || "",
        imageUrl: initialData?.imageUrl || "",
        twitter: initialData?.twitter || "",
        telegram: initialData?.telegram || "",
        website: initialData?.website || "",
        initialBuy: initialData?.initialBuy || 0.1,
        slippage: initialData?.slippage || 5,
        priorityFee: initialData?.priorityFee || 0.001,
      });
    }
  }, [initialData, form]);

  const launchMutation = useMutation({
    mutationFn: async (data: LaunchTokenRequest) => {
      return await apiRequest("POST", "/api/launch", data);
    },
    onSuccess: (data) => {
      if (data.success) {
        setLaunchResult({
          tokenAddress: data.tokenAddress,
          signature: data.signature,
        });
        toast({
          title: "Token Launched Successfully!",
          description: `Token address: ${data.tokenAddress?.slice(0, 8)}...`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Launch Failed",
          description: data.error || "Unknown error occurred",
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Launch Failed",
        description: error.message || "Failed to launch token",
      });
    },
  });

  const onSubmit = (data: LaunchTokenRequest) => {
    launchMutation.mutate(data);
  };

  if (launchResult) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Token Launched! 🎉</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your token has been successfully created on pump.fun
            </p>
          </div>
          
          {launchResult.tokenAddress && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <p className="text-xs text-muted-foreground">Token Address</p>
              <p className="font-mono text-sm break-all">{launchResult.tokenAddress}</p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                asChild
              >
                <a
                  href={`https://pump.fun/coin/${launchResult.tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Pump.fun
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            </div>
          )}

          {launchResult.signature && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <p className="text-xs text-muted-foreground">Transaction Signature</p>
              <p className="font-mono text-xs break-all">{launchResult.signature}</p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                asChild
              >
                <a
                  href={`https://solscan.io/tx/${launchResult.signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Solscan
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            </div>
          )}

          <Button
            onClick={() => {
              setLaunchResult(null);
              form.reset();
            }}
            variant="outline"
            className="w-full"
            data-testid="button-launch-another"
          >
            Launch Another Token
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Launch New Token</h2>
        <p className="text-sm text-muted-foreground">
          Configure your token details and launch on pump.fun
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Token" {...field} data-testid="input-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Symbol</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="MAT" 
                      {...field} 
                      className="uppercase"
                      data-testid="input-symbol"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your token..."
                    className="min-h-20"
                    {...field}
                    data-testid="input-description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://example.com/token-image.png" 
                    {...field} 
                    data-testid="input-image"
                  />
                </FormControl>
                <FormDescription>
                  Direct link to your token image (PNG, JPG, or GIF)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Social Links (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter</FormLabel>
                    <FormControl>
                      <Input placeholder="https://twitter.com/..." {...field} data-testid="input-twitter" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telegram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telegram</FormLabel>
                    <FormControl>
                      <Input placeholder="https://t.me/..." {...field} data-testid="input-telegram" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} data-testid="input-website" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Launch Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="initialBuy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Buy (SOL)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        data-testid="input-initial-buy"
                      />
                    </FormControl>
                    <FormDescription>0.01 - 10 SOL</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slippage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slippage (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        data-testid="input-slippage"
                      />
                    </FormControl>
                    <FormDescription>1 - 50%</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priorityFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority Fee (SOL)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        data-testid="input-priority-fee"
                      />
                    </FormControl>
                    <FormDescription>0.0001 - 0.01</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={launchMutation.isPending}
            data-testid="button-launch-token"
          >
            {launchMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Launch Token on Pump.fun
              </>
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
