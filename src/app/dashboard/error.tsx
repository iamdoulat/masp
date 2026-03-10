'use client';
import { useEffect } from 'react';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Dashboard Error:', error);
    }, [error]);

    return (
        <div className="glass-card" style={{
            padding: '48px',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '40px auto'
        }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔧</div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>Dashboard Issue</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>
                We had trouble loading this section of your dashboard. This usually happens due to a temporary connection blip.
            </p>
            <button
                onClick={() => reset()}
                className="btn-glow"
                style={{ width: '200px' }}
            >
                Reload Page
            </button>
        </div>
    );
}
