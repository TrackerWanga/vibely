import { isNativeApp } from './platform';

// Request all needed permissions on app startup
export async function requestAllPermissions(): Promise<{
  storage: boolean;
  notifications: boolean;
}> {
  if (!isNativeApp()) return { storage: true, notifications: true };

  const result = { storage: false, notifications: false };

  try {
    // Storage permission
    const { Filesystem } = await import('@capacitor/filesystem');
    const permStatus = await Filesystem.checkPermissions();
    
    if (permStatus.publicStorage !== 'granted') {
      const requestResult = await Filesystem.requestPermissions();
      result.storage = requestResult.publicStorage === 'granted';
    } else {
      result.storage = true;
    }
  } catch (e) {
    console.error('Storage permission error:', e);
  }

  try {
    // Notification permission
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const permResult = await LocalNotifications.checkPermissions();
    
    if (permResult.display !== 'granted') {
      const requestResult = await LocalNotifications.requestPermissions();
      result.notifications = requestResult.display === 'granted';
    } else {
      result.notifications = true;
    }
  } catch (e) {
    console.error('Notification permission error:', e);
  }

  return result;
}

// Check if we have storage access
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
