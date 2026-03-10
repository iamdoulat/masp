'use client';
import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Unhandled Error:', error);
    }, [error]);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '24px',
            background: '#0a0a1a',
            color: '#fff',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>⚠️</div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>Something went wrong</h1>
            <p style={{ color: '#8888a8', maxWidth: '400px', marginBottom: '32px', fontSize: '15px' }}>
                We encountered an unexpected error. Don't worry, your data is safe.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    onClick={() => reset()}
                    style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Try Again
                </button>
                <button
                    onClick={() => window.location.href = '/'}
                    style={{
                        padding: '12px 24px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Go Home
                </button>
            </div>
        </div>
    );
}
