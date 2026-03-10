'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function AdminSessionsPage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active');

    useEffect(() => { fetchSessions(); }, [filter]);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/sessions/all?status=${filter}`);
            setSessions(res.data.sessions);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleRevoke = async (id: number) => {
        if (!confirm('Revoke this session?')) return;
        try {
            await api.post(`/sessions/${id}/revoke`);
            fetchSessions();
        } catch (err) { console.error(err); }
    };

    const handleRevokeAll = async () => {
        if (!confirm('Are you SURE you want to forcibly terminate ALL active sessions? This will disconnect all users.')) return;
        try {
            const res = await api.post('/sessions/revoke-all');
            alert(res.data.message);
            fetchSessions();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Failed to revoke all');
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800 }}>All Sessions</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Monitor and manage all user sessions</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button
                        onClick={handleRevokeAll}
                        style={{
                            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer',
                            fontFamily: 'Inter'
                        }}
                    >
                        🚨 Revoke All Active
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {['active', 'expired', 'revoked'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 8,
                                    border: '1px solid',
                                    borderColor: filter === s ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)',
                                    background: filter === s ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                                    color: filter === s ? '#818cf8' : 'var(--text-secondary)',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    textTransform: 'capitalize',
                                    fontFamily: 'Inter, sans-serif'
                                }}
                            >{s}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User</th>
                            <th>Service</th>
                            <th>Account</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Expires</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                        ) : sessions.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No {filter} sessions</td></tr>
                        ) : sessions.map((s: any) => (
                            <tr key={s.id}>
                                <td>#{s.id}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 7,
                                            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 11, fontWeight: 700
                                        }}>{s.user?.username?.[0]}</div>
                                        <span style={{ fontSize: 13 }}>{s.user?.username || s.user?.email}</span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span>{s.account?.service?.icon}</span>
                                        <span style={{ fontSize: 13 }}>{s.account?.service?.name}</span>
                                    </div>
                                </td>
                                <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{s.account?.email}</td>
                                <td>
                                    <span className={`badge ${s.status === 'active' ? 'badge-active' :
                                        s.status === 'expired' ? 'badge-warning' : 'badge-inactive'
                                        }`}>{s.status}</span>
                                </td>
                                <td style={{ fontSize: 12 }}>{new Date(s.created_at).toLocaleString()}</td>
                                <td style={{ fontSize: 12 }}>{new Date(s.expires_at).toLocaleString()}</td>
                                <td>
                                    {s.status === 'active' && (
                                        <button onClick={() => handleRevoke(s.id)} style={{
                                            padding: '6px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                            borderRadius: 6, color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter'
                                        }}>Revoke</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
