'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SokoPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--sol-dark)', color: 'var(--text-primary)', flexDirection: 'column', gap: 12
    }}>
      <div style={{ fontSize: 36 }}>🤖</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>Redirecting to WaboTrader...</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        SokoAnalyst has evolved into WaboTrader — the Autonomous Solana AI Agent.
      </div>
    </div>
  );
}