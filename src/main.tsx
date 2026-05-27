import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ArtistPage from './pages/ArtistPage';
import PlayerPage from './pages/PlayerPage';
import VideoPage from './pages/VideoPage';
import GospelPage from './pages/GospelPage';
import { useMusicStore } from './store/musicStore';
import './styles/globals.css';

function HomeWrapper() {
  const navigate = useNavigate();
  return <HomePage 
    onSearch={() => navigate('/search')}
    onArtistSelect={(name) => navigate(`/artist/${encodeURIComponent(name)}`)}
    onSongPlay={() => navigate('/player')}
    onGospelClick={() => navigate('/gospel')}
  />;
}

function SearchWrapper() {
  const navigate = useNavigate();
  return <SearchPage 
    onSongPlay={() => navigate('/player')}
    onArtistSelect={(name) => navigate(`/artist/${encodeURIComponent(name)}`)}
  />;
}

function ArtistWrapper() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  return <ArtistPage 
    artistName={decodeURIComponent(name || '')} 
    onBack={() => navigate(-1)}
    onSongPlay={() => navigate('/player')} 
  />;
}

function PlayerWrapper() {
  const navigate = useNavigate();
  return <PlayerPage 
    onBack={() => navigate(-1)} 
    onVideoMode={() => navigate('/video')} 
  />;
}

function VideoWrapper() {
  const navigate = useNavigate();
  return <VideoPage 
    onBack={() => navigate(-1)} 
    onAudioMode={() => navigate('/player')} 
  />;
}

function GospelWrapper() {
  const navigate = useNavigate();
  return <GospelPage 
    onBack={() => navigate(-1)}
    onArtistSelect={(name) => navigate(`/artist/${encodeURIComponent(name)}`)}
    onSongPlay={() => navigate('/player')}
  />;
}

function SharedSongHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setQueue = useMusicStore(s => s.setQueue);
  
  useEffect(() => {
    const songId = searchParams.get('song');
    const title = searchParams.get('title');
    if (songId) {
      setQueue([{
        videoId: songId,
        title: title || 'Shared Song',
        artist: '',
        thumbnail: `https://i.ytimg.com/vi/${songId}/hqdefault.jpg`,
        duration: '',
      }], 0);
      navigate('/player', { replace: true });
    }
  }, []);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <SharedSongHandler />
      <Routes>
        <Route path="/" element={<HomeWrapper />} />
        <Route path="/search" element={<SearchWrapper />} />
        <Route path="/artist/:name" element={<ArtistWrapper />} />
        <Route path="/player" element={<PlayerWrapper />} />
        <Route path="/video" element={<VideoWrapper />} />
        <Route path="/gospel" element={<GospelWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
