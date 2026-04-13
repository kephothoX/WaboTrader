"use client";

interface TradeActionCardsProps {
  onAction: (command: string) => void;
}

export default function TradeActionCards({ onAction }: TradeActionCardsProps) {
  const actions = [
    {
      icon: "🌍",
      iconClass: "market",
      title: "Market Overview",
      description: "Comprehensive analysis of major tokens & opportunities",
      command: "what's happening in the market?",
    },
    {
      icon: "💵",
      iconClass: "stablecoin",
      title: "Analyze USDC",
      description: "Deep stablecoin analysis with peg stability & DeFi usage",
      command: "analyze USDC",
    },
    {
      icon: "🎯",
      iconClass: "opportunities",
      title: "Trading Opportunities",
      description: "AI-powered recommendations for top trading opportunities",
      command: "show me trading opportunities",
    },
    {
      icon: "📊",
      iconClass: "analyze",
      title: "Analyze SOL",
      description: "Complete SOL analysis with technical indicators & risk",
      command: "analyze SOL",
    },
    {
      icon: "💰",
      iconClass: "balance",
      title: "Check Balance",
      description: "View wallet balance with USD valuations",
      command: "show my balance",
    },
    {
      icon: "📈",
      iconClass: "portfolio",
      title: "Portfolio Analytics",
      description: "Performance metrics, diversification & rebalancing",
      command: "portfolio analytics",
    },
  ];

  return (
    <div className="glass-card">
      <div className="card-header">
        <span className="card-title">Quick Actions</span>
        <span className="card-icon">⚡</span>
      </div>
      <div className="action-cards">
        {actions.map((action) => (
          <div
            key={action.title}
            className="action-card"
            onClick={() => onAction(action.command)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onAction(action.command)}
          >
            <div className={`action-card-icon ${action.iconClass}`}>
              {action.icon}
            </div>
            <div className="action-card-text">
              <h3>{action.title}</h3>
              <p>{action.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
