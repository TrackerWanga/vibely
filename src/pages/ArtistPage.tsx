import { useState, useEffect } from 'react';
import { Play, ArrowLeft, ExternalLink } from 'lucide-react';
import { getArtist, searchAll, type Artist, type Song } from '../services/api';
import { useMusicStore } from '../store/musicStore';

interface Props { artistName: string; onBack: () => void; onSongPlay: () => void; }

export default function ArtistPage({ artistName, onBack, onSongPlay }: Props) {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [similar, setSimilar] = useState<Artist[]>([]);
  const [youtubeResults, setYoutubeResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { setQueue } = useMusicStore();

  useEffect(() => { loadAll(); }, [artistName]);

  const loadAll = async () => {
    try {
      const data = await getArtist(artistName);
      setArtist(data.artist);
      setSimilar(data.similar || []);
      const searchData = await searchAll(artistName);
      setYoutubeResults(searchData.youtube || []);
    } catch (e) {}
    setLoading(false);
  };

  const playSong = (song: Song) => {
    setQueue([{ videoId: song.videoId, title: song.title, artist: artist?.name || '', thumbnail: song.thumbnail, duration: song.duration }], 0);
    onSongPlay();
  };

  const playAll = () => {
    if (!artist?.topSongs) return;
    setQueue(artist.topSongs.map(s => ({ videoId: s.videoId, title: s.title, artist: artist.name, thumbnail: s.thumbnail, duration: s.duration })), 0);
    onSongPlay();
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#a78bfa' }}>Loading...</div>;
  if (!artist) return null;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px 120px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}><ArrowLeft size={16} /> Back</button>
      <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
        {artist.channel?.image && <img src={artist.channel.image} alt="" style={{ width: '160px', height: '160px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(124,58,237,0.5)' }} />}
        <div>
          <div style={{ color: '#a78bfa', fontSize: '13px' }}>{artist.flag} {artist.country}</div>
          <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#f1f5f9' }}>{artist.name}</h1>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>{(artist.channel?.subscribers || 0).toLocaleString()} subscribers{artist.channel?.verified && ' ✓'}</p>
          <button className="btn-primary" onClick={playAll} style={{ marginTop: '16px' }}><Play size={18} /> Play All</button>
        </div>
      </div>
      <h2 style={{ color: '#f1f5f9', marginBottom: '16px' }}>Top Songs</h2>
      {artist.topSongs?.map((song, i) => (
        <div key={i} className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px', cursor: 'pointer' }} onClick={() => playSong(song)}>
          <span style={{ color: '#64748b', width: '24px' }}>#{i + 1}</span>
          {song.thumbnail && <img src={song.thumbnail} alt="" style={{ width: '48px', height: '36px', borderRadius: '4px' }} />}
          <div style={{ flex: 1 }}><div style={{ color: '#f1f5f9', fontWeight: 500, fontSize: '14px' }}>{song.title}</div><div style={{ color: '#64748b', fontSize: '12px' }}>{(song.views || 0).toLocaleString()} views • {song.duration}</div></div>
          <Play size={16} color="#a78bfa" />
        </div>
      ))}
      {similar.length > 0 && (
        <>
          <h2 style={{ color: '#f1f5f9', margin: '40px 0 16px' }}>Similar Artists</h2>
          <div className="scroll-row">{similar.map((a, i) => (
            <div key={i} className="glass-card" style={{ width: '160px', padding: '12px', textAlign: 'center' }}>
              {a.channel?.image && <img src={a.channel.image} alt="" style={{ width: '70px', height: '70px', borderRadius: '50%', marginBottom: '8px' }} />}
              <div style={{ fontWeight: 600, fontSize: '12px', color: '#f1f5f9' }}>{a.name}</div>
              <div style={{ color: '#64748b', fontSize: '10px' }}>{a.flag} {a.country}</div>
            </div>
          ))}</div>
        </>
      )}
      {youtubeResults.length > 0 && (
        <>
          <h2 style={{ color: '#f1f5f9', margin: '40px 0 16px' }}>▶ YouTube Results</h2>
          {youtubeResults.slice(0, 5).map((item: any, i: number) => (
            <div key={i} className="glass-card" style={{ padding: '10px 16px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Play size={14} color="#ef4444" />
              <div style={{ flex: 1 }}><div style={{ color: '#f1f5f9', fontSize: '13px' }}>{item.title?.substring(0, 60)}</div><div style={{ color: '#64748b', fontSize: '11px' }}>{item.channelTitle}</div></div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
