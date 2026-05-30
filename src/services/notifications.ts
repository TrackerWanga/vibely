import { isNativeApp } from './platform';
import { useMusicStore } from '../store/musicStore';

let controlsAvailable = false;

export async function createMusicControls(track: {
  title: string;
  artist: string;
  thumbnail: string;
  isPlaying?: boolean;
}) {
  if (!isNativeApp()) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || 'Unknown',
        artist: track.artist || 'Unknown Artist',
        artwork: track.thumbnail ? [{ src: track.thumbnail, sizes: '480x360', type: 'image/jpg' }] : []
      });
    }
    return;
  }

  try {
    const { CapacitorMusicControls } = await import('capacitor-music-controls-plugin');
    CapacitorMusicControls.create({
      track: track.title || 'Unknown',
      artist: track.artist || 'Unknown Artist',
      cover: track.thumbnail || '',
      isPlaying: track.isPlaying ?? true,
      hasPrev: true,
      hasNext: true,
      hasClose: false,
      dismissable: true,
      ticker: `Now playing: ${track.title}`,
    });
    controlsAvailable = true;
  } catch (e) {
    console.log('Music controls not available');
    controlsAvailable = false;
  }
}

export async function updateMusicControlsPlaying(isPlaying: boolean) {
  if (!isNativeApp() || !controlsAvailable) return;
  try {
    const { CapacitorMusicControls } = await import('capacitor-music-controls-plugin');
    CapacitorMusicControls.updateIsPlaying({ isPlaying });
  } catch (e) {}
}

export function setupMusicControlListeners() {
  if (!isNativeApp()) return;

  try {
    import('capacitor-music-controls-plugin').then(({ CapacitorMusicControls }) => {
      CapacitorMusicControls.addListener('controlsNotification', (info: any) => {
        handleControlEvent(info?.message || info);
      });
    }).catch(() => {});
    
    document.addEventListener('controlsNotification', (event: any) => {
      const message = event?.message || event?.detail?.message;
      if (message) handleControlEvent(message);
    });
  } catch (e) {}
}

export function destroyMusicControls() {
  controlsAvailable = false;
}

function handleControlEvent(message: string) {
  const store = useMusicStore.getState();
  switch (message) {
    case 'music-controls-next': store.nextTrack(); break;
    case 'music-controls-previous': store.prevTrack(); break;
    case 'music-controls-pause':
    case 'music-controls-play':
    case 'music-controls-toggle-play-pause': store.togglePlay(); break;
    case 'music-controls-headset-unplugged': if (store.isPlaying) store.togglePlay(); break;
    default: break;
  }
}

export async function updateMusicControlsTrack(track: {
  title: string;
  artist: string;
  thumbnail: string;
  isPlaying?: boolean;
}) {
  await createMusicControls(track);
}
