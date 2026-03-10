'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function AdminServicesPage() {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', icon: '🎮', login_url: '', domain: '', category: 'streaming', color: '#6366f1' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchServices(); }, []);

    const fetchServices = async () => {
        try {
            const res = await api.get('/services/admin');
            setServices(res.data.services);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleToggleStatus = async (service: any) => {
        try {
            await api.put(`/services/${service.id}`, { is_active: !service.is_active });
            fetchServices();
        } catch (err) { console.error(err); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/services', form);
            setShowForm(false);
            setForm({ name: '', icon: '🎮', login_url: '', domain: '', category: 'streaming', color: '#6366f1' });
            fetchServices();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this service?')) return;
        try {
            await api.delete(`/services/${id}`);
            fetchServices();
        } catch (err) { console.error(err); }
    };

    return (
        <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800 }}>Manage Services</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Add and manage streaming services</p>
                </div>
                <button className="btn-glow" onClick={() => setShowForm(!showForm)}>
                    {showForm ? '✕ Cancel' : '+ Add Service'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Name</label>
                            <input className="input-glass" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Netflix" />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Icon (Emoji)</label>
                            <input className="input-glass" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🎬" />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Login URL</label>
                            <input className="input-glass" value={form.login_url} onChange={(e) => setForm({ ...form, login_url: e.target.value })} required placeholder="https://netflix.com/login" />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Domain</label>
                            <input className="input-glass" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} required placeholder=".netflix.com" />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Category</label>
                            <select className="input-glass" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                <option value="streaming">Streaming</option>
                                <option value="music">Music</option>
                                <option value="gaming">Gaming</option>
                                <option value="productivity">Productivity</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Brand Color</label>
                            <input type="color" className="input-glass" style={{ height: 44, cursor: 'pointer' }} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                        </div>
                    </div>
                    <button className="btn-glow" type="submit" disabled={saving} style={{ marginTop: 20, width: '100%' }}>
                        {saving ? 'Creating...' : 'Create Service'}
                    </button>
                </form>
            )}

            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>Domain</th>
                            <th>Status</th>
                            <th>Slots</th>
                            <th>Active</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                        ) : services.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No services yet</td></tr>
                        ) : services.map((s: any) => (
                            <tr key={s.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 20 }}>{s.icon}</span>
                                        <strong>{s.name}</strong>
                                    </div>
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{s.domain}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                                        backgroundColor: s.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: s.is_active ? '#10b981' : '#ef4444'
                                    }}>
                                        {s.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </td>
                                <td>{s.totalSlots}</td>
                                <td>{s.activeSessions}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => handleToggleStatus(s)} style={{
                                            padding: '6px 12px', background: s.is_active ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)',
                                            border: `1px solid ${s.is_active ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                                            borderRadius: 6, color: s.is_active ? '#ef4444' : '#10b981', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter'
                                        }}>
                                            {s.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button onClick={() => handleDelete(s.id)} style={{
                                            padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter'
                                        }}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
