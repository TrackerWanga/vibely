import { useState, useEffect, useRef } from 'react';
import { Play, ArrowLeft, Loader, Music } from 'lucide-react';
import { useMusicStore } from '../store/musicStore';

interface Props { onBack: () => void; onArtistSelect: (name: string) => void; onSongPlay: () => void; }

const COUNTRIES_PER_PAGE = 5;

export default function GospelPage({ onBack, onArtistSelect, onSongPlay }: Props) {
  const [allGospelArtists, setAllGospelArtists] = useState<any[]>([]);
  const [visibleArtists, setVisibleArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const { setQueue } = useMusicStore();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadAllGospel(); }, []);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && visibleArtists.length < allGospelArtists.length) {
          loadMorePage(page + 1);
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadingMore, visibleArtists, allGospelArtists, page]);

  const loadAllGospel = async () => {
    try {
      const res = await fetch('https://music-discovery-platform.vercel.app/api/artists?category=gospel&limit=200');
      const data = await res.json();
      const artists = data?.artists || [];
      setAllGospelArtists(artists);
      loadMorePage(1, artists);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadMorePage = (nextPage: number, artists?: any[]) => {
    const source = artists || allGospelArtists;
    setLoadingMore(true);
    const start = (nextPage - 1) * COUNTRIES_PER_PAGE;
    const end = start + COUNTRIES_PER_PAGE;
    const batch = source.slice(start, end);
    setVisibleArtists(prev => [...prev, ...batch]);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const playSong = (song: any, artistName: string) => {
    setQueue([{ videoId: song.videoId, title: song.title, artist: artistName, thumbnail: song.thumbnail, duration: song.duration }], 0);
    onSongPlay();
  };

  const playAllArtist = (artist: any) => {
    if (!artist.topSongs?.length) return;
    setQueue(artist.topSongs.map((s: any) => ({ videoId: s.videoId, title: s.title, artist: artist.name, thumbnail: s.thumbnail, duration: s.duration })), 0);
    onSongPlay();
  };

  // Group by country
  const groupedByCountry: Record<string, any[]> = {};
  visibleArtists.forEach(a => {
    const key = a.country || 'Unknown';
    if (!groupedByCountry[key]) groupedByCountry[key] = [];
    groupedByCountry[key].push(a);
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#06060e' }}>
        <div style={{ textAlign: 'center', color: '#a78bfa' }}>
          <Loader size={48} style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <div>Loading gospel artists...</div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#06060e', color: '#f1f5f9', padding: '20px 24px 120px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ArrowLeft size={16} /> Back to Home
      </button>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px' }}>
          🙏 Gospel Music
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          {allGospelArtists.length} gospel artists from {Object.keys(groupedByCountry).length} countries
        </p>
      </div>

      {Object.entries(groupedByCountry).map(([country, artists]) => (
        <section key={country} style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>{artists[0]?.flag || '🌍'}</span>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9' }}>{country}</h2>
            <span style={{ color: '#64748b', fontSize: '13px' }}>{artists.length} artists</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
            {artists.map((artist: any, i: number) => (
              <div key={i} className="glass-card" style={{ padding: '14px', cursor: 'pointer' }}
                onClick={() => onArtistSelect(artist.name)}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: artist.topSongs?.length > 0 ? '10px' : '0' }}>
                  {artist.channel?.image ? <img src={artist.channel.image} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} /> :
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music size={20} color="#10b981" /></div>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '14px' }}>{artist.name}</div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>{artist.songCount} songs • {(artist.channel?.subscribers || 0).toLocaleString()} subs</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); playAllArtist(artist); }}
                    style={{ padding: '6px 12px', background: '#10b981', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Play size={12} /> Play All
                  </button>
                </div>
                {artist.topSongs?.slice(0, 3).map((song: any, j: number) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); playSong(song, artist.name); }}>
                    <span style={{ color: '#64748b', fontSize: '11px', width: '16px' }}>#{j + 1}</span>
                    <div style={{ flex: 1, fontSize: '12px', color: '#94a3b8' }}>{song.title?.substring(0, 50)}</div>
                    <span style={{ color: '#64748b', fontSize: '10px' }}>{song.duration}</span>
                    <Play size={10} color="#10b981" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}

      <div ref={loadMoreRef} style={{ textAlign: 'center', padding: '40px' }}>
        {loadingMore && (
          <div style={{ color: '#a78bfa' }}>
            <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <div style={{ fontSize: '14px' }}>Loading more gospel artists...</div>
          </div>
        )}
        {visibleArtists.length >= allGospelArtists.length && allGospelArtists.length > 0 && (
          <div style={{ color: '#64748b', fontSize: '13px' }}>
            ✅ All {allGospelArtists.length} gospel artists loaded
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
