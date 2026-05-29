import { isNativeApp } from './platform';
import { NativeSettings, AndroidSettings } from 'capacitor-native-settings';

// Request all needed permissions on app startup
export async function requestAllPermissions(): Promise<{
  storage: boolean;
  notifications: boolean;
}> {
  if (!isNativeApp()) return { storage: true, notifications: true };

  const result = { storage: false, notifications: false };

  // Storage
  try {
    const { Filesystem } = await import('@capacitor/filesystem');
    const permStatus = await Filesystem.checkPermissions();
    if (permStatus.publicStorage === 'granted') {
      result.storage = true;
    } else {
      const requestResult = await Filesystem.requestPermissions();
      result.storage = requestResult.publicStorage === 'granted';
    }
  } catch (e) {
    console.error('Storage permission error:', e);
  }

  // Notifications
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const permResult = await LocalNotifications.checkPermissions();
    if (permResult.display === 'granted') {
      result.notifications = true;
    } else {
      const requestResult = await LocalNotifications.requestPermissions();
      result.notifications = requestResult.display === 'granted';
    }
  } catch (e) {
    console.error('Notification permission error:', e);
  }

  return result;
}

// Check storage permission
export async function hasStoragePermission(): Promise<boolean> {
  if (!isNativeApp()) return true;
  try {
    const { Filesystem } = await import('@capacitor/filesystem');
    const status = await Filesystem.checkPermissions();
    return status.publicStorage === 'granted';
  } catch {
    return false;
  }
}

// Open app settings so user can manually grant permissions
export function openAppSettings() {
  if (isNativeApp()) {
    NativeSettings.openAndroid({ option: AndroidSettings.ApplicationDetails });
  }
}
