import { useState } from 'react';
import { Search, Loader, Play, Music, Download, TrendingUp, Check } from 'lucide-react';
import { useMusicStore } from '../store/musicStore';

interface Props { onSongPlay: () => void; onArtistSelect: (name: string) => void; }

const QUICK_EXAMPLES = [
  { icon: '🔥', text: 'Afrobeats', query: 'afrobeats' },
  { icon: '💜', text: 'K-Pop', query: 'kpop' },
  { icon: '🙏', text: 'Gospel', query: 'gospel' },
  { icon: '🕺', text: 'Amapiano', query: 'amapiano' },
  { icon: '🎸', text: 'Rock', query: 'rock' },
  { icon: '💃', text: 'Reggaeton', query: 'reggaeton' },
  { icon: '🎤', text: 'Hip Hop', query: 'hip hop' },
  { icon: '☪️', text: 'Nasheed', query: 'nasheed' },
  { icon: '🇰🇪', text: 'Kenya', query: 'Kenya' },
  { icon: '🇳🇬', text: 'Nigeria', query: 'Nigeria' },
  { icon: '🇹🇿', text: 'Tanzania', query: 'Tanzania' },
  { icon: '🇯🇲', text: 'Jamaica', query: 'Jamaica' },
];

const MEGAN = 'https://apis.megan.qzz.io';
const KEY = 'megan_admin_master';

