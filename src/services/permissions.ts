import { isNativeApp } from './platform';
import { NativeSettings, AndroidSettings } from 'capacitor-native-settings';

// Show a persistent permission request flow
export async function requestAllPermissions(): Promise<{
  storage: boolean;
  notifications: boolean;
}> {
  if (!isNativeApp()) return { storage: true, notifications: true };

  const result = { storage: false, notifications: false };

  // 1. Try notifications first (this one already works)
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const nCheck = await LocalNotifications.checkPermissions();
    if (nCheck.display !== 'granted') {
      const nReq = await LocalNotifications.requestPermissions();
      result.notifications = nReq.display === 'granted';
    } else {
      result.notifications = true;
    }
  } catch (e) {}

  // 2. Try storage - chain multiple attempts
  try {
    const { Filesystem } = await import('@capacitor/filesystem');
    
    // Try 1: Direct request
    const check = await Filesystem.checkPermissions();
    if (check.publicStorage === 'granted') {
      result.storage = true;
    } else {
      const req1 = await Filesystem.requestPermissions();
      if (req1.publicStorage === 'granted') {
        result.storage = true;
      } else {
        // Try 2: requestPermissions again (sometimes works on second attempt)
        const req2 = await Filesystem.requestPermissions();
        if (req2.publicStorage === 'granted') {
          result.storage = true;
        }
      }
    }
  } catch (e) {}

  // 3. If still denied, we'll let the user know to use settings
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

// Open app settings
export function openAppSettings() {
  if (isNativeApp()) {
    NativeSettings.openAndroid({ option: AndroidSettings.ApplicationDetails });
  }
}
