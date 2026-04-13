"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import html2canvas from 'html2canvas';

interface PerpsProtocol {
    id: string;
    name: string;
    displayName: string;
    logo: string;
    total24h: number;
    total7d: number;
    total30d: number;
    change_1d: number;
    change_7d: number;
    change_1m: number;
    chains: string[];
}

interface PerpsData {
    totalVolume24h: number;
    totalVolume30d: number;
    weeklyChange: number;
    protocols: PerpsProtocol[];
}

export default function SolanaPerpsAnalytics() {
    const [perpsData, setPerpsData] = useState<PerpsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showChart, setShowChart] = useState(false);
    const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

    useEffect(() => {
        fetchPerpsData();
        const interval = setInterval(fetchPerpsData, 300000); // Refresh every 5 minutes
        return () => clearInterval(interval);
    }, []);

    // Filter protocols based on search term
    const filteredProtocols = useMemo(() => {
        if (!perpsData) return [];
        if (!searchTerm) return perpsData.protocols;

        return perpsData.protocols.filter(protocol =>
            protocol.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            protocol.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [perpsData, searchTerm]);

    const fetchPerpsData = async () => {
        try {
            setError(null);

            // Fetch data from DeFi Llama API
            const response = await fetch('https://api.llama.fi/overview/open-interest');
            const data = await response.json();

            // Filter for Solana protocols
            const solanaProtocols = data.protocols.filter((protocol: any) =>
                protocol.chains && protocol.chains.includes('Solana')
            );

            // Calculate totals
            const totalVolume24h = solanaProtocols.reduce((sum: number, protocol: any) =>
                sum + (protocol.total24h || 0), 0
            );

            const totalVolume30d = solanaProtocols.reduce((sum: number, protocol: any) =>
                sum + (protocol.total30d || 0), 0
            );

            // Calculate weekly change (comparing current 7d to previous 7d)
            const current7d = solanaProtocols.reduce((sum: number, protocol: any) =>
                sum + (protocol.total7d || 0), 0
            );

            const previous7d = solanaProtocols.reduce((sum: number, protocol: any) =>
                sum + (protocol.total14dto7d || 0), 0
            );

            const weeklyChange = previous7d > 0 ? ((current7d - previous7d) / previous7d) * 100 : 0;

            // Transform protocols data
            const transformedProtocols: PerpsProtocol[] = solanaProtocols.map((protocol: any) => ({
                id: protocol.id,
                name: protocol.name,
                displayName: protocol.displayName,
                logo: protocol.logo,
                total24h: protocol.total24h || 0,
                total7d: protocol.total7d || 0,
                total30d: protocol.total30d || 0,
                change_1d: protocol.change_1d || 0,
                change_7d: protocol.change_7d || 0,
                change_1m: protocol.change_1m || 0,
                chains: protocol.chains || []
            }));

            // Sort by 24h volume descending
            transformedProtocols.sort((a, b) => b.total24h - a.total24h);

            setPerpsData({
                totalVolume24h,
                totalVolume30d,
                weeklyChange,
                protocols: transformedProtocols
            });

        } catch (err) {
            console.error('Failed to fetch perps data:', err);
            setError('Failed to load perpetuals data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        if (value >= 1e9) {
            return `$${(value / 1e9).toFixed(2)}b`;
        } else if (value >= 1e6) {
            return `$${(value / 1e6).toFixed(2)}m`;
        } else if (value >= 1e3) {
            return `$${(value / 1e3).toFixed(2)}k`;
        }
        return `$${value.toFixed(2)}`;
    };

    const formatPercentage = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };

    // Export functions
    const exportToCSV = () => {
        if (!perpsData) return;

        const csvData = filteredProtocols.map(protocol => ({
            Name: protocol.displayName,
            '24h Volume': protocol.total24h,
            '7d Volume': protocol.total7d,
            '30d Volume': protocol.total30d,
            '24h Change': protocol.change_1d,
            '7d Change': protocol.change_7d,
            '1m Change': protocol.change_1m
        }));

        const csvString = [
            Object.keys(csvData[0]).join(','),
            ...csvData.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `solana-perps-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const exportToPNG = async () => {
        const element = document.getElementById('perps-analytics');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#0B0F1A',
                scale: 2
            });
            const link = document.createElement('a');
            link.download = `solana-perps-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL();
            link.click();
        } catch (error) {
            console.error('Failed to export PNG:', error);
        }
    };

    // Chart data preparation
    const chartData = useMemo(() => {
        if (!perpsData) return [];

        return filteredProtocols.slice(0, 10).map(protocol => ({
            name: protocol.displayName.length > 10 ? protocol.displayName.substring(0, 10) + '...' : protocol.displayName,
            volume: protocol.total24h / 1000000, // Convert to millions for better display
            change: protocol.change_1d
        }));
    }, [perpsData, filteredProtocols]);

    const pieData = useMemo(() => {
        if (!perpsData) return [];

        const colors = ['#14F195', '#9945FF', '#00D1FF', '#FBBF24', '#EF4444', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#6B7280'];

        return filteredProtocols.slice(0, 8).map((protocol, index) => ({
            name: protocol.displayName,
            value: protocol.total24h,
            color: colors[index % colors.length]
        }));
    }, [perpsData, filteredProtocols]);

    if (loading) {
        return (
            <div className="glass-card">
                <div className="card-header">
                    <span className="card-title">Solana Perps</span>
                    <span className="card-icon">📈</span>
                </div>
                <div className="loading-spinner">Loading perps data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card">
                <div className="card-header">
                    <span className="card-title">Solana Perps</span>
                    <span className="card-icon">📈</span>
                </div>
                <div className="text-center text-red-400 text-sm">{error}</div>
            </div>
        );
    }

    if (!perpsData) {
        return (
            <div className="glass-card">
                <div className="card-header">
                    <span className="card-title">Solana Perps</span>
                    <span className="card-icon">📈</span>
                </div>
                <div className="text-center text-muted">No perps data available</div>
            </div>
        );
    }

    return (
        <div className="glass-card" id="perps-analytics">
            <div className="card-header">
                <span className="card-title">Solana Perps</span>
                <span className="card-icon">📈</span>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="metric-card">
                    <div className="metric-label">24h Volume</div>
                    <div className="metric-value">{formatCurrency(perpsData.totalVolume24h)}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">30d Volume</div>
                    <div className="metric-value">{formatCurrency(perpsData.totalVolume30d)}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Weekly Change</div>
                    <div className={`metric-value ${perpsData.weeklyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercentage(perpsData.weeklyChange)}
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Active Protocols</div>
                    <div className="metric-value">{perpsData.protocols.length}</div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search protocols..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* Controls */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setShowChart(!showChart)}
                    className="control-btn"
                >
                    {showChart ? '📊 Hide Chart' : '📈 Show Chart'}
                </button>
                {showChart && (
                    <select
                        value={chartType} title="Select chart type"
                        onChange={(e) => setChartType(e.target.value as 'bar' | 'pie')}
                        className="control-select"
                    >
                        <option value="bar">Bar Chart</option>
                        <option value="pie">Pie Chart</option>
                    </select>
                )}
                <button onClick={exportToCSV} className="control-btn">
                    📄 Export CSV
                </button>
                <button onClick={exportToPNG} className="control-btn">
                    🖼️ Export PNG
                </button>
            </div>

            {/* Chart */}
            {showChart && (
                <div className="chart-container mb-6">
                    <h4 className="text-sm font-semibold mb-3">Volume Distribution</h4>
                    <div className="chart-wrapper">
                        {chartType === 'bar' ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 69, 255, 0.2)" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#9CA3AF"
                                        fontSize={12}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis
                                        stroke="#9CA3AF"
                                        fontSize={12}
                                        label={{ value: 'Volume ($M)', angle: -90, position: 'insideLeft' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                            border: '1px solid rgba(148, 69, 255, 0.3)',
                                            borderRadius: '8px',
                                            color: '#F9FAFB'
                                        }}
                                        formatter={(value: any) => [`$${value.toFixed(2)}M`, 'Volume']}
                                    />
                                    <Bar dataKey="volume" fill="#14F195" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                            border: '1px solid rgba(148, 69, 255, 0.3)',
                                            borderRadius: '8px',
                                            color: '#F9FAFB'
                                        }}
                                        formatter={(value: any) => [`$${formatCurrency(value)}`, 'Volume']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            )}

            {/* Protocols List */}
            <div>
                <h4 className="text-sm font-semibold mb-3">
                    Top Protocols by 24h Volume {searchTerm && `(${filteredProtocols.length} results)`}
                </h4>
                <div className="flex overflow-x-auto gap-4 pb-2 snap-x">
                    {filteredProtocols.slice(0, 10).map((protocol) => (
                        <div 
                            key={protocol.id} 
                            className="flex-shrink-0 w-36 glass-card snap-start hover:border-sol-green transition-colors"
                            style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)' }}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <img
                                    src={protocol.logo}
                                    alt={protocol.name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-sol-border"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48x48?text=?';
                                    }}
                                />
                                <div className="text-center">
                                    <div className="font-bold text-sm truncate w-full mb-1">{protocol.displayName}</div>
                                    <div className="text-xs text-muted mb-2">{formatCurrency(protocol.total24h)}</div>
                                    <div className={`text-xs font-bold px-2 py-1 rounded ${protocol.change_1d >= 0 ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                                        {formatPercentage(protocol.change_1d)} (24h)
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredProtocols.length === 0 && searchTerm && (
                        <div className="text-center text-muted text-sm py-8 w-full">
                            No protocols found matching "{searchTerm}"
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}