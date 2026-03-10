'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function AdminAccountsPage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState({ service_id: '', email: '', password: '', max_users: 1, cookiesString: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [accRes, svcRes] = await Promise.all([
                api.get('/accounts'),
                api.get('/services')
            ]);
            setAccounts(accRes.data.accounts);
            setServices(svcRes.data.services);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        let parsedCookies = null;
        if (form.cookiesString) {
            try {
                parsedCookies = JSON.parse(form.cookiesString);
                if (!Array.isArray(parsedCookies)) throw new Error('Cookies must be a JSON array');
            } catch (err: any) {
                alert(`Invalid cookies JSON: ${err.message}`);
                return;
            }
        }

        setSaving(true);
        try {
            const payload = {
                ...form,
                service_id: Number(form.service_id),
                cookies: parsedCookies
            };
            if (editId) {
                await api.put(`/accounts/${editId}`, payload);
            } else {
                await api.post('/accounts', payload);
            }
            setShowForm(false);
            setEditId(null);
            setForm({ service_id: '', email: '', password: '', max_users: 1, cookiesString: '' });
            fetchData();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const handleEdit = (account: any) => {
        setForm({
            service_id: account.service_id.toString(),
            email: account.email,
            password: '', // Don't pre-fill password for security/UX
            max_users: account.max_users,
            cookiesString: '' // We don't fetch full decrypted cookies here usually, so leave blank or inform user
        });
        setEditId(account.id);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditId(null);
        setForm({ service_id: '', email: '', password: '', max_users: 1, cookiesString: '' });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this account?')) return;
        try {
            await api.delete(`/accounts/${id}`);
            fetchData();
        } catch (err) { console.error(err); }
    };

    return (
        <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800 }}>Manage Accounts</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Service accounts with credentials & cookies</p>
                </div>
                <button className="btn-glow" onClick={() => showForm ? handleCancel() : setShowForm(true)}>
                    {showForm ? '✕ Cancel' : '+ Add Account'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                    <h2 style={{ fontSize: 18, marginBottom: 16 }}>{editId ? 'Edit Account' : 'Add New Account'}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Service</label>
                            <select className="input-glass" value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })} required>
                                <option value="">Select Service</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Max Users</label>
                            <input type="number" className="input-glass" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: Number(e.target.value) })} min={1} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Email</label>
                            <input className="input-glass" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="account@email.com" />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Password {editId ? '(Leave blank to keep unchanged)' : ''}</label>
                            <input type="password" className="input-glass" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editId} placeholder={editId ? '•••••••• (unchanged)' : '••••••••'} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Session Cookies (JSON Array, Optional)</label>
                            <textarea
                                className="input-glass"
                                value={form.cookiesString}
                                onChange={(e) => setForm({ ...form, cookiesString: e.target.value })}
                                placeholder='[{"name": "session_id", "value": "xyz", "domain": ".service.com", ...}]'
                                style={{ height: 100, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
                            />
                        </div>
                    </div>
                    <button className="btn-glow" type="submit" disabled={saving} style={{ marginTop: 20, width: '100%' }}>
                        {saving ? 'Saving...' : editId ? 'Update Account' : 'Create Account'}
                    </button>
                </form>
            )}

            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>Email</th>
                            <th>Max Users</th>
                            <th>Active</th>
                            <th>Cookies</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                        ) : accounts.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No accounts yet</td></tr>
                        ) : accounts.map((a: any) => (
                            <tr key={a.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{a.service?.icon}</span>
                                        <span>{a.service?.name}</span>
                                    </div>
                                </td>
                                <td style={{ fontSize: 13 }}>{a.email}</td>
                                <td>{a.max_users}</td>
                                <td>{a.activeSessions}</td>
                                <td>
                                    <span className={`badge ${a.hasCookies ? 'badge-active' : 'badge-inactive'}`}>
                                        {a.hasCookies ? 'Yes' : 'No'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${a.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                                        {a.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => handleEdit(a)} style={{
                                            padding: '6px 12px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                                            borderRadius: 6, color: '#818cf8', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter'
                                        }}>Edit</button>
                                        <button onClick={() => handleDelete(a.id)} style={{
                                            padding: '6px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                            borderRadius: 6, color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter'
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
