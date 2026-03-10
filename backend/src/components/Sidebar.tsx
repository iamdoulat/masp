import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearAuth, getUser, isAdmin } from '@/lib/auth';

const navItems = [
  { label: 'Dashboard', icon: '🏠', path: '/dashboard' },
  { label: 'My Sessions', icon: '🔗', path: '/dashboard/sessions' },
  { label: 'My Subscription', icon: '⭐', path: '/dashboard/subscribe' },
  { label: 'Download Extension', icon: '🧩', path: '/dashboard/extension' },
];

const adminItems = [
  { label: 'Services', icon: '⚙️', path: '/dashboard/admin/services' },
  { label: 'Accounts', icon: '🔑', path: '/dashboard/admin/accounts' },
  { label: 'Users', icon: '👥', path: '/dashboard/admin/users' },
  { label: 'Subscriptions', icon: '💳', path: '/dashboard/admin/subscriptions' },
  { label: 'Browser Extension', icon: '📦', path: '/dashboard/admin/extension' },
  { label: 'All Sessions', icon: '📊', path: '/dashboard/admin/sessions' },
  { label: 'Settings', icon: '⚙️', path: '/dashboard/admin/settings' },
];

export default function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const user = getUser();
  const admin = isAdmin();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text gradient-text">MASP</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`nav-item ${pathname === item.path ? 'active' : ''}`}
              target={item.path.startsWith('http') ? "_blank" : undefined}
              rel={item.path.startsWith('http') ? "noopener noreferrer" : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </a>
          ))}
        </div>

        {admin && (
          <div className="nav-section">
            <div className="nav-section-title">Admin</div>
            {adminItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`nav-item ${pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </a>
            ))}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        {mounted && (
          <div className="user-info">
            <div className="user-avatar">{user?.username?.[0] || '?'}</div>
            {!collapsed && (
              <div className="user-details">
                <span className="user-name">{user?.username}</span>
                <span className="user-role">{user?.role}</span>
              </div>
            )}
          </div>
        )}
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          {collapsed ? '🚪' : '🚪 Logout'}
        </button>
      </div>

      <style jsx>{`
        .sidebar {
          width: ${collapsed ? '80px' : '260px'};
          height: 100vh;
          background: rgba(255, 255, 255, 0.02);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
          transition: all 0.3s ease;
        }

        .sidebar-header {
          height: 72px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          justify-content: ${collapsed ? 'center' : 'flex-start'};
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo-icon { font-size: 24px; }
        .logo-text { 
            display: ${collapsed ? 'none' : 'block'};
            font-size: 22px; 
            font-weight: 800; 
            letter-spacing: 2px; 
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
        }

        .nav-section {
          margin-bottom: 24px;
        }

        .nav-section-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-secondary);
          padding: 8px 12px;
          margin-bottom: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 10px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          margin-bottom: 2px;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: rgba(124, 58, 237, 0.15);
          color: #818cf8;
        }

        .nav-icon { font-size: 18px; }
        .nav-label { flex: 1; }

        .sidebar-footer {
          padding: 16px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-avatar {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-name { font-size: 13px; font-weight: 600; }
        .user-role { font-size: 11px; color: var(--text-secondary); text-transform: capitalize; }

        .logout-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
        }
      `}</style>
    </aside>
  );
}
