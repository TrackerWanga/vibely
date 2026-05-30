import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativeApp } from './platform';
import { useMusicStore } from '../store/musicStore';

let ready = false;

async function init() {
  if (!isNativeApp() || ready) return;
  try {
    await LocalNotifications.createChannel({ id: 'vibely', name: 'Vibely', importance: 4, visibility: 1 });
    await LocalNotifications.registerActionTypes({
      types: [{
        id: 'playback',
        actions: [
          { id: 'prev', title: 'Previous', foreground: true },
          { id: 'play_pause', title: 'Play/Pause', foreground: true },
          { id: 'next', title: 'Next', foreground: true },
          { id: 'close', title: 'Close', destructive: true }
        ]
      }]
    });
  } catch(e) {}

  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const s = useMusicStore.getState();
    switch(action.actionId) {
      case 'prev': s.prevTrack(); break;
      case 'play_pause': s.togglePlay(); break;
      case 'next': s.nextTrack(); break;
      case 'close':
        s.isPlaying && s.togglePlay();
        LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }] });
        break;
    }
  });

  ready = true;
}

async function send(id: number, title: string, artist: string) {
  if (!isNativeApp()) return;
  await init();
  try {
    await LocalNotifications.cancel({ notifications: [{ id }] });
    await LocalNotifications.schedule({
      notifications: [{
        id, title, body: artist, channelId: 'vibely',
        ongoing: true, autoCancel: false,
        schedule: { at: new Date(Date.now() + 100) },
        actionTypeId: 'playback',
        smallIcon: 'ic_notification',
        iconColor: '#7c3aed',
      }]
    });
  } catch(e) {}
}

// Streaming notification (ID 1)
export async function showStreamNotification(title: string, artist: string) { await send(1, title, artist); }
export function hideStreamNotification() { LocalNotifications.cancel({ notifications: [{ id: 1 }] }).catch(()=>{}); }

// Offline notification (ID 2)
export async function showOfflineNotification(title: string, artist: string) { await send(2, title, artist); }
export function hideOfflineNotification() { LocalNotifications.cancel({ notifications: [{ id: 2 }] }).catch(()=>{}); }

// PlayerPage compat
export function showNowPlaying(track: { title: string; artist: string }) { showStreamNotification(track.title, track.artist); }
export function hideNowPlaying() { hideStreamNotification(); }
export async function updateNowPlayingState() {}
