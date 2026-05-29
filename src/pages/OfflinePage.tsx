import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Trash2, Music, Download, HardDrive } from 'lucide-react';
import { getDownloads, deleteDownload, getStorageUsed, type DownloadedTrack } from '../services/offlineStorage';
import { useMusicStore } from '../store/musicStore';

interface Props { onBack: () => void; onSongPlay: () => void; }

export default function OfflinePage({ onBack, onSongPlay }: Props) {
  const [downloads, setDownloads] = useState<DownloadedTrack[]>([]);
  const [storageUsed, setStorageUsed] = useState('');
  const [loading, setLoading] = useState(true);
  const { setQueue } = useMusicStore();

  useEffect(() => { loadDownloads(); }, []);

  const loadDownloads = async () => {
    try {
      const dl = await getDownloads();
      setDownloads(dl);
      setStorageUsed(await getStorageUsed());
    } catch (e) {
      // Fallback to localStorage for web
      const saved = JSON.parse(localStorage.getItem('vibely_downloads') || '[]');
      setDownloads(saved);
    }
    setLoading(false);
  };

  const playDownload = (track: DownloadedTrack, index: number) => {
    setQueue(downloads.map(d => ({
      videoId: d.videoId,
      title: d.title,
      artist: d.artist,
      thumbnail: d.thumbnail,
      duration: d.duration,
    })), index);
    onSongPlay();
  };

  const handleDelete = async (videoId: string) => {
    try {
      await deleteDownload(videoId);
    } catch (e) {
      // Fallback for web
      const saved = JSON.parse(localStorage.getItem('vibely_downloads') || '[]');
      localStorage.setItem('vibely_downloads', JSON.stringify(saved.filter((d: any) => d.videoId !== videoId)));
    }
    loadDownloads();
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#06060e' }}>
      <div style={{ textAlign: 'center', color: '#a78bfa' }}>Loading...</div>
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
          {downloads.length} songs • {storageUsed}
        </p>
      </div>

      {downloads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
          <Download size={64} color="#a78bfa" style={{ marginBottom: '16px', opacity: 0.3 }} />
          <div style={{ fontSize: '18px', color: '#f1f5f9' }}>No downloads yet</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>Download songs to listen offline</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {downloads.map((track, i) => (
            <div key={track.videoId} className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
              onClick={() => playDownload(track, i)}>
              <span style={{ color: '#64748b', fontSize: '18px', width: '28px' }}>#{i + 1}</span>
              {track.thumbnail && <img src={track.thumbnail} alt="" style={{ width: '48px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#f1f5f9', fontWeight: 500, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                <div style={{ color: '#a78bfa', fontSize: '12px' }}>{track.artist || 'Unknown'}</div>
              </div>
              <span style={{ color: '#64748b', fontSize: '11px' }}>
                {new Date(track.downloadedAt).toLocaleDateString()}
              </span>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(track.videoId); }}
                style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '8px' }}>
                <Trash2 size={16} />
              </button>
              <Play size={16} color="#a78bfa" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
