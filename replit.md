# Pump.fun Token Monitor & Launcher

A real-time web application for monitoring newly launched tokens on pump.fun and quickly copying their details to launch similar tokens.

## Overview

This application provides a beautiful dashboard that:
- Monitors pump.fun token launches in real-time via WebSocket
- Displays token details including image, name, ticker, description, and social links
- Allows one-click copying of token details
- Enables launching new tokens on pump.fun with pre-filled data
- Features dark/light theme support

## Architecture

### Frontend (React + TypeScript)
- **Dashboard**: Main page showing real-time token feed
- **TokenCard**: Component displaying individual token details with copy button
- **LaunchForm**: Form for launching new tokens with pre-filled or custom data
- **ThemeProvider**: Dark/light mode theme management
- **WebSocket Client**: Real-time connection to backend for live updates

### Backend (Express + WebSocket)
- **WebSocket Server**: Maintains connections with frontend clients
- **PumpPortal Integration**: Connects to PumpPortal WebSocket API for token data
- **Token Launch API**: Endpoint for creating new tokens on Solana
- **Solana Integration**: Uses @solana/web3.js for blockchain interactions

### Data Flow
1. Backend connects to PumpPortal WebSocket API
2. New token events are received and transformed
3. Token data is broadcast to all connected clients
4. Frontend displays tokens in real-time
5. User clicks "Copy to Launch" on a token
6. Launch form is pre-filled with token details
7. User can modify and launch the token
8. Backend creates token transaction on Solana

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, WebSocket (ws)
- **Blockchain**: Solana (@solana/web3.js)
- **Real-time Data**: PumpPortal WebSocket API
- **State Management**: TanStack Query
- **Form Validation**: React Hook Form + Zod
- **Styling**: Tailwind CSS with custom design tokens

## Environment Variables

- `SOLANA_PRIVATE_KEY`: Base58-encoded Solana wallet private key for token launching

## Features

### Real-time Token Monitoring
- Live feed of new token launches from pump.fun
- Auto-updates every time a new token is created
- Shows up to 50 most recent tokens
- WebSocket auto-reconnection on disconnect

### Token Details Display
- Token image with fallback gradient
- Name and symbol
- Description
- Market cap (when available)
- Time since launch
- Social links (Twitter, Telegram, Website)
- Contract address

### One-Click Copy & Launch
- Copy button on each token card
- Pre-fills launch form with token details
- Smooth scroll to launch form
- Toast notifications for user feedback

### Token Launch Form
- Configurable token details (name, symbol, description, image)
- Social links (Twitter, Telegram, Website)
- Launch settings (initial buy, slippage, priority fee)
- Form validation with helpful error messages
- Loading states during transaction
- Success screen with token address and transaction signature
- Direct links to pump.fun and Solscan

### UI/UX Features
- Beautiful dark/light theme toggle
- Responsive design (mobile, tablet, desktop)
- Live connection status indicator
- Loading skeletons
- Empty states
- Smooth animations and transitions
- Accessible components

## Design System

### Colors
- **Primary**: Vibrant green (success/launch actions)
- **Accent**: Purple (new/live indicators)
- **Background**: Deep navy-black (dark) / White (light)
- **Text**: Three-level hierarchy (primary, secondary, tertiary)

### Typography
- **Primary Font**: Inter (clean, modern sans-serif)
- **Mono Font**: JetBrains Mono (addresses, tickers)

### Components
- Card-based layout for tokens
- Sticky header with status indicators
- Two-column layout (token feed + launch form)
- Consistent spacing and borders
- Hover effects and elevation

## API Endpoints

### WebSocket (`/ws`)
- Real-time token updates from PumpPortal
- Message types: `token`, `error`, `connected`

### POST `/api/launch`
Launch a new token on pump.fun

**Request Body:**
```json
{
  "name": "Token Name",
  "symbol": "SYMBOL",
  "description": "Optional description",
  "imageUrl": "https://...",
  "twitter": "https://twitter.com/...",
  "telegram": "https://t.me/...",
  "website": "https://...",
  "initialBuy": 0.1,
  "slippage": 5,
  "priorityFee": 0.001
}
```

**Response:**
```json
{
  "success": true,
  "tokenAddress": "...",
  "signature": "..."
}
```

## Development

The application uses:
- Vite for frontend development
- Express for backend API
- WebSocket for real-time communication
- In-memory storage (no database required)

## Notes

- The token launching functionality uses a simplified mock implementation
- In production, proper pump.fun SDK integration would be required
- Ensure wallet has sufficient SOL for transaction fees
- Token images must be publicly accessible URLs
- WebSocket connection auto-reconnects on disconnect
