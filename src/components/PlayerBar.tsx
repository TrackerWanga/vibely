import { useMusicStore } from '../store/musicStore';
import { Play, Pause, SkipBack, SkipForward, Volume2, Download, Heart } from 'lucide-react';
import { useState } from 'react';

export default function PlayerBar() {
  const { currentTrack, isPlaying, queue, queueIndex, volume, isDownloading, downloadProgress, togglePlay, nextTrack, prevTrack, setVolume, setDownloadProgress, toggleFavorite, favorites } = useMusicStore();
  const [showVolume, setShowVolume] = useState(false);

  if (!currentTrack) return null;

  const isFav = favorites.some(f => f.videoId === currentTrack.videoId);
  const nextSong = queue[queueIndex + 1];

  const handleDownload = () => {
    let prog = 0; setDownloadProgress(0);
    const interval = setInterval(() => { prog += 5; if (prog >= 100) { clearInterval(interval); setDownloadProgress(100); } else setDownloadProgress(prog); }, 200);
  };

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: 'rgba(10,10,24,0.98)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 24px' }}>
      {isDownloading && (
        <div style={{ height: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '1px', marginBottom: '8px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${downloadProgress}%`, background: 'linear-gradient(90deg, #7c3aed, #06b6d4)', transition: 'width 0.3s' }} />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🎵 {currentTrack.title || 'Unknown'}</div>
          {nextSong && <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>Next: {nextSong.title?.substring(0, 40)}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={prevTrack} style={ctrlBtn}><SkipBack size={18} /></button>
          <button onClick={togglePlay} style={ctrlBtn}>{isPlaying ? <Pause size={22} /> : <Play size={22} />}</button>
          <button onClick={nextTrack} style={ctrlBtn}><SkipForward size={18} /></button>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowVolume(!showVolume)} style={ctrlBtn}><Volume2 size={18} /></button>
          {showVolume && (
            <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', padding: '8px', background: '#111128', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} style={{ width: '80px', accentColor: '#7c3aed' }} />
            </div>
          )}
        </div>
        <button onClick={handleDownload} className="btn-glass"><Download size={14} /> {isDownloading ? `${downloadProgress}%` : ''}</button>
        <button onClick={() => currentTrack && toggleFavorite(currentTrack)} style={ctrlBtn}>
          <Heart size={16} fill={isFav ? '#f43f5e' : 'none'} color={isFav ? '#f43f5e' : '#94a3b8'} />
        </button>
      </div>
    </div>
  );
}

const ctrlBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
