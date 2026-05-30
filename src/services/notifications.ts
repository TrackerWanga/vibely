import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativeApp } from './platform';

// Create a sticky "Now Playing" notification
export async function showNowPlaying(track: {
  title: string;
  artist: string;
}) {
  if (!isNativeApp()) return;

  try {
    // Cancel previous
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    
    await LocalNotifications.schedule({
      notifications: [{
        id: 1,
        title: track.title || 'Unknown',
        body: track.artist || 'Unknown Artist',
        ongoing: true,
        autoCancel: false,
        schedule: { at: new Date(Date.now() + 1000) }
      }]
    });
  } catch (e) {
    console.log('Notification not available');
  }
}

export function hideNowPlaying() {
  if (!isNativeApp()) return;
  LocalNotifications.cancel({ notifications: [{ id: 1 }] }).catch(() => {});
}
