# 🤖 WaboTrader: The Sentient Vanguard Revolutionizing Solana Trading

In the high-octane world of cryptocurrency trading, particularly on Solana's lightning-fast blockchain, traders face monumental challenges. Complex on-chain data overwhelms even seasoned pros, with 24/7 market volatility, fleeting alpha opportunities, and the constant threat of slippage or poor execution leading to capital erosion. Traditional bots are rigid, lacking intuition—they execute predefined rules without adaptation, backtesting, or foresight into sentiment-driven moves like prediction markets. Manual trading? It's exhausting, error-prone, and misses microseconds of edge in Solana's memecoin frenzy and DeFi surges. Custodial risks compound the pain, exposing funds to hacks or downtime.

Enter WaboTrader, the autonomous, agentic, non-custodial sentinel built to obliterate these barriers. Powered by ElizaOS and deployed on the decentralized Nosana GPU Network, WaboTrader is a sentient trading partner with a sharp, protective personality. Operating on an OODA loop (Observe, Orient, Decide, Act), it pulses 24/7, scanning Solana for hidden alpha: real-time token analysis (price, volume, liquidity, risk), predictive trade recommendations (buy/sell/hold with precise entry/exit sizing), and seamless execution via Jupiter Aggregator with built-in slippage shields.

What sets it apart? Autonomous Strategy Architecture: Dynamically generates Momentum, Arbitrage, or DCA strategies based on volatility, backtests them over 30 days of historical data, self-optimizes to slash drawdowns, and activates on command—all non-custodial, with simulation mode for risk-free testing. Dive into Prediction Market Intuition: It synthesizes crowd wisdom, farms YES/NO yields, and resolves outcomes strictly via verified on-chain truth, turning social hype into profits.

Accessible via intuitive web dashboard, conversational AI chat, or Telegram bot (commands like **/strategy**, **/movers**, **/create_market**), it integrates Perplexity AI for market intel and displays live wallet balances. Security-first: Env-loaded keys, Blinks for signatures, no hardcoding. Deploy locally, Docker, or Nosana for decentralized power using Qwen3:8b LLM.

WaboTrader solves the trader's trilemma—speed, smarts, safety—empowering retail and pros to conquer Solana without the grind. Clone, config, and unleash your vanguard today. The future of trading thinks, acts, and wins for you.

**Autonomous | Agentic | Non-Custodial**

