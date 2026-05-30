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
  if (!track.filePath || !isNativeApp()) return;
  currentTrack = track;
  const url = getPlayableUrl(track.filePath);
  currentAudio = new Audio(url);
  currentAudio.play().catch(console.error);
  showOfflineNotification(track.title, track.artist);
  currentAudio.onended = () => stopTrack();
  currentAudio.onerror = () => stopTrack();
  notify();
}

export function stopTrack() {
  if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null; }
  hideOfflineNotification();
  currentTrack = null;
  notify();
}

export function toggleTrack(track: { videoId: string; title: string; artist: string; filePath?: string }) {
  if (currentTrack?.videoId === track.videoId) { stopTrack(); return false; }
  playTrack(track);
  return true;
}

export function getCurrentTrack() { return currentTrack; }
export function isTrackPlaying(videoId: string) { return currentTrack?.videoId === videoId && currentAudio && !currentAudio.paused; }
