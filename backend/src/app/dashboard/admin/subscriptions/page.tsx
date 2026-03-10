'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function AdminSubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const res = await api.get('/subscriptions/admin/all');
            setSubscriptions(res.data.subscriptions);
        } catch (err) {
            console.error('Failed to fetch subscriptions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        setActionLoading(id);
        try {
            await api.put(`/subscriptions/admin/${id}/status`, { status });
            fetchSubscriptions();
        } catch (err) {
            alert('Failed to update status');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading subscriptions...</div>;

    return (
        <div className="admin-subs" style={{ width: '100%' }}>
            <div className="page-header" style={{ marginBottom: 32 }}>
                <h1 className="page-title" style={{ fontSize: 24, fontWeight: 800 }}>User Subscriptions</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Manage all user billing plans and manual approvals.</p>
            </div>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.03)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
                        <tr>
                            <th style={{ padding: '16px 20px' }}>User</th>
                            <th style={{ padding: '16px 20px' }}>Plan</th>
                            <th style={{ padding: '16px 20px' }}>Payment</th>
                            <th style={{ padding: '16px 20px' }}>Status</th>
                            <th style={{ padding: '16px 20px' }}>Period End</th>
                            <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subscriptions.map((sub) => (
                            <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 14 }}>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600 }}>{sub.user?.username}</span>
                                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sub.user?.email}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <span className="badge" style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa', padding: '4px 10px', borderRadius: 20 }}>
                                        {sub.plan?.name}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 20px', textTransform: 'capitalize' }}>{sub.payment_method}</td>
                                <td style={{ padding: '16px 20px' }}>
                                    <span className={`badge badge-${sub.status}`} style={{
                                        padding: '4px 10px',
                                        borderRadius: 20,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        background: sub.status === 'active' ? 'rgba(16,185,129,0.1)' : sub.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: sub.status === 'active' ? '#10b981' : sub.status === 'pending' ? '#f59e0b' : '#ef4444'
                                    }}>
                                        {sub.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 20px' }}>{new Date(sub.current_period_end).toLocaleDateString()}</td>
                                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                        {sub.status === 'pending' && (
                                            <button
                                                className="btn-glow"
                                                onClick={() => handleUpdateStatus(sub.id, 'active')}
                                                disabled={actionLoading === sub.id}
                                                style={{ fontSize: 12, padding: '6px 12px' }}
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {sub.status === 'active' ? (
                                            <button
                                                onClick={() => handleUpdateStatus(sub.id, 'cancelled')}
                                                disabled={actionLoading === sub.id}
                                                style={{ fontSize: 12, padding: '6px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, cursor: 'pointer' }}
                                            >
                                                Deactivate
                                            </button>
                                        ) : sub.status !== 'pending' ? (
                                            <button
                                                onClick={() => handleUpdateStatus(sub.id, 'active')}
                                                disabled={actionLoading === sub.id}
                                                style={{ fontSize: 12, padding: '6px 12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, cursor: 'pointer' }}
                                            >
                                                Activate
                                            </button>
                                        ) : null}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {subscriptions.length === 0 && (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No subscriptions found.</div>
                )}
            </div>

            <style jsx>{`
                .badge-active { }
                .badge-pending { }
                .badge-expired { }
            `}</style>
        </div>
    );
}
