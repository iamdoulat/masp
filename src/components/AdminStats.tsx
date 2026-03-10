'use client';
import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import api from '@/lib/api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#7c3aed', '#ef4444', '#06b6d4'];

export default function AdminStats() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState(false);

    const fetchStats = async () => {
        try {
            const res = await api.get('/analytics/stats');
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Auto refresh every 30s for "Live" feel
        const timer = setInterval(fetchStats, 30000);
        return () => clearInterval(timer);
    }, []);

    const handleRevokeAll = async () => {
        if (!window.confirm('CRITICAL ACTION: This will disconnect ALL active users from ALL services. Are you absolutely sure?')) return;

        setRevoking(true);
        try {
            const res = await api.post('/sessions/revoke-all');
            alert(`Success: ${res.data.message}`);
            fetchStats();
        } catch (err) {
            alert('Failed to revoke sessions');
        } finally {
            setRevoking(false);
        }
    };

    if (loading && !stats) return (
        <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="animate-pulse" style={{ fontSize: 18, color: 'var(--text-secondary)' }}>Loading analytical data...</div>
        </div>
    );
    if (!stats) return null;

    return (
        <div className="admin-analytics animate-fade-in">
            {/* Action Bar Removed as per request */}

            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                <div className="glass-card" style={{ padding: 20 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Monthly Revenue</span>
                    <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: '#10b981' }}>${stats.revenue.monthly.toFixed(2)}</div>
                </div>
                <div className="glass-card" style={{ padding: 20 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Active Users</span>
                    <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{stats.global?.totalUsers || 0}</div>
                </div>
                <div className="glass-card" style={{ padding: 20 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Active Sessions (Live)</span>
                    <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: '#6366f1' }}>{stats.global?.activeSessions || 0}</div>
                </div>
                <div className="glass-card" style={{ padding: 20 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Slots (Occupancy)</span>
                    <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: '#f59e0b' }}>
                        {stats.global?.activeSessions || 0} / {stats.global?.totalSlots || 0}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 32 }}>
                {/* Subscription Dist */}
                <div className="glass-card" style={{ padding: 24, height: 350 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Subscription Tiers</h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <PieChart>
                            <Pie
                                data={stats.subscriptionDistribution}
                                cx="50%" cy="50%"
                                innerRadius={60} outerRadius={80}
                                paddingAngle={5} dataKey="value"
                            >
                                {stats.subscriptionDistribution.map((e: any, i: number) => (
                                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                            <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Popular Services */}
                <div className="glass-card" style={{ padding: 24, height: 350 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Top Performers (Services)</h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={stats.popularServices} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={100} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 12 }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <Bar dataKey="value" fill="url(#barGradient)" radius={[0, 4, 4, 0]} barSize={20} />
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#4f46e5" />
                                    <stop offset="100%" stopColor="#9333ea" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* User Growth */}
            <div className="glass-card" style={{ padding: 24, height: 400, marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>Registration Growth (30D)</h3>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Trend: Upward</span>
                </div>
                <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={stats.userGrowth}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 12 }} />
                        <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Recent Users Table */}
            <div className="glass-card" style={{ padding: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>New User Pipeline</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '16px 8px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>IDENTITY</th>
                                <th style={{ padding: '16px 8px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>EMAIL</th>
                                <th style={{ padding: '16px 8px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>MEMBERSHIP</th>
                                <th style={{ padding: '16px 8px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>JOINED</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentUsers.map((u: any) => (
                                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '16px 8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                                                {u.username[0]}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{u.username}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 8px', color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                                    <td style={{ padding: '16px 8px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: 20,
                                            fontSize: 10,
                                            fontWeight: 800,
                                            background: u.plan === 'Free' ? 'rgba(255,255,255,0.05)' : 'rgba(245, 158, 11, 0.1)',
                                            color: u.plan === 'Free' ? '#94a3b8' : '#f59e0b',
                                            border: `1px solid ${u.plan === 'Free' ? 'rgba(255,255,255,0.1)' : 'rgba(245, 158, 11, 0.2)'}`
                                        }}>
                                            {u.plan.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 8px', color: 'var(--text-secondary)', fontSize: 13 }}>
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
