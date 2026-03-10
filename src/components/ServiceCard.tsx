'use client';

interface ServiceCardProps {
    id: number;
    name: string;
    icon: string;
    color: string;
    category: string;
    totalSlots: number;
    activeSessions: number;
    available: number;
    onConnect: (serviceId: number) => void;
    loading?: boolean;
}

export default function ServiceCard({
    id, name, icon, color, category, totalSlots, activeSessions, available, onConnect, loading
}: ServiceCardProps) {
    return (
        <div className="service-card glass-card">
            <div className="card-header">
                <div className="service-icon" style={{ background: `${color}20` }}>
                    <span style={{ fontSize: 28 }}>{icon}</span>
                </div>
                <span className="category-badge">{category}</span>
            </div>

            <h3 className="service-name">{name}</h3>

            <div className="slots-info">
                <div className="slot-bar">
                    <div
                        className="slot-fill"
                        style={{
                            width: `${totalSlots ? (activeSessions / totalSlots) * 100 : 0}%`,
                            background: `linear-gradient(90deg, ${color}, ${color}88)`
                        }}
                    />
                </div>
                <div className="slot-text">
                    <span>{activeSessions}/{totalSlots} slots used</span>
                    <span className={available > 0 ? 'available' : 'full'}>
                        {available > 0 ? `${available} available` : 'Full'}
                    </span>
                </div>
            </div>

            <button
                className="connect-btn"
                style={{ background: available > 0 ? `linear-gradient(135deg, ${color}, ${color}cc)` : undefined }}
                onClick={() => onConnect(id)}
                disabled={loading || available <= 0}
            >
                {loading ? '⏳ Connecting...' : available > 0 ? '🔗 Connect' : '🔒 No Slots'}
            </button>

            <style jsx>{`
        .service-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .service-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .category-badge {
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(255,255,255,0.06);
          font-size: 11px;
          color: var(--text-secondary);
          text-transform: capitalize;
          font-weight: 500;
        }
        .service-name {
          font-size: 18px;
          font-weight: 700;
        }
        .slots-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .slot-bar {
          height: 6px;
          border-radius: 3px;
          background: rgba(255,255,255,0.06);
          overflow: hidden;
        }
        .slot-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }
        .slot-text {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .available { color: #10b981; font-weight: 600; }
        .full { color: #ef4444; font-weight: 600; }
        .connect-btn {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          font-family: 'Inter', sans-serif;
        }
        .connect-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        .connect-btn:disabled {
          background: rgba(255,255,255,0.06) !important;
          color: var(--text-secondary);
          cursor: not-allowed;
        }
      `}</style>
        </div>
    );
}
