import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Trash2, Music, HardDrive, FolderSearch, Shield, RefreshCw } from 'lucide-react';
import { getAllAudio, getStorageUsed, deleteDownload, getPlayableUrl, type DownloadedTrack } from '../services/offlineStorage';
import { isNativeApp } from '../services/platform';
import { hasStoragePermission, openAppSettings } from '../services/permissions';
import { playAudio, stopAll, stopIfPlaying } from '../services/audioManager';
import { useMusicStore } from '../store/musicStore';

interface Props { onBack: () => void; onSongPlay: () => void; }

export default function OfflinePage({ onBack, onSongPlay }: Props) {
  const [tracks, setTracks] = useState<DownloadedTrack[]>([]);
  const [storageUsed, setStorageUsed] = useState('');
  const [loading, setLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const { setQueue } = useMusicStore();

  useEffect(() => { checkAndLoad(); }, []);

  const checkAndLoad = async () => {
    setLoading(true);
    if (isNativeApp()) {
      let granted = await hasStoragePermission();
      if (!granted) {
        try {
          const { Filesystem } = await import('@capacitor/filesystem');
          const result = await Filesystem.requestPermissions();
          granted = result.publicStorage === 'granted';
        } catch (e) {}
      }
      if (granted) {
        setPermissionState('granted');
        await loadAllAudio();
      } else {
        setPermissionState('denied');
        await loadFromLocalStorage();
      }
    } else {
      setPermissionState('granted');
      await loadFromLocalStorage();
    }
    setLoading(false);
  };

  const requestStorageAccess = async () => {
    try {
      const { Filesystem } = await import('@capacitor/filesystem');
      const result = await Filesystem.requestPermissions();
      if (result.publicStorage === 'granted') {
        setPermissionState('granted');
        await loadAllAudio();
      } else {
        setPermissionState('denied');
        await loadFromLocalStorage();
      }
    } catch (e) {
      setPermissionState('denied');
      await loadFromLocalStorage();
    }
  };

  const loadAllAudio = async () => {
    try {
      const all = await getAllAudio();
      setTracks(all);
      setStorageUsed(await getStorageUsed());
    } catch (e) {
      await loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = async () => {
    const saved = JSON.parse(localStorage.getItem('vibely_downloads') || '[]');
    setTracks(saved.map((d: any) => ({ ...d, source: 'device' as const })));
  };

  const playTrack = (track: DownloadedTrack) => {
    const trackId = track.videoId;
    if (stopIfPlaying(trackId)) { setPlayingTrackId(null); return; }
    stopAll();
    
    if (track.source === 'device' && track.filePath && isNativeApp()) {
      const url = getPlayableUrl(track.filePath);
      const audio = playAudio(url, trackId, { title: track.title, artist: track.artist });
      setPlayingTrackId(trackId);
      audio.onended = () => setPlayingTrackId(null);
      audio.onerror = () => setPlayingTrackId(null);
    } else if (track.source === 'vibely') {
      const allVibely = tracks.filter(t => t.source === 'vibely');
      const idx = allVibely.findIndex(t => t.videoId === track.videoId);
      if (idx >= 0 && allVibely.length > 0) {
        stopAll();
        setPlayingTrackId(trackId);
        setQueue(allVibely.map(d => ({
          videoId: d.videoId, title: d.title, artist: d.artist,
          thumbnail: d.thumbnail, duration: d.duration,
        })), idx);
        onSongPlay();
      }
    }
  };

  const handleDelete = async (track: DownloadedTrack) => {
    stopIfPlaying(track.videoId);
    await deleteDownload(track.videoId);
    await loadAllAudio();
  };

  const vibelyDownloads = tracks.filter(t => t.source === 'vibely');
  const deviceAudio = tracks.filter(t => t.source === 'device');

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#06060e' }}>
      <div style={{ textAlign: 'center', color: '#a78bfa' }}>
        <FolderSearch size={48} style={{ marginBottom: '16px', animation: 'pulse 1.5s infinite' }} />
        <div>Scanning for audio files...</div>
        <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }`}</style>
      </div>
    </div>
  );

  if (permissionState === 'denied') {
    return (
      <div style={{ minHeight: '100vh', background: '#06060e', color: '#f1f5f9', padding: '20px 24px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <Shield size={64} color="#f59e0b" style={{ marginBottom: '16px' }} />
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Storage Access Required</div>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
            Vibely needs access to your audio files to play them offline.
          </p>
          <button onClick={requestStorageAccess} className="btn-primary" style={{ padding: '14px 32px', fontSize: '16px', marginBottom: '12px' }}>
            <Shield size={18} /> Request Permission
          </button>
          <br />
          <button onClick={openAppSettings} className="btn-primary" style={{ background: '#64748b', padding: '10px 20px', fontSize: '13px' }}>
            ⚙ Open App Settings
          </button>
          <br />
          <button onClick={loadAllAudio} className="btn-glass" style={{ marginTop: '12px' }}>
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#06060e', color: '#f1f5f9', padding: '20px 24px 120px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={loadAllAudio} className="btn-glass" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <HardDrive size={28} color="#7c3aed" /> Offline Library
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          {tracks.length} audio files • {storageUsed}
        </p>
      </div>

      {tracks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
          <Music size={64} color="#a78bfa" style={{ marginBottom: '16px', opacity: 0.3 }} />
          <div style={{ fontSize: '18px', color: '#f1f5f9' }}>No audio files found</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>Download songs or add music to your Downloads folder</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {vibelyDownloads.length > 0 && (
            <section>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#a78bfa', marginBottom: '12px' }}>💜 Vibely Downloads</h2>
              {vibelyDownloads.map((track, i) => {
                const isCurrentlyPlaying = playingTrackId === track.videoId;
                return (
                  <div key={track.videoId} className="glass-card" style={{ 
                    padding: '12px 16px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer',
                    borderColor: isCurrentlyPlaying ? 'rgba(124,58,237,0.5)' : undefined,
                    background: isCurrentlyPlaying ? 'rgba(124,58,237,0.1)' : undefined
                  }} onClick={() => playTrack(track)}>
                    <span style={{ color: '#64748b', fontSize: '18px', width: '28px' }}>#{i + 1}</span>
                    {track.thumbnail ? <img src={track.thumbnail} alt="" style={{ width: '48px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} /> :
                      <div style={{ width: '48px', height: '36px', borderRadius: '4px', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music size={18} color="#a78bfa" /></div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#f1f5f9', fontWeight: 500, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                      <div style={{ color: '#a78bfa', fontSize: '12px' }}>{track.artist || 'Unknown'}</div>
                    </div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>{new Date(track.downloadedAt).toLocaleDateString()}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(track); }}
                      style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '8px' }}><Trash2 size={16} /></button>
                    {isCurrentlyPlaying ? <Pause size={16} color="#a78bfa" /> : <Play size={16} color="#a78bfa" />}
                  </div>
                );
              })}
            </section>
          )}

          {deviceAudio.length > 0 && (
            <section>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', marginBottom: '12px' }}>📁 Device Audio</h2>
              {deviceAudio.map((track, i) => {
                const isCurrentlyPlaying = playingTrackId === track.videoId;
                return (
                  <div key={track.videoId} className="glass-card" style={{ 
                    padding: '12px 16px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer',
                    borderColor: isCurrentlyPlaying ? 'rgba(16,185,129,0.5)' : undefined,
                    background: isCurrentlyPlaying ? 'rgba(16,185,129,0.1)' : undefined
                  }} onClick={() => playTrack(track)}>
                    <span style={{ color: '#64748b', fontSize: '18px', width: '28px' }}>#{vibelyDownloads.length + i + 1}</span>
                    <div style={{ width: '48px', height: '36px', borderRadius: '4px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music size={18} color="#10b981" /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#f1f5f9', fontWeight: 500, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                      <div style={{ color: '#10b981', fontSize: '12px' }}>{track.artist}</div>
                    </div>
                    <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>{track.filePath?.split('.').pop()}</span>
                    {isCurrentlyPlaying ? <Pause size={16} color="#10b981" /> : <Play size={16} color="#10b981" />}
                  </div>
                );
              })}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
