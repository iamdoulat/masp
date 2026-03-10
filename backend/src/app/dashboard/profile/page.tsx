'use client';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        mobile: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/auth/me');
                const u = res.data.user;
                setUser(u);
                setFormData({
                    username: u.username,
                    email: u.email,
                    password: '',
                    mobile: u.mobile || ''
                });
                if (u.avatar) {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                    const baseUrl = apiUrl.replace(/\/api$/, '');
                    setPreviewUrl(`${baseUrl}${u.avatar.replace(/^.*\/public/, '/public')}`);
                }
            } catch (err: any) {
                console.error('Failed to fetch user:', err.response?.data || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        const data = new FormData();
        data.append('username', formData.username);
        data.append('email', formData.email);
        data.append('mobile', formData.mobile);
        if (formData.password) data.append('password', formData.password);
        if (selectedFile) data.append('avatar', selectedFile);

        try {
            const res = await api.put('/auth/profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('✅ Profile updated successfully!');
            setUser(res.data.user);
            if (res.data.user.avatar) {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                const baseUrl = apiUrl.replace(/\/api$/, '');
                setPreviewUrl(`${baseUrl}${res.data.user.avatar.replace(/^.*\/public/, '/public')}`);
            }
        } catch (err: any) {
            setMessage('❌ ' + (err.response?.data?.error || 'Failed to update profile'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="animate-pulse" style={{ fontSize: 18, color: 'var(--text-secondary)' }}>Loading profile...</div>
        </div>
    );

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', paddingBottom: 40 }}>
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
                    Account <span className="gradient-text">Settings</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your personal information, mobile, and avatar</p>
            </div>

            <div className="glass-card" style={{ padding: 40, marginBottom: 40 }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 32 }}>

                    {/* Avatar Section */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 8 }}>
                        <div
                            style={{
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 32,
                                border: '2px solid rgba(255,255,255,0.1)',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Avatar"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerText = formData.username?.charAt(0).toUpperCase() || '?';
                                    }}
                                />
                            ) : (
                                <span>{formData.username?.charAt(0).toUpperCase() || '?'}</span>
                            )}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.3s'
                            }} className="avatar-hover">
                                <span style={{ fontSize: 14 }}>Change</span>
                            </div>
                        </div>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Profile Picture</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>PNG, JPG or WebP. Max 2MB.</p>
                            <button
                                type="button"
                                className="btn-glass"
                                style={{ padding: '8px 16px', fontSize: 12 }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                📸 Upload Image
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                accept="image/*"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Username</label>
                            <input
                                type="text"
                                name="username"
                                className="input-glass"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Display name"
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                className="input-glass"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Your email"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Mobile Number</label>
                            <input
                                type="text"
                                name="mobile"
                                className="input-glass"
                                value={formData.mobile}
                                onChange={handleChange}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>New Password (leave blank to keep current)</label>
                            <input
                                type="password"
                                name="password"
                                className="input-glass"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {message && (
                        <div style={{
                            padding: '12px 20px',
                            background: message.startsWith('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid ' + (message.startsWith('✅') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                            borderRadius: 12,
                            color: message.startsWith('✅') ? '#10b981' : '#ef4444',
                            fontSize: 14,
                            textAlign: 'center'
                        }}>
                            {message}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16 }}>
                        <button type="submit" className="btn-glow" disabled={saving} style={{ padding: '14px 40px' }}>
                            {saving ? 'Saving Changes...' : '💾 Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="glass-card" style={{ padding: 32, borderStyle: 'dashed', background: 'transparent' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Security Information</h3>
                <div style={{ display: 'grid', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Joined On</span>
                        <span>{new Date(user?.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Last Login</span>
                        <span>{new Date(user?.last_login).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Account Type</span>
                        <span className="badge badge-active">{user?.role?.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .avatar-hover:hover {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
}
