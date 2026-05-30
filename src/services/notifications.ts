import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativeApp } from './platform';
import { useMusicStore } from '../store/musicStore';

let channelCreated = false;
let notificationListenerSetup = false;

async function ensureChannel() {
  if (!isNativeApp() || channelCreated) return;
  
  try {
    await LocalNotifications.createChannel({
      id: 'vibely_playback',
      name: 'Now Playing',
      description: 'Shows currently playing track with playback controls',
      importance: 4,
      visibility: 1,
      sound: undefined,
      vibration: false,
      lights: false,
    });
    channelCreated = true;
  } catch (e) {
    console.error('Channel creation error:', e);
  }
}

async function ensureActionTypes() {
  if (!isNativeApp()) return;
  
  try {
    await LocalNotifications.registerActionTypes({
      types: [{
        id: 'playback_controls',
        actions: [
          { id: 'prev', title: 'Previous', foreground: true },
          { id: 'play_pause', title: 'Play/Pause', foreground: true },
          { id: 'next', title: 'Next', foreground: true },
          { id: 'close', title: 'Close', foreground: false, destructive: true }
        ]
      }]
    });
  } catch (e) {
    console.error('Register action types error:', e);
  }

  if (!notificationListenerSetup) {
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      const store = useMusicStore.getState();
      switch (notification.actionId) {
        case 'prev': store.prevTrack(); break;
        case 'play_pause': store.togglePlay(); break;
        case 'next': store.nextTrack(); break;
        case 'close':
          store.isPlaying && store.togglePlay();
          LocalNotifications.cancel({ notifications: [{ id: 1 }] });
          break;
      }
    });
    notificationListenerSetup = true;
  }
}

export async function showNowPlaying(track: { title: string; artist: string }) {
  if (!isNativeApp()) return;

  await ensureChannel();
  await ensureActionTypes();

  try {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

    await LocalNotifications.schedule({
      notifications: [{
        id: 1,
        title: `🎵 ${track.title || 'Unknown'}`,
        body: `${track.artist || 'Unknown Artist'}`,
        channelId: 'vibely_playback',
        ongoing: true,
        autoCancel: false,
        schedule: { at: new Date(Date.now() + 100) },
        actionTypeId: 'playback_controls',
        smallIcon: 'ic_launcher',
        iconColor: '#7c3aed',
      }]
    });
  } catch (e) {
    console.error('Show notification error:', e);
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
