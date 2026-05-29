import { create } from 'zustand';

interface Track {
  videoId: string; title: string; artist?: string;
  thumbnail?: string; duration?: string;
}

interface MusicState {
  currentTrack: Track | null; isPlaying: boolean; isMuted: boolean;
  queue: Track[]; queueIndex: number;
  volume: number; progress: number; duration: number;
  isDownloading: boolean; downloadProgress: number;
  favorites: Track[];
  history: Track[];
  autoplayEnabled: boolean;
  setTrack: (t: Track) => void;
  togglePlay: () => void;
  toggleMute: () => void;
  setQueue: (tracks: Track[], start?: number) => void;
  addToQueue: (track: Track) => void;
  nextTrack: () => void; prevTrack: () => void;
  setVolume: (v: number) => void;
  setProgress: (p: number) => void;
  setDuration: (d: number) => void;
  setDownloadProgress: (p: number) => void;
  toggleFavorite: (t: Track) => void;
  toggleAutoplay: () => void;
  addToHistory: (t: Track) => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentTrack: null, isPlaying: false, isMuted: true,
  queue: [], queueIndex: -1,
  volume: 0.8, progress: 0, duration: 0,
  isDownloading: false, downloadProgress: 0,
  favorites: JSON.parse(localStorage.getItem('vibely_favorites') || '[]'),
  history: JSON.parse(localStorage.getItem('vibely_history') || '[]'),
  autoplayEnabled: JSON.parse(localStorage.getItem('vibely_autoplay') || 'true'),

  setTrack: (track) => {
    const { history } = get();
    const newHistory = [track, ...history.filter(h => h.videoId !== track.videoId)].slice(0, 50);
    localStorage.setItem('vibely_history', JSON.stringify(newHistory));
    set({ currentTrack: track, isPlaying: true, history: newHistory });
  },

  togglePlay: () => set(s => ({ isPlaying: !s.isPlaying })),

  toggleMute: () => set(s => ({ isMuted: !s.isMuted })),

  setQueue: (tracks, start = 0) => {
    const track = tracks[start];
    const { history } = get();
    const newHistory = track ? [track, ...history.filter(h => h.videoId !== track.videoId)].slice(0, 50) : history;
    if (track) localStorage.setItem('vibely_history', JSON.stringify(newHistory));
    set({
      queue: tracks, queueIndex: start,
      currentTrack: track || null, isPlaying: true,
      history: newHistory,
    });
  },

  addToQueue: (track) => {
    const { queue } = get();
    set({ queue: [...queue, track] });
  },

  nextTrack: () => {
    const { queue, queueIndex } = get();
    if (queueIndex < queue.length - 1) {
      const next = queue[queueIndex + 1];
      const { history } = get();
      const newHistory = [next, ...history.filter(h => h.videoId !== next.videoId)].slice(0, 50);
      localStorage.setItem('vibely_history', JSON.stringify(newHistory));
      set({ queueIndex: queueIndex + 1, currentTrack: next, isPlaying: true, history: newHistory });
    } else {
      // Queue ended — stop playback, autoplay will be handled by PlayerPage
      set({ isPlaying: false });
    }
  },

  prevTrack: () => {
    const { queue, queueIndex } = get();
    if (queueIndex > 0) {
      set({ queueIndex: queueIndex - 1, currentTrack: queue[queueIndex - 1], isPlaying: true });
    }
  },

  setVolume: (v) => set({ volume: v }),
  setProgress: (p) => set({ progress: p }),
  setDuration: (d) => set({ duration: d }),

  setDownloadProgress: (p) => set({ downloadProgress: p, isDownloading: p < 100 }),

  toggleFavorite: (track) => {
    const favs = get().favorites;
    const exists = favs.find(f => f.videoId === track.videoId);
    const newFavs = exists ? favs.filter(f => f.videoId !== track.videoId) : [...favs, track];
    localStorage.setItem('vibely_favorites', JSON.stringify(newFavs));
    set({ favorites: newFavs });
  },

  toggleAutoplay: () => {
    const current = get().autoplayEnabled;
    const next = !current;
    localStorage.setItem('vibely_autoplay', JSON.stringify(next));
    set({ autoplayEnabled: next });
  },

  addToHistory: (track) => {
    const { history } = get();
    const newHistory = [track, ...history.filter(h => h.videoId !== track.videoId)].slice(0, 50);
    localStorage.setItem('vibely_history', JSON.stringify(newHistory));
    set({ history: newHistory });
  },
}));
