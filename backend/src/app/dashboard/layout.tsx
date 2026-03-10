'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.replace('/login');
            return;
        }

        const checkSubscription = async () => {
            // Don't enforce on the subscribe pages to prevent loops
            if (pathname.startsWith('/dashboard/subscribe')) return;

            try {
                const res = await api.get('/subscriptions/me');
                const sub = res.data.subscription;

                // If no sub, not active, or expired -> redirect
                if (!sub || sub.status !== 'active' || new Date(sub.current_period_end) < new Date()) {
                    router.replace('/dashboard/subscribe');
                }
            } catch (err: any) {
                if (err.response?.status === 402) {
                    router.replace('/dashboard/subscribe');
                }
            }
        };

        checkSubscription();
    }, [router, pathname]);

    const sidebarWidth = isSidebarCollapsed ? 80 : 260;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Sidebar collapsed={isSidebarCollapsed} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' }}>
                <Header
                    onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    style={{
                        marginLeft: sidebarWidth,
                        width: `calc(100% - ${sidebarWidth}px)`,
                        borderRadius: 0,
                        borderBottom: '1px solid var(--border-glass)'
                    }}
                />
                <main style={{
                    marginLeft: sidebarWidth,
                    flex: 1,
                    padding: '24px 40px 40px 40px',
                    maxWidth: `calc(100vw - ${sidebarWidth}px)`,
                    overflowX: 'hidden',
                    transition: 'all 0.3s ease'
                }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
