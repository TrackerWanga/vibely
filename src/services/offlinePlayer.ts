import { showOfflineNotification, hideOfflineNotification } from './notifications';
import { getPlayableUrl } from './offlineStorage';
import { isNativeApp } from './platform';

let currentAudio: HTMLAudioElement | null = null;
let currentTrack: { videoId: string; title: string; artist: string; filePath?: string } | null = null;
let listeners: Array<() => void> = [];

export function onTrackChange(cb: () => void) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(l => l !== cb); };
}

function notify() { listeners.forEach(cb => cb()); }

export function playTrack(track: { videoId: string; title: string; artist: string; filePath?: string }) {
  stopTrack();
  currentTrack = track;
  
  const url = track.filePath && isNativeApp() ? getPlayableUrl(track.filePath) : '';
  if (!url) return;
  
  currentAudio = new Audio(url);
  currentAudio.play().catch(console.error);
  showOfflineNotification(track.title, track.artist);
  currentAudio.onended = () => stopTrack();
  notify();
}

export function stopTrack() {
  if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; currentAudio.src = ''; currentAudio = null; }
  hideOfflineNotification();
  currentTrack = null;
  notify();
}

export function getCurrentTrack() { return currentTrack; }
export function isTrackPlaying(videoId: string) { return currentTrack?.videoId === videoId && currentAudio && !currentAudio.paused; }
