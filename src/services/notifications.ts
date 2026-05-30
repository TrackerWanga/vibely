import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativeApp } from './platform';
import { useMusicStore } from '../store/musicStore';

let setup = false;

async function setupOnce() {
  if (!isNativeApp() || setup) return;
  
  try {
    await LocalNotifications.createChannel({
      id: 'vibely',
      name: 'Now Playing',
      importance: 4,
      visibility: 1,
    });
  } catch (e) {}

  try {
    await LocalNotifications.registerActionTypes({
      types: [{
        id: 'controls',
        actions: [
          { id: 'prev', title: 'Previous' },
          { id: 'play_pause', title: 'Play/Pause' },
          { id: 'next', title: 'Next' },
          { id: 'close', title: 'Close', destructive: true }
        ]
      }]
    });
  } catch (e) {}

  LocalNotifications.addListener('localNotificationActionPerformed', (n) => {
    const s = useMusicStore.getState();
    if (n.actionId === 'prev') s.prevTrack();
    if (n.actionId === 'play_pause') s.togglePlay();
    if (n.actionId === 'next') s.nextTrack();
    if (n.actionId === 'close') { s.isPlaying && s.togglePlay(); LocalNotifications.cancel({ notifications: [{ id: 1 }] }); }
  });

  setup = true;
}

export async function showNowPlaying(track: { title: string; artist: string }) {
  if (!isNativeApp()) return;
  await setupOnce();
  try {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    await LocalNotifications.schedule({
      notifications: [{
        id: 1,
        title: track.title || 'Unknown',
        body: track.artist || 'Unknown Artist',
        channelId: 'vibely',
        ongoing: true,
        autoCancel: false,
        schedule: { at: new Date(Date.now() + 100) },
        actionTypeId: 'controls',
        smallIcon: 'ic_notification',
      }]
    });
  } catch (e) {}
}

export function hideNowPlaying() {
  if (!isNativeApp()) return;
  LocalNotifications.cancel({ notifications: [{ id: 1 }] }).catch(() => {});
}

export async function updateNowPlayingState(_isPlaying: boolean) {
  const s = useMusicStore.getState();
  if (s.currentTrack) await showNowPlaying({ title: s.currentTrack.title || '', artist: s.currentTrack.artist || '' });
}
