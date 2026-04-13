# syntax=docker/dockerfile:1
# WaboTrader — Solana Trading Agent on Nosana

# Grab the official Ollama binary directly to avoid curl network drops
FROM ollama/ollama:latest AS ollama-base

FROM node:lts AS build

RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ollama-base /usr/bin/ollama /usr/local/bin/ollama

RUN corepack enable

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Disable telemetry
ENV DISABLE_TELEMETRY=true
ENV DO_NOT_TRACK=1
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY pnpm-lock.yaml ./
RUN --mount=type=cache,target=/pnpm/store \
  pnpm fetch --frozen-lockfile

COPY package.json ./
RUN --mount=type=cache,target=/pnpm/store \
  pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm build

# ── Runtime ─────────────────────────────────
FROM node:lts-slim AS runtime

RUN apt-get update && apt-get install -y \
    curl \
    bash \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ollama-base /usr/bin/ollama /usr/local/bin/ollama

WORKDIR /app

# Ensure correct standalone static handling
# Copy the public files directly
COPY --from=build /app/public ./public
# Copy the standalone output (this contains server.js natively)
COPY --from=build /app/.next/standalone ./
# Copy the static assets into the standalone .next folder so Next.js can serve them
COPY --from=build /app/.next/static ./.next/static

# Startup script
RUN cat > /app/start-wabotrader.sh << 'EOF'
#!/bin/bash
set -e

echo "═══════════════════════════════════════════"
echo "  🤖 WaboTrader — Solana Trading Agent"
echo "  🌐 Powered by ElizaOS on Nosana GPU"
echo "═══════════════════════════════════════════"

# Start Ollama if OLLAMA_API_URL points to localhost
if echo "${OLLAMA_API_URL:-}" | grep -q "localhost\|127.0.0.1"; then
  echo "📡 Starting local Ollama server..."
  # Run in background
  ollama serve &
  
  echo "⏳ Waiting for Ollama..."
  timeout=60
  while [ $timeout -gt 0 ] && ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
    sleep 1
    timeout=$((timeout-1))
  done

  if [ $timeout -gt 0 ]; then
    echo "📥 Nosana GPU Models detected. Engine is ready."
    # We explicitly DO NOT run 'ollama pull' here anymore. 
    # Nosana natively pre-mounts the models into /root/.ollama as a read-only volume.
  else
    echo "⚠️  Ollama timeout — server failed to start or using remote endpoint"
  fi
else
  echo "🌐 Using remote Ollama endpoint: ${OLLAMA_API_URL}"
fi

echo "🚀 Starting WaboTrader Next.js standalone server..."
# Run the node app using the standalone server, explicitly binding to 0.0.0.0
HOST=0.0.0.0 exec node server.js
EOF

RUN chmod +x /app/start-wabotrader.sh

ENV NODE_ENV=production \
    NODE_OPTIONS="--enable-source-maps" \
    HOST="0.0.0.0" \
    HOSTNAME="0.0.0.0" \
    OLLAMA_HOST="0.0.0.0:11434" \
    PORT=3000 \
    TRADE_SIMULATION_MODE=true \
    SOLANA_NETWORK=mainnet-beta \
    SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

EXPOSE 3000 11434

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/eliza/agents || exit 1

ENTRYPOINT ["/app/start-wabotrader.sh"]
