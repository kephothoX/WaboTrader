'use client';

import React, { useState } from 'react';

interface StrategyConfig {
  id: string;
  name: string;
  type: string;
  riskProfile: string;
  parameters: Record<string, any>;
  conditions: { type: string; indicator: string; operator: string; value: number }[];
}

const strategyTypes = [
  { value: 'momentum', label: 'Momentum' },
  { value: 'mean-reversion', label: 'Mean Reversion' },
  { value: 'arbitrage', label: 'Arbitrage' },
  { value: 'grid', label: 'Grid Trading' },
  { value: 'dca', label: 'DCA' },
];

const riskProfiles = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'aggressive', label: 'Aggressive' },
];

const tokens = ['SOL', 'BTC', 'ETH', 'BONK', 'WIF'];

const SEL_STYLE: React.CSSProperties = {
  width: '100%', 
  background: 'var(--sol-dark-2)', 
  border: '1px solid var(--sol-border)',
  borderRadius: 8, 
  padding: '8px 12px', 
  color: 'var(--text-primary)',
  fontSize: 13, 
  fontFamily: 'var(--font-sans)', 
  cursor: 'pointer',
  outline: 'none',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', 
  fontSize: 11, 
  color: 'var(--text-muted)', 
  fontWeight: 700,
  textTransform: 'uppercase', 
  letterSpacing: '0.5px', 
  marginBottom: 6,
};

export default function StrategyGenerator() {
  const [selectedType, setSelectedType] = useState<string>('momentum');
  const [selectedRisk, setSelectedRisk] = useState<string>('moderate');
  const [selectedToken, setSelectedToken] = useState<string>('SOL');
  const [generating, setGenerating] = useState(false);
  const [strategy, setStrategy] = useState<StrategyConfig | null>(null);

  const generateStrategy = async () => {
    setGenerating(true);
    setStrategy(null);
    try {
      const response = await fetch('/api/eliza/strategy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'generate', 
          type: selectedType, 
          riskProfile: selectedRisk, 
          token: selectedToken 
        }),
      });
      const data = await response.json();
      if (data.content?.strategy) {
        setStrategy(data.content.strategy);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Strategy generation error:', error);
    }
    setGenerating(false);
  };

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 20px' }}>
        🎯 Strategy Architect
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <div>
          <label htmlFor="strategy-type" style={LABEL_STYLE}>Strategy Type</label>
          <select 
            id="strategy-type" 
            value={selectedType} 
            onChange={e => setSelectedType(e.target.value)} 
            style={SEL_STYLE}
          >
            {strategyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="risk-profile" style={LABEL_STYLE}>Risk Profile</label>
          <select 
            id="risk-profile" 
            value={selectedRisk} 
            onChange={e => setSelectedRisk(e.target.value)} 
            style={SEL_STYLE}
          >
            {riskProfiles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="strategy-asset" style={LABEL_STYLE}>Asset</label>
          <select 
            id="strategy-asset" 
            value={selectedToken} 
            onChange={e => setSelectedToken(e.target.value)} 
            style={SEL_STYLE}
          >
            {tokens.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <button
        id="strategy-generator-btn"
        onClick={generateStrategy}
        disabled={generating}
        className="jupiter-link-btn"
        style={{
          width: '100%', 
          justifyContent: 'center',
          gap: 10,
          background: generating ? 'var(--sol-surface)' : 'var(--gradient-primary)',
          cursor: generating ? 'wait' : 'pointer',
          opacity: generating ? 0.7 : 1,
        }}
      >
        {generating ? (
          <>
            <span className="typing-dot" style={{ width: 6, height: 6 }} />
            <span>Analyzing Market Alpha...</span>
          </>
        ) : (
          '🚀 Architect Live Strategy'
        )}
      </button>

      {strategy && (
        <div style={{
          marginTop: 20, 
          padding: 16, 
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 12, 
          border: '1px solid var(--sol-border)', 
          animation: 'fadeSlideUp 0.4s ease-out forwards',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                {strategy.name || 'Autonomous Strategy'}
              </h3>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="apc-badge" style={{ background: 'rgba(20,241,149,0.1)', color: 'var(--sol-green)' }}>{strategy.type}</span>
                <span className="apc-badge" style={{ background: 'rgba(153,69,255,0.1)', color: 'var(--sol-purple)' }}>{strategy.riskProfile}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Core Parameters</span>
            {Object.entries(strategy.parameters || {}).filter(([k]) => !['token', 'timeframe', 'id', 'name'].includes(k)).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{String(v)}</span>
              </div>
            ))}
          </div>

          {(['entry', 'exit'] as const).map(type => (
            <div key={type} style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 6 }}>
                {type} Logic
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(strategy.conditions || []).filter(c => c.type === type).map((c, i) => (
                  <div key={i} style={{ fontSize: 11, color: 'var(--sol-green)', fontFamily: 'var(--font-mono)', padding: '4px 8px', background: 'rgba(20,241,149,0.05)', borderRadius: 4 }}>
                    IF <span style={{ color: 'var(--text-primary)' }}>{c.indicator}</span> {c.operator} <span style={{ fontWeight: 800 }}>{c.value}</span>
                  </div>
                ))}
                {!(strategy.conditions || []).some(c => c.type === type) && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>No specific {type} conditions defined</div>
                )}
              </div>
            </div>
          ))}
          
          <button 
            className="share-wa-btn" 
            style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
            onClick={() => {
              const text = `🎯 WaboTrader Strategy: ${strategy.name}\nType: ${strategy.type}\nRisk: ${strategy.riskProfile}\n\nLogic: ${strategy.conditions.map(c => `${c.type.toUpperCase()}: ${c.indicator} ${c.operator} ${c.value}`).join('\n')}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            }}
          >
            <span>💬 Share Strategy to WhatsApp</span>
          </button>
        </div>
      )}
    </div>
  );
}
