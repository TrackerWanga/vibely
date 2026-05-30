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
    if (n.actionId === 'close') {
      // Stop whatever is playing and cancel the notification that was tapped
      const s = useMusicStore.getState();
      if (s.isPlaying) s.togglePlay();
      LocalNotifications.cancel({ notifications: [{ id: n.notification.id }] });
      return;
    }
    const s = useMusicStore.getState();
    if (n.actionId === 'prev') s.prevTrack();
    if (n.actionId === 'play_pause') s.togglePlay();
    if (n.actionId === 'next') s.nextTrack();
  });

  setup = true;
}

// For streaming (PlayerPage) - uses ID 1
export async function showStreamingNotification(track: { title: string; artist: string }) {
  if (!isNativeApp()) return;
  await setupOnce();
  try {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    await LocalNotifications.schedule({
      notifications: [{
        id: 1,
        title: track.title || 'Unknown',
        body: `${track.artist || 'Unknown Artist'} — Streaming`,
        channelId: 'vibely',
        ongoing: true,
        autoCancel: false,
        schedule: { at: new Date(Date.now() + 100) },
        actionTypeId: 'controls',
      }]
    });
  } catch (e) {}
}

// For offline playback - uses ID 2
export async function showOfflineNotification(track: { title: string; artist: string }) {
  if (!isNativeApp()) return;
  await setupOnce();
  try {
    await LocalNotifications.cancel({ notifications: [{ id: 2 }] });
    await LocalNotifications.schedule({
      notifications: [{
        id: 2,
        title: track.title || 'Unknown',
        body: `${track.artist || 'Unknown Artist'} — Offline`,
        channelId: 'vibely',
        ongoing: true,
        autoCancel: false,
        schedule: { at: new Date(Date.now() + 100) },
        actionTypeId: 'controls',
      }]
    });
  } catch (e) {}
}

// Hide specific notification
export function hideStreamingNotification() {
  if (!isNativeApp()) return;
  LocalNotifications.cancel({ notifications: [{ id: 1 }] }).catch(() => {});
}

export function hideOfflineNotification() {
  if (!isNativeApp()) return;
  LocalNotifications.cancel({ notifications: [{ id: 2 }] }).catch(() => {});
}

// These keep backward compatibility
export function showNowPlaying(track: { title: string; artist: string }) {
  showStreamingNotification(track);
}

export function hideNowPlaying() {
  hideStreamingNotification();
}

export async function updateNowPlayingState(_isPlaying: boolean) {
  const s = useMusicStore.getState();
  if (s.currentTrack) {
    await showStreamingNotification({ title: s.currentTrack.title || '', artist: s.currentTrack.artist || '' });
  }
}
