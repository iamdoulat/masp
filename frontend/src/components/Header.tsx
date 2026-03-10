'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { logout } from '@/lib/auth';

export default function Header({ onToggleSidebar, style }: { onToggleSidebar?: () => void, style?: React.CSSProperties }) {
    const [theme, setTheme] = useState('dark');
    const [user, setUser] = useState<any>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);

        const fetchUser = async () => {
            try {
                const res = await api.get('/auth/me');
                setUser(res.data.user);
            } catch (err) {
                console.error('Failed to fetch user');
            }
        };
        fetchUser();
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header style={{
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 40px',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-glass)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            borderRadius: '0 0 16px 16px',
            ...style
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <button
                    onClick={onToggleSidebar}
                    className="btn-glass"
                    style={{
                        width: 40,
                        height: 40,
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        cursor: 'pointer'
                    }}
                    title="Toggle Sidebar"
                >
                    ☰
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: 'var(--accent-primary)', fontSize: 14, fontWeight: 600 }}>Multi-Account Sharing Platform</span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-glass)',
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: 18,
                        transition: 'all 0.3s'
                    }}
                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                    {theme === 'dark' ? '🌙' : '☀️'}
                </button>

                {/* User Dropdown */}
                <div style={{ position: 'relative' }}>
                    <div
                        onClick={() => setShowDropdown(!showDropdown)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: 12,
                            transition: 'all 0.2s'
                        }}
                        className="header-user-btn"
                    >
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {user?.username || 'Loading...'}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                {user?.role === 'admin' ? 'Administrator' : 'User Account'}
                            </div>
                        </div>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: user?.avatar ? 'transparent' : 'linear-gradient(135deg, #7c3aed, #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            fontWeight: 800,
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                            overflow: 'hidden'
                        }}>
                            {user?.avatar ? (
                                <img
                                    src={user.avatar.startsWith('data:') ? user.avatar : `${(process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api$/, '')}${user.avatar.replace(/^.*\/public/, '/public')}`}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerText = user?.username?.[0]?.toUpperCase() || '?';
                                    }}
                                />
                            ) : (
                                user?.username?.[0]?.toUpperCase() || '?'
                            )}
                        </div>
                    </div>

                    {showDropdown && (
                        <>
                            <div
                                style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                                onClick={() => setShowDropdown(false)}
                            />
                            <div className="glass-card" style={{
                                position: 'absolute',
                                top: 'calc(100% + 12px)',
                                right: 0,
                                width: 220,
                                padding: 8,
                                zIndex: 100,
                                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                                overflow: 'hidden'
                            }}>
                                <button
                                    onClick={() => { setShowDropdown(false); router.push('/dashboard/profile'); }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '12px 16px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'var(--text-primary)',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        fontSize: 14,
                                        textAlign: 'left',
                                        transition: 'all 0.2s'
                                    }}
                                    className="dropdown-item"
                                >
                                    👤 Profile Settings
                                </button>
                                <div style={{ height: 1, background: 'var(--border-glass)', margin: '4px 8px' }} />
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '12px 16px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#ef4444',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        fontSize: 14,
                                        textAlign: 'left',
                                        transition: 'all 0.2s'
                                    }}
                                    className="dropdown-item-danger"
                                >
                                    🚪 Logout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
                .header-user-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                .dropdown-item:hover {
                    background: rgba(124, 58, 237, 0.1);
                    color: var(--accent-primary) !important;
                }
                .dropdown-item-danger:hover {
                    background: rgba(239, 68, 68, 0.1);
                }
            `}</style>
        </header>
    );
}
