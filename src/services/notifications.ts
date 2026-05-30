import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativeApp } from './platform';
import { useMusicStore } from '../store/musicStore';

let notificationListenerSetup = false;

async function setupNotificationChannel() {
  if (!isNativeApp()) return;
  
  try {
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'playback_controls',
          actions: [
            { id: 'prev', title: 'Previous' },
            { id: 'play_pause', title: 'Play/Pause' },
            { id: 'next', title: 'Next' },
            { id: 'close', title: 'Close', destructive: true }
          ]
        }
      ]
    });

    if (!notificationListenerSetup) {
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        const store = useMusicStore.getState();
        switch (notification.actionId) {
          case 'prev': store.prevTrack(); break;
          case 'play_pause': store.togglePlay(); break;
          case 'next': store.nextTrack(); break;
          case 'close': hideNowPlaying(); break;
        }
      });
      notificationListenerSetup = true;
    }
  } catch (e) {
    console.error('Notification setup error:', e);
  }
}

export async function showNowPlaying(track: {
  title: string;
  artist: string;
}) {
  if (!isNativeApp()) return;

  await setupNotificationChannel();

  try {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

    await LocalNotifications.schedule({
      notifications: [{
        id: 1,
        title: track.title || 'Unknown',
        body: `${track.artist || 'Unknown Artist'} — Vibely`,
        ongoing: true,
        autoCancel: false,
        schedule: { at: new Date(Date.now() + 100) },
        actionTypeId: 'playback_controls',
        sound: undefined,
        attachments: undefined
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
