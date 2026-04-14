# 🤖 WaboTrader: Your Autonomous Solana Trading Sentinel

Let's be honest: surviving in the Solana ecosystem is exhausting. The volatility is 24/7, opportunities appear and vanish in microseconds, and the constant fear of getting rugged or crushed by slippage makes manual trading a nightmare. And while standard trading bots offer a bit of relief, they're generally rigid and dumb—they just stubbornly execute predefined rules without ever actually "reading" the room context or adapting to shifting market sentiment.

**WaboTrader is built to fix this.**

Powered by ElizaOS and designed to run natively on the decentralized Nosana GPU Network, WaboTrader isn't just a script; it's an agentic, non-custodial trading partner. Operating on a continuous OODA (Observe, Orient, Decide, Act) loop, it autonomously scans on-chain order books, synthesizes social sentiment via prediction markets, and executes Jupiter-optimized swaps with strict slippage controls.

No custodial risk. No centralized points of failure. Just continuous, sentient alpha.

---

## ⚡ What Makes It Tick?

- **Dynamic Strategy Architect:** WaboTrader doesn't rely on static configs. It analyzes current Solana volatility to suggest and autogenerate Momentum, DCA, or Arbitrage strategies.
- **Pre-execution Backtesting:** Before risking your capital on a new strategy, it rigorously backtests the logic across the last 30 days of historical volume.
- **Prediction Market Intuition:** It leverages crowd wisdom. WaboTrader can create, monitor, and yield-farm YES/NO outcome shares based strict on-chain verifiable truths (turning social hype into measurable profits).
- **Omni-Channel Access:** Control your agent via the sleek Next.js UI, or manage your portfolio entirely from the Telegram Bot while on the go.
- **Truly Non-Custodial:** WaboTrader embraces "Blinks" (Transaction Links). We never hold your funds; you manage your keys, you sign the transactions.

