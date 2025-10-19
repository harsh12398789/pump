import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { Connection, Keypair, PublicKey, VersionedTransaction, sendAndConfirmTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import axios from "axios";
import { launchTokenSchema, type LaunchTokenRequest, type LaunchTokenResponse, type WSMessage, type PumpFunToken } from "@shared/schema";

const PUMPPORTAL_WS_URL = "wss://pumpportal.fun/api/data";
const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for client connections
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Connect to PumpPortal WebSocket
  let pumpPortalWs: WebSocket | null = null;
  const clients = new Set<WebSocket>();

  function connectToPumpPortal() {
    console.log("Connecting to PumpPortal WebSocket...");
    pumpPortalWs = new WebSocket(PUMPPORTAL_WS_URL);

    pumpPortalWs.on("open", () => {
      console.log("Connected to PumpPortal");
      
      // Subscribe to new token launches
      pumpPortalWs?.send(JSON.stringify({
        method: "subscribeNewToken"
      }));

      // Send connection confirmation to all clients
      const message: WSMessage = {
        type: 'connected'
      };
      broadcastToClients(JSON.stringify(message));
    });

    pumpPortalWs.on("message", async (data) => {
      try {
        const tokenData = JSON.parse(data.toString());
        
        // Skip subscription confirmation messages
        if (tokenData.message) {
          console.log("PumpPortal:", tokenData.message);
          return;
        }
        
        console.log("New token:", tokenData.name, tokenData.symbol);
        
        // Create initial token object without metadata
        const token: PumpFunToken = {
          mint: tokenData.mint || tokenData.signature || "",
          name: tokenData.name || "Unknown Token",
          symbol: tokenData.symbol || "???",
          description: undefined,
          image: undefined,
          uri: tokenData.uri,
          twitter: undefined,
          telegram: undefined,
          website: undefined,
          marketCapSol: tokenData.marketCapSol || tokenData.initialBuy,
          timestamp: Date.now(),
          creator: tokenData.creator || tokenData.traderPublicKey,
          initialBuy: tokenData.initialBuy,
        };

        // Broadcast initial token immediately
        const message: WSMessage = {
          type: 'token',
          data: token
        };
        broadcastToClients(JSON.stringify(message));
        
        // Fetch metadata asynchronously without blocking
        if (tokenData.uri) {
          (async () => {
            try {
              const metadataResponse = await axios.get(tokenData.uri, { 
                timeout: 10000,
                headers: { 'Accept': 'application/json' }
              });
              const metadata = metadataResponse.data;
              
              // Update token with metadata and broadcast again
              token.description = metadata.description;
              token.image = metadata.image;
              token.twitter = metadata.twitter;
              token.telegram = metadata.telegram;
              token.website = metadata.website;
              
              const updateMessage: WSMessage = {
                type: 'token',
                data: token
              };
              broadcastToClients(JSON.stringify(updateMessage));
              console.log("Updated", token.name, "with metadata");
            } catch (err) {
              console.log("Could not fetch metadata for", token.name);
            }
          })();
        }
      } catch (error) {
        console.error("Error parsing PumpPortal message:", error);
      }
    });

    pumpPortalWs.on("error", (error) => {
      console.error("PumpPortal WebSocket error:", error);
    });

    pumpPortalWs.on("close", () => {
      console.log("PumpPortal connection closed, reconnecting in 5s...");
      setTimeout(connectToPumpPortal, 5000);
    });
  }

  function broadcastToClients(message: string) {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Start PumpPortal connection
  connectToPumpPortal();

  // Handle client WebSocket connections
  wss.on("connection", (ws) => {
    console.log("Client connected");
    clients.add(ws);

    // Send connection confirmation
    const message: WSMessage = {
      type: 'connected'
    };
    ws.send(JSON.stringify(message));

    ws.on("close", () => {
      console.log("Client disconnected");
      clients.delete(ws);
    });

    ws.on("error", (error) => {
      console.error("Client WebSocket error:", error);
    });
  });

  // API endpoint to launch a token
  app.post("/api/launch", async (req, res) => {
    try {
      // Validate request body
      const validationResult = launchTokenSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: validationResult.error.errors[0].message
        });
      }

      const launchData: LaunchTokenRequest = validationResult.data;

      // Get private key from environment
      const privateKeyString = process.env.SOLANA_PRIVATE_KEY;
      if (!privateKeyString) {
        return res.status(500).json({
          success: false,
          error: "Solana private key not configured"
        });
      }

      // Decode private key
      let keypair: Keypair;
      try {
        // Try base58 decoding first
        const privateKeyBytes = bs58.decode(privateKeyString);
        keypair = Keypair.fromSecretKey(privateKeyBytes);
      } catch {
        try {
          // Try as array of numbers
          const privateKeyArray = JSON.parse(privateKeyString);
          keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
        } catch {
          return res.status(500).json({
            success: false,
            error: "Invalid private key format"
          });
        }
      }

      console.log("Launching token with data:", launchData);
      console.log("Using wallet:", keypair.publicKey.toBase58());

      // Generate a new mint keypair for the token
      const mintKeypair = Keypair.generate();
      console.log("Generated mint address:", mintKeypair.publicKey.toBase58());

      // Step 1: Upload metadata to pump.fun IPFS
      let metadataUri: string;
      
      try {
        // If we have an image URL, fetch it and upload to IPFS
        if (launchData.imageUrl) {
          try {
            // Fetch the image
            const imageResponse = await axios.get(launchData.imageUrl, {
              responseType: 'arraybuffer',
              timeout: 10000
            });

            const FormData = (await import('form-data')).default;
            const formData = new FormData();
            
            // Add image file
            formData.append('file', Buffer.from(imageResponse.data), {
              filename: 'token-image.png',
              contentType: imageResponse.headers['content-type'] || 'image/png'
            });
            
            // Add metadata fields
            formData.append('name', launchData.name);
            formData.append('symbol', launchData.symbol);
            formData.append('description', launchData.description || '');
            formData.append('twitter', launchData.twitter || '');
            formData.append('telegram', launchData.telegram || '');
            formData.append('website', launchData.website || '');
            formData.append('showName', 'true');

            // Upload to pump.fun IPFS
            const ipfsResponse = await axios.post('https://pump.fun/api/ipfs', formData, {
              headers: formData.getHeaders(),
              timeout: 30000
            });

            metadataUri = ipfsResponse.data.metadataUri;
            console.log("Metadata uploaded to IPFS:", metadataUri);
          } catch (imageError: any) {
            console.warn("Failed to upload image to IPFS, using text-only metadata:", imageError.message);
            // Fall back to creating metadata without image
            const FormData = (await import('form-data')).default;
            const formData = new FormData();
            
            formData.append('name', launchData.name);
            formData.append('symbol', launchData.symbol);
            formData.append('description', launchData.description || '');
            formData.append('twitter', launchData.twitter || '');
            formData.append('telegram', launchData.telegram || '');
            formData.append('website', launchData.website || '');
            formData.append('showName', 'true');

            const ipfsResponse = await axios.post('https://pump.fun/api/ipfs', formData, {
              headers: formData.getHeaders(),
              timeout: 30000
            });

            metadataUri = ipfsResponse.data.metadataUri;
          }
        } else {
          // No image, create text-only metadata
          const FormData = (await import('form-data')).default;
          const formData = new FormData();
          
          formData.append('name', launchData.name);
          formData.append('symbol', launchData.symbol);
          formData.append('description', launchData.description || '');
          formData.append('twitter', launchData.twitter || '');
          formData.append('telegram', launchData.telegram || '');
          formData.append('website', launchData.website || '');
          formData.append('showName', 'true');

          const ipfsResponse = await axios.post('https://pump.fun/api/ipfs', formData, {
            headers: formData.getHeaders(),
            timeout: 30000
          });

          metadataUri = ipfsResponse.data.metadataUri;
          console.log("Text-only metadata uploaded to IPFS:", metadataUri);
        }
      } catch (metadataError: any) {
        console.error("Failed to upload metadata to IPFS:", metadataError.message);
        return res.status(500).json({
          success: false,
          error: `Failed to upload metadata: ${metadataError.message}`
        });
      }

      // Step 2: Create token via PumpPortal API
      try {
        const createResponse = await axios.post('https://pumpportal.fun/api/trade-local', {
          publicKey: keypair.publicKey.toBase58(),
          action: 'create',
          tokenMetadata: {
            name: launchData.name,
            symbol: launchData.symbol,
            uri: metadataUri
          },
          mint: mintKeypair.publicKey.toBase58(),
          denominatedInSol: 'true',
          amount: launchData.initialBuy,
          slippage: launchData.slippage,
          priorityFee: launchData.priorityFee,
          pool: 'pump'
        }, {
          responseType: 'arraybuffer',
          timeout: 30000
        });

        // Deserialize transaction
        const txBuffer = Buffer.from(createResponse.data);
        const transaction = VersionedTransaction.deserialize(new Uint8Array(txBuffer));

        // Sign with both keypairs (wallet and mint)
        transaction.sign([keypair, mintKeypair]);

        // Connect to Solana
        const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

        // Send transaction
        const signature = await connection.sendTransaction(transaction);

        console.log("Token created successfully!");
        console.log("Signature:", signature);
        console.log("Mint address:", mintKeypair.publicKey.toBase58());

        const response: LaunchTokenResponse = {
          success: true,
          tokenAddress: mintKeypair.publicKey.toBase58(),
          signature: signature,
        };

        res.json(response);
      } catch (apiError: any) {
        console.error("PumpPortal API error:", apiError.response?.data || apiError.message);
        
        // If API fails, return a helpful error message
        return res.status(500).json({
          success: false,
          error: `Failed to create token via PumpPortal: ${apiError.message}. Please ensure you have sufficient SOL in your wallet and the PumpPortal API is available.`
        });
      }
    } catch (error) {
      console.error("Error launching token:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to launch token"
      });
    }
  });

  return httpServer;
}
