import { isNativeApp } from './platform';
import { NativeSettings, AndroidSettings } from 'capacitor-native-settings';

export async function requestAllPermissions() {
  if (!isNativeApp()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.requestPermissions();
  } catch(e){}
}

export async function hasStoragePermission(): Promise<boolean> {
  if (!isNativeApp()) return true;
  try {
    const { Filesystem } = await import('@capacitor/filesystem');
    const s = await Filesystem.checkPermissions();
    return s.publicStorage === 'granted';
  } catch { return false; }
}

export async function requestStoragePermission(): Promise<boolean> {
  if (!isNativeApp()) return true;
  try {
    const { Filesystem } = await import('@capacitor/filesystem');
    const r = await Filesystem.requestPermissions();
    return r.publicStorage === 'granted';
  } catch { return false; }
}

export function openAppSettings() {
  if (isNativeApp()) {
    NativeSettings.openAndroid({ option: AndroidSettings.ApplicationDetails });
  }
}
