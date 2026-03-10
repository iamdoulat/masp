'use client';
export default function Loading() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a1a'
    }}>
      <div className="spinner" />
      <style jsx>{`
        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(124, 58, 237, 0.1);
          border-top: 3px solid #7c3aed;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
