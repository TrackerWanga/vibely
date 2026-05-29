import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Music } from 'lucide-react';
import { useMusicStore } from '../store/musicStore';

interface Props { onBack: () => void; onArtistSelect: (name: string) => void; onSongPlay: () => void; }

export default function BelovedPage({ onBack, onArtistSelect, onSongPlay }: Props) {
  const [beloved, setBeloved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { setQueue } = useMusicStore();

  useEffect(() => { loadBeloved(); }, []);

  const loadBeloved = async () => {
    try {
      const res = await fetch('https://music-discovery-platform.vercel.app/api/beloved');
      const data = await res.json();
      setBeloved(data?.beloved || []);
    } catch (e) {}
    setLoading(false);
  };

  const playArtist = (artist: any) => {
    if (artist.topSongs?.length) {
      setQueue(artist.topSongs.map((s: any) => ({
        videoId: s.videoId, title: s.title, artist: artist.name,
        thumbnail: s.thumbnail, duration: s.duration,
      })), 0);
      onSongPlay();
    }
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
        <h1 style={{ fontSize: '32px', fontWeight: 900 }}>🌟 Beloved & Trending</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>{beloved.length} global superstars</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
        {beloved.map((artist: any, i: number) => (
          <div key={i} className="glass-card" style={{ padding: '14px', cursor: 'pointer' }}
            onClick={() => onArtistSelect(artist.name)}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: artist.topSongs?.length > 0 ? '8px' : '0' }}>
              {artist.channel?.image ? (
                <img src={artist.channel.image} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Music size={20} color="#f59e0b" />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#f1f5f9' }}>{artist.name}</div>
                <div style={{ color: '#64748b', fontSize: '11px' }}>
                  {(artist.channel?.subscribers || 0).toLocaleString()} subs {artist.channel?.verified ? '✓' : ''}
                </div>
              </div>
            </div>
            {artist.topSongs?.slice(0, 3).map((song: any, j: number) => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 0', cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); playArtist(artist); }}>
                <span style={{ color: '#64748b', fontSize: '10px', width: '16px' }}>#{j + 1}</span>
                <div style={{ flex: 1, fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {song.title?.substring(0, 40)}
                </div>
                <span style={{ color: '#64748b', fontSize: '10px' }}>{song.duration}</span>
                <Play size={10} color="#f59e0b" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
