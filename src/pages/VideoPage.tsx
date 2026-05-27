import { ArrowLeft, Music } from 'lucide-react';
import { useMusicStore } from '../store/musicStore';

interface Props {
  onBack: () => void;
  onAudioMode: () => void;
}

export default function VideoPage({ onBack, onAudioMode }: Props) {
  const { currentTrack } = useMusicStore();
  const track = currentTrack;

  if (!track) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, background: 'linear-gradient(rgba(0,0,0,0.8), transparent)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{track.title?.substring(0, 40)}</div>
          <div style={{ color: '#ccc', fontSize: '12px' }}>{track.artist}</div>
        </div>
        <button onClick={onAudioMode} className="btn-glass" style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Music size={16} /> Audio
        </button>
      </div>

      {track.videoId ? (
        <iframe
          src={`https://www.youtube.com/embed/${track.videoId}?autoplay=1&rel=0`}
          style={{ width: '100%', height: '100vh', border: 'none' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#fff' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
            <div>Video not available</div>
          </div>
        </div>
      )}
    </div>
  );
}
