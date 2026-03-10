'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function MySessionsPage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchSessions(); }, []);

    const fetchSessions = async () => {
        try {
            const res = await api.get('/sessions/active');
            setSessions(res.data.sessions);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const releaseSession = async (id: number) => {
        try {
            await api.post(`/sessions/${id}/release`);
            fetchSessions();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>My Sessions</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14 }}>
                Manage your active service sessions
            </p>

            {loading ? (
                <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
            ) : sessions.length === 0 ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                    <p style={{ fontSize: 40, marginBottom: 12 }}>🔗</p>
                    <h3 style={{ marginBottom: 8 }}>No active sessions</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        Go to the Dashboard to connect to a service
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {sessions.map((s: any) => (
                        <div key={s.id} className="glass-card" style={{
                            padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16
                        }}>
                            <span style={{ fontSize: 28 }}>{s.service?.icon || '🔗'}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, marginBottom: 2 }}>{s.service?.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                    Started {new Date(s.created_at).toLocaleString()} · Expires {new Date(s.expires_at).toLocaleTimeString()}
                                </div>
                            </div>
                            <span className="badge badge-active">Active</span>
                            <button
                                onClick={() => releaseSession(s.id)}
                                style={{
                                    padding: '8px 16px',
                                    background: 'rgba(239,68,68,0.1)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: 8,
                                    color: '#ef4444',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: 'Inter, sans-serif'
                                }}
                            >
                                Release
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
