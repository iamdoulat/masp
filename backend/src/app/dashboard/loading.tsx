'use client';
export default function DashboardLoading() {
    return (
        <div className="dashboard-loading" style={{ width: '100%' }}>
            <div className="skeleton h-10 w-48 mb-6" />
            <div className="skeleton h-4 w-64 mb-8" />

            {/* Stats Grid Skeleton */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '40px'
            }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="skeleton glass-card" style={{ height: '110px' }} />
                ))}
            </div>

            <div className="skeleton h-8 w-40 mb-6" />

            {/* Services Grid Skeleton */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
            }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="skeleton glass-card" style={{ height: '240px' }} />
                ))}
            </div>

            <style jsx>{`
        .skeleton {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 25%,
            rgba(255, 255, 255, 0.06) 50%,
            rgba(255, 255, 255, 0.03) 75%
          );
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 12px;
        }

        .h-10 { height: 40px; }
        .h-8 { height: 32px; }
        .h-4 { height: 16px; }
        .w-48 { width: 192px; }
        .w-64 { width: 256px; }
        .w-40 { width: 160px; }
        .mb-6 { margin-bottom: 24px; }
        .mb-8 { margin-bottom: 32px; }

        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
        </div>
    );
}
