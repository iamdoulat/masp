'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function ExtensionPage() {
    const [latest, setLatest] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLatest = async () => {
            try {
                const res = await api.get('/extensions/latest');
                setLatest(res.data.extension);
            } catch (err) {
                console.error('No extension found');
            } finally {
                setLoading(false);
            }
        };
        fetchLatest();
    }, []);

    const steps = [
        {
            title: '1. Download Extension',
            desc: 'Click the button below to download the latest extension ZIP file to your computer.',
            icon: '⬇️'
        },
        {
            title: '2. Extract ZIP File',
            desc: 'Locate the downloaded file and extract it to a folder you can easily find (e.g., your Desktop).',
            icon: '📂'
        },
        {
            title: '3. Open Chrome Extensions',
            desc: 'Type chrome://extensions in your browser address bar and press Enter.',
            icon: '🌐'
        },
        {
            title: '4. Enable Developer Mode',
            desc: 'Switch on the "Developer mode" toggle in the top-right corner of the extensions page.',
            icon: '🛠️'
        },
        {
            title: '5. Load Unpacked',
            desc: 'Click "Load unpacked" and select the folder where you extracted the extension.',
            icon: '🧩'
        }
    ];

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
                    Chrome Extension <span className="gradient-text">Setup Guide</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
                    Follow these simple steps to activate the MASP extension and start using shared services.
                </p>
            </div>

            <div className="glass-card" style={{ padding: 40, marginBottom: 40 }}>
                <div style={{ display: 'grid', gap: 32 }}>
                    {steps.map((step, index) => (
                        <div key={index} style={{ display: 'flex', gap: 24 }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
                                fontSize: 24, background: 'rgba(255,255,255,0.03)', flexShrink: 0
                            }}>
                                {step.icon}
                            </div>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{step.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{step.desc} {index === 2 && <code style={{ color: 'var(--primary)', background: 'rgba(124, 58, 237, 0.1)', padding: '2px 6px', borderRadius: 4 }}>chrome://extensions</code>}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                    {loading ? (
                        <p>Loading download link...</p>
                    ) : latest ? (
                        <div>
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                                Latest Version: <strong style={{ color: '#fff' }}>v{latest.version}</strong>
                            </p>
                            <a
                                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/extensions/download`}
                                className="btn-glow"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 12,
                                    textDecoration: 'none', padding: '16px 32px', fontSize: 16, fontWeight: 700
                                }}
                            >
                                📥 Download Extension (.zip)
                            </a>
                        </div>
                    ) : (
                        <div style={{ padding: 24, background: 'rgba(239, 68, 68, 0.05)', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <p style={{ color: '#ef4444' }}>No active extension found. Please contact the administrator.</p>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                <p>Need help? Check out our video tutorial or contact support.</p>
            </div>
        </div>
    );
}
