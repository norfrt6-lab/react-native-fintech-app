# FinTrack - React Native Fintech App

A production-grade React Native fintech application built with Expo, TypeScript, and modern mobile architecture patterns. Features real-time cryptocurrency portfolio tracking, market data, trading simulation, biometric authentication, and offline-first data persistence.

## Features

- **Portfolio Dashboard** - Real-time portfolio value, P&L tracking, interactive charts, holdings breakdown with allocation percentages
- **Market Data** - 500+ cryptocurrencies via CoinGecko API, real-time prices, sparkline charts, search, watchlist management
- **Trading Simulation** - Market/limit/stop orders, fee calculation, order history, biometric trade confirmation
- **Transaction History** - Grouped by date, filterable, CSV export support
- **Biometric Authentication** - Face ID / Fingerprint with PIN fallback, auto-lock on inactivity
- **Offline-First** - MMKV persistence for all stores, works without network connectivity
- **Multi-Language** - English, Japanese, Chinese (i18n with react-i18next)
- **Dark Mode** - System-aware theme with manual light/dark/system toggle
- **Security** - Encrypted storage, balance hiding, screenshot prevention ready

## Tech Stack

| Technology | Purpose |
|---|---|
| Expo SDK 55 | Managed workflow, EAS Build |
| React Native 0.83 | Cross-platform mobile UI |
| TypeScript 5.x (strict) | Type safety |
| Expo Router v4 | File-based navigation with typed routes |
| Zustand + Immer | State management with immutable updates |
| MMKV | Ultra-fast encrypted key-value persistence |
| Axios | HTTP client with retry, rate-limit handling |
| i18next | Internationalization (EN, JA, ZH) |
| FlashList | High-performance virtualized lists |
| Reanimated 4 | 60fps animations |
| expo-local-authentication | Biometric auth |
| expo-secure-store | Secure credential storage |

## Architecture

```
app/                        # Expo Router - file-based navigation
  (auth)/                   # Auth flow (welcome, login, register)
  (tabs)/                   # Main tab navigator
    index.tsx               # Dashboard
    markets.tsx             # Market list
    trade.tsx               # Trade form
    activity.tsx            # Transaction history
    settings.tsx            # App settings
  coin/[id].tsx             # Coin detail page
  trade/[id].tsx            # Trade modal

src/
  api/                      # API layer (Axios client, market endpoints)
  store/                    # Zustand stores (auth, market, portfolio, trade, settings)
  types/                    # TypeScript interfaces (market, portfolio, trade, auth)
  lib/                      # Utilities (storage, formatters, constants, logger, i18n)
  ui/
    theme/                  # Design system (colors, spacing, typography, shadows)
    components/
      common/               # Reusable components (Button, Input, Card, Badge, etc.)
      market/               # Market-specific (CoinListItem, TimeRangeSelector)
      portfolio/            # Portfolio-specific (PortfolioCard, HoldingListItem)
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npx expo`)
- iOS Simulator (macOS) or Android Emulator

### Installation

```bash
git clone https://github.com/norfrt6-lab/react-native-fintech-app.git
cd react-native-fintech-app
npm install
```

### Development

```bash
# Start Expo dev server
npm start

# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

### Environment Variables

Create a `.env` file in the project root:

```env
COINGECKO_API_KEY=your_api_key_here  # Optional - free tier works without key
```

## Git Workflow

This project follows **Git Flow**:

```
main (production)
  └── dev (integration)
        ├── feat/project-scaffolding
        ├── feat/auth-system
        ├── feat/dashboard
        ├── feat/markets
        ├── feat/trading
        ├── feat/activity
        └── feat/settings
```

- Feature branches created from `dev`
- PRs merge features into `dev`
- `dev` merged to `main` for releases
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`

## API

This app uses the [CoinGecko API](https://www.coingecko.com/en/api) (free tier):

- `/coins/markets` - Market data with sparklines
- `/coins/{id}` - Coin detail
- `/coins/{id}/market_chart` - Price history
- `/coins/{id}/ohlc` - Candlestick data
- `/search` - Coin search
- `/search/trending` - Trending coins

## License

MIT
