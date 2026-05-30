import { LocalNotifications, ActionType } from '@capacitor/local-notifications';
import { isNativeApp } from './platform';
import { useMusicStore } from '../store/musicStore';

let notificationListenerSetup = false;
let isCurrentlyPlaying = false;

// Setup notification channel and action types
async function setupNotificationChannel() {
  if (!isNativeApp()) return;
  
  try {
    // Register action types with buttons
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

    // Listen for button taps
    if (!notificationListenerSetup) {
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        const store = useMusicStore.getState();
        switch (notification.actionId) {
          case 'prev':
            store.prevTrack();
            break;
          case 'play_pause':
            store.togglePlay();
            break;
          case 'next':
            store.nextTrack();
            break;
          case 'close':
            hideNowPlaying();
            break;
        }
      });
      notificationListenerSetup = true;
    }
  } catch (e) {
    console.error('Notification setup error:', e);
  }
}

// Show now playing notification
export async function showNowPlaying(track: {
  title: string;
  artist: string;
}) {
  if (!isNativeApp()) return;

  await setupNotificationChannel();

  try {
    // Cancel old notification
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

    // Schedule new one with action buttons
    await LocalNotifications.schedule({
      notifications: [{
        id: 1,
        title: track.title || 'Unknown',
        body: `${track.artist || 'Unknown Artist'} — Vibely`,
        ongoing: true,
        autoCancel: false,
        schedule: { at: new Date(Date.now() + 100) },
        actionTypeId: 'playback_controls',
        sound: null,
        attachments: null
      }]
    });
  } catch (e) {
    console.error('Show notification error:', e);
  }
}

export function hideNowPlaying() {
  if (!isNativeApp()) return;
  LocalNotifications.cancel({ notifications: [{ id: 1 }] }).catch(() => {});
  isCurrentlyPlaying = false;
}

// Update notification for play/pause state
export async function updateNowPlayingState(isPlaying: boolean) {
  isCurrentlyPlaying = isPlaying;
  // Re-show notification with same data but updated
  const store = useMusicStore.getState();
  const track = store.currentTrack;
  if (track) {
    await showNowPlaying({ title: track.title || '', artist: track.artist || '' });
  }
}
