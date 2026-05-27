import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Download, Heart, Share2, Music, Video, Loader, Check, Copy } from 'lucide-react';
import { useMusicStore } from '../store/musicStore';
import { getCachedUrl, setCachedUrl } from '../services/audioCache';

interface Props { onBack: () => void; onVideoMode: () => void; }

export default function PlayerPage({ onBack, onVideoMode }: Props) {
  const { currentTrack, isPlaying, queue, queueIndex, togglePlay, nextTrack, prevTrack, toggleFavorite, favorites } = useMusicStore();
  const [lyrics, setLyrics] = useState<any>(null);
  const [lyricLines, setLyricLines] = useState<Array<{ time: number; text: string }>>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioState, setAudioState] = useState<'loading' | 'playing' | 'error'>('loading');
  const [audioUrl, setAudioUrl] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [shared, setShared] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const track = currentTrack;
  const upcomingTrack = queue[queueIndex + 1];
  const isFav = track ? favorites.some(f => f.videoId === track.videoId) : false;

  useEffect(() => { if (track) loadAll(); }, [track]);
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      isPlaying ? audioRef.current.play().catch(() => {}) : audioRef.current.pause();
    }
  }, [isPlaying, audioUrl]);

  const loadAll = async () => {
    const videoId = track?.videoId || '';
    const cached = getCachedUrl(videoId);
    if (cached) { setAudioUrl(cached); setAudioState('playing'); loadLyrics(); return; }
    
    setAudioState('loading');
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const query = track?.artist ? `${track.artist} ${track.title}` : track?.title || '';
    loadLyrics();

    // Try xwolf first (fast), then Megan
    try {
      setStatusMsg('Getting audio...');
      const res = await fetch(`https://apis.xwolf.space/download/mp3?url=${encodeURIComponent(youtubeUrl)}&q=${encodeURIComponent(query)}`);
      const d = await res.json();
      const url = d?.proxyUrl || d?.downloadUrl;
      if (url) { setCachedUrl(videoId, url); setAudioUrl(url); return; }
    } catch (e) {}

    try {
      setStatusMsg('Trying backup...');
      const res = await fetch(`https://apis.megan.qzz.io/download/audio?q=${encodeURIComponent(query)}&apikey=megan_admin_master`);
      const d = await res.json();
      const url = d?.proxyUrl || d?.downloadUrl;
      if (url) { setCachedUrl(videoId, url); setAudioUrl(url); return; }
    } catch (e) {}

    setAudioState('error');
    setStatusMsg('');
    setTimeout(() => onVideoMode(), 2000);
  };

  const loadLyrics = async () => {
    try {
      const q = track?.artist || track?.title || '';
      const lr = await fetch(`https://apis.xwolf.space/download/lyrics?q=${encodeURIComponent(q)}`);
      const ld = await lr.json();
      if (ld?.syncedLyrics) {
        const lines = ld.syncedLyrics.split('\n').map((line: string) => {
          const m = line.match(/\[(\d+):(\d+)\.(\d+)\]\s*(.*)/);
          if (m) return { time: parseInt(m[1])*60 + parseInt(m[2]) + parseInt(m[3])/100, text: m[4] };
          return { time: 0, text: line };
        }).filter((l: any) => l.text);
        setLyricLines(lines);
      } else if (ld?.lyrics) { setLyrics(ld); }
    } catch (e) {}
  };

  const handleDownload = async () => {
    if (!track?.videoId) return;
    setDownloading(true);
    const videoId = track.videoId;
    const title = (track.title || 'song').replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50);
    
    try {
      const res = await fetch(`https://apis.xwolf.space/download/mp3?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&q=${encodeURIComponent(title)}`);
      const data = await res.json();
      const dlUrl = data?.proxyUrl || data?.downloadUrl;
      
      if (dlUrl) {
        // Download via hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = dlUrl;
        document.body.appendChild(iframe);
        setTimeout(() => document.body.removeChild(iframe), 5000);
        
        // Save to localStorage
        const saved = JSON.parse(localStorage.getItem('vibely_downloads') || '[]');
        saved.push({ videoId, title: track.title, downloadedAt: new Date().toISOString() });
        localStorage.setItem('vibely_downloads', JSON.stringify(saved));
        
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 3000);
      }
    } catch (err) {
      // Fallback: open in new tab
      window.open(`https://apis.xwolf.space/download/mp3?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&q=${encodeURIComponent(title)}`, '_blank');
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    }
    setDownloading(false);
  };

  const handleShare = async () => {
    if (!track?.videoId) return;
    const url = `${window.location.origin}/?song=${track.videoId}&title=${encodeURIComponent(track.title || '')}`;
    
    // Try Web Share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: track.title || 'Check out this song',
          text: `🎵 ${track.title} - ${track.artist || 'Unknown'}`,
          url: `https://www.youtube.com/watch?v=${track.videoId}`,
        });
        return;
      } catch (e) {}
    }
    
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/?song=${track.videoId}`);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (e) {
      // Final fallback: show the URL
      prompt("Share this song:", `${window.location.origin}/?song=${track.videoId}`);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      const ct = audioRef.current.currentTime;
      const idx = lyricLines.findIndex((line, i) => {
        const next = lyricLines[i+1];
        return ct >= line.time && (!next || ct < next.time);
      });
      if (idx !== -1) setCurrentLine(idx);
    }
  };
  const handleLoadedMetadata = () => { if (audioRef.current) { setDuration(audioRef.current.duration); setAudioState('playing'); setStatusMsg(''); } };
  const handleCanPlay = () => { setAudioState('playing'); setStatusMsg(''); };
  const handleError = () => { setAudioState('error'); setTimeout(() => onVideoMode(), 1500); };
  const handleEnded = () => nextTrack();
  const formatTime = (t: number) => { if (isNaN(t)) return '0:00'; const m = Math.floor(t/60), s = Math.floor(t%60); return `${m}:${s.toString().padStart(2,'0')}`; };

  if (!track) return (
    <div style={{ minHeight: '100vh', background: '#06060e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
      <div style={{ textAlign: 'center' }}><Music size={48} color="#a78bfa" /><div>No track</div><button onClick={onBack} className="btn-primary" style={{ marginTop: '16px' }}>Go Back</button></div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#06060e', color: '#f1f5f9' }}>
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer' }}><ArrowLeft size={24} /></button>
        <div style={{ flex: 1 }}><div style={{ fontSize: '12px', color: '#a78bfa' }}>Now Playing</div><div style={{ fontSize: '16px', fontWeight: 600 }}>{track.title?.substring(0, 50)}</div></div>
        <button onClick={onVideoMode} className="btn-glass"><Video size={16} /> Video</button>
      </div>
      {statusMsg && (
        <div style={{ padding: '10px 24px', textAlign: 'center', background: 'rgba(124,58,237,0.08)', color: '#a78bfa', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> {statusMsg}
        </div>
      )}
      <div style={{ display: 'flex', padding: '0 24px', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 350px', minWidth: '280px' }}>
          <div style={{ width: '100%', aspectRatio: '1', borderRadius: '16px', background: 'linear-gradient(135deg, #1a1a2e, #16213e)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', overflow: 'hidden', position: 'relative' }}>
            {track.thumbnail ? <img src={track.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Music size={80} color="#a78bfa" />}
            {audioState === 'loading' && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader size={48} color="#a78bfa" style={{ animation: 'spin 1s linear infinite' }} /></div>}
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>{track.title}</h1>
          <p style={{ color: '#a78bfa', fontSize: '16px', marginBottom: '4px' }}>{track.artist || 'Unknown Artist'}</p>
          {track.duration && <p style={{ color: '#64748b', fontSize: '13px' }}>{track.duration}</p>}
          <div style={{ marginTop: '20px' }}>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', cursor: 'pointer' }}
              onClick={(e) => { if (audioRef.current && duration) { const r = e.currentTarget.getBoundingClientRect(); audioRef.current.currentTime = ((e.clientX-r.left)/r.width)*duration; }}}>
              <div style={{ height: '100%', width: `${duration ? (progress/duration)*100 : 0}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#64748b' }}><span>{formatTime(progress)}</span><span>{formatTime(duration)}</span></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
            <button onClick={prevTrack} style={ctrlBtn}><SkipBack size={24} /></button>
            <button onClick={togglePlay} style={{ ...ctrlBtn, width: '56px', height: '56px', background: '#7c3aed', borderRadius: '50%' }}>{isPlaying ? <Pause size={28} /> : <Play size={28} />}</button>
            <button onClick={nextTrack} style={ctrlBtn}><SkipForward size={24} /></button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
            <button onClick={() => track && toggleFavorite(track)} className="btn-glass" title="Favorite">
              <Heart size={16} fill={isFav ? '#f43f5e' : 'none'} color={isFav ? '#f43f5e' : '#94a3b8'} />
            </button>
            <button onClick={handleDownload} className="btn-glass" title="Download MP3" style={{ color: downloaded ? '#10b981' : '#94a3b8' }}>
              {downloading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> :
               downloaded ? <Check size={16} /> : <Download size={16} />}
              <span style={{ fontSize: '11px', marginLeft: '4px' }}>{downloaded ? 'Done' : downloading ? '' : 'MP3'}</span>
            </button>
            <button onClick={handleShare} className="btn-glass" title="Share" style={{ color: shared ? '#10b981' : '#94a3b8' }}>
              {shared ? <Check size={16} /> : <Share2 size={16} />}
              <span style={{ fontSize: '11px', marginLeft: '4px' }}>{shared ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
          {audioState === 'error' && (
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(244,63,94,0.06)', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ color: '#f43f5e', fontSize: '13px' }}>Audio unavailable</p>
              <button onClick={onVideoMode} className="btn-primary" style={{ marginTop: '10px' }}><Video size={14} /> Play Video</button>
            </div>
          )}
          {upcomingTrack && (
            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Coming Next</div>
              <div style={{ fontSize: '13px', color: '#f1f5f9' }}>{upcomingTrack.title?.substring(0, 40)}</div>
              <div style={{ fontSize: '11px', color: '#a78bfa' }}>{upcomingTrack.artist}</div>
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: '300px', maxHeight: '60vh', overflowY: 'auto', padding: '0 16px' }}>
          {lyricLines.length > 0 ? lyricLines.map((line, i) => (
            <p key={i} style={{ padding: '8px 0', fontSize: '18px', fontWeight: i === currentLine ? 700 : 400, color: i === currentLine ? '#fff' : i < currentLine ? '#64748b' : '#94a3b8', transition: 'all 0.3s', lineHeight: 1.6 }}>{line.text}</p>
          )) : lyrics?.lyrics ? <pre style={{ color: '#94a3b8', fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{lyrics.lyrics}</pre> : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}><Music size={48} color="#a78bfa" style={{ marginBottom: '16px' }} /><div style={{ fontSize: '16px' }}>🎤 Vocals Playing</div></div>
          )}
        </div>
      </div>
      {audioUrl && <audio ref={audioRef} src={audioUrl} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onCanPlay={handleCanPlay} onError={handleError} onEnded={handleEnded} preload="auto" crossOrigin="anonymous" autoPlay />}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
const ctrlBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' };

// The nextTrack and prevTrack functions from useMusicStore already work.
// They increment/decrement queueIndex and update currentTrack.
// The audio element's onEnded calls nextTrack() automatically.
// The next/prev buttons call nextTrack() and prevTrack().
// Everything is wired correctly in the store:
//
// nextTrack: () => {
//   const { queue, queueIndex } = get();
//   if (queueIndex < queue.length - 1) {
//     set({ queueIndex: queueIndex + 1, currentTrack: queue[queueIndex + 1], isPlaying: true });
//   }
// },
// prevTrack: () => {
//   const { queue, queueIndex } = get();
//   if (queueIndex > 0) {
//     set({ queueIndex: queueIndex - 1, currentTrack: queue[queueIndex - 1], isPlaying: true });
//   }
// },
