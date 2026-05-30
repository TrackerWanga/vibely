import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativeApp } from './platform';
import { useMusicStore } from '../store/musicStore';

let initialized = false;

async function ensureInit() {
  if (!isNativeApp() || initialized) return;
  
  try {
    // Step 1: Create channel
    await LocalNotifications.createChannel({
      id: 'vibely',
      name: 'Vibely',
      importance: 4,
      visibility: 1,
    });
  } catch(e) { console.log('channel error:', e); }

  try {
    // Step 2: Register action types
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
  } catch(e) { console.log('action types error:', e); }

  // Step 3: Listen for button taps
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const store = useMusicStore.getState();
    switch(action.actionId) {
      case 'prev': store.prevTrack(); break;
      case 'play_pause': store.togglePlay(); break;
      case 'next': store.nextTrack(); break;
      case 'close':
        if (store.isPlaying) store.togglePlay();
        LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }] }).catch(()=>{});
        break;
    }
  });

  initialized = true;
  console.log('Notification system ready');
}

async function send(id: number, title: string, artist: string) {
  if (!isNativeApp()) return;
  await ensureInit();
  try {
    // Cancel old notification with same ID
    await LocalNotifications.cancel({ notifications: [{ id }] });
    // Schedule new
    await LocalNotifications.schedule({
      notifications: [{
        id,
        title: title || 'Unknown',
        body: artist || 'Unknown Artist',
        channelId: 'vibely',
        ongoing: true,
        autoCancel: false,
        schedule: { at: new Date(Date.now() + 200) },
        actionTypeId: 'playback',
        smallIcon: 'ic_notification',
        iconColor: '#7c3aed',
      }]
    });
    console.log(`Notification ${id} sent:`, title);
  } catch(e) { console.log('schedule error:', e); }
}

// ID 1 = Streaming
export async function showStreamNotification(title: string, artist: string) {
  await send(1, title, artist);
}
export function hideStreamNotification() {
  if (!isNativeApp()) return;
  LocalNotifications.cancel({ notifications: [{ id: 1 }] }).catch(()=>{});
}

// ID 2 = Offline
export async function showOfflineNotification(title: string, artist: string) {
  await send(2, title, artist);
}
export function hideOfflineNotification() {
  if (!isNativeApp()) return;
  LocalNotifications.cancel({ notifications: [{ id: 2 }] }).catch(()=>{});
}

// PlayerPage helpers
export function showNowPlaying(track: { title: string; artist: string }) {
  showStreamNotification(track.title, track.artist);
}
export function hideNowPlaying() {
  hideStreamNotification();
}
export function updateNowPlayingState() {}
