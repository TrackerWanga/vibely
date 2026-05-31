import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Trash2, Music, HardDrive, FolderSearch, Shield, RefreshCw, Settings, Menu } from 'lucide-react';
import { getAllAudio, getStorageUsed, deleteDownload, getPlayableUrl, type DownloadedTrack } from '../services/offlineStorage';
import { isNativeApp } from '../services/platform';
import { hasStoragePermission, requestStoragePermission, openAppSettings } from '../services/permissions';
import { setQueue, stop, toggle, isPlaying } from '../services/audioManager';
import { useMusicStore } from '../store/musicStore';

interface Props { onBack: () => void; onSongPlay: () => void; onMenuClick: () => void; }

export default function OfflinePage({ onBack, onSongPlay, onMenuClick }: Props) {
  const [tracks, setTracks] = useState<DownloadedTrack[]>([]);
  const [storageUsed, setStorageUsed] = useState('');
  const [loading, setLoading] = useState(true);
  const [needPerm, setNeedPerm] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const { setQueue: setStreamQueue } = useMusicStore();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    if (isNativeApp()) {
      const ok = await hasStoragePermission();
      if (ok) { setNeedPerm(false); await loadTracks(); }
      else { setNeedPerm(true); await localOnly(); }
    } else { setNeedPerm(false); await localOnly(); }
    setLoading(false);
  };

  const loadTracks = async () => {
    try { const all = await getAllAudio(); setTracks(all); setStorageUsed(await getStorageUsed()); }
    catch { await localOnly(); }
  };

  const localOnly = async () => {
    const saved = JSON.parse(localStorage.getItem('vibely_downloads') || '[]');
    setTracks(saved.map((d: any) => ({ ...d, source: 'device' })));
  };

  const handlePerm = async () => {
    const ok = await requestStoragePermission();
    if (ok) { setNeedPerm(false); await loadTracks(); }
    else { openAppSettings(); }
  };

  const handlePlay = (track: DownloadedTrack) => {
    if (track.source === 'device' && track.filePath && isNativeApp()) {
      const url = getPlayableUrl(track.filePath);
      // Build queue of all device tracks starting from this one
      const deviceTracks = tracks.filter(t => t.source === 'device' && t.filePath);
      const startIdx = deviceTracks.findIndex(t => t.videoId === track.videoId);
      const queueItems = deviceTracks.map(t => ({
        url: getPlayableUrl(t.filePath!),
        trackId: t.videoId,
        info: { title: t.title, artist: t.artist }
      }));
      
      if (isPlaying(track.videoId)) {
        stop();
        setPlayingId(null);
      } else {
        setQueue(queueItems, startIdx >= 0 ? startIdx : 0);
        setPlayingId(track.videoId);
      }
    } else if (track.source === 'vibely') {
      stop();
      const v = tracks.filter(t => t.source === 'vibely');
      const i = v.findIndex(t => t.videoId === track.videoId);
      if (i >= 0) {
        setPlayingId(track.videoId);
        setStreamQueue(v.map(d => ({
          videoId: d.videoId, title: d.title, artist: d.artist,
          thumbnail: d.thumbnail, duration: d.duration,
        })), i);
        onSongPlay();
      }
    }
  };

  const handleDelete = async (track: DownloadedTrack) => {
    if (isPlaying(track.videoId)) stop();
    await deleteDownload(track.videoId);
    await loadTracks();
  };

  const vibely = tracks.filter(t => t.source === 'vibely');
  const device = tracks.filter(t => t.source === 'device');

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#06060e' }}>
      <div style={{ textAlign: 'center', color: '#a78bfa' }}>Loading...</div>
    </div>
  );

  if (needPerm) return (
    <div style={{ minHeight: '100vh', background: '#06060e', color: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <button onClick={onBack} style={{ position: 'absolute', top: 20, left: 20, background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer' }}>
        <ArrowLeft size={16} /> Back
      </button>
      <Shield size={80} color="#a78bfa" style={{ marginBottom: 24 }} />
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, textAlign: 'center' }}>Access Your Music</h1>
      <p style={{ color: '#94a3b8', fontSize: 15, textAlign: 'center', marginBottom: 32, maxWidth: 340 }}>
        Vibely needs permission to find and play music on your device
      </p>
      <button onClick={handlePerm} className="btn-primary" style={{ padding: '16px 40px', fontSize: 16, width: '100%', maxWidth: 320, marginBottom: 12 }}>
        <Shield size={18} /> Grant Permission
      </button>
      <button onClick={openAppSettings} style={{ width: '100%', maxWidth: 320, padding: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#94a3b8', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Settings size={16} /> Open App Settings
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#06060e', color: '#f1f5f9', padding: '20px 24px 120px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={load} className="btn-glass" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginRight: 8 }}>
          <RefreshCw size={14} /> Refresh
        </button>
        <button onClick={onMenuClick} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 8 }}>
          <Menu size={20} />
        </button>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 12 }}>
          <HardDrive size={26} color="#7c3aed" /> Offline Library
        </h1>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{tracks.length} audio files • {storageUsed || '0 KB'}</p>
      </div>

      {tracks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
          <Music size={64} color="#a78bfa" style={{ marginBottom: 16, opacity: 0.3 }} />
          <div style={{ fontSize: 18, color: '#f1f5f9', fontWeight: 600 }}>No audio files found</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {vibely.length > 0 && (
            <section>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>💜 Vibely Downloads · {vibely.length}</h2>
              {vibely.map((t, i) => (
                <div key={t.videoId} className="glass-card" onClick={() => handlePlay(t)} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 4, borderColor: playingId === t.videoId ? 'rgba(124,58,237,0.5)' : undefined, background: playingId === t.videoId ? 'rgba(124,58,237,0.12)' : undefined }}>
                  <span style={{ color: '#64748b', fontSize: 13, width: 24 }}>#{i+1}</span>
                  {t.thumbnail ? <img src={t.thumbnail} style={{ width: 44, height: 32, borderRadius: 4 }} /> : <div style={{ width: 44, height: 32, borderRadius: 4, background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music size={16} color="#a78bfa" /></div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#f1f5f9', fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ color: '#a78bfa', fontSize: 11, marginTop: 1 }}>{t.artist || 'Unknown'}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDelete(t); }} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: 6 }}><Trash2 size={14} /></button>
                  <div style={{ width: 32, display: 'flex', justifyContent: 'center' }}>{playingId === t.videoId ? <Pause size={18} color="#a78bfa" /> : <Play size={18} color="#a78bfa" />}</div>
                </div>
              ))}
            </section>
          )}
          {device.length > 0 && (
            <section>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#10b981', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📁 Device Audio · {device.length}</h2>
              {device.map((t, i) => (
                <div key={t.videoId} className="glass-card" onClick={() => handlePlay(t)} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 4, borderColor: playingId === t.videoId ? 'rgba(16,185,129,0.5)' : undefined, background: playingId === t.videoId ? 'rgba(16,185,129,0.1)' : undefined }}>
                  <span style={{ color: '#64748b', fontSize: 13, width: 24 }}>#{vibely.length+i+1}</span>
                  <div style={{ width: 44, height: 32, borderRadius: 4, background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music size={16} color="#10b981" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#f1f5f9', fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ color: '#10b981', fontSize: 11, marginTop: 1 }}>{t.artist}</div>
                  </div>
                  <span style={{ color: '#475569', fontSize: 9, textTransform: 'uppercase' }}>{t.filePath?.split('.').pop()}</span>
                  <div style={{ width: 32, display: 'flex', justifyContent: 'center' }}>{playingId === t.videoId ? <Pause size={18} color="#10b981" /> : <Play size={18} color="#10b981" />}</div>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
