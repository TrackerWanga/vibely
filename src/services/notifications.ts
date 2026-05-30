import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativeApp } from './platform';
import { useMusicStore } from '../store/musicStore';

export async function showNowPlaying(track: { title: string; artist: string }) {
  if (!isNativeApp()) return;

  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: 1,
        title: track.title || 'Unknown',
        body: `${track.artist || 'Unknown Artist'} — Vibely`,
        ongoing: true,
        autoCancel: false,
        schedule: { at: new Date(Date.now() + 100) },
      }]
    });
  } catch (e) {
    console.error('Notification error:', e);
  }
}

export function hideNowPlaying() {
  if (!isNativeApp()) return;
  LocalNotifications.cancel({ notifications: [{ id: 1 }] }).catch(() => {});
}

export async function updateNowPlayingState(_isPlaying: boolean) {
  const store = useMusicStore.getState();
  const track = store.currentTrack;
  if (track) {
    await showNowPlaying({ title: track.title || '', artist: track.artist || '' });
  }
}
