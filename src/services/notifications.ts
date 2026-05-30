import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativeApp } from './platform';
import { useMusicStore } from '../store/musicStore';

let setup = false;

async function setupOnce() {
  if (!isNativeApp() || setup) return;
  
  try {
    await LocalNotifications.createChannel({
      id: 'vibely',
      name: 'Vibely Player',
      importance: 4,
      visibility: 1,
    });
  } catch (e) {}

  try {
    await LocalNotifications.registerActionTypes({
      types: [{
        id: 'controls',
        actions: [
          { id: 'prev', title: 'Previous', foreground: true },
          { id: 'play_pause', title: 'Play/Pause', foreground: true },
          { id: 'next', title: 'Next', foreground: true },
          { id: 'close', title: 'Close', destructive: true }
        ]
      }]
    });
  } catch (e) {}

  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const actionId = action.actionId;
    const store = useMusicStore.getState();
    
    if (actionId === 'prev') store.prevTrack();
    else if (actionId === 'play_pause') store.togglePlay();
    else if (actionId === 'next') store.nextTrack();
    else if (actionId === 'close') {
      // Stop playback
      if (store.isPlaying) store.togglePlay();
      // Cancel all notifications
      LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }] });
    }
  });

  setup = true;
}

// Notification ID 1: Streaming
export async function showStreamingNotification(track: { title: string; artist: string }) {
  if (!isNativeApp()) return;
  await setupOnce();
  try {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    await LocalNotifications.schedule({
      notifications: [{
        id: 1,
        title: track.title || 'Unknown',
        body: `${track.artist || 'Unknown Artist'}`,
        channelId: 'vibely',
        ongoing: true,
        autoCancel: false,
        schedule: { at: new Date(Date.now() + 100) },
        actionTypeId: 'controls',
      }]
    });
  } catch (e) {}
}

// Notification ID 2: Offline
export async function showOfflineNotification(track: { title: string; artist: string }) {
  if (!isNativeApp()) return;
  await setupOnce();
  try {
    await LocalNotifications.cancel({ notifications: [{ id: 2 }] });
    await LocalNotifications.schedule({
      notifications: [{
        id: 2,
        title: track.title || 'Unknown',
        body: `${track.artist || 'Unknown Artist'}`,
        channelId: 'vibely',
        ongoing: true,
        autoCancel: false,
        schedule: { at: new Date(Date.now() + 100) },
        actionTypeId: 'controls',
      }]
    });
  } catch (e) {}
}

export function hideStreamingNotification() {
  if (!isNativeApp()) return;
  LocalNotifications.cancel({ notifications: [{ id: 1 }] }).catch(() => {});
}

export function hideOfflineNotification() {
  if (!isNativeApp()) return;
  LocalNotifications.cancel({ notifications: [{ id: 2 }] }).catch(() => {});
}

// Backward compat
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
