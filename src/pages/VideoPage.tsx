import { useState, useEffect } from 'react';
import { ArrowLeft, Music, Search, Play, Loader, TrendingUp } from 'lucide-react';
import { useMusicStore } from '../store/musicStore';

interface Props {
  onBack: () => void;
  onAudioMode: () => void;
}

const MEGAN = 'https://apis.megan.qzz.io';
const KEY = 'megan_admin_master';

export default function VideoPage({ onBack, onAudioMode }: Props) {
  const { currentTrack } = useMusicStore();
  const [videoId, setVideoId] = useState(currentTrack?.videoId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [mode, setMode] = useState<'player' | 'search'>(currentTrack?.videoId ? 'player' : 'search');

  useEffect(() => {
    if (currentTrack?.videoId) {
      setVideoId(currentTrack.videoId);
      setSelectedVideo(currentTrack);
      setMode('player');
    }
  }, [currentTrack]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${MEGAN}/api/search/youtube?q=${encodeURIComponent(searchQuery)}&apikey=${KEY}`);
      const data = await res.json();
      setResults(data?.results || []);
    } catch (e) {}
    setLoading(false);
  };

  const playVideo = (item: any) => {
    setVideoId(item.videoId);
    setSelectedVideo(item);
    setMode('player');
  };

  const switchToAudio = () => {
    if (selectedVideo) {
      const store = useMusicStore.getState();
      store.setQueue([{
        videoId: selectedVideo.videoId,
        title: selectedVideo.title,
        artist: selectedVideo.author || selectedVideo.channelTitle || '',
        thumbnail: selectedVideo.thumbnail || `https://i.ytimg.com/vi/${selectedVideo.videoId}/hqdefault.jpg`,
        duration: selectedVideo.duration || '',
      }], 0);
    }
    onAudioMode();
  };

  if (mode === 'player' && videoId) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', position: 'relative' }}>
        {/* Controls overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          padding: '16px 20px',
          background: 'linear-gradient(rgba(0,0,0,0.8), transparent)',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <button onClick={() => setMode('search')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <ArrowLeft size={24} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedVideo?.title?.substring(0, 50) || 'Video Player'}
            </div>
            {selectedVideo?.author && (
              <div style={{ color: '#ccc', fontSize: '12px' }}>{selectedVideo.author}</div>
            )}
          </div>
          <button onClick={switchToAudio} style={{
            background: 'rgba(124,58,237,0.8)', border: 'none', borderRadius: '8px',
            color: '#fff', padding: '8px 16px', fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <Music size={16} /> Audio
          </button>
        </div>

        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          style={{ width: '100%', height: '100vh', border: 'none' }}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  // Search mode
  return (
    <div style={{ minHeight: '100vh', background: '#06060e', color: '#f1f5f9', padding: '20px 24px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        🎬 Video Player
      </h1>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search YouTube videos..."
          style={{
            flex: 1, padding: '14px 18px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
            color: '#f1f5f9', fontSize: '15px', outline: 'none'
          }}
          autoFocus
        />
        <button onClick={handleSearch} className="btn-primary" style={{ padding: '14px 24px' }}>
          <Search size={18} />
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#a78bfa' }}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Trending section */}
      {!searchQuery && results.length === 0 && !loading && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} /> Trending Videos
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Search for any video or artist to start watching</p>
        </div>
      )}

      {/* Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {results.map((item: any, i: number) => (
          <div key={i} className="glass-card" onClick={() => playVideo(item)}
            style={{ padding: '12px', display: 'flex', gap: '12px', cursor: 'pointer', alignItems: 'center' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img src={item.thumbnail} alt="" style={{ width: '140px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>
                {item.duration}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#f1f5f9', fontWeight: 500, fontSize: '13px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.title}
              </div>
              <div style={{ color: '#64748b', fontSize: '11px' }}>
                {item.author || item.channelTitle} • {(item.views || 0).toLocaleString()} views
              </div>
            </div>
            <Play size={18} color="#f43f5e" />
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
