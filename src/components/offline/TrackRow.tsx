import { Play, Pause, Trash2, Music } from 'lucide-react';
import type { DownloadedTrack } from '../../services/offlineStorage';

interface Props {
  track: DownloadedTrack;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
  onDelete: () => void;
  color?: string;
}

export default function TrackRow({ track, index, isPlaying, onPlay, onDelete, color = '#a78bfa' }: Props) {
  return (
    <div className="glass-card" style={{
      padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
      borderColor: isPlaying ? `${color}80` : undefined,
      background: isPlaying ? `${color}1a` : undefined,
      transition: 'all 0.15s'
    }} onClick={onPlay}>
      <span style={{ color: '#64748b', fontSize: '13px', width: '24px', fontWeight: 500 }}>#{index + 1}</span>
      {track.thumbnail ? (
        <img src={track.thumbnail} alt="" style={{ width: '44px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '44px', height: '32px', borderRadius: '4px', background: `${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Music size={16} color={color} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#f1f5f9', fontWeight: 500, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.title}
        </div>
        <div style={{ color, fontSize: '11px', marginTop: '1px' }}>{track.artist || 'Unknown'}</div>
      </div>
      {track.source === 'vibely' && (
        <span style={{ color: '#475569', fontSize: '10px', flexShrink: 0 }}>
          {new Date(track.downloadedAt).toLocaleDateString()}
        </span>
      )}
      {track.source === 'device' && (
        <span style={{ color: '#475569', fontSize: '9px', textTransform: 'uppercase', flexShrink: 0 }}>
          {track.filePath?.split('.').pop()}
        </span>
      )}
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '6px', flexShrink: 0 }}>
        <Trash2 size={14} />
      </button>
      <div style={{ width: '32px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        {isPlaying ? <Pause size={18} color={color} /> : <Play size={18} color={color} />}
      </div>
    </div>
  );
}
