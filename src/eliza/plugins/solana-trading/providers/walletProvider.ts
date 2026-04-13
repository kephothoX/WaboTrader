/**
 * Wallet Provider — Injects wallet state into agent context
 */
import { getSolanaService } from "../services/solanaService";

export const walletProvider = {
  name: "WALLET_STATE",
  description: "Provides the connected wallet address and SOL balance",
  dynamic: true,
  get: async () => {
    try {
      const service = getSolanaService();
      const address = service.walletAddress;

      if (!address) {
        return {
          text: "No wallet connected. Please connect a Solana wallet to enable trading features.",
          data: { connected: false },
        };
      }

      const solBalance = await service.getSOLBalance();
      const shortAddr = `${address.slice(0, 4)}...${address.slice(-4)}`;

      return {
        text: `Wallet: ${shortAddr} | Balance: ${solBalance.toFixed(4)} SOL | Network: ${process.env.SOLANA_NETWORK || "mainnet-beta"}`,
        data: {
          connected: true,
          address,
          solBalance,
        },
      };
    } catch {
      return {
        text: "Wallet state unavailable",
        data: { connected: false },
      };
    }
  },
};
