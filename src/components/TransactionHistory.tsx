"use client";

import { useState, useEffect } from "react";

interface Transaction {
    signature: string;
    timestamp: number;
    type: string;
    amount: number;
    token: string;
    usdValue?: number;
}

export default function TransactionHistory() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(20);

    useEffect(() => {
        fetchTransactionHistory();
    }, [limit]);

    const fetchTransactionHistory = async () => {
        try {
            const res = await fetch("/api/eliza/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: `show my transaction history ${limit}` }),
            });
            const data = await res.json();

            if (data.data && Array.isArray(data.data)) {
                setTransactions(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch transaction history:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString() + ' ' +
            new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatAmount = (amount: number, token: string) => {
        if (token === 'SOL') {
            return amount.toFixed(4);
        }
        return amount.toFixed(2);
    };

    if (loading) {
        return (
            <div className="glass-card">
                <div className="card-header">
                    <span className="card-title">Transaction History</span>
                    <span className="card-icon">📜</span>
                </div>
                <div className="loading-spinner">Loading transactions...</div>
            </div>
        );
    }

    return (
        <div className="glass-card">
            <div className="card-header">
                <span className="card-title">Transaction History</span>
                <span className="card-icon">📜</span>
            </div>

            {/* Controls */}
            <div className="flex gap-2 mb-4">
                <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="px-3 py-1 bg-black/20 border border-white/10 rounded text-sm"
                >
                    <option value={10}>Last 10</option>
                    <option value={20}>Last 20</option>
                    <option value={50}>Last 50</option>
                    <option value={100}>Last 100</option>
                </select>
                <button
                    onClick={fetchTransactionHistory}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                >
                    Refresh
                </button>
            </div>

            {/* Transaction List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactions.length === 0 ? (
                    <div className="text-center text-muted py-8">No transactions found</div>
                ) : (
                    transactions.map((tx, index) => (
                        <div key={index} className="transaction-item">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium capitalize">{tx.type}</span>
                                    <span className="text-xs text-muted">{tx.token}</span>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-medium ${tx.type.toLowerCase().includes('transfer') && tx.amount > 0 ? 'text-green-400' :
                                            tx.type.toLowerCase().includes('transfer') && tx.amount < 0 ? 'text-red-400' :
                                                'text-white'
                                        }`}>
                                        {tx.amount > 0 ? '+' : ''}{formatAmount(tx.amount, tx.token)} {tx.token}
                                    </div>
                                    {tx.usdValue && (
                                        <div className="text-xs text-muted">
                                            ${tx.usdValue.toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs text-muted">
                                <span>{formatDate(tx.timestamp)}</span>
                                <a
                                    href={`https://solscan.io/tx/${tx.signature}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 underline"
                                >
                                    {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {transactions.length > 0 && (
                <div className="mt-4 text-center">
                    <button
                        onClick={() => setLimit(Math.min(limit + 20, 100))}
                        className="px-4 py-2 bg-black/20 hover:bg-black/30 rounded text-sm transition-colors"
                    >
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
}