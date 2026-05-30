import { useState, useEffect } from 'react';
import { ArrowLeft, Music, HardDrive, FolderSearch, RefreshCw, Info } from 'lucide-react';
import { getAllAudio, getStorageUsed, deleteDownload, type DownloadedTrack } from '../services/offlineStorage';
import { isNativeApp } from '../services/platform';
import { hasStoragePermission } from '../services/permissions';
import { toggleTrack, stopTrack, isTrackPlaying, getCurrentTrack, onTrackChange } from '../services/offlinePlayer';
import { useMusicStore } from '../store/musicStore';
import PermissionGate from '../components/offline/PermissionGate';
import TrackRow from '../components/offline/TrackRow';

interface Props { onBack: () => void; onSongPlay: () => void; }

export default function OfflinePage({ onBack, onSongPlay }: Props) {
  const [tracks, setTracks] = useState<DownloadedTrack[]>([]);
  const [storageUsed, setStorageUsed] = useState('');
  const [loading, setLoading] = useState(true);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const { setQueue } = useMusicStore();

  useEffect(() => {
    checkAndLoad();
    const unsub = onTrackChange(() => {
      setPlayingId(getCurrentTrack()?.videoId || null);
    });
    return () => { unsub(); stopTrack(); };
  }, []);

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
      }
    } catch (e) {}
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

  const handlePlayTrack = (track: DownloadedTrack) => {
    if (track.source === 'device' && track.filePath && isNativeApp()) {
      toggleTrack({ videoId: track.videoId, title: track.title, artist: track.artist, filePath: track.filePath });
      setPlayingId(isTrackPlaying(track.videoId) ? null : track.videoId);
    } else if (track.source === 'vibely') {
      stopTrack();
      const allVibely = tracks.filter(t => t.source === 'vibely');
      const idx = allVibely.findIndex(t => t.videoId === track.videoId);
      if (idx >= 0) {
        setQueue(allVibely.map(d => ({
          videoId: d.videoId, title: d.title, artist: d.artist,
          thumbnail: d.thumbnail, duration: d.duration,
        })), idx);
        onSongPlay();
      }
    }
  };

  const handleDelete = async (track: DownloadedTrack) => {
    if (isTrackPlaying(track.videoId)) stopTrack();
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

  if (needsPermission) {
    return (
      <div style={{ position: 'relative' }}>
        <button onClick={onBack} style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <PermissionGate onRequestPermission={requestPermission} />
      </div>
    );
  }

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
          {vibelyDownloads.length > 0 && (
            <section>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#a78bfa', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                💜 Vibely Downloads · {vibelyDownloads.length}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {vibelyDownloads.map((track, i) => (
                  <TrackRow key={track.videoId} track={track} index={i} isPlaying={playingId === track.videoId} onPlay={() => handlePlayTrack(track)} onDelete={() => handleDelete(track)} color="#a78bfa" />
                ))}
              </div>
            </section>
          )}
          {deviceAudio.length > 0 && (
            <section>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📁 Device Audio · {deviceAudio.length}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {deviceAudio.map((track, i) => (
                  <TrackRow key={track.videoId} track={track} index={i} isPlaying={playingId === track.videoId} onPlay={() => handlePlayTrack(track)} onDelete={() => handleDelete(track)} color="#10b981" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
