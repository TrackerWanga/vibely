import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Download, Heart, Share2, Music, Video, Loader, Check, RotateCcw, RotateCw, Gauge, Infinity } from 'lucide-react';
import { useMusicStore } from '../store/musicStore';
import { updateMediaSession, updatePlaybackState, updatePositionState } from '../services/mediaSession';

interface Props { onBack: () => void; onVideoMode: () => void; }

const MEGAN = 'https://apis.megan.qzz.io';
const KEY = 'megan_admin_master';

export default function PlayerPage({ onBack, onVideoMode }: Props) {
  const { currentTrack, isPlaying, queue, queueIndex, togglePlay, nextTrack, prevTrack, toggleFavorite, favorites, autoplayEnabled, toggleAutoplay, setQueue } = useMusicStore();
  const [lyrics, setLyrics] = useState<any>(null);
  const [lyricLines, setLyricLines] = useState<Array<{ time: number; text: string }>>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioState, setAudioState] = useState<'loading' | 'playing' | 'retrying'>('loading');
  const [audioUrl, setAudioUrl] = useState('');
  const [statusMsg, setStatusMsg] = useState('Connecting...');
  const [dots, setDots] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [shared, setShared] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [autoplayLoading, setAutoplayLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const retryTimer = useRef<any>(null);
  const hasAutoPlayed = useRef(false);

  const track = currentTrack;
  const upcomingTrack = queue[queueIndex + 1];
  const isFav = track ? favorites.some(f => f.videoId === track.videoId) : false;

  // Media Session update
  useEffect(() => {
    if (track) {
      updateMediaSession({
        title: track.title || 'Unknown',
        artist: track.artist || 'Unknown Artist',
        thumbnail: track.thumbnail || '',
        videoId: track.videoId
      });
    }
  }, [track]);

  useEffect(() => {
    updatePlaybackState(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    updatePositionState(duration, playbackRate, progress);
  }, [duration, playbackRate, progress]);

  useEffect(() => {
    if (audioState === 'loading' || audioState === 'retrying') {
      const interval = setInterval(() => setDots(prev => prev.length >= 3 ? '' : prev + '.'), 500);
      return () => clearInterval(interval);
    }
  }, [audioState]);

  useEffect(() => { if (track) { hasAutoPlayed.current = false; loadAll(); } return () => clearTimeout(retryTimer.current); }, [track]);
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      isPlaying ? audioRef.current.play().catch(() => {}) : audioRef.current.pause();
    }
  }, [isPlaying, audioUrl]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const loadAll = async () => {
    setAudioState('loading');
    setAudioUrl('');
    setLyrics(null);
    setLyricLines([]);
    setCurrentLine(0);
    setProgress(0);
    setDuration(0);
    loadLyrics();
    fetchAudio();
  };

  const loadLyrics = async () => {
    try {
      const q = track?.artist ? `${track.artist} ${track.title}` : track?.title || '';
      let lr = await fetch(`${MEGAN}/download/lyrics?q=${encodeURIComponent(q)}&apikey=${KEY}`);
      let ld = await lr.json();

      if (!ld?.syncedLyrics && !ld?.lyrics && track?.artist && track?.title) {
        lr = await fetch(`${MEGAN}/download/lyrics?q=${encodeURIComponent(track.title)}&apikey=${KEY}`);
        ld = await lr.json();
      }

      if (ld?.syncedLyrics) {
        const lines = ld.syncedLyrics.split('\n').map((line: string) => {
          const m = line.match(/\[(\d+):(\d+)\.(\d+)\]\s*(.*)/);
          if (m) return { time: parseInt(m[1])*60 + parseInt(m[2]) + parseInt(m[3])/100, text: m[4] };
          return { time: 0, text: line };
        }).filter((l: any) => l.text);
        setLyricLines(lines);
        setLyrics(ld);
      } else if (ld?.lyrics) {
        setLyrics(ld);
        setLyricLines([]);
      }
    } catch (e) {}
  };

  const fetchAudio = async () => {
    const videoId = track?.videoId || '';
    const query = track?.artist ? `${track.artist} ${track.title}` : track?.title || '';

    setStatusMsg('Streaming');
    try {
      // Direct stream URL
      const streamUrl = `${MEGAN}/stream?q=${videoId}&type=mp3&apikey=${KEY}`;
      setAudioUrl(streamUrl);
      return;
    } catch (e) {}

    try {
      setStatusMsg('Getting audio');
      const res = await fetch(`${MEGAN}/download/audio?q=${encodeURIComponent(query)}&apikey=${KEY}`);
      const d = await res.json();
      const url = d?.proxyUrl || d?.downloadUrl;
      if (url) { setAudioUrl(url); return; }
    } catch (e) {}

    setAudioState('retrying');
    setStatusMsg('Waking server');
    retryTimer.current = setTimeout(() => { setAudioState('loading'); fetchAudio(); }, 5000);
  };

  const fetchAndQueueRelated = async () => {
    if (!track?.videoId || hasAutoPlayed.current) return;
    hasAutoPlayed.current = true;
    setAutoplayLoading(true);
    try {
      const res = await fetch(`${MEGAN}/api/youtube/recommend?id=${track.videoId}&apikey=${KEY}`);
      const data = await res.json();
      if (data?.recommendations?.length) {
        const related = data.recommendations
          .filter((r: any) => r.videoId && r.durationSeconds > 30 && r.durationSeconds < 900)
          .slice(0, 5)
          .map((r: any) => ({
            videoId: r.videoId,
            title: r.title,
            artist: r.author || '',
            thumbnail: r.thumbnail || '',
            duration: r.duration || '',
          }));
        if (related.length > 0) {
          setQueue([...queue, ...related], queueIndex + 1);
          nextTrack();
        }
      }
    } catch (e) { console.error('Autoplay fetch failed:', e); }
    setAutoplayLoading(false);
  };

  const handleEnded = () => {
    if (queueIndex < queue.length - 1) {
      nextTrack();
    } else if (autoplayEnabled && track?.videoId) {
      fetchAndQueueRelated();
    }
  };

  const skipForward = () => {
    if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, audioRef.current.duration || 0);
  };
  const skipBackward = () => {
    if (audioRef.current) audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
  };
  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2, 0.75, 0.5];
    const idx = speeds.indexOf(playbackRate);
    setPlaybackRate(speeds[(idx + 1) % speeds.length]);
  };

  const handleDownload = async () => {
    if (!track?.videoId) return;
    setDownloading(true);
    const title = (track.title || 'song').replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50);

    try {
      // Get download URL from Megan
      const res = await fetch(`${MEGAN}/download/audio?q=${encodeURIComponent(title)}&apikey=${KEY}`);
      const data = await res.json();
      const dlUrl = data?.downloadUrl || data?.proxyUrl || data?.videoUrl;

      if (!dlUrl) {
        console.error('No download URL in response:', data);
        setDownloading(false);
        return;
      }

      // Use direct anchor download — works on both web and Capacitor
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `${title}.mp3`;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Save to downloads list
      const saved = JSON.parse(localStorage.getItem('vibely_downloads') || '[]');
      if (!saved.find((s: any) => s.videoId === track.videoId)) {
        saved.push({
          videoId: track.videoId,
          title: track.title,
          artist: track.artist || '',
          thumbnail: track.thumbnail || '',
          duration: track.duration || '',
          filePath: '',
          fileSize: 0,
          downloadedAt: new Date().toISOString(),
          source: 'vibely'
        });
        localStorage.setItem('vibely_downloads', JSON.stringify(saved));
      }

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error('Download failed:', err);
    }
    setDownloading(false);
  };

  const handleShare = async () => {
    if (!track?.videoId) return;
    const url = `${window.location.origin}/?song=${track.videoId}`;
    if (navigator.share) {
      try { await navigator.share({ title: track.title || '', text: `🎵 ${track.title}`, url }); return; } catch (e) {}
    }
    try { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 2000); } catch (e) {}
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

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setAudioState('playing');
      setStatusMsg('');
    }
  };
  const handleCanPlay = () => { setAudioState('playing'); setStatusMsg(''); };
  const handlePlaying = () => { setAudioState('playing'); setStatusMsg(''); };
  const handleWaiting = () => { setStatusMsg('Buffering...'); };
  const handleError = () => { setAudioState('retrying'); setTimeout(() => { setAudioState('loading'); fetchAudio(); }, 3000); };

  const formatTime = (t: number) => { if (isNaN(t)) return '0:00'; const m = Math.floor(t/60), s = Math.floor(t%60); return `${m}:${s.toString().padStart(2,'0')}`; };

  const isLoading = audioState === 'loading' || audioState === 'retrying';

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
        <div style={{ padding: '8px 24px', textAlign: 'center', background: 'rgba(124,58,237,0.06)', color: '#a78bfa', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> {statusMsg}{dots}
        </div>
      )}

      {autoplayLoading && (
        <div style={{ padding: '8px 24px', textAlign: 'center', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Finding related songs...
        </div>
      )}

      <div style={{ display: 'flex', padding: '0 24px', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 380px', minWidth: '300px' }}>
          <div style={{ width: '100%', aspectRatio: '1', borderRadius: '16px', background: 'linear-gradient(135deg, #1a1a2e, #16213e)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', overflow: 'hidden', position: 'relative' }}>
            {track.thumbnail ? <img src={track.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Music size={80} color="#a78bfa" />}
            {isLoading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader size={48} color="#a78bfa" style={{ animation: 'spin 1s linear infinite' }} /></div>}
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '2px' }}>{track.title}</h1>
          <p style={{ color: '#a78bfa', fontSize: '14px', marginBottom: '2px' }}>{track.artist || 'Unknown Artist'}</p>
          {track.duration && <p style={{ color: '#64748b', fontSize: '11px' }}>{track.duration}</p>}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <button onClick={skipBackward} className="btn-glass" style={{ padding: '4px 8px', fontSize: '10px' }}><RotateCcw size={12} /> 10s</button>
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', cursor: 'pointer' }}
                onClick={(e) => { if (audioRef.current && duration) { const r = e.currentTarget.getBoundingClientRect(); audioRef.current.currentTime = ((e.clientX-r.left)/r.width)*duration; }}}>
                <div style={{ height: '100%', width: `${duration ? (progress/duration)*100 : 0}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }} />
              </div>
              <button onClick={skipForward} className="btn-glass" style={{ padding: '4px 8px', fontSize: '10px' }}>10s <RotateCw size={12} /></button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}><span>{formatTime(progress)}</span><span>{formatTime(duration)}</span></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
            <button onClick={prevTrack} style={ctrlBtn}><SkipBack size={22} /></button>
            <button onClick={skipBackward} style={ctrlBtn}><RotateCcw size={16} /></button>
            <button onClick={togglePlay} style={{ ...ctrlBtn, width: '48px', height: '48px', background: '#7c3aed', borderRadius: '50%' }}>
              {isLoading ? <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} /> : isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button onClick={skipForward} style={ctrlBtn}><RotateCw size={16} /></button>
            <button onClick={nextTrack} style={ctrlBtn}><SkipForward size={22} /></button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
            <button onClick={cycleSpeed} className="btn-glass" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}><Gauge size={12} /> {playbackRate}x</button>
            <button onClick={() => track && toggleFavorite(track)} className="btn-glass"><Heart size={12} fill={isFav ? '#f43f5e' : 'none'} color={isFav ? '#f43f5e' : '#94a3b8'} /></button>
            <button onClick={toggleAutoplay} className="btn-glass" style={{ fontSize: '11px', background: autoplayEnabled ? 'rgba(245,158,11,0.15)' : 'transparent', borderColor: autoplayEnabled ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)' }}>
              <Infinity size={12} color={autoplayEnabled ? '#f59e0b' : '#64748b'} /> Autoplay
            </button>
            <button onClick={handleDownload} className="btn-glass" style={{ fontSize: '11px' }}>
              {downloading ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : downloaded ? <Check size={12} color="#10b981" /> : <Download size={12} />}
              {downloaded ? 'Done' : 'MP3'}
            </button>
            <button onClick={handleShare} className="btn-glass" style={{ fontSize: '11px' }}>
              {shared ? <Check size={12} color="#10b981" /> : <Share2 size={12} />}
              {shared ? 'Copied' : 'Share'}
            </button>
          </div>
          {upcomingTrack && (
            <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>⏭ Coming Next</div>
              <div style={{ fontSize: '12px', color: '#f1f5f9', fontWeight: 500 }}>{upcomingTrack.title?.substring(0, 40)}</div>
              <div style={{ fontSize: '10px', color: '#a78bfa' }}>{upcomingTrack.artist}</div>
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: '300px', maxHeight: '60vh', overflowY: 'auto', padding: '0 8px' }}>
          {lyricLines.length > 0 ? lyricLines.map((line, i) => (
            <p key={i} onClick={() => { if (audioRef.current) audioRef.current.currentTime = line.time; }}
              style={{ padding: '6px 0', fontSize: '17px', fontWeight: i === currentLine ? 700 : 400, color: i === currentLine ? '#fff' : i < currentLine ? '#64748b' : '#94a3b8', transition: 'all 0.3s', lineHeight: 1.6, cursor: 'pointer' }}>
              {line.text}
            </p>
          )) : lyrics?.lyrics ? (
            <pre style={{ color: '#94a3b8', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{lyrics.lyrics}</pre>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <Music size={48} color="#a78bfa" style={{ marginBottom: '12px', opacity: 0.5 }} />
              <div style={{ fontSize: '15px' }}>🎤 Vocals Playing</div>
              <div style={{ fontSize: '12px', marginTop: '6px' }}>Lyrics unavailable for this track</div>
            </div>
          )}
        </div>
      </div>
      {audioUrl && <audio ref={audioRef} src={audioUrl} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onCanPlay={handleCanPlay} onWaiting={handleWaiting} onPlaying={handlePlaying} onError={handleError} onEnded={handleEnded} preload="auto" crossOrigin="anonymous" autoPlay />}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const ctrlBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
