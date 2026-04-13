import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker
  output: "standalone",

  // Optimize imports
  experimental: {
    optimizePackageImports: ["@solana/web3.js", "@solana/spl-token"],
  },

  // Public env vars
  env: {
    NEXT_PUBLIC_APP_NAME: "WaboTrader",
    NEXT_PUBLIC_APP_VERSION: "1.0.0",
  },

  // CORS headers for ElizaOS API routes
  async headers() {
    return [
      {
        source: "/api/eliza/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },

  // Disable strict validation during Docker build
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    unoptimized: true,
  },

  // Required for @solana/web3.js in Next.js
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
