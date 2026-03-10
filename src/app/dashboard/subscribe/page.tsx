'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { isAdmin } from '@/lib/auth';

export default function SubscribePage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [userPlan, setUserPlan] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]); // All available services for admin selection
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newPlan, setNewPlan] = useState({
        name: '', price: 0, max_services: 1, max_sessions: 1, description: '', is_active: true, allowed_services: [] as number[]
    });
    const [saving, setSaving] = useState(false);
    const router = useRouter();
    const admin = isAdmin();

    const fetchPlans = async () => {
        try {
            const url = admin ? '/subscriptions/admin/plans' : '/subscriptions/plans';
            const [plansRes, meRes] = await Promise.all([
                api.get(url),
                api.get('/subscriptions/me')
            ]);
            setPlans(plansRes.data.plans);
            setUserPlan(meRes.data.subscription);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await api.get('/services'); // Public services endpoint
            setServices(res.data.services);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPlans();
        fetchServices();
    }, []);

    const handleSelectPlan = (planId: number) => {
        router.push(`/dashboard/subscribe/checkout?plan_id=${planId}`);
    };

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/subscriptions/admin/plans', newPlan);
            setShowAddForm(false);
            setNewPlan({ name: '', price: 0, max_services: 1, max_sessions: 1, description: '', is_active: true, allowed_services: [] });
            fetchPlans();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPlan) return;
        setSaving(true);
        try {
            await api.put(`/subscriptions/admin/plans/${editingPlan.id}`, editingPlan);
            setEditingPlan(null);
            fetchPlans();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (plan: any) => {
        try {
            await api.put(`/subscriptions/admin/plans/${plan.id}`, { is_active: !plan.is_active });
            fetchPlans();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '100px 0' }}>Loading plans...</div>;
    }

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Choose Your Subscription</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 48, fontSize: 16, maxWidth: 600, margin: '0 auto 48px' }}>
                You need an active subscription to access MASP services. Select a plan below to continue.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 64 }}>
                {plans.filter(p => p.is_active).map((plan) => (
                    <div key={plan.id} className="glass-card" style={{
                        padding: 32,
                        display: 'flex',
                        flexDirection: 'column',
                        textAlign: 'left',
                        position: 'relative',
                        overflow: 'hidden',
                        border: plan.name === 'Pro' ? '1px solid rgba(124, 58, 237, 0.5)' : undefined
                    }}>
                        {plan.name === 'Pro' && (
                            <div style={{
                                position: 'absolute', top: 12, right: -30, background: '#7c3aed',
                                color: 'white', fontSize: 10, fontWeight: 700, padding: '4px 32px',
                                transform: 'rotate(45deg)'
                            }}>
                                POPULAR
                            </div>
                        )}
                        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {plan.name}
                            {userPlan?.plan_id === plan.id && userPlan?.status === 'active' && (
                                <span style={{ color: '#10b981', fontSize: 24 }} title="Currently Active Plan">✅</span>
                            )}
                        </h2>
                        <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
                            ${plan.price} <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400 }}>/ month</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, flex: 1 }}>
                            {plan.description}
                        </p>

                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', fontSize: 14, color: '#d1d5db' }}>
                            <li style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: '#10b981' }}>✓</span> Max {plan.max_services} Concurrent Services
                            </li>
                            <li style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: '#10b981' }}>✓</span> {plan.max_sessions} Parallel session cookies
                            </li>
                            <li style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: '#10b981' }}>✓</span> 24/7 Access
                            </li>
                        </ul>

                        {plan.allowed_services?.length > 0 && (
                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, marginTop: -8, marginBottom: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>Included Services:</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {services.filter(s => plan.allowed_services.includes(s.id)).map(s => (
                                        <span key={s.id} style={{
                                            background: 'rgba(124, 58, 237, 0.15)',
                                            color: '#a5b4fc',
                                            padding: '3px 8px',
                                            borderRadius: 6,
                                            fontSize: 11,
                                            fontWeight: 500,
                                            border: '1px solid rgba(124, 58, 237, 0.2)'
                                        }}>
                                            {s.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {userPlan?.plan_id === plan.id && userPlan?.status === 'active' ? (
                            <button
                                className="input-glass"
                                style={{
                                    width: '100%',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    cursor: 'default'
                                }}
                                disabled
                            >
                                Your Current Plan
                            </button>
                        ) : (
                            <button
                                className="btn-glow"
                                style={{
                                    width: '100%',
                                    background: plan.name === 'Pro' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    border: plan.name === 'Pro' ? 'none' : '1px solid rgba(255,255,255,0.1)'
                                }}
                                onClick={() => handleSelectPlan(plan.id)}
                            >
                                Select {plan.name}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {admin && (
                <div className="glass-card" style={{ padding: 32, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Admin: Configure Plans</h2>
                        <button className="btn-glow" style={{ padding: '8px 16px' }} onClick={() => setShowAddForm(!showAddForm)}>
                            {showAddForm ? '✕ Cancel' : '+ Add New Plan'}
                        </button>
                    </div>

                    {showAddForm && (
                        <form onSubmit={handleCreatePlan} style={{ background: 'rgba(255,255,255,0.02)', padding: 24, borderRadius: 12, marginBottom: 32, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Create New Subscription Plan</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Plan Name</label>
                                    <input className="input-glass" value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} required placeholder="e.g. Ultra" />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Price ($)</label>
                                    <input type="number" step="0.01" className="input-glass" value={newPlan.price} onChange={e => setNewPlan({ ...newPlan, price: Number(e.target.value) })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Max Active Services</label>
                                    <input type="number" className="input-glass" value={newPlan.max_services} onChange={e => setNewPlan({ ...newPlan, max_services: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Max Parallel Sessions</label>
                                    <input type="number" className="input-glass" value={newPlan.max_sessions} onChange={e => setNewPlan({ ...newPlan, max_sessions: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Allowed Services (Whitelist)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 8 }}>
                                    {services.map(s => (
                                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={newPlan.allowed_services?.includes(s.id)}
                                                onChange={e => {
                                                    const ids = e.target.checked
                                                        ? [...(newPlan.allowed_services || []), s.id]
                                                        : (newPlan.allowed_services || []).filter(id => id !== s.id);
                                                    setNewPlan({ ...newPlan, allowed_services: ids });
                                                }}
                                            />
                                            {s.name}
                                        </label>
                                    ))}
                                    {services.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No services available. Create services first.</span>}
                                </div>
                                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>If none selected, all services will be allowed by default.</p>
                            </div>
                            <button type="submit" className="btn-glow" disabled={saving}>
                                {saving ? 'Creating...' : 'Create Plan'}
                            </button>
                        </form>
                    )}

                    {editingPlan ? (
                        <form onSubmit={handleUpdatePlan} style={{ background: 'rgba(255,255,255,0.02)', padding: 24, borderRadius: 12, border: '1px solid var(--primary)' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Editing: {editingPlan.name}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Plan Name</label>
                                    <input className="input-glass" value={editingPlan.name} onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Price ($)</label>
                                    <input type="number" step="0.01" className="input-glass" value={editingPlan.price} onChange={e => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Max Active Services</label>
                                    <input type="number" className="input-glass" value={editingPlan.max_services} onChange={e => setEditingPlan({ ...editingPlan, max_services: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Max Parallel Sessions</label>
                                    <input type="number" className="input-glass" value={editingPlan.max_sessions} onChange={e => setEditingPlan({ ...editingPlan, max_sessions: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Description</label>
                                <textarea className="input-glass" value={editingPlan.description} onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })} rows={2} />
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Allowed Services (Whitelist)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 8 }}>
                                    {services.map(s => (
                                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={editingPlan.allowed_services?.includes(s.id)}
                                                onChange={e => {
                                                    const ids = e.target.checked
                                                        ? [...(editingPlan.allowed_services || []), s.id]
                                                        : (editingPlan.allowed_services || []).filter((id: number) => id !== s.id);
                                                    setEditingPlan({ ...editingPlan, allowed_services: ids });
                                                }}
                                            />
                                            {s.name}
                                        </label>
                                    ))}
                                </div>
                                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>If none selected, all services will be allowed by default.</p>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="submit" className="btn-glow" disabled={saving}>
                                    {saving ? 'Saving...' : 'Update Plan'}
                                </button>
                                <button type="button" className="input-glass" style={{ width: 'auto' }} onClick={() => setEditingPlan(null)}>Cancel</button>
                            </div>
                        </form>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Price</th>
                                        <th>Max Services</th>
                                        <th>Max Sessions</th>
                                        <th>Service Whitelist</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plans.map(plan => (
                                        <tr key={plan.id}>
                                            <td style={{ fontWeight: 700 }}>{plan.name}</td>
                                            <td>${plan.price}</td>
                                            <td>{plan.max_services}</td>
                                            <td>{plan.max_sessions}</td>
                                            <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                                {(() => {
                                                    let allowed = plan.allowed_services;
                                                    while (typeof allowed === 'string') {
                                                        try {
                                                            const parsed = JSON.parse(allowed);
                                                            if (parsed === allowed) break;
                                                            allowed = parsed;
                                                        } catch (e) { break; }
                                                    }
                                                    return (allowed && Array.isArray(allowed) && allowed.length > 0)
                                                        ? `${allowed.length} selected`
                                                        : 'ALL AVAILABLE';
                                                })()}
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                                                    background: plan.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                    color: plan.is_active ? '#10b981' : '#ef4444'
                                                }}>
                                                    {plan.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button
                                                        onClick={() => {
                                                            let allowed = plan.allowed_services;
                                                            if (typeof allowed === 'string') {
                                                                try { allowed = JSON.parse(allowed); } catch (e) { allowed = []; }
                                                            }
                                                            while (typeof allowed === 'string') {
                                                                try { allowed = JSON.parse(allowed); } catch (e) { break; }
                                                            }
                                                            setEditingPlan({ ...plan, allowed_services: Array.isArray(allowed) ? allowed : [] });
                                                        }}
                                                        style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, color: '#fff', cursor: 'pointer' }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(plan)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: plan.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                                            border: `1px solid ${plan.is_active ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                                                            borderRadius: 6, fontSize: 12, color: plan.is_active ? '#ef4444' : '#10b981', cursor: 'pointer'
                                                        }}
                                                    >
                                                        {plan.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