**[Watch the Demo on YouTube](https://youtu.be/8LwPUNubGVY)**

---

## 🛠 Getting Started (The Real Guide)

Look, setting up autonomous AI agents can be finicky. I've documented exactly how we build, test, and deploy this stack so you don't have to guess.

### Prerequisites

Before you start throwing commands at your terminal, make sure you've got the essentials:

- **Node.js 20+** and **pnpm 10+** (Seriously, use `pnpm`, it handles the workspace and ElizaOS dependencies substantially better).
- **Solana CLI** (Highly recommended for securely generating burner keys without pasting them into random web apps).
- **Ollama** (Required only if you want to run the LLM compute locally instead of deploying to Nosana).

### 1. Repository Setup

First things first, clone the repo and pull down the packages:

```bash
git clone https://github.com/kephothoX/WaboTrader.git
cd WaboTrader
pnpm install
```

### 2. Environment Configuration

WaboTrader's brain is configured via the `.env` file. Do not skip this step.

```bash
cp .env.example .env
```

Open up `.env` in your editor. Here are the variables you actually need to care about:

- **`TELEGRAM_BOT_TOKEN`**: Chat up BotFather on Telegram to grab this. It's required if you want mobile access to your agent.
- **`OLLAMA_API_URL`**: If you're running locally, use `http://127.0.0.1:11434/api`. If you are deploying, point this to your Nosana endpoint.
- **`MODEL_NAME_AT_ENDPOINT`**: Typically `qwen3:8b`. We found it hits the absolute sweet spot for fast logic reasoning on consumer/standard GPUs.
- **`SOLANA_PRIVATE_KEY`**: Base58 encoded. **PSA: Do not use your main saving wallet.** Generate a fresh burner `solana-keygen new`, send it a tiny bit of SOL, and use that.
- **`TRADE_SIMULATION_MODE`**: Set to `true` while you're learning the ropes. WaboTrader will do everything but sign the final Jupiter transaction.
- **`PERPLEXITY_API_KEY`**: Grab one from Perplexity. We use Sonar Reasoning for high-level market intel.

### 3. Local Development & Testing

WaboTrader spins up two primary processes: the Next.js React frontend and the ElizaOS background runtime.

If running the LLM locally, ensure Ollama is serving the model first:

```bash
ollama pull qwen3:8b
ollama serve
```

Next, boot the actual application. We use `concurrently` to launch both the UI and the Agent under one command:

```bash
pnpm dev
```

Wait a few seconds, and your dashboard will be live at `http://localhost:3000`.

**Pre-Deployment Checks:**
Before you think about deploying, verify your Typescript strictness and Next.js builds. Solana packages combined with React 19 types can be temperamental. If it passes here, it'll pass in Docker.

```bash
pnpm lint
pnpm build
```

---

## 🐳 Containerizing with Docker

Once your local tests are green, it's time to build the container. We use Next.js standalone mode to keep the image size slim and secure. This guarantees your local code behaves exactly the same way in the decentralized network.

```bash
# Compile the standalone image (grab coffee, this takes a minute)
docker build -t wabotrader:latest .

# Run it locally to make sure it didn't break during containerization
docker run -p 3000:3000 \
  -e OLLAMA_API_URL=http://host.docker.internal:11434/api \
  -e TRADE_SIMULATION_MODE=true \
  wabotrader:latest
```

---

## 🌐 Deploying to the Nosana Network

This is the end-game. Taking WaboTrader off your local machine and dropping it onto Nosana's decentralized compute grid.

### Step 1: Push Your Image

Nosana's nodes need to know where to pull your code from. Push your local, tested image to a public Docker Hub repository (or an accessible private one).

```bash
docker tag wabotrader:latest your-dockerhub/wabotrader:latest
docker push your-dockerhub/wabotrader:latest
```

### Step 2: Set Up Nosana CLI

If you haven't yet, you need to install the Nosana CLI toolkit. You will also need a Solana wallet loaded with a little SOL (for gas) and NOS tokens (to pay for the computing power).

```bash
npm install -g @nosana/cli

# Ensure your CLI is pointing to a wallet that actually has funds
solana config set --keypair ~/.config/solana/id.json
```

### Step 3: Configure the Job Definition

Open up `nos_job_def/wabotrader_nosana_job.json`.

- Find the `image` field and change it to point at the docker tag you just pushed (`your-dockerhub/wabotrader:latest`).
- **Crucial Security Note:** Make sure you encrypt your environment variables! The Nosana CLI allows you to pass secrets securely. _Never_ post a job with your plaintext private key in the JSON file.

### Step 4: Fire it Up

Find a currently active market via Nosana's docs or their Discord, and throw the job into the queue:

```bash
nosana job post --file nos_job_def/wabotrader_nosana_job.json --market <MARKET_ADDRESS>
```

The CLI will spit out a Job ID. Throw that into the [Nosana Explorer](https://explorer.nosana.io/), watch the node pick up your image, and grab your public IP once it binds.

---

## 💬 Interacting with WaboTrader

### 📱 Telegram Bot Commands

Your mobile command center. Start a chat with your bot and try these:

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

### 🤖 Chat Prompts (Web UI)

If you're using the browser dashboard, you can speak to the agent organically:

- _"Analyze the current liquidity pool for BONK."_
- _"Generate a 30-day arbitrage strategy for SOL/USDC and run a backtest."_
- _"Create a prediction market: Will Solana hit $200 by Friday?"_

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

## 📁 Repository Map

If you want to poke around the codebase, here's where everything lives:

```text
src/
├── app/                  # Next.js 15 Frontend Pages & Routing
│   ├── api/eliza/        # Bridging endpoints between UI and Agent
│   ├── strategies/       # The strategy architecture UI
│   └── globals.css       # Because default styles are boring
├── components/           # Reusable React UI Blocks (Chat, Dashboards, Charts)
└── eliza/                # The Brains
    ├── character.ts      # Defines WaboTrader's personality and prompt injection
    ├── index.ts          # Core Runtime Initialization
    └── plugins/          # Solana swaps, Strategy logic, Markets
```

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

## 🏆 Nosana x ElizaOS

- **Framework:** ElizaOS v2 (character, plugins, actions, providers, evaluators)
- **Deployment:** Nosana decentralized GPU network
- **Model:** Qwen3:8b via Ollama on Nosana GPU
- **Blockchain:** Solana mainnet-beta via Jupiter Aggregator

---

## 📄 Licensing

WaboTrader is open-sourced under the MIT License. See [LICENSE](./LICENSE) for details. Let's stop bleeding alpha to MEV bots and take control back.
