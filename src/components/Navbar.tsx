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
      padding: '0 24px', height: '64px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src="https://files.catbox.moe/zkyj2v.png" alt="Vibely" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
        <span style={{ fontSize: '22px', fontWeight: 800, background: 'linear-gradient(135deg, #a78bfa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Vibely
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onSearchClick}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
            color: '#94a3b8', fontSize: '13px', cursor: 'pointer',
            width: '280px', justifyContent: 'flex-start'
          }}
        >
          <Search size={16} />
          Search artists, songs...
        </button>
        
        <button
          onClick={onMenuClick}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '40px', height: '40px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
            color: '#94a3b8', cursor: 'pointer',
          }}
        >
          <Menu size={20} />
        </button>
      </div>
    </nav>
  );
}
