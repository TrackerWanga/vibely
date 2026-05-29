import { CapacitorMusicControls } from 'capacitor-music-controls-plugin';
import { isNativeApp } from './platform';
import { useMusicStore } from '../store/musicStore';

// Initialize music controls for Android notification & lock screen
export async function createMusicControls(track: {
  title: string;
  artist: string;
  thumbnail: string;
  duration?: string;
  isPlaying?: boolean;
}) {
  if (!isNativeApp()) return;

  try {
    await CapacitorMusicControls.create({
      track: track.title || 'Unknown',
      artist: track.artist || 'Unknown Artist',
      cover: track.thumbnail || '',
      isPlaying: track.isPlaying ?? true,
      hasPrev: true,
      hasNext: true,
      hasClose: true,
      dismissable: true,
      ticker: `Now playing: ${track.title}`,
    });
  } catch (e) {
    console.error('Music controls create failed:', e);
  }
}

// Update play/pause state
export async function updateMusicControlsPlaying(isPlaying: boolean) {
  if (!isNativeApp()) return;
  try {
    await CapacitorMusicControls.updateIsPlaying({ isPlaying });
  } catch (e) {}
}

// Update track info
export async function updateMusicControlsTrack(track: {
  title: string;
  artist: string;
  thumbnail: string;
  isPlaying?: boolean;
}) {
  if (!isNativeApp()) return;
  try {
    await CapacitorMusicControls.create({
      track: track.title || 'Unknown',
      artist: track.artist || 'Unknown Artist',
      cover: track.thumbnail || '',
      isPlaying: track.isPlaying ?? true,
      hasPrev: true,
      hasNext: true,
      hasClose: true,
      dismissable: true,
      ticker: `Now playing: ${track.title}`,
    });
  } catch (e) {}
}

// Destroy music controls
export async function destroyMusicControls() {
  if (!isNativeApp()) return;
  try {
    // CapacitorMusicControls doesn't have destroy, we just update with empty
    await CapacitorMusicControls.create({
      track: '',
      artist: '',
      isPlaying: false,
      hasPrev: false,
      hasNext: false,
      hasClose: true,
      dismissable: true,
    });
  } catch (e) {}
}

// Listen for control events from notification/lock screen
export function setupMusicControlListeners() {
  if (!isNativeApp()) return;

  const store = useMusicStore.getState;

  try {
    // iOS listener
    CapacitorMusicControls.addListener('controlsNotification', (info: any) => {
      handleControlEvent(info?.message || info);
    });
  } catch (e) {
    // Android listener (bug in Capacitor 4+ on Android 13)
    document.addEventListener('controlsNotification', (event: any) => {
      const message = event?.message || event?.detail?.message;
      handleControlEvent(message);
    });
  }
}

function handleControlEvent(message: string) {
  const store = useMusicStore.getState();
  
  switch (message) {
    case 'music-controls-next':
      store.nextTrack();
      break;
    case 'music-controls-previous':
      store.prevTrack();
      break;
    case 'music-controls-pause':
      store.togglePlay();
      break;
    case 'music-controls-play':
      store.togglePlay();
      break;
    case 'music-controls-destroy':
      break;
    case 'music-controls-toggle-play-pause':
      store.togglePlay();
      break;
    case 'music-controls-headset-unplugged':
      if (store.isPlaying) store.togglePlay();
      break;
    case 'music-controls-headset-plugged':
      break;
    default:
      break;
  }
}
