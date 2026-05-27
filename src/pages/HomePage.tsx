import { useState, useEffect, useRef } from 'react';
import { Play, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { getHomepage, getArtists, type Artist, type Country, type Song } from '../services/api';
import { useMusicStore } from '../store/musicStore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PlayerBar from '../components/PlayerBar';

interface Props {
  onSearch: () => void;
  onArtistSelect: (name: string) => void;
  onSongPlay: () => void;
  onGospelClick: () => void;
}

const COUNTRIES_PER_PAGE = 5;

export default function HomePage({ onSearch, onArtistSelect, onSongPlay, onGospelClick }: Props) {
  const [data, setData] = useState<any>(null);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [visibleCountries, setVisibleCountries] = useState<Country[]>([]);
  const [countrySongs, setCountrySongs] = useState<Record<string, Song[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const { setQueue } = useMusicStore();
  const bannerTimer = useRef<any>(null);
  const trendingRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadHomepage(); return () => clearInterval(bannerTimer.current); }, []);
  useEffect(() => { if (data?.countries) { setAllCountries(data.countries); loadMoreCountries(1, data.countries); } }, [data]);
  useEffect(() => {
    if (!data?.banner?.length) return;
    if (bannerLoaded) {
      bannerTimer.current = setInterval(() => { setBannerLoaded(false); setBannerIndex(prev => (prev + 1) % data.banner.length); }, 30000);
    }
    return () => clearInterval(bannerTimer.current);
  }, [data, bannerLoaded]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore && visibleCountries.length < allCountries.length) {
        loadMoreCountries(page + 1, allCountries);
      }
    }, { threshold: 0.1 });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadingMore, visibleCountries, allCountries, page]);

  const loadHomepage = async () => {
    try { const d = await getHomepage(); setData(d); } catch (e) {}
    setLoading(false);
  };

  const loadMoreCountries = async (nextPage: number, countries: Country[]) => {
    setLoadingMore(true);
    const start = (nextPage - 1) * COUNTRIES_PER_PAGE;
    const end = start + COUNTRIES_PER_PAGE;
    const batch = countries.slice(start, end);
    const songsMap: Record<string, Song[]> = { ...countrySongs };
    for (const c of batch) {
      if (!songsMap[c.code]) {
        try {
          const artists = await getArtists({ country: c.code, limit: 4 });
          const songs: Song[] = [];
          artists.forEach(a => { if (a.topSongs) songs.push(...a.topSongs.slice(0, 4).map(s => ({ ...s, artistName: a.name }))); });
          songsMap[c.code] = songs.slice(0, 20);
        } catch (e) { songsMap[c.code] = []; }
      }
    }
    setCountrySongs(songsMap);
    setVisibleCountries(prev => [...prev, ...batch]);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const playSong = (song: any) => {
    setQueue([{ videoId: song.videoId, title: song.title, artist: song.artistName || '', thumbnail: song.thumbnail, duration: song.duration }], 0);
    onSongPlay();
  };

  const playAllSongs = (songs: Song[]) => {
    setQueue(songs.map(s => ({ videoId: s.videoId, title: s.title, artist: (s as any).artistName || '', thumbnail: s.thumbnail, duration: s.duration })), 0);
    onSongPlay();
  };

  const scrollRow = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) ref.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#06060e' }}>
        <div style={{ textAlign: 'center', color: '#a78bfa' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎵</div>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>Vibely</div>
          <div style={{ color: '#64748b', marginTop: '8px' }}>Loading...</div>
        </div>
      </div>
    );
  }

  const { banner, trending, topArtists } = data || {};
  const currentBanner = banner?.[bannerIndex];

  return (
    <div style={{ background: '#06060e', minHeight: '100vh' }}>
      <Navbar onSearchClick={onSearch} />

      {/* Hero Banner */}
      {currentBanner && (
        <div style={{ position: 'relative', height: '40vh', minHeight: '350px', overflow: 'hidden', borderRadius: '0 0 24px 24px', marginBottom: '32px', background: '#111128' }}>
          {!bannerLoaded && <div className="skeleton" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />}
          {currentBanner.channel?.image && (
            <img src={currentBanner.channel.image} alt="" onLoad={() => setBannerLoaded(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)', opacity: bannerLoaded ? 1 : 0, transition: 'opacity 0.5s' }} />
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px', background: 'linear-gradient(transparent, rgba(6,6,14,0.95))' }}>
            <span style={{ color: '#a78bfa', fontSize: '13px', fontWeight: 600 }}>{currentBanner.flag} {currentBanner.country}</span>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, margin: '8px 0', color: '#fff', cursor: 'pointer' }} onClick={() => onArtistSelect(currentBanner.name)}>
              {currentBanner.name}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '16px' }}>{(currentBanner.channel?.subscribers || 0).toLocaleString()} subscribers</p>
            <button className="btn-primary" onClick={() => playSong(currentBanner.topSongs?.[0])} style={{ marginTop: '20px' }}>
              <Play size={18} /> Play Audio
            </button>
          </div>
          <div style={{ position: 'absolute', bottom: '16px', right: '24px', display: 'flex', gap: '8px' }}>
            {banner?.map((_: any, i: number) => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === bannerIndex ? '#a78bfa' : 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                onClick={() => { setBannerLoaded(false); setBannerIndex(i); }} />
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>

        {/* Gospel Section */}
        <section style={{ marginBottom: '40px', padding: '24px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🙏 Gospel Music
              </h2>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Spiritual music from around the world</p>
            </div>
            <button className="btn-primary" onClick={onGospelClick} style={{ background: '#10b981', fontSize: '13px' }}>
              View All Gospel →
            </button>
          </div>
        </section>

        {/* Featured Artists */}
        {trending?.length > 0 && (
          <section style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9' }}>🔥 Featured Artists</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-glass" onClick={() => scrollRow(trendingRef, 'left')}><ChevronLeft size={16} /></button>
                <button className="btn-glass" onClick={() => scrollRow(trendingRef, 'right')}><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className="scroll-row" ref={trendingRef}>
              {trending.map((artist: Artist, i: number) => (
                <div key={i} className="glass-card" style={{ width: '180px', padding: '12px' }} onClick={() => onArtistSelect(artist.name)}>
                  {artist.channel?.image && <img src={artist.channel.image} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />}
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#f1f5f9' }}>{artist.name}</div>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>{artist.flag} {artist.country}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top Artists */}
        {topArtists?.length > 0 && (
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px' }}>🏆 Top Artists</h2>
            <div className="scroll-row">
              {topArtists.map((artist: Artist, i: number) => (
                <div key={i} className="glass-card" style={{ width: '200px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }} onClick={() => onArtistSelect(artist.name)}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', minWidth: '30px' }}>#{i + 1}</div>
                  {artist.channel?.image && <img src={artist.channel.image} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />}
                  <div><div style={{ fontWeight: 600, fontSize: '13px', color: '#f1f5f9' }}>{artist.name}</div><div style={{ color: '#64748b', fontSize: '11px' }}>{artist.flag} {artist.country}</div></div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Countries */}
        {visibleCountries.map((country: Country) => {
          const songs = countrySongs[country.code] || [];
          return (
            <section key={country.code} style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '28px' }}>{country.flag}</span>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9' }}>{country.name}</h2>
                <span style={{ color: '#64748b', fontSize: '13px' }}>{country.totalArtists} artists</span>
                {songs.length > 0 && <button className="btn-glass" style={{ marginLeft: 'auto' }} onClick={() => playAllSongs(songs)}><Play size={14} /> Play All</button>}
              </div>
              {songs.length > 0 ? (
                <div className="scroll-row">
                  {songs.map((song: any, i: number) => (
                    <div key={i} className="glass-card" style={{ width: '200px', padding: '10px' }} onClick={() => playSong(song)}>
                      <img src={song.thumbnail} alt="" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }} loading="lazy" />
                      <div style={{ fontWeight: 500, fontSize: '12px', color: '#f1f5f9', lineHeight: 1.3 }}>{song.title?.substring(0, 50)}...</div>
                      <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>{song.artistName} • {song.duration}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="skeleton" style={{ height: '120px', borderRadius: '12px' }} />
              )}
            </section>
          );
        })}

        <div ref={loadMoreRef} style={{ textAlign: 'center', padding: '40px' }}>
          {loadingMore && <div style={{ color: '#a78bfa' }}><Loader size={32} style={{ animation: 'spin 1s linear infinite' }} /><div>Loading more countries...</div></div>}
          {visibleCountries.length >= allCountries.length && allCountries.length > 0 && <div style={{ color: '#64748b', fontSize: '13px' }}>✅ All {allCountries.length} countries loaded</div>}
        </div>
      </div>

      <Footer />
      <PlayerBar />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
