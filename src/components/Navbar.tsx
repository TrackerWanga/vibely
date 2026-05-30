import { Search, Menu } from 'lucide-react';

interface Props {
  onSearchClick: () => void;
  onMenuClick: () => void;
}

export default function Navbar({ onSearchClick, onMenuClick }: Props) {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(6,6,14,0.9)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      padding: '0 16px', height: '64px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <img src="https://files.catbox.moe/zkyj2v.png" alt="Vibely" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
        <span style={{ fontSize: '18px', fontWeight: 800, background: 'linear-gradient(135deg, #a78bfa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'none' }}>
          Vibely
        </span>
      </div>

      <button
        onClick={onSearchClick}
        style={{
          flex: 1, maxWidth: '400px',
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 16px', background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
          color: '#94a3b8', fontSize: '13px', cursor: 'pointer',
          justifyContent: 'flex-start', overflow: 'hidden', whiteSpace: 'nowrap',
        }}
      >
        <Search size={16} style={{ flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Search artists, songs...</span>
      </button>

      <button
        onClick={onMenuClick}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '42px', height: '42px', flexShrink: 0,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
          color: '#94a3b8', cursor: 'pointer',
        }}
      >
        <Menu size={22} />
      </button>
    </nav>
  );
}
