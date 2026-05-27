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
  setTrack: (t: Track) => void;
  togglePlay: () => void;
  toggleMute: () => void;
  setQueue: (tracks: Track[], start?: number) => void;
  nextTrack: () => void; prevTrack: () => void;
  setVolume: (v: number) => void;
  setProgress: (p: number) => void;
  setDuration: (d: number) => void;
  setDownloadProgress: (p: number) => void;
  toggleFavorite: (t: Track) => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentTrack: null, isPlaying: false, isMuted: true,
  queue: [], queueIndex: -1,
  volume: 0.8, progress: 0, duration: 0,
  isDownloading: false, downloadProgress: 0,
  favorites: JSON.parse(localStorage.getItem('vibely_favorites') || '[]'),

  setTrack: (track) => set({ currentTrack: track, isPlaying: true }),

  togglePlay: () => set(s => ({ isPlaying: !s.isPlaying })),

  toggleMute: () => set(s => ({ isMuted: !s.isMuted })),

  setQueue: (tracks, start = 0) => set({
    queue: tracks, queueIndex: start,
    currentTrack: tracks[start], isPlaying: true
  }),

  nextTrack: () => {
    const { queue, queueIndex } = get();
    if (queueIndex < queue.length - 1) {
      set({ queueIndex: queueIndex + 1, currentTrack: queue[queueIndex + 1], isPlaying: true });
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
}));
