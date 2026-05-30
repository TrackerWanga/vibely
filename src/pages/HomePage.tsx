import { useState, useEffect, useRef } from 'react';
import { Play, ChevronLeft, ChevronRight, Loader, TrendingUp, HardDrive } from 'lucide-react';
import { getHomepage, getArtists, type Artist, type Country, type Song } from '../services/api';
import { useMusicStore } from '../store/musicStore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface Props {
  onSearch: () => void;
  onArtistSelect: (name: string) => void;
  onSongPlay: () => void;
  onGospelClick: () => void;
  onBelovedClick: () => void;
  onOfflineClick: () => void;
  onMenuClick: () => void;
}

const COUNTRIES_PER_PAGE = 5;
const MEGAN = 'https://apis.megan.qzz.io';
const KEY = 'megan_admin_master';

export default function HomePage({ onSearch, onArtistSelect, onSongPlay, onGospelClick, onBelovedClick, onOfflineClick, onMenuClick }: Props) {
  const [data, setData] = useState<any>(null);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [visibleCountries, setVisibleCountries] = useState<Country[]>([]);
  const [countrySongs, setCountrySongs] = useState<Record<string, Song[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [trendingSongs, setTrendingSongs] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const { setQueue } = useMusicStore();
  const bannerTimer = useRef<any>(null);
  const trendingRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadHomepage(); loadTrending(); return () => clearInterval(bannerTimer.current); }, []);
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

  const loadTrending = async () => {
    try {
      const res = await fetch(`${MEGAN}/api/music/trending?apikey=${KEY}`);
      const d = await res.json();
      if (d?.results) {
        setTrendingSongs(d.results.filter((s: any) => s.videoId && s.durationSeconds > 30 && s.durationSeconds < 900).slice(0, 20));
      }
    } catch (e) { console.error('Trending load failed:', e); }
    setTrendingLoading(false);
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

  const playSong = (song: any, allSongs?: any[]) => {
    const trackList = [{ videoId: song.videoId, title: song.title, artist: song.artistName || song.author || '', thumbnail: song.thumbnail, duration: song.duration }];
    if (allSongs && allSongs.length > 1) {
      allSongs.filter((s: any) => s.videoId !== song.videoId).slice(0, 19).forEach((s: any) => {
        trackList.push({ videoId: s.videoId, title: s.title, artist: s.artistName || s.author || '', thumbnail: s.thumbnail, duration: s.duration });
      });
    }
    setQueue(trackList, 0);
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
      <Navbar onSearchClick={onSearch} onMenuClick={onMenuClick} />

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
            <button className="btn-primary" onClick={() => playSong(currentBanner.topSongs?.[0], currentBanner.topSongs)} style={{ marginTop: '20px' }}>
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

        {/* Discover - Trending Music Grid */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <TrendingUp size={20} color="#f59e0b" />
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9' }}>Discover</h2>
            <span style={{ color: '#64748b', fontSize: '13px' }}>Trending now</span>
          </div>
          {trendingLoading ? (
            <div className="skeleton" style={{ height: '200px', borderRadius: '12px' }} />
          ) : (
            <div className="scroll-row">
              {trendingSongs.map((song: any, i: number) => (
                <div key={i} className="glass-card" style={{ width: '200px', padding: '10px', flexShrink: 0 }}
                  onClick={() => playSong({ videoId: song.videoId, title: song.title, artistName: song.author, thumbnail: song.thumbnail, duration: song.duration }, trendingSongs)}>
                  <div style={{ position: 'relative' }}>
                    <img src={song.thumbnail} alt="" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }} loading="lazy" />
                    <div style={{ position: 'absolute', bottom: '12px', right: '4px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>{song.duration}</div>
                  </div>
                  <div style={{ fontWeight: 500, fontSize: '12px', color: '#f1f5f9', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</div>
                  <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.author}</div>
                  <div style={{ color: '#475569', fontSize: '10px', marginTop: '2px' }}>{(song.views || 0).toLocaleString()} views</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Gospel Section */}
        <section style={{ marginBottom: '24px', padding: '20px 24px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>🙏 Gospel Music</h2>
              <p style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>Spiritual music from around the world</p>
            </div>
            <button className="btn-primary" onClick={onGospelClick} style={{ background: '#10b981', fontSize: '12px', padding: '8px 16px' }}>View All →</button>
          </div>
        </section>

        {/* Beloved Section */}
        <section style={{ marginBottom: '24px', padding: '20px 24px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>🌟 Beloved & Trending</h2>
              <p style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>28 global superstars • Alan Walker, Drake, Taylor Swift & more</p>
            </div>
            <button className="btn-primary" onClick={onBelovedClick} style={{ background: '#f59e0b', fontSize: '12px', padding: '8px 16px' }}>View All →</button>
          </div>
        </section>

        {/* Offline Library Section */}
        <section style={{ marginBottom: '24px', padding: '20px 24px', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.1)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}><HardDrive size={18} style={{ marginRight: '8px', display: 'inline' }} />Offline Library</h2>
              <p style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>Downloaded songs play without internet</p>
            </div>
            <button className="btn-primary" onClick={onOfflineClick} style={{ background: '#7c3aed', fontSize: '12px', padding: '8px 16px' }}>View Library →</button>
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

        {/* Countries - Infinite Scroll */}
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
                    <div key={i} className="glass-card" style={{ width: '200px', padding: '10px' }} onClick={() => playSong(song, songs)}>
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
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
