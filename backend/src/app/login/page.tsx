'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setAuth } from '@/lib/auth';

import Image from 'next/image';

export default function LoginPage() {
  // ... existing state ...
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.token, res.data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="login-page">
      <div className="auth-bg-wrapper">
        <Image
          src="/assets/auth_bg.png"
          alt="Background"
          fill
          priority
          quality={85}
          style={{ objectFit: 'cover' }}
        />
        <div className="auth-bg-overlay" />
      </div>

      <div className="login-card animate-fade-in">
        {/* ... existing card content ... */}
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon-wrapper">
              <span>⚡</span>
            </div>
            <h1 className="logo-text">MASP <span className="version">v3.0</span></h1>
          </div>
          <h2>Welcome Back</h2>
          <p>Securely access your shared service accounts</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-badge">{error}</div>}

          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Password</label>
              <a href="/forgot-password" style={{ fontSize: 11, color: '#818cf8', textDecoration: 'none' }}>Forgot Password?</a>
            </div>
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

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In Now'}
          </button>

          <div className="form-divider">
            <span>OR</span>
          </div>

          <div className="login-footer">
            <p>New to MASP? <a href="/register">Create persistent account</a></p>
          </div>
        </form>
      </div>

      <style jsx>{`
                .login-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    padding: 24px;
                }

                .auth-bg-wrapper {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                }

                .auth-bg-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(rgba(5, 5, 16, 0.85), rgba(5, 5, 16, 0.95));
                }

                .login-card {
                    width: 100%;
                    max-width: 440px;
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 32px;
                    padding: 48px;
                    z-index: 10;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    transition: all 0.3s ease;
                }

                .login-header { text-align: center; margin-bottom: 40px; }
                
                .logo-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .logo-icon-wrapper {
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, #4f46e5, #9333ea);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
                }

                .logo-text {
                    font-size: 32px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    background: linear-gradient(to right, #fff, #a5b4fc);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .version {
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 0;
                    vertical-align: top;
                    padding: 2px 6px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    margin-left: 4px;
                    -webkit-text-fill-color: #fff;
                }

                h2 { font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 8px; }
                p { color: #94a3b8; font-size: 14px; }

                .login-form { display: flex; flex-direction: column; gap: 24px; }
                
                .error-badge {
                    padding: 12px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    border-radius: 12px;
                    color: #f87171;
                    font-size: 13px;
                    text-align: center;
                }

                .input-group { display: flex; flex-direction: column; gap: 8px; }
                .input-group label { font-size: 13px; font-weight: 600; color: #cbd5e1; }
                
                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-icon {
                    position: absolute;
                    left: 16px;
                    font-size: 16px;
                    opacity: 0.6;
                }

                input {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 14px;
                    padding: 14px 14px 14px 48px;
                    color: #fff;
                    font-size: 15px;
                    transition: all 0.3s;
                    outline: none;
                }

                input:focus {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: #6366f1;
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
                }

                .login-button {
                    background: linear-gradient(135deg, #4f46e5, #9333ea);
                    color: #fff;
                    border: none;
                    border-radius: 14px;
                    padding: 16px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s;
                    margin-top: 8px;
                }

                .login-button:hover {
                    box-shadow: 0 10px 25px rgba(79, 70, 229, 0.4);
                    transform: translateY(-2px);
                }

                .form-divider {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin: 8px 0;
                }

                .form-divider::before, .form-divider::after {
                    content: "";
                    flex: 1;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.08);
                }

                .form-divider span { font-size: 11px; color: #475569; font-weight: 800; }

                .login-footer { text-align: center; }
                .login-footer p { font-size: 14px; }
                .login-footer a { color: #818cf8; text-decoration: none; font-weight: 700; }
                .login-footer a:hover { color: #a5b4fc; text-decoration: underline; }

                @media (max-width: 480px) {
                    .login-card {
                        padding: 32px 24px;
                        border-radius: 24px;
                    }
                    .logo-text { font-size: 26px; }
                    .login-header h2 { font-size: 20px; }
                    .logo-icon-wrapper { width: 48px; height: 48px; font-size: 24px; }
                    .login-header { margin-bottom: 24px; }
                    .login-form { gap: 16px; }
                }

                @media (max-width: 360px) {
                    .login-card { padding: 24px 20px; }
                    .logo-text { font-size: 22px; }
                    .login-header h2 { font-size: 18px; }
                }
            `}</style>
    </div>
  );
}
