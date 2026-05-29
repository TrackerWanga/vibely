// Check if running inside Capacitor (native app)
export function isNativeApp(): boolean {
  return !!(window as any).Capacitor?.isNativePlatform();
}