- [YouTube Demo](https://youtu.be/8LwPUNubGVY)
- [GitHub Repository](https://github.com/kephothoX/WaboTrader)

WaboTrader is not just a tool; it's a **sentient trading partner** designed to bridge the gap between complex on-chain data and profitable market execution. Operating on an autonomous **OODA (Observe, Orient, Decide, Act)** loop, WaboTrader monitors the Solana pulse 24/7, identifying alpha before it reaches the surface.

Built with **ElizaOS** and hosted on the decentralized **Nosana GPU Network**, this agent possesses a distinct personality: analytical, proactive, and fiercely protective of its user's capital.

![WaboTrader Dashboard](./docs/screenshot.png)

---

## 🧠 The Agent's Consciousness

Unlike traditional bots, WaboTrader operates with a continuous stream of thoughts, alerts, and actions:

### 📈 Autonomous Strategy Architect

I don't just "run" strategies. I **architect** them.

- **Dynamic Generation**: I analyze market volatility to suggest Momentum, Arbitrage, or DCA structures tailored to the current SOL climate.
- **Real-Time Backtesting**: I simulate my own logic across 30 days of historical volume before recommending a live deployment.
- **Self-Optimization**: I constantly tweak parameters to minimize drawdown and maximize yield on the Nosana network.

### 🎯 Prediction Market Intuition

I look beyond the price charts into the future.

- **Crowd Wisdom Synthesis**: I create and monitor prediction markets to gauge social sentiment and future event probabilities.
- **Yield Farming**: I proactively manage your YES/NO positions to capitalize on resolving market outcomes.
- **On-Chain Truth**: I only resolve markets based on verified on-chain data, ensuring fair play and transparency.

---

## 🆕 Additional Features

| Feature                      | Description                                                 |
| ---------------------------- | ----------------------------------------------------------- |
| 📊 **Token Analysis**        | Real-time price, volume, liquidity, and risk scoring        |
| 💡 **Trade Recommendations** | Buy/sell/hold with entry/exit points and position sizing    |
| 💱 **Trade Execution**       | Swap tokens via Jupiter Aggregator with slippage protection |
| 💰 **Wallet Dashboard**      | Live SOL + SPL token balances with USD values               |
| 🧠 **ElizaOS Agent**         | Conversational interface with memory and context            |
| 📈 **Trading Strategies**    | AI-powered strategy generation, backtesting, execution      |
| 🎯 **Prediction Markets**    | Forecast events, trade outcomes, earn profits               |
| 🔍 **Market Research**       | Perplexity Sonar-Reasoning for real-time intelligence       |
| 🌐 **Telegram Bot**          | Full trading capabilities on mobile                         |
| 🧪 **Simulation Mode**       | Safe demo mode to test without real funds                   |

---

## 🎨 Brand Identity

The WaboTrader brand represents the **Stealth Vanguard** of the Solana ecosystem.

- **Aesthetic**: Cyber-obsidian with neon accents
- **DNA**: Fast, secure, and fully autonomous
- **Visuals**: Modern glassmorphism with high-fidelity geometric optics

<p align="center">
  <img src="./public/images/logo.png" width="120" alt="Wabo Logo" />
  <img src="./public/images/app-icon.png" width="120" alt="Wabo App Icon" />
</p>

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+, pnpm 10+
- Solana CLI (optional, for wallet generation)
- Ollama (optional, for local LLM)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/wabotrader
cd wabotrader
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Telegram
TELEGRAM_BOT_TOKEN=...

# LLM — use Nosana endpoint or local Ollama
OLLAMA_API_URL=http://127.0.0.1:11434/api
MODEL_NAME_AT_ENDPOINT=qwen3:8b

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta
SOLANA_PRIVATE_KEY=      # base58 private key (optional)

# Trading Mode
TRADE_SIMULATION_MODE=true  # Set to false for live trades

# Market Intelligence
PERPLEXITY_API_KEY=pplx-...
```

### 3. Run Locally

```bash
# Start with local Ollama (pull model first)
ollama pull qwen3:8b
ollama serve

# Start the app
pnpm dev
```

Open **http://localhost:3000**

---

## 💬 Usage

### 🤖 AI Chat Commands

```
You: analyze SOL
You: check BONK
You: recommend a trade on SOL
You: swap 1 SOL for USDC
You: show my balance
```

### 📈 Trading Strategies Commands

```
You: generate a momentum strategy for SOL
You: backtest my strategy for 30 days
You: optimize strategy xyz
You: activate strategy abc
You: show my strategies
You: browse the marketplace
```

### 🎯 Prediction Markets Commands

```
You: create a market: Will SOL reach $200 by end of 2024?
You: show me trending markets
You: buy YES shares in market xyz
You: show my positions
You: resolve market xyz as YES
```

---

## 📱 Telegram Bot Commands

Our Telegram bot brings full trading capabilities to your mobile device:

### Core & Sentinel Commands

| Command        | Description                                                                     |
| -------------- | ------------------------------------------------------------------------------- |
| `/app`         | 🌐 **Mini App**: Launch the **Live Ticker header** and Proactive Command Center |
| `/ticker`      | 📡 **Snapshot**: Get an instant price report of the top 3 live Solana movers    |
| `/subscribe`   | 🔔 **Pulse**: Opt-in to my real-time mental state and market breakout alerts    |
| `/unsubscribe` | 🔕 **Silence**: Stop receiving proactive agent pulses in this chat              |
| `/movers`      | 📊 **Movers**: Scan Solana for breaking alpha and positive momentum             |
| `/status`      | 📡 **Health**: Audit my internal sentience, win-rate, and performance           |
| `/perps`       | 🌎 **Perps**: View global volume dominance across all major perp protocols      |
| `/advice`      | 🧠 **Advisor**: Consult my strategic engine for a deep market orientation       |
| `/pay`         | 💰 **Transfers**: Approve or clear my queued autonomous solar payments          |
| `/setup`       | 🔑 **Signer**: Initialise your non-custodial autonomous execution wallet        |
| `/help`        | 🛡️ **Vanguard**: Access the full guide to my sentient capabilities              |

### Trading Intelligence Commands

| Command        | Parameters         | Description                                           |
| -------------- | ------------------ | ----------------------------------------------------- |
| `/strategy`    | `type risk token`  | 🎯 **Architect**: Generate a custom AI strategy       |
| `/backtest`    | `strategy_id days` | 📊 **Verify**: Run historical simulation              |
| `/strategies`  | -                  | 📋 **Portfolio**: Browse your strategies              |
| `/marketplace` | -                  | 🛒 **Marketplace**: Import elite community strategies |
| `/long`        | `token`            | 📈 **Bullish**: Open a managed 2x long position       |
| `/short`       | `token`            | 📉 **Bearish**: Open a managed 2x short position      |

### Prediction Market Commands

| Command          | Parameters                 | Description                                          |
| ---------------- | -------------------------- | ---------------------------------------------------- |
| `/markets`       | `category`                 | 🔍 **Explore**: Scan active prediction markets       |
| `/create_market` | `question`                 | 📝 **Creation**: Architect a new prediction event    |
| `/buy_shares`    | `market_id outcome amount` | 💰 **Stake**: Take a position in a market            |
| `/my_positions`  | -                          | 🎯 **Positions**: Manage your open prediction stakes |

---

## 🎯 Using the Web Interface

### Trading Strategies Page

Navigate to `/strategies` to access:

- **Generator**: Select strategy type, risk profile, and token to generate
- **Dashboard**: View all strategies, activate/deactivate them
- **Marketplace**: Browse and import community strategies

### Prediction Markets Page

Navigate to `/markets` to access:

- **Discover**: Browse markets by category, search, and sort
- **Create**: Ask a question, set resolution date, add liquidity
- **Trade**: Buy/sell YES or NO shares
- **Positions**: Manage your open positions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Next.js Frontend                   │
│   Main Dashboard │ Strategies │ Prediction Markets │
│   Telegram Bot  │  Chat UI    │  Wallet Dashboard  │
└───────────────────────┬─────────────────────────────┘
                         │ /api/eliza/*
┌───────────────────────▼─────────────────────────────┐
│              ElizaOS Agent Runtime                  │
│                                                     │
│  Character: WaboTrader                              │
│                                                     │
│  ┌──────────────────┐ ┌───────────────────────────┐ │
│  │ Solana Trading  │ │  Trading Strategies       │ │
│  │ Plugin          │ │  Plugin                    │ │
│  │                 │ │                            │ │
│  │ • ANALYZE       │ │  • GENERATE_STRATEGY       │ │
│  │ • RECOMMEND     │ │  • BACKTEST_STRATEGY       │ │
│  │ • EXECUTE       │ │  • OPTIMIZE_STRATEGY       │ │
│  │ • WALLET        │ │  • ACTIVATE_STRATEGY       │ │
│  └──────────────────┘ │  • PUBLISH_STRATEGY         │ │
│                     │                            │ │
│  ┌──────────────────┐ └───────────────────────────┘ │
│  │ Prediction      │                                │
│  │ Markets Plugin  │                                │
│  │                 │                                │
│  │ • CREATE_MARKET │                                │
│  │ • BUY_SHARES    │                                │
│  │ • RESOLVE       │                                │
│  │ • ANALYTICS     │                                │
│  └──────────────────┘                                │
└───────────────────────┬─────────────────────────────┘
                        │
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
  Jupiter API     Solana RPC      Perplexity AI
  (Quotes/Swaps)  (Balances)      (Research)
```

**Model:** Qwen3:8b via Ollama (Nosana GPU endpoint)
**Fallback:** Remote Nosana Ollama endpoint → OpenAI

---

## 🔒 Security

- **Simulation Mode** (`TRADE_SIMULATION_MODE=true`) is on by default
- Private keys are loaded from environment variables only — never hardcoded
- Slippage protection is always applied on live trades
- High price impact warnings trigger before execution
- All trades use **Blinks** (Transaction Links) — you sign in your wallet

---

## 🐳 Docker Deployment

```bash
# Build
docker build -t wabotrader:latest .

# Run locally
docker run -p 3000:3000 \
  -e OLLAMA_API_URL=https://<nosana-node>.node.k8s.prd.nos.ci/api \
  -e TRADE_SIMULATION_MODE=true \
  -e PERPLEXITY_API_KEY=pplx-... \
  wabotrader:latest
```

---

## 🌐 Nosana Deployment

### 1. Push Docker Image

```bash
docker tag wabotrader:latest yourusername/wabotrader:latest
docker push yourusername/wabotrader:latest
```

### 2. Update Job Definition

Edit `nos_job_def/wabotrader_nosana_job.json` — set your image name.

### 3. Deploy via Nosana CLI

```bash
npm install -g @nosana/cli
nosana job post --file nos_job_def/wabotrader_nosana_job.json --market 97G...
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/eliza/           # API routes
│   │   ├── chat/            # Chat API
│   │   ├── strategy/         # Strategy endpoints
│   │   └── markets/         # Market endpoints
│   ├── strategies/          # Strategies page
│   ├── markets/             # Markets page
│   ├── globals.css          # Solana dark theme
│   └── page.tsx             # Main dashboard
├── components/
│   ├── WaboTraderChat.tsx   # Chat interface
│   ├── WalletDashboard.tsx # Wallet display
│   ├── StrategyGenerator.tsx
│   ├── StrategyDashboard.tsx
│   ├── MarketDiscovery.tsx
│   ├── MarketTradingInterface.tsx
│   └── ...
└── eliza/
    ├── character.ts         # Agent personality + agents
    ├── index.ts             # Runtime bootstrap
    └── plugins/
        ├── solana-trading/  # Trading plugin
        ├── trading-strategies/ # Strategies plugin
        └── prediction-markets/ # Markets plugin
```

---

## 🏆 Nosana x ElizaOS

- **Framework:** ElizaOS v2 (character, plugins, actions, providers, evaluators)
- **Deployment:** Nosana decentralized GPU network
- **Model:** Qwen3:8b via Ollama on Nosana GPU
- **Blockchain:** Solana mainnet-beta via Jupiter Aggregator

---

## 📄 License

MIT — see [LICENSE](./LICENSE)
