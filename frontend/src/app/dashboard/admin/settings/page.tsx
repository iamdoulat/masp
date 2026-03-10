'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            setSettings(res.data.settings);
        } catch (err) {
            console.error('Failed to fetch settings');
        } finally {
            setLoading(false);
        }
    };

    const getSetting = (key: string) => settings.find(s => s.key === key)?.value || '';

    const handleUpdate = (key: string, value: string, group: string = 'smtp') => {
        const newSettings = [...settings];
        const index = newSettings.findIndex(s => s.key === key);
        if (index > -1) {
            newSettings[index].value = value;
        } else {
            newSettings.push({ key, value, group });
        }
        setSettings(newSettings);
    };

    const saveSettings = async () => {
        setSaving(true);
        setMessage('');
        try {
            await api.post('/settings/bulk', { settings });
            setMessage('✅ Settings saved successfully!');
        } catch (err: any) {
            setMessage('❌ Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div style={{ maxWidth: 800 }}>
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
                    System <span className="gradient-text">Settings</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Configure system-wide parameters and integrations</p>
            </div>

            <div className="glass-card" style={{ padding: 40, marginBottom: 40 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                    📧 SMTP Configuration
                </h2>
                <div style={{ display: 'grid', gap: 24 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div className="field">
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>SMTP Host</label>
                            <input
                                className="input-glass"
                                placeholder="smtp.gmail.com"
                                value={getSetting('smtp_host')}
                                onChange={(e) => handleUpdate('smtp_host', e.target.value)}
                            />
                        </div>
                        <div className="field">
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>SMTP Port</label>
                            <input
                                className="input-glass"
                                placeholder="587"
                                value={getSetting('smtp_port')}
                                onChange={(e) => handleUpdate('smtp_port', e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div className="field">
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>SMTP User</label>
                            <input
                                className="input-glass"
                                placeholder="user@gmail.com"
                                value={getSetting('smtp_user')}
                                onChange={(e) => handleUpdate('smtp_user', e.target.value)}
                            />
                        </div>
                        <div className="field">
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>SMTP Password</label>
                            <input
                                type="password"
                                className="input-glass"
                                placeholder="••••••••"
                                value={getSetting('smtp_pass')}
                                onChange={(e) => handleUpdate('smtp_pass', e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div className="field">
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>From Email</label>
                            <input
                                className="input-glass"
                                placeholder="noreply@masm.com"
                                value={getSetting('smtp_from_email')}
                                onChange={(e) => handleUpdate('smtp_from_email', e.target.value)}
                            />
                        </div>
                        <div className="field">
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>From Name</label>
                            <input
                                className="input-glass"
                                placeholder="MASP Notifications"
                                value={getSetting('smtp_from_name')}
                                onChange={(e) => handleUpdate('smtp_from_name', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: message.startsWith('✅') ? '#10b981' : '#ef4444', fontSize: 14 }}>{message}</div>
                    <button onClick={saveSettings} className="btn-glow" disabled={saving}>
                        {saving ? 'Saving...' : '💾 Save Settings'}
                    </button>
                </div>
            </div>

            <div className="glass-card" style={{ padding: 32, opacity: 0.6 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Advanced</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Global system settings are restricted to Super Admins. More fields coming soon.</p>
            </div>
        </div>
    );
}
