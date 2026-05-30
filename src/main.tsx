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
import DocsPage from './pages/DocsPage';
import PlayerBar from './components/PlayerBar';
import Sidebar from './components/Sidebar';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import { useMusicStore } from './store/musicStore';
import { requestAllPermissions } from './services/permissions';
import './styles/globals.css';

function HomeWrapper() {
  const navigate = useNavigate();
  const sidebar = useSidebar();
  return <HomePage 
    onSearch={() => navigate('/search')} 
    onArtistSelect={(name) => navigate(`/artist/${encodeURIComponent(name)}`)} 
    onSongPlay={() => navigate('/player')} 
    onGospelClick={() => navigate('/gospel')} 
    onBelovedClick={() => navigate('/beloved')} 
    onOfflineClick={() => navigate('/offline')} 
    onMenuClick={() => sidebar.open()}
  />;
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
  const sidebar = useSidebar();

  useEffect(() => { requestAllPermissions(); }, []);
  
  useEffect(() => {
    CapApp.addListener('backButton', () => {
      if (sidebar.isOpen) { sidebar.close(); return; }
      window.location.pathname === '/' ? CapApp.minimizeApp() : navigate(-1);
    });
  }, [navigate, sidebar]);

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
        <Route path="/docs" element={<DocsWrapper />} />
      </Routes>
      <PlayerBar />
      <Sidebar isOpen={sidebar.isOpen} onClose={() => sidebar.close()} />
    </>
  );
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
  const sidebar = useSidebar();
  return <PlayerPage onBack={() => navigate(-1)} onVideoMode={() => navigate('/video')} onMenuClick={() => sidebar.open()} />;
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
function DocsWrapper() {
  const navigate = useNavigate();
  return <DocsPage onBack={() => navigate(-1)} />;
}
  const navigate = useNavigate();
  const sidebar = useSidebar();
  return <OfflinePage onBack={() => navigate(-1)} onSongPlay={() => navigate('/player')} onMenuClick={() => sidebar.open()} />;
}

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <AppShell />
      </SidebarProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
