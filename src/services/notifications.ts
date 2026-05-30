import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativeApp } from './platform';
import { useMusicStore } from '../store/musicStore';

let notificationListenerSetup = false;

// Create "Now Playing" notification with action buttons
export async function showNowPlaying(track: {
  title: string;
  artist: string;
}) {
  if (!isNativeApp()) return;

  try {
    // Setup listeners once
    if (!notificationListenerSetup) {
      LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        const store = useMusicStore.getState();
        switch (action.actionId) {
          case 'play': store.togglePlay(); break;
          case 'next': store.nextTrack(); break;
          case 'prev': store.prevTrack(); break;
          case 'stop':
            store.isPlaying && store.togglePlay();
            LocalNotifications.cancel({ notifications: [{ id: 1 }] });
            break;
        }
      });
      notificationListenerSetup = true;
    }

    // Cancel previous
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

    // Create with action buttons
    await LocalNotifications.schedule({
      notifications: [{
        id: 1,
        title: `🎵 ${track.title || 'Unknown'}`,
        body: track.artist || 'Unknown Artist',
        ongoing: true,
        autoCancel: false,
        schedule: { at: new Date(Date.now() + 500) },
        actionTypeId: 'now_playing',
        extra: { type: 'now_playing' }
      }]
    });

    // Register the action type for buttons
    await LocalNotifications.registerActionTypes({
      types: [{
        id: 'now_playing',
        actions: [
          { id: 'prev', title: '⏮' },
          { id: 'play', title: '▶⏸' },
          { id: 'next', title: '⏭' },
          { id: 'stop', title: '⏹' }
        ]
      }]
    });
  } catch (e) {
    console.log('Notification error:', e);
  }
}

export function hideNowPlaying() {
  if (!isNativeApp()) return;
  LocalNotifications.cancel({ notifications: [{ id: 1 }] }).catch(() => {});
}