export default function SearchPage({ onSongPlay, onArtistSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string | null>(null);
  const { setQueue } = useMusicStore();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    const q = query.trim();

    // Check country database
    setLoadingStage('Checking country database...');
    let countryData: any = null;
    try {
      const countryRes = await fetch('https://music-discovery-platform.vercel.app/api/countries');
      const countries = await countryRes.json();
      const matched = countries?.countries?.find((c: any) =>
        c.name.toLowerCase() === q.toLowerCase() || c.code.toLowerCase() === q.toLowerCase()
      );
      if (matched) {
        const artistRes = await fetch(`https://music-discovery-platform.vercel.app/api/artists?country=${matched.code}&limit=50`);
        const artistData = await artistRes.json();
        countryData = { country: matched, artists: artistData?.artists || [] };
      }
    } catch (e) {}

    // Search library
    setLoadingStage('Searching library...');
    let localResults: any[] = [];
    try {
      const localRes = await fetch(`https://music-discovery-platform.vercel.app/api/search?q=${encodeURIComponent(q)}`);
      const localData = await localRes.json();
      localResults = localData?.local || [];
    } catch (e) {}

    // Search YouTube via Megan (replaces Siputzx)
    setLoadingStage('Searching YouTube via Megan...');
    let youtubeResults: any[] = [];
    try {
      const ytRes = await fetch(`${MEGAN}/api/search/youtube?q=${encodeURIComponent(q)}&apikey=${KEY}`);
      const ytData = await ytRes.json();
      if (ytData?.results) {
        youtubeResults = ytData.results.slice(0, 10).map((item: any) => ({
          videoId: item.videoId,
          title: item.title,
          channelTitle: item.author || '',
          duration: item.duration || '',
          views: item.views || 0,
          thumbnail: item.thumbnail || '',
          url: item.url || '',
        }));
      }
    } catch (e) {
      console.error('Megan YouTube search failed:', e);
    }

    // Enrich local results
    setLoadingStage('Enriching results...');
    const enrichedLocal = await Promise.all(
      localResults.slice(0, 5).map(async (artist: any) => {
        try {
          const res = await fetch(`https://music-discovery-platform.vercel.app/api/artist/${encodeURIComponent(artist.name)}`);
          const d = await res.json();
          return { ...artist, similar: d?.similar || [], allSongs: d?.artist?.topSongs || [] };
        } catch { return artist; }
      })
    );

    setResults({ query: q, local: enrichedLocal, youtube: youtubeResults, country: countryData });
    setLoading(false);
    setLoadingStage('');
  };

  const handleExampleClick = (q: string) => {
    setQuery(q);
    setTimeout(() => handleSearch(), 100);
  };

  const playSong = (item: any, artistName?: string) => {
    setQueue([{
      videoId: item.videoId || '', title: item.title || '',
      artist: artistName || item.channelTitle || '', thumbnail: item.thumbnail || '', duration: item.duration || '',
    }], 0);
    onSongPlay();
  };

  const downloadSong = async (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const videoId = item.videoId || '';
    const title = (item.title || 'song').replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50);
    setDownloading(videoId);
    try {
      const res = await fetch(`${MEGAN}/download/audio?q=${encodeURIComponent(title)}&apikey=${KEY}`);
      const data = await res.json();
      const dlUrl = data?.downloadUrl || data?.proxyUrl;
      if (dlUrl) {
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = `${title}.mp3`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        const saved = JSON.parse(localStorage.getItem('vibely_downloads') || '[]');
        saved.push({ videoId, title, downloadedAt: new Date().toISOString() });
        localStorage.setItem('vibely_downloads', JSON.stringify(saved));
        setDownloaded(videoId);
        setTimeout(() => setDownloaded(null), 3000);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
    setDownloading(null);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 24px 120px' }}>
      <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '14px', marginBottom: '20px' }}>
        ← Back to Home
      </button>

      <form onSubmit={handleSearch} style={{ marginBottom: hasSearched ? '32px' : '48px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '4px' }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search artists, countries, genres..." style={{ flex: 1, padding: '14px 20px', background: 'transparent', border: 'none', color: '#f1f5f9', fontSize: '15px', outline: 'none' }} autoFocus />
          <button type="submit" className="btn-primary" style={{ padding: '14px 28px' }}><Search size={18} /> Search</button>
        </div>
      </form>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#a78bfa' }}>
          <Loader size={48} style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <div>{loadingStage}</div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {!hasSearched && !loading && (
        <div>
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={14} /> Try searching for
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {QUICK_EXAMPLES.map((ex, i) => (
                <button key={i} onClick={() => handleExampleClick(ex.query)}
                  style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '25px', color: '#e2e8f0', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {ex.icon} {ex.text}
                </button>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '60px', color: '#64748b' }}>
            <Music size={64} color="#a78bfa" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '18px' }}>Search by artist, country, or genre</div>
            <div style={{ fontSize: '14px', marginTop: '8px' }}>Try "Kenya", "gospel", or "Burna Boy"</div>
          </div>
        </div>
      )}

      {hasSearched && !loading && results && (
        <div>
          {!results.country && !results.local?.length && !results.youtube?.length && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <div style={{ fontSize: '18px', color: '#f1f5f9' }}>No results for "{results.query}"</div>
            </div>
          )}

          {/* Country Results */}
          {results.country && (
            <section style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '32px' }}>{results.country.country.flag}</span>
                <div>
                  <h2 style={{ color: '#f1f5f9', fontSize: '20px', fontWeight: 700 }}>{results.country.country.name}</h2>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>{results.country.artists.length} artists</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '8px' }}>
                {results.country.artists.slice(0, 20).map((artist: any, i: number) => (
                  <div key={i} className="glass-card" style={{ padding: '12px', display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => onArtistSelect(artist.name)}>
                    {artist.channel?.image ? <img src={artist.channel.image} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%' }} /> :
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music size={20} color="#a78bfa" /></div>}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '13px' }}>{artist.name}</div>
                      <div style={{ color: '#64748b', fontSize: '11px' }}>{artist.songCount} songs</div>
                    </div>
                    {artist.topSongs?.[0] && (
                      <button onClick={(e) => { e.stopPropagation(); playSong(artist.topSongs[0], artist.name); }}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#7c3aed', border: 'none', color: '#fff', cursor: 'pointer' }}>
                        <Play size={12} /></button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Local Artists */}
          {results.local?.length > 0 && (
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#f1f5f9', fontSize: '18px', marginBottom: '16px' }}>📦 From Library ({results.local.length})</h2>
              {results.local.map((artist: any, i: number) => (
                <div key={i} className="glass-card" style={{ padding: '16px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', cursor: 'pointer' }} onClick={() => onArtistSelect(artist.name)}>
                    {artist.channel?.image ? <img src={artist.channel.image} alt="" style={{ width: '56px', height: '56px', borderRadius: '50%' }} /> :
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music size={24} color="#a78bfa" /></div>}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '16px' }}>{artist.name}</div>
                      <div style={{ color: '#64748b', fontSize: '12px' }}>{artist.flag} {artist.country} • {(artist.channel?.subscribers || 0).toLocaleString()} subs</div>
                    </div>
                    {artist.topSongs?.[0] && (
                      <button onClick={(e) => { e.stopPropagation(); playSong(artist.topSongs[0], artist.name); }}
                        style={{ padding: '8px 16px', background: '#7c3aed', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
                        <Play size={12} /> Play</button>
                    )}
                  </div>
                  {artist.allSongs?.length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      {artist.allSongs.slice(0, 5).map((song: any, j: number) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); playSong(song, artist.name); }}>
                          <span style={{ color: '#64748b', fontSize: '12px', width: '20px' }}>#{j + 1}</span>
                          <div style={{ flex: 1 }}><div style={{ color: '#f1f5f9', fontSize: '12px' }}>{song.title?.substring(0, 50)}</div></div>
                          <span style={{ color: '#64748b', fontSize: '11px' }}>{song.duration}</span>
                          <button onClick={(e) => downloadSong(song, e)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
                            {downloaded === song.videoId ? <Check size={14} color="#10b981" /> :
                             downloading === song.videoId ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> :
                             <Download size={14} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* YouTube Results via Megan */}
          {results.youtube?.length > 0 && (
            <section>
              <h2 style={{ color: '#f1f5f9', fontSize: '18px', marginBottom: '16px' }}>▶ YouTube Results ({results.youtube.length}) via Megan</h2>
              {results.youtube.map((item: any, i: number) => (
                <div key={i} className="glass-card" style={{ padding: '12px 16px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => playSong(item)}>
                  {item.thumbnail ? <img src={item.thumbnail} alt="" style={{ width: '80px', height: '60px', borderRadius: '6px' }} /> :
                    <div style={{ width: '80px', height: '60px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music size={24} color="#a78bfa" /></div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 500 }}>{item.title}</div>
                    <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>{item.channelTitle} • {(item.views || 0).toLocaleString()} views • {item.duration}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={(e) => { e.stopPropagation(); playSong(item); }} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#7c3aed', border: 'none', color: '#fff', cursor: 'pointer' }}><Play size={14} /></button>
                    <button onClick={(e) => downloadSong(item, e)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer' }}>
                      {downloaded === item.videoId ? <Check size={14} color="#10b981" /> :
                       downloading === item.videoId ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> :
                       <Download size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
