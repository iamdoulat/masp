'use client';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: string;
    color?: string;
    subtitle?: string;
}

export default function StatsCard({ title, value, icon, color = '#7c3aed', subtitle }: StatsCardProps) {
    return (
        <div className="stats-card glass-card">
            <div className="stats-icon" style={{ background: `${color}20`, color }}>
                {icon}
            </div>
            <div className="stats-content">
                <span className="stats-title">{title}</span>
                <span className="stats-value">{value}</span>
                {subtitle && <span className="stats-subtitle">{subtitle}</span>}
            </div>

            <style jsx>{`
        .stats-card {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .stats-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }
        .stats-content {
          display: flex;
          flex-direction: column;
        }
        .stats-title {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stats-value {
          font-size: 26px;
          font-weight: 700;
          margin-top: 2px;
        }
        .stats-subtitle {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
      `}</style>
        </div>
    );
}
