'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function AdminExtensionPage() {
    const [latest, setLatest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [version, setVersion] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => { fetchLatest(); }, []);

    const fetchLatest = async () => {
        try {
            const res = await api.get('/extensions/latest');
            setLatest(res.data.extension);
        } catch (err) { console.error('No extension found'); }
        finally { setLoading(false); }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setMessage('');

        const formData = new FormData();
        formData.append('extension', file);
        formData.append('version', version);

        try {
            await api.post('/extensions/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('Extension uploaded successfully!');
            fetchLatest();
            setFile(null);
            setVersion('');
        } catch (err: any) {
            setMessage(err.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800 }}>Extension Management</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Upload and manage the Chrome browser extension ZIP</p>
                <a href="/dashboard/extension" style={{ color: 'var(--primary)', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginTop: 8 }}>
                    👁️ View User Guide & Instructions
                </a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 400px) 1fr', gap: 24 }}>
                {/* Upload Section */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Upload New Version</h2>
                    <form onSubmit={handleUpload}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>ZIP File</label>
                            <input
                                type="file"
                                accept=".zip"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                style={{
                                    width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)',
                                    border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff',
                                    fontSize: 13
                                }}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Version String</label>
                            <input
                                className="input-glass"
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                                placeholder="e.g. 1.2.0"
                                required
                            />
                        </div>
                        <button className="btn-glow" type="submit" disabled={uploading} style={{ width: '100%' }}>
                            {uploading ? 'Uploading...' : 'Upload ZIP'}
                        </button>
                    </form>
                    {message && (
                        <p style={{
                            marginTop: 16, fontSize: 13, textAlign: 'center',
                            color: message.includes('failed') ? '#ef4444' : '#10b981'
                        }}>
                            {message}
                        </p>
                    )}
                </div>

                {/* Current Version */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Current Active Extension</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : latest ? (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div style={{ fontSize: 40 }}>📦</div>
                                <div>
                                    <h3 style={{ fontSize: 20, fontWeight: 700 }}>Version {latest.version}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                                        Uploaded on {new Date(latest.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, fontSize: 14 }}>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>File Identifier:</p>
                                <code style={{ color: 'var(--primary)', wordBreak: 'break-all' }}>{latest.filename}</code>
                            </div>
                            <a
                                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/extensions/download`}
                                className="btn-glow"
                                style={{ display: 'inline-block', marginTop: 24, textDecoration: 'none', padding: '12px 24px' }}
                            >
                                ⬇️ Test Download
                            </a>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 40, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
                            <p style={{ color: 'var(--text-secondary)' }}>No extension ZIP uploaded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
