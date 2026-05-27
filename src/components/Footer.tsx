export default function Footer() {
  return (
    <footer style={{
      padding: '48px 24px 120px',
      textAlign: 'center',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      marginTop: '48px',
    }}>
      <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#a78bfa' }}>
        🎵 Vibely
      </div>
      <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>
        Discover the world's rhythms
      </p>
      <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px' }}>
        1,689 artists • 8,398 songs • 31 countries
      </p>
      <p style={{ color: '#64748b', fontSize: '11px', marginBottom: '4px' }}>
        Created by <span style={{ color: '#a78bfa', fontWeight: 600 }}>Tracker Wanga</span>
      </p>
      <p style={{ color: '#64748b', fontSize: '11px', marginBottom: '8px' }}>
        📞 <a href="https://wa.me/254758476795" style={{ color: '#06b6d4', textDecoration: 'none' }}>+254 758 476 795</a> (WhatsApp)
      </p>
      <p style={{ color: '#475569', fontSize: '10px' }}>
        Powered by Megan Music © 2026
      </p>
    </footer>
  );
}
