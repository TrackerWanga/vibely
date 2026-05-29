import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Trash2, Music, HardDrive, FolderSearch, Shield } from 'lucide-react';
import { getAllAudio, getStorageUsed, deleteDownload, type DownloadedTrack } from '../services/offlineStorage';
import { isNativeApp } from '../services/platform';
import { useMusicStore } from '../store/musicStore';

interface Props { onBack: () => void; onSongPlay: () => void; }

export default function OfflinePage({ onBack, onSongPlay }: Props) {
  const [tracks, setTracks] = useState<DownloadedTrack[]>([]);
  const [storageUsed, setStorageUsed] = useState('');
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const { setQueue } = useMusicStore();

  useEffect(() => { requestAndLoad(); }, []);

  const requestAndLoad = async () => {
    setLoading(true);
    setPermissionDenied(false);

    if (isNativeApp()) {
      try {
        // Request storage permission on Android 13+
        const { Filesystem } = await import('@capacitor/filesystem');
        try {
          await Filesystem.requestPermissions();
        } catch (e) {
          // Permission dialog might not be supported on all versions
        }
        await loadAllAudio();
      } catch (e: any) {
        if (e.message?.includes('permission') || e.message?.includes('denied')) {
          setPermissionDenied(true);
        }
        // Fallback to localStorage for web
        await loadFromLocalStorage();
      }
    } else {
      await loadFromLocalStorage();
    }
    setLoading(false);
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
    setStorageUsed('');
  };

  const playTrack = (track: DownloadedTrack, index: number) => {
    if (track.source === 'vibely' || !isNativeApp()) {
      // Play via YouTube streaming
      setQueue(tracks.filter(t => t.source === 'vibely').map(d => ({
        videoId: d.videoId,
        title: d.title,
        artist: d.artist,
        thumbnail: d.thumbnail,
        duration: d.duration,
      })), index);
    } else {
      // Play local file directly
      const audio = new Audio(track.filePath);
      audio.play();
    }
    onSongPlay();
  };

  const playAllLocal = () => {
    if (tracks.length === 0) return;
    const first = tracks[0];
    if (first.source === 'vibely' || !isNativeApp()) {
      const vibelyTracks = tracks.filter(t => t.source === 'vibely');
      if (vibelyTracks.length > 0) {
        setQueue(vibelyTracks.map(d => ({
          videoId: d.videoId,
          title: d.title,
          artist: d.artist,
          thumbnail: d.thumbnail,
          duration: d.duration,
        })), 0);
      }
    } else {
      // Play first local track
      const audio = new Audio(first.filePath);
      audio.play();
    }
    onSongPlay();
  };

  const handleDelete = async (track: DownloadedTrack) => {
    if (track.source === 'device') {
      // Can't delete device files from here
      return;
    }
    try {
      await deleteDownload(track.videoId);
    } catch (e) {
      const saved = JSON.parse(localStorage.getItem('vibely_downloads') || '[]');
      localStorage.setItem('vibely_downloads', JSON.stringify(saved.filter((d: any) => d.videoId !== track.videoId)));
    }
    loadAllAudio();
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

  return (
    <div style={{ minHeight: '100vh', background: '#06060e', color: '#f1f5f9', padding: '20px 24px 120px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <HardDrive size={28} color="#7c3aed" /> Offline Library
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          {tracks.length} audio files found • {storageUsed}
        </p>
      </div>

      {permissionDenied && (
        <div style={{ padding: '16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={24} color="#f59e0b" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#f59e0b', fontSize: '14px' }}>Storage Permission Needed</div>
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>Grant storage access to see all audio files on your device</div>
          </div>
          <button onClick={requestAndLoad} className="btn-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>Grant Access</button>
        </div>
      )}

      {tracks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
          <Music size={64} color="#a78bfa" style={{ marginBottom: '16px', opacity: 0.3 }} />
          <div style={{ fontSize: '18px', color: '#f1f5f9' }}>No audio files found</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>Download songs from Vibely or add music files to your device</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Vibely Downloads Section */}
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
                    <span style={{ color: '#64748b', fontSize: '11px' }}>
                      {new Date(track.downloadedAt).toLocaleDateString()}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(track); }}
                      style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '8px' }}>
                      <Trash2 size={16} />
                    </button>
                    <Play size={16} color="#a78bfa" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Device Audio Section */}
          {deviceAudio.length > 0 && (
            <section>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', marginBottom: '12px' }}>📁 Device Audio</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {deviceAudio.map((track, i) => (
                  <div key={track.videoId} className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
                    onClick={() => playTrack(track, i)}>
                    <span style={{ color: '#64748b', fontSize: '18px', width: '28px' }}>#{i + 1}</span>
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
