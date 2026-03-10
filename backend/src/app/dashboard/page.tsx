'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import StatsCard from '@/components/StatsCard';
import ServiceCard from '@/components/ServiceCard';
import SessionModal from '@/components/SessionModal';
import AdminStats from '@/components/AdminStats';

interface ServiceData {
    id: number;
    name: string;
    icon: string;
    color: string;
    category: string;
    totalSlots: number;
    activeSessions: number;
    available: number;
}

export default function DashboardPage() {
    const [services, setServices] = useState<ServiceData[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [activeSessions, setActiveSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [connectingId, setConnectingId] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);
    const [modal, setModal] = useState<{
        open: boolean;
        status: 'connecting' | 'connected' | 'error';
        session: any;
        error?: string;
    }>({ open: false, status: 'connecting', session: null });

    const user = getUser();

    useEffect(() => {
        setMounted(true);
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [svcRes, sessRes, statsRes] = await Promise.all([
                api.get('/services'),
                api.get('/sessions/active'),
                api.get('/analytics/user-dashboard')
            ]);
            console.log('Dashboard Data Fetched:', {
                services: svcRes.data.services.length,
                sessions: sessRes.data.sessions.length,
                stats: statsRes.data.stats
            });
            setServices(svcRes.data.services);
            setActiveSessions(sessRes.data.sessions);
            setStats(statsRes.data.stats);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSession = async (sessionId: number) => {
        if (!window.confirm('Are you sure you want to end this session?')) return;
        try {
            await api.post(`/sessions/${sessionId}/release`);
            fetchData();
        } catch (err) {
            console.error('Failed to delete session:', err);
        }
    };

    const handleConnect = async (serviceId: number) => {
        setConnectingId(serviceId);
        setModal({ open: true, status: 'connecting', session: null });

        try {
            const res = await api.post('/sessions/get-session', { service_id: serviceId });
            setModal({
                open: true,
                status: 'connected',
                session: res.data.session
            });
            fetchData(); // Refresh counts
        } catch (err: any) {
            setModal({
                open: true,
                status: 'error',
                session: null,
                error: err.response?.data?.error || 'Connection failed'
            });
        } finally {
            setConnectingId(null);
        }
    };

    const totalSlots = services.reduce((sum, s) => sum + s.totalSlots, 0);
    const totalActive = services.reduce((sum, s) => sum + s.activeSessions, 0);

    return (
        <div className="dashboard">
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        Welcome back, <span className="gradient-text">{mounted ? user?.username : ''}</span>
                    </h1>
                    <p className="page-subtitle">Access your shared services (v1.9)</p>
                </div>
            </div>

            {/* Admin Analytics */}
            {user?.role === 'admin' && (
                <div style={{ marginBottom: 48 }}>
                    <AdminStats />
                </div>
            )}

            {/* Stats */}
            <div className="stats-grid">
                <StatsCard
                    title="Max Services / Active"
                    value={stats ? `${stats.services.total} / ${stats.services.active}` : '0 / 0'}
                    icon="🎮"
                    color="#6366f1"
                />
                <StatsCard
                    title="Max Sessions / Active"
                    value={stats ? `${stats.sessions.total} / ${stats.sessions.active}` : '0 / 0'}
                    icon="🔗"
                    color="#10b981"
                />
                <StatsCard
                    title="Total Slots / Active"
                    value={stats ? `${stats.slots.total} / ${stats.slots.active}` : '0 / 0'}
                    icon="📊"
                    color="#f59e0b"
                />
                <StatsCard
                    title="Available / Active"
                    value={stats ? `${stats.available.total} / ${stats.available.active}` : '0 / 0'}
                    icon="✨"
                    color="#7c3aed"
                />
            </div>

            {/* Services Grid */}
            <div className="section-header">
                <h2>Available Services</h2>
                <span className="count-badge">{services.length} services</span>
            </div>

            {loading ? (
                <div className="loading-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="skeleton-card glass-card" />
                    ))}
                </div>
            ) : (
                <div className="services-grid">
                    {services.map((service, idx) => (
                        <div key={service.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                            <ServiceCard
                                {...service}
                                onConnect={handleConnect}
                                loading={connectingId === service.id}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Active Sessions */}
            {activeSessions.length > 0 && (
                <>
                    <div className="section-header" style={{ marginTop: 40 }}>
                        <h2>Your Active Sessions</h2>
                    </div>
                    <div className="sessions-list">
                        {activeSessions.map((s: any) => (
                            <div key={s.id} className="session-row glass-card">
                                <span style={{ fontSize: 24 }}>{s.service?.icon || '🔗'}</span>
                                <div className="session-info">
                                    <strong>{s.service?.name}</strong>
                                    <span>Expires {new Date(s.expires_at).toLocaleTimeString()}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span className="badge badge-active">Active</span>
                                    <button
                                        onClick={() => handleDeleteSession(s.id)}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <SessionModal
                isOpen={modal.open}
                onClose={() => setModal({ ...modal, open: false })}
                session={modal.session}
                status={modal.status}
                error={modal.error}
            />

            <style jsx>{`
        .dashboard { width: 100%; }
        .page-header { margin-bottom: 32px; }
        .page-title { font-size: 28px; font-weight: 800; }
        .page-subtitle { color: var(--text-secondary); margin-top: 4px; font-size: 15px; }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 40px;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .section-header h2 { font-size: 20px; font-weight: 700; }
        .count-badge {
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(124, 58, 237, 0.12);
          color: #818cf8;
          font-size: 12px;
          font-weight: 600;
        }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .skeleton-card {
          height: 240px;
          background: rgba(255,255,255,0.02);
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .session-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
        }
        .session-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .session-info strong { font-size: 14px; }
        .session-info span { font-size: 12px; color: var(--text-secondary); }
      `}</style>
        </div>
    );
}
