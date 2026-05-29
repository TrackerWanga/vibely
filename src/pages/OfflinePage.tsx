import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Trash2, Music, HardDrive, FolderSearch, Shield, RefreshCw } from 'lucide-react';
import { getAllAudio, getStorageUsed, deleteDownload, type DownloadedTrack } from '../services/offlineStorage';
import { isNativeApp } from '../services/platform';
import { useMusicStore } from '../store/musicStore';

interface Props { onBack: () => void; onSongPlay: () => void; }

export default function OfflinePage({ onBack, onSongPlay }: Props) {
  const [tracks, setTracks] = useState<DownloadedTrack[]>([]);
  const [storageUsed, setStorageUsed] = useState('');
  const [loading, setLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const { setQueue } = useMusicStore();

  useEffect(() => { checkPermissionAndLoad(); }, []);

  const checkPermissionAndLoad = async () => {
    setLoading(true);
    if (isNativeApp()) {
      try {
        const { Filesystem } = await import('@capacitor/filesystem');
        const permStatus = await Filesystem.checkPermissions();
        
        if (permStatus.publicStorage === 'granted') {
          setPermissionState('granted');
          await loadAllAudio();
        } else if (permStatus.publicStorage === 'denied') {
          setPermissionState('denied');
          await loadFromLocalStorage();
        } else {
          setPermissionState('prompt');
          await requestStoragePermission();
        }
      } catch (e) {
        console.error('Permission check failed:', e);
        await loadAllAudio(); // Try anyway
      }
    } else {
      setPermissionState('granted');
      await loadFromLocalStorage();
    }
    setLoading(false);
  };

  const requestStoragePermission = async () => {
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
      console.error('Permission request failed:', e);
      await loadFromLocalStorage();
    }
  };

  const loadAllAudio = async () => {
    try {
      const all = await getAllAudio();
      setTracks(all);
      setStorageUsed(await getStorageUsed());
    } catch (e) {
      console.error('Load audio failed:', e);
      await loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = async () => {
    const saved = JSON.parse(localStorage.getItem('vibely_downloads') || '[]');
    setTracks(saved.map((d: any) => ({ ...d, source: 'device' as const })));
    setStorageUsed('');
  };

  const playTrack = (track: DownloadedTrack, index: number) => {
    if (track.source === 'device' && track.filePath && isNativeApp()) {
      // Convert file:// URI to accessible path
      const audio = new Audio(track.filePath);
      audio.play().catch(e => console.error('Playback failed:', e));
    } else {
      // Stream from YouTube
      const allVibely = tracks.filter(t => t.source === 'vibely');
      const idx = allVibely.findIndex(t => t.videoId === track.videoId);
      if (idx >= 0 && allVibely.length > 0) {
        setQueue(allVibely.map(d => ({
          videoId: d.videoId,
          title: d.title,
          artist: d.artist,
          thumbnail: d.thumbnail,
          duration: d.duration,
        })), idx);
        onSongPlay();
      }
    }
  };

  const handleDelete = async (track: DownloadedTrack) => {
    await deleteDownload(track.videoId);
    await loadAllAudio();
  };

  const vibelyDownloads = tracks.filter(t => t.source === 'vibely');
  const deviceAudio = tracks.filter(t => t.source === 'device');

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#06060e' }}>
      <div style={{ textAlign: 'center', color: '#a78bfa' }}>
        <FolderSearch size={48} style={{ marginBottom: '16px', animation: 'pulse 1.5s infinite' }} />
        <div>Scanning device for audio files...</div>
        <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }`}</style>
      </div>
    </div>
  );

  if (permissionState === 'denied' || permissionState === 'prompt') {
    return (
      <div style={{ minHeight: '100vh', background: '#06060e', color: '#f1f5f9', padding: '20px 24px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <Shield size={64} color="#f59e0b" style={{ marginBottom: '16px' }} />
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Storage Permission Required</div>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
            Vibely needs access to your device storage to find and play audio files.
          </p>
          <button onClick={requestStoragePermission} className="btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>
            <Shield size={18} /> Grant Storage Access
          </button>
          <p style={{ color: '#64748b', fontSize: '12px', marginTop: '12px' }}>
            You can also enable this in Settings → Apps → Vibely → Permissions
          </p>
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
          {tracks.length} audio files found • {storageUsed}
        </p>
      </div>

      {tracks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
          <Music size={64} color="#a78bfa" style={{ marginBottom: '16px', opacity: 0.3 }} />
          <div style={{ fontSize: '18px', color: '#f1f5f9' }}>No audio files found</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>Download songs or add music files to your Downloads folder</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {vibelyDownloads.length > 0 && (
            <section>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#a78bfa', marginBottom: '12px' }}>💜 Vibely Downloads</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {vibelyDownloads.map((track, i) => (
                  <div key={track.videoId} className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
                    onClick={() => playTrack(track, i)}>
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
                    <Play size={16} color="#a78bfa" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {deviceAudio.length > 0 && (
            <section>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', marginBottom: '12px' }}>📁 Device Audio</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {deviceAudio.map((track, i) => (
                  <div key={track.videoId} className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
                    onClick={() => playTrack(track, i)}>
                    <span style={{ color: '#64748b', fontSize: '18px', width: '28px' }}>#{vibelyDownloads.length + i + 1}</span>
                    <div style={{ width: '48px', height: '36px', borderRadius: '4px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music size={18} color="#10b981" /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#f1f5f9', fontWeight: 500, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                      <div style={{ color: '#10b981', fontSize: '12px' }}>{track.artist || 'Unknown Artist'}</div>
                    </div>
                    <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>{track.filePath?.split('.').pop()}</span>
                    <Play size={16} color="#10b981" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
