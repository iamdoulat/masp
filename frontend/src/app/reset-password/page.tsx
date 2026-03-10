'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) return setError('Passwords do not match');
        if (password.length < 6) return setError('Password must be at least 6 characters');

        setLoading(true);
        setMessage('');
        setError('');
        try {
            await api.post('/auth/reset-password', { token, password });
            setMessage('Password reset successful! Redirecting to login...');
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="bg-blur">
                <div className="blob blob-1" />
                <div className="blob blob-2" />
            </div>

            <div className="login-card animate-fade-in">
                <div className="login-header">
                    <div className="logo-container">
                        <div className="logo-icon-wrapper">
                            <span>🛡️</span>
                        </div>
                        <h1 className="logo-text">MASP</h1>
                    </div>
                    <h2>Reset Password</h2>
                    <p>Enter your new secure password below</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {message && <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: 12, borderRadius: 12, fontSize: 13, textAlign: 'center' }}>{message}</div>}
                    {error && <div className="error-badge">{error}</div>}

                    <div className="input-group">
                        <label>New Password</label>
                        <div className="input-wrapper">
                            <span className="input-icon">🔒</span>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Confirm New Password</label>
                        <div className="input-wrapper">
                            <span className="input-icon">🛡️</span>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-button" disabled={loading || !!message || !!error && !token}>
                        {loading ? 'Reseting...' : 'Update Password'}
                    </button>

                    <div className="login-footer">
                        <p>Back to <a href="/login">Sign In</a></p>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .login-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #050510;
                    position: relative;
                    overflow: hidden;
                    padding: 24px;
                }
                .bg-blur { position: fixed; inset: 0; z-index: 0; }
                .blob { position: absolute; filter: blur(80px); border-radius: 50%; opacity: 0.25; animation: float 20s infinite alternate; }
                .blob-1 { width: 500px; height: 500px; background: #4f46e5; top: -10%; left: -10%; }
                .blob-2 { width: 400px; height: 400px; background: #9333ea; bottom: -5%; right: -5%; }
                @keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(40px, 40px) scale(1.1); } }
                .login-card { width: 100%; max-width: 440px; background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 32px; padding: 48px; z-index: 10; }
                .login-header { text-align: center; margin-bottom: 40px; }
                .logo-container { display: flex; flex-direction: column; align-items: center; gap: 16px; margin-bottom: 24px; }
                .logo-icon-wrapper { width: 56px; height: 56px; background: linear-gradient(135deg, #4f46e5, #9333ea); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; }
                .logo-text { font-size: 32px; font-weight: 900; letter-spacing: 2px; color: white; }
                h2 { font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 8px; }
                p { color: #94a3b8; font-size: 14px; }
                .login-form { display: flex; flex-direction: column; gap: 24px; }
                .error-badge { padding: 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; color: #f87171; font-size: 13px; text-align: center; }
                .input-group { display: flex; flex-direction: column; gap: 8px; }
                .input-group label { font-size: 13px; font-weight: 600; color: #cbd5e1; }
                .input-wrapper { position: relative; display: flex; align-items: center; }
                .input-icon { position: absolute; left: 16px; font-size: 16px; opacity: 0.6; }
                input { width: 100%; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 14px 14px 14px 48px; color: #fff; font-size: 15px; outline: none; }
                input:focus { border-color: #6366f1; }
                .login-button { background: linear-gradient(135deg, #4f46e5, #9333ea); color: #fff; border: none; border-radius: 14px; padding: 16px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
                .login-button:hover { box-shadow: 0 10px 25px rgba(79, 70, 229, 0.4); transform: translateY(-2px); }
                .login-footer { text-align: center; }
                .login-footer p { font-size: 14px; }
                .login-footer a { color: #818cf8; text-decoration: none; font-weight: 700; }
            `}</style>
        </div>
    );
}
