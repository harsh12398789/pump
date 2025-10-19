import { z } from "zod";

// Token data from PumpPortal WebSocket
export interface PumpFunToken {
  mint: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  uri?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  marketCapSol?: number;
  timestamp: number;
  creator?: string;
  initialBuy?: number;
}

// Token launch request schema
export const launchTokenSchema = z.object({
  name: z.string().min(1, "Token name is required").max(32, "Name too long"),
  symbol: z.string().min(1, "Symbol is required").max(10, "Symbol too long").toUpperCase(),
  description: z.string().max(500, "Description too long").optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
  website: z.string().optional(),
  initialBuy: z.number().min(0.01, "Minimum 0.01 SOL").max(10, "Maximum 10 SOL").default(0.1),
  slippage: z.number().min(1).max(50).default(5),
  priorityFee: z.number().min(0.0001).max(0.01).default(0.001),
});

export type LaunchTokenRequest = z.infer<typeof launchTokenSchema>;

// Token launch response
export interface LaunchTokenResponse {
  success: boolean;
  tokenAddress?: string;
  signature?: string;
  error?: string;
}

// WebSocket message types
export interface WSMessage {
  type: 'token' | 'error' | 'connected';
  data?: PumpFunToken;
  error?: string;
}
