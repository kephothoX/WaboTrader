import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WaboTrader — The Stealth Vanguard of Solana",
  description:
    "Autonomous Solana trading agent powered by ElizaOS. Analyze tokens, get trade recommendations, and execute swaps via Jupiter Aggregator. Deployed on Nosana decentralized GPU network.",
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0B0F1A" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
