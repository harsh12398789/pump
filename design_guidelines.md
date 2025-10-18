# Design Guidelines: Pump.fun Coin Copy Tool

## Design Approach
**System**: Material Design + Crypto Exchange Interface Patterns
**References**: Pump.fun (familiarity), Dexscreener (data density), Uniswap (clean functionality)
**Principle**: Fast, functional, data-first interface optimized for quick scanning and one-click actions

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary)**
- Background: 220 15% 8% (deep navy-black)
- Surface: 220 13% 12% (elevated cards)
- Surface Elevated: 220 12% 16% (hover states)
- Primary: 142 76% 56% (vibrant green - success/launch action)
- Text Primary: 0 0% 98%
- Text Secondary: 220 9% 65%
- Border: 220 13% 20%
- Accent: 271 76% 63% (purple for new/live indicators)
- Warning: 25 95% 53% (orange for attention)

**Light Mode**
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Primary: 142 71% 45%
- Text Primary: 220 15% 12%
- Text Secondary: 220 9% 45%

### B. Typography
**Fonts**: Inter (primary), JetBrains Mono (addresses/tickers)

**Hierarchy**:
- Page Title: text-2xl font-bold tracking-tight
- Section Headers: text-lg font-semibold
- Coin Name: text-base font-semibold
- Ticker: text-sm font-mono uppercase tracking-wider
- Metadata: text-xs text-secondary
- Action Buttons: text-sm font-medium

### C. Layout System
**Spacing Units**: 2, 4, 6, 8, 12, 16 (Tailwind units)
- Card padding: p-6
- Section spacing: space-y-8
- Row gaps: gap-4
- Container: max-w-7xl mx-auto px-4

**Grid**: 12-column grid for responsive coin cards
- Desktop: grid-cols-3 (3 coins per row)
- Tablet: grid-cols-2
- Mobile: grid-cols-1

### D. Component Library

**Navigation Bar**
- Fixed top position with backdrop blur
- Height: h-16
- Contains: Logo, "Latest Coins" title, Live indicator badge, Settings icon
- Style: Dark surface with subtle border-b

**Coin Cards** (Primary Component)
- Compact card design optimizing vertical space
- Layout: Horizontal split - Left (coin image 80x80), Right (details + actions)
- Border: 1px border with subtle hover glow effect
- Sections within card:
  - Image: Rounded-lg, object-cover
  - Header: Name (bold) + Ticker (mono, muted)
  - Metadata: Market cap, Time since launch (text-xs)
  - Social Links: Icon row (Twitter, Telegram, Website) - horizontal flex
  - Action: Large "Copy & Launch" button (full-width, primary color)

**Status Indicators**
- "LIVE" pill badge (purple background, small, animated pulse)
- "NEW" badge for coins < 5 minutes old
- Position: Top-right of coin cards

**Action Buttons**
- Primary: bg-primary with ring-2 focus, h-10, rounded-lg
- Icon buttons for social links: w-8 h-8 rounded, hover:bg-surface-elevated
- Copy button: Prominent, includes rocket icon, shows loading state

**Data Table** (Alternative View)
- Striped rows for readability
- Columns: Image, Name/Ticker, Market Cap, Age, Socials, Action
- Sticky header
- Mobile: Collapses to cards

**Loading States**
- Skeleton cards with pulse animation
- Spinner for button actions
- Progress indicator for API calls

**Toast Notifications**
- Position: top-right
- Types: Success (green), Error (red), Info (blue)
- Auto-dismiss: 4 seconds
- Shows: "Copied successfully", "Launching...", "Error: [message]"

### E. Layout Structure

**Main View**
- Header bar (fixed)
- Filter bar: Timeframe selector (Last 1h, 24h, 7d), Sort dropdown
- Coin grid/list: Scrollable, auto-updates every 10s
- Footer: Last updated timestamp

**Empty States**
- Large icon, "No new coins found", "Check back soon" message
- Retry button

**Responsive Behavior**
- Desktop: 3-column grid, full feature set
- Tablet: 2-column grid, condensed metadata
- Mobile: Single column, stacked layout, bottom action bar

## Interaction Patterns

**Copy & Launch Flow**
1. Click button → Loading spinner in button
2. Show confirmation toast
3. Button becomes "Launching..." with progress
4. Success/Error toast appears
5. Button resets to ready state

**Real-time Updates**
- New coins slide in from top with subtle animation
- Live badges pulse every 2s
- Auto-scroll disabled when user is actively browsing

**Hover States**
- Cards: Subtle elevation increase, border glow
- Buttons: Brightness increase, scale 1.02
- Social icons: Background color change

## Images
No hero image needed - this is a utility dashboard.

**Coin Images**: 80x80px, rounded-lg, sourced from pump.fun API
- Fallback: Gradient placeholder with ticker initial
- Loading: Shimmer skeleton

## Performance Optimizations
- Virtual scrolling for 100+ coins
- Image lazy loading
- Debounced search/filter
- Optimistic UI updates