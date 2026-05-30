import { useMusicStore } from '../store/musicStore';
import { Play, Pause, SkipBack, SkipForward, Volume2, Download, Heart, Loader, Check } from 'lucide-react';
import { useState } from 'react';
import { Browser } from '@capacitor/browser';
import { isNativeApp } from '../services/platform';
import { saveDownloadRecord } from '../services/offlineStorage';

const MEGAN = 'https://apis.megan.qzz.io';
const KEY = 'megan_admin_master';

export default function PlayerBar() {
  const { currentTrack, isPlaying, queue, queueIndex, volume, togglePlay, nextTrack, prevTrack, setVolume, toggleFavorite, favorites } = useMusicStore();
  const [showVolume, setShowVolume] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!currentTrack) return null;

  const isFav = favorites.some(f => f.videoId === currentTrack.videoId);
  const nextSong = queue[queueIndex + 1];

  const handleDownload = async () => {
    if (!currentTrack?.videoId) return;
    setDownloading(true);
    const title = (currentTrack.title || 'song').replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50);
    try {
      const res = await fetch(`${MEGAN}/download/audio?q=${encodeURIComponent(title)}&apikey=${KEY}`);
      const data = await res.json();
      const dlUrl = data?.downloadUrl || data?.proxyUrl;
      if (dlUrl) {
        saveDownloadRecord({
          videoId: currentTrack.videoId,
          title: currentTrack.title || '',
          artist: currentTrack.artist || '',
          thumbnail: currentTrack.thumbnail || '',
          duration: currentTrack.duration || '',
          filePath: '', fileSize: 0
        }).catch(() => {});
        
        if (isNativeApp()) {
          await Browser.open({ url: dlUrl });
        } else {
          const a = document.createElement('a'); a.href = dlUrl; a.download = `${title}.mp3`;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
        }
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 3000);
      }
    } catch (e) {}
    setDownloading(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: 'rgba(10,10,24,0.98)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 24px' }}>
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
        <button onClick={handleDownload} className="btn-glass" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {downloading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : downloaded ? <Check size={14} color="#10b981" /> : <Download size={14} />}
          {downloaded ? 'Saved' : 'MP3'}
        </button>
        <button onClick={() => currentTrack && toggleFavorite(currentTrack)} style={ctrlBtn}>
          <Heart size={16} fill={isFav ? '#f43f5e' : 'none'} color={isFav ? '#f43f5e' : '#94a3b8'} />
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const ctrlBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
