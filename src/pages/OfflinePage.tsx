import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Trash2, Music, HardDrive, FolderSearch, Shield, RefreshCw, Settings } from 'lucide-react';
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
  const [needsPermission, setNeedsPermission] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const { setQueue } = useMusicStore();

  useEffect(() => { checkAndLoad(); }, []);

  const checkAndLoad = async () => {
    setLoading(true);
    if (isNativeApp()) {
      const granted = await hasStoragePermission();
      if (granted) {
        setNeedsPermission(false);
        await loadAllAudio();
      } else {
        setNeedsPermission(true);
        await loadFromLocalStorage();
      }
    } else {
      setNeedsPermission(false);
      await loadFromLocalStorage();
    }
    setLoading(false);
  };

  const requestPermission = async () => {
    try {
      const { Filesystem } = await import('@capacitor/filesystem');
      await Filesystem.requestPermissions();
      const granted = await hasStoragePermission();
      if (granted) {
        setNeedsPermission(false);
        await loadAllAudio();
      } else {
        openAppSettings();
      }
    } catch (e) {
      openAppSettings();
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

    // Toggle: if already playing this track, stop it
    if (stopIfPlaying(trackId)) {
      setPlayingTrackId(null);
      return;
    }

    // Stop everything else
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

  // Loading state
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#06060e' }}>
      <div style={{ textAlign: 'center', color: '#a78bfa' }}>
        <FolderSearch size={48} style={{ marginBottom: '16px', animation: 'pulse 1.5s infinite' }} />
        <div>Scanning for audio files...</div>
        <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }`}</style>
      </div>
    </div>
  );

  // Permission needed screen
  if (needsPermission) {
    return (
      <div style={{ minHeight: '100vh', background: '#06060e', color: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <button onClick={onBack} style={{ position: 'absolute', top: '20px', left: '20px', background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <Shield size={80} color="#a78bfa" style={{ marginBottom: '24px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Access Your Music</h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
            Vibely needs permission to find and play music files stored on your device. Your files stay private and never leave your phone.
          </p>
          
          <button 
            onClick={requestPermission}
            className="btn-primary" 
            style={{ padding: '16px 40px', fontSize: '16px', width: '100%', marginBottom: '12px' }}
          >
            <Shield size={18} /> Grant Permission
          </button>
          
          <button 
            onClick={openAppSettings}
            style={{ 
              width: '100%', padding: '14px 24px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', color: '#94a3b8', fontSize: '14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <Settings size={16} /> Open App Settings
          </button>
          
          <p style={{ color: '#64748b', fontSize: '11px', marginTop: '16px' }}>
            Settings → Apps → Vibely → Permissions → Music & audio
          </p>
        </div>
      </div>
    );
  }

  // Main library
  return (
    <div style={{ minHeight: '100vh', background: '#06060e', color: '#f1f5f9', padding: '20px 24px 120px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={loadAllAudio} className="btn-glass" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Title */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <HardDrive size={26} color="#7c3aed" /> Offline Library
        </h1>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
          {tracks.length} audio files • {storageUsed || '0 KB'}
        </p>
      </div>

      {/* Empty state */}
      {tracks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
          <Music size={64} color="#a78bfa" style={{ marginBottom: '16px', opacity: 0.3 }} />
          <div style={{ fontSize: '18px', color: '#f1f5f9', fontWeight: 600 }}>No audio files found</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>Download songs or add music to your Downloads folder</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Vibely Downloads */}
          {vibelyDownloads.length > 0 && (
            <section>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#a78bfa', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                💜 Vibely Downloads · {vibelyDownloads.length}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {vibelyDownloads.map((track, i) => {
                  const isPlaying = playingTrackId === track.videoId;
                  return (
                    <div 
                      key={track.videoId} 
                      className="glass-card" 
                      style={{ 
                        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                        borderColor: isPlaying ? 'rgba(124,58,237,0.5)' : undefined,
                        background: isPlaying ? 'rgba(124,58,237,0.12)' : undefined,
                        transition: 'all 0.15s'
                      }} 
                      onClick={() => playTrack(track)}
                    >
                      <span style={{ color: '#64748b', fontSize: '13px', width: '24px', fontWeight: 500 }}>#{i + 1}</span>
                      {track.thumbnail ? (
                        <img src={track.thumbnail} alt="" style={{ width: '44px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '44px', height: '32px', borderRadius: '4px', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Music size={16} color="#a78bfa" />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#f1f5f9', fontWeight: 500, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {track.title}
                        </div>
                        <div style={{ color: '#a78bfa', fontSize: '11px', marginTop: '1px' }}>{track.artist || 'Unknown'}</div>
                      </div>
                      <span style={{ color: '#475569', fontSize: '10px', flexShrink: 0 }}>
                        {new Date(track.downloadedAt).toLocaleDateString()}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(track); }}
                        style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '6px', flexShrink: 0 }}
                      >
                        <Trash2 size={14} />
                      </button>
                      <div style={{ width: '32px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                        {isPlaying ? <Pause size={18} color="#a78bfa" /> : <Play size={18} color="#a78bfa" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Device Audio */}
          {deviceAudio.length > 0 && (
            <section>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📁 Device Audio · {deviceAudio.length}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {deviceAudio.map((track, i) => {
                  const isPlaying = playingTrackId === track.videoId;
                  return (
                    <div 
                      key={track.videoId} 
                      className="glass-card" 
                      style={{ 
                        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                        borderColor: isPlaying ? 'rgba(16,185,129,0.5)' : undefined,
                        background: isPlaying ? 'rgba(16,185,129,0.1)' : undefined,
                        transition: 'all 0.15s'
                      }} 
                      onClick={() => playTrack(track)}
                    >
                      <span style={{ color: '#64748b', fontSize: '13px', width: '24px', fontWeight: 500 }}>#{vibelyDownloads.length + i + 1}</span>
                      <div style={{ width: '44px', height: '32px', borderRadius: '4px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Music size={16} color="#10b981" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#f1f5f9', fontWeight: 500, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {track.title}
                        </div>
                        <div style={{ color: '#10b981', fontSize: '11px', marginTop: '1px' }}>{track.artist}</div>
                      </div>
                      <span style={{ color: '#475569', fontSize: '9px', textTransform: 'uppercase', flexShrink: 0 }}>
                        {track.filePath?.split('.').pop()}
                      </span>
                      <div style={{ width: '32px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                        {isPlaying ? <Pause size={18} color="#10b981" /> : <Play size={18} color="#10b981" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
