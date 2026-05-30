import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ArtistPage from './pages/ArtistPage';
import PlayerPage from './pages/PlayerPage';
import VideoPage from './pages/VideoPage';
import GospelPage from './pages/GospelPage';
import BelovedPage from './pages/BelovedPage';
import OfflinePage from './pages/OfflinePage';
import { useMusicStore } from './store/musicStore';
import { requestAllPermissions } from './services/permissions';
import { isNativeApp } from './services/platform';
import './styles/globals.css';

function HomeWrapper() {
  const navigate = useNavigate();
  return <HomePage
    onSearch={() => navigate('/search')}
    onArtistSelect={(name) => navigate(`/artist/${encodeURIComponent(name)}`)}
    onSongPlay={() => navigate('/player')}
    onGospelClick={() => navigate('/gospel')}
    onBelovedClick={() => navigate('/beloved')}
    onOfflineClick={() => navigate('/offline')}
  />;
}

function SearchWrapper() {
  const navigate = useNavigate();
  return <SearchPage onSongPlay={() => navigate('/player')} onArtistSelect={(name) => navigate(`/artist/${encodeURIComponent(name)}`)} />;
}

function ArtistWrapper() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  return <ArtistPage artistName={decodeURIComponent(name || '')} onBack={() => navigate(-1)} onSongPlay={() => navigate('/player')} />;
}

function PlayerWrapper() {
  const navigate = useNavigate();
  return <PlayerPage onBack={() => navigate(-1)} onVideoMode={() => navigate('/video')} />;
}

function VideoWrapper() {
  const navigate = useNavigate();
  return <VideoPage onBack={() => navigate(-1)} onAudioMode={() => navigate('/player')} />;
}

function GospelWrapper() {
  const navigate = useNavigate();
  return <GospelPage onBack={() => navigate(-1)} onArtistSelect={(name) => navigate(`/artist/${encodeURIComponent(name)}`)} onSongPlay={() => navigate('/player')} />;
}

function BelovedWrapper() {
  const navigate = useNavigate();
  return <BelovedPage onBack={() => navigate(-1)} onArtistSelect={(name) => navigate(`/artist/${encodeURIComponent(name)}`)} onSongPlay={() => navigate('/player')} />;
}

function OfflineWrapper() {
  const navigate = useNavigate();
  return <OfflinePage onBack={() => navigate(-1)} onSongPlay={() => navigate('/player')} />;
}

function SharedSongHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setQueue = useMusicStore(s => s.setQueue);
  useEffect(() => {
    const songId = searchParams.get('song');
    if (songId) {
      setQueue([{ videoId: songId, title: searchParams.get('title') || 'Shared Song', artist: '', thumbnail: `https://i.ytimg.com/vi/${songId}/hqdefault.jpg`, duration: '' }], 0);
      navigate('/player', { replace: true });
    }
  }, []);
  return null;
}

function AppShell() {
  const navigate = useNavigate();

  // Request ALL permissions on first launch
  useEffect(() => {
    const initPermissions = async () => {
      if (isNativeApp()) {
        try {
          // Force request storage permission immediately
          const { Filesystem } = await import('@capacitor/filesystem');
          const checkResult = await Filesystem.checkPermissions();
          if (checkResult.publicStorage !== 'granted') {
            await Filesystem.requestPermissions();
          }
          
          // Request notification permission
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          const notifCheck = await LocalNotifications.checkPermissions();
          if (notifCheck.display !== 'granted') {
            await LocalNotifications.requestPermissions();
          }
        } catch (e) {
          console.error('Permission init error:', e);
        }
      }
    };
    setTimeout(initPermissions, 1500);
  }, []);

  // Handle Android back button
  useEffect(() => {
    const handleBack = () => {
      const path = window.location.pathname;
      if (path === '/' || path === '') {
        CapApp.minimizeApp();
      } else {
        navigate(-1);
      }
    };
    CapApp.addListener('backButton', handleBack);
    return () => {
      CapApp.removeAllListeners();
    };
  }, [navigate]);

  return (
    <>
      <SharedSongHandler />
      <Routes>
        <Route path="/" element={<HomeWrapper />} />
        <Route path="/search" element={<SearchWrapper />} />
        <Route path="/artist/:name" element={<ArtistWrapper />} />
        <Route path="/player" element={<PlayerWrapper />} />
        <Route path="/video" element={<VideoWrapper />} />
        <Route path="/gospel" element={<GospelWrapper />} />
        <Route path="/beloved" element={<BelovedWrapper />} />
        <Route path="/offline" element={<OfflineWrapper />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
