'use client';
import { useState, useEffect } from 'react';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: number;
    service: string;
    domain: string;
    cookies: any[] | null;
    expires_at: string;
  } | null;
  status: 'connecting' | 'connected' | 'error';
  error?: string;
}

export default function SessionModal({ isOpen, onClose, session, status, error }: SessionModalProps) {
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);

  useEffect(() => {
    // Check initial state
    if (document.documentElement.getAttribute('data-masm-extension-installed') === 'true') {
      setIsExtensionInstalled(true);
    }

    // Listen for extension ready message
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'MASM_EXTENSION_READY') {
        setIsExtensionInstalled(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Heartbeat / Pulse logic
  useEffect(() => {
    let interval: any = null;

    if (isOpen && status === 'connected' && session?.id) {
      // Initial pulse
      const sendPulse = async () => {
        try {
          await import('@/lib/api').then(m => m.default.post(`/sessions/${session.id}/pulse`));
        } catch (err) {
          console.error('Pulse failed:', err);
        }
      };

      sendPulse();
      interval = setInterval(sendPulse, 30000); // Every 30 seconds
    }

    // Faster cleanup when tab/browser is closed
    const handleUnload = () => {
      if (status === 'connected' && session?.id) {
        // Beacon/Fetch with keepalive to notify server immediately
        const token = localStorage.getItem('token');
        if (token) {
          fetch(`/api/sessions/${session.id}/release`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            keepalive: true
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [isOpen, status, session?.id]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {status === 'connecting' && (
          <div className="modal-status">
            <div className="spinner" />
            <h3>Connecting...</h3>
            <p>Setting up your session</p>
          </div>
        )}

        {status === 'connected' && session && (
          <div className="modal-status">
            <div className="success-icon">✅</div>
            <h3>Connected to {session.service}</h3>
            <p className="domain">{session.domain}</p>

            <div className="session-info">
              <div className="info-row">
                <span>Session ID</span>
                <span>#{session.id}</span>
              </div>
              <div className="info-row">
                <span>Cookies</span>
                <span>{session.cookies?.length || 0} injected</span>
              </div>
              <div className="info-row">
                <span>Expires</span>
                <span>{new Date(session.expires_at).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  const targetUrl = `https://${session.domain.replace(/^\./, '')}`;

                  if (isExtensionInstalled) {
                    window.postMessage({
                      type: 'MASM_CONNECT',
                      payload: {
                        cookies: session.cookies,
                        domain: session.domain,
                        url: targetUrl
                      }
                    }, '*');
                  } else {
                    window.open(targetUrl, '_blank');
                  }
                }}
                className="btn-glow"
                style={{ border: 'none' }}
              >
                🚀 Open {session.service} {isExtensionInstalled ? '(Auto-Inject)' : ''}
              </button>
              <button className="btn-secondary" onClick={onClose}>Close</button>
            </div>

            {!isExtensionInstalled && (
              <div className="extension-note">
                💡 Install the MASP Chrome Extension for automatic cookie injection
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="modal-status">
            <div className="error-icon">❌</div>
            <h3>Connection Failed</h3>
            <p className="error-text">{error || 'Unable to create session'}</p>
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          width: 100%;
          max-width: 420px;
          padding: 40px;
        }
        .modal-status {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(124, 58, 237, 0.2);
          border-top-color: #7c3aed;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .success-icon, .error-icon { font-size: 48px; }
        .modal-status h3 { font-size: 20px; font-weight: 700; }
        .modal-status p { color: var(--text-secondary); font-size: 14px; }
        .domain { font-family: monospace; color: #818cf8 !important; }
        .error-text { color: #ef4444 !important; }
        .session-info {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          padding: 16px;
          margin: 8px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 13px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .info-row:last-child { border: none; }
        .info-row span:first-child { color: var(--text-secondary); }
        .info-row span:last-child { font-weight: 600; }
        .modal-actions {
          display: flex;
          gap: 12px;
          width: 100%;
          margin-top: 8px;
        }
        .modal-actions .btn-glow { flex: 1; text-align: center; text-decoration: none; }
        .btn-secondary {
          padding: 12px 20px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: var(--text-primary);
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .btn-secondary:hover {
          background: rgba(255,255,255,0.1);
        }
        .extension-note {
          font-size: 12px;
          color: var(--text-secondary);
          padding: 12px;
          background: rgba(124, 58, 237, 0.08);
          border-radius: 10px;
          margin-top: 8px;
          width: 100%;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
