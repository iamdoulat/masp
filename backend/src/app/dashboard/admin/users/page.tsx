'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState({ email: '', password: '', username: '', role: 'user', is_active: true });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data.users);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editId) {
                await api.put(`/users/${editId}`, form);
            } else {
                await api.post('/users', form);
            }
            setShowForm(false);
            setEditId(null);
            setForm({ email: '', password: '', username: '', role: 'user', is_active: true });
            fetchData();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const handleEdit = (user: any) => {
        setForm({
            email: user.email,
            password: '', // Leave blank for security
            username: user.username,
            role: user.role,
            is_active: user.is_active
        });
        setEditId(user.id);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditId(null);
        setForm({ email: '', password: '', username: '', role: 'user', is_active: true });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this user?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete');
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800 }}>Manage Users</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Platform user management</p>
                </div>
                <button className="btn-glow" onClick={() => showForm ? handleCancel() : setShowForm(true)}>
                    {showForm ? '✕ Cancel' : '+ Add User'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                    <h2 style={{ fontSize: 18, marginBottom: 16 }}>{editId ? 'Edit User' : 'Add New User'}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Username</label>
                            <input className="input-glass" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Email</label>
                            <input type="email" className="input-glass" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Role</label>
                            <select className="input-glass" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Password {editId && '(Optional)'}</label>
                            <input type="password" className="input-glass" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editId} placeholder={editId ? '••••••••' : 'Password'} />
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                                <span style={{ fontSize: 14 }}>Active Account</span>
                            </label>
                        </div>
                    </div>
                    <button className="btn-glow" type="submit" disabled={saving} style={{ marginTop: 20, width: '100%' }}>
                        {saving ? 'Saving...' : editId ? 'Update User' : 'Create User'}
                    </button>
                </form>
            )}

            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Subscription</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                        ) : users.map((u: any) => (
                            <tr key={u.id}>
                                <td>#{u.id}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 30, height: 30, borderRadius: 8,
                                            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 13, fontWeight: 700
                                        }}>{u.username?.[0]}</div>
                                        <span>{u.username}</span>
                                    </div>
                                </td>
                                <td style={{ fontSize: 13 }}>{u.email}</td>
                                <td>
                                    <span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-active'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: 20,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        background: u.subscription?.plan?.name ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.05)',
                                        color: u.subscription?.plan?.name ? '#a78bfa' : 'var(--text-secondary)'
                                    }}>
                                        {u.subscription?.plan?.name || 'No Plan'}
                                        {u.subscription?.status === 'pending' && ' (Pending)'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${u.is_active ? 'badge-active' : 'badge-inactive'}`}>
                                        {u.is_active ? 'Active' : 'Disabled'}
                                    </span>
                                </td>
                                <td style={{ fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => handleEdit(u)} style={{
                                            padding: '6px 12px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                                            borderRadius: 6, color: '#818cf8', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter'
                                        }}>Edit</button>
                                        <button onClick={() => handleDelete(u.id)} style={{
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
