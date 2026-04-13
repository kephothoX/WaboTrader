"use client";

import { useState, useEffect } from "react";

interface PortfolioMetrics {
    totalValue: number;
    performance: {
        totalReturn: number;
        sharpeRatio: number;
    };
    risk: {
        maxDrawdown: number;
        volatility: number;
    };
    diversification: {
        solAllocation: number;
        topToken: string;
        topTokenAllocation: number;
        concentrationRisk: string;
    };
    holdings: Array<{
        symbol: string;
        balance: number;
        usdValue: number;
        allocation: number;
    }>;
}

export default function PortfolioAnalytics() {
    const [analytics, setAnalytics] = useState<PortfolioMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPortfolioAnalytics();
        const interval = setInterval(fetchPortfolioAnalytics, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const fetchPortfolioAnalytics = async () => {
        try {
            const res = await fetch("/api/eliza/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "show me my portfolio analytics" }),
            });
            const data = await res.json();

            if (data.data) {
                setAnalytics(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch portfolio analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="glass-card">
                <div className="card-header">
                    <span className="card-title">Portfolio Analytics</span>
                    <span className="card-icon">📊</span>
                </div>
                <div className="loading-spinner">Loading analytics...</div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="glass-card">
                <div className="card-header">
                    <span className="card-title">Portfolio Analytics</span>
                    <span className="card-icon">📊</span>
                </div>
                <div className="text-center text-muted">No portfolio data available</div>
            </div>
        );
    }

    const { totalValue, performance, risk, diversification, holdings } = analytics;

    return (
        <div className="glass-card">
            <div className="card-header">
                <span className="card-title">Portfolio Analytics</span>
                <span className="card-icon">📊</span>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="metric-card">
                    <div className="metric-label">Total Value</div>
                    <div className="metric-value">${totalValue.toFixed(2)}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">30-Day Return</div>
                    <div className={`metric-value ${performance.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {performance.totalReturn >= 0 ? '+' : ''}{performance.totalReturn.toFixed(2)}%
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Sharpe Ratio</div>
                    <div className="metric-value">{performance.sharpeRatio.toFixed(2)}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Max Drawdown</div>
                    <div className="metric-value text-red-400">{risk.maxDrawdown.toFixed(2)}%</div>
                </div>
            </div>

            {/* Diversification */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">Diversification</h4>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted">SOL Allocation</span>
                        <span>{diversification.solAllocation.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted">Top Token</span>
                        <span>{diversification.topToken} ({diversification.topTokenAllocation.toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted">Risk Level</span>
                        <span className={`font-semibold ${diversification.concentrationRisk === 'HIGH' ? 'text-red-400' :
                                diversification.concentrationRisk === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                            {diversification.concentrationRisk}
                        </span>
                    </div>
                </div>
            </div>

            {/* Holdings Breakdown */}
            <div>
                <h4 className="text-sm font-semibold mb-3">Holdings</h4>
                <div className="space-y-2">
                    {holdings.map((holding, index) => (
                        <div key={index} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{holding.symbol}</span>
                                <span className="text-xs text-muted">
                                    {holding.balance.toFixed(holding.symbol === 'SOL' ? 4 : 2)}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="font-medium">${holding.usdValue.toFixed(2)}</div>
                                <div className="text-xs text-muted">{holding.allocation.toFixed(1)}%</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recommendations */}
            <div className="mt-6 p-3 bg-black/20 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
                <div className="text-xs space-y-1">
                    {performance.totalReturn < 0 && (
                        <div className="text-yellow-400">• Consider rebalancing to reduce losses</div>
                    )}
                    {risk.volatility > 0.5 && (
                        <div className="text-yellow-400">• High volatility detected - consider defensive positions</div>
                    )}
                    {diversification.concentrationRisk === "HIGH" && (
                        <div className="text-red-400">• Portfolio heavily concentrated - diversify across more assets</div>
                    )}
                    {diversification.concentrationRisk === "LOW" && (
                        <div className="text-green-400">• Good diversification - portfolio well-balanced</div>
                    )}
                </div>
            </div>
        </div>
    );
}