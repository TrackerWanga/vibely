import { showOfflineNotification, hideOfflineNotification } from './notifications';

let audio: HTMLAudioElement | null = null;
let id: string | null = null;

export function play(url: string, trackId: string, info?: { title: string; artist: string }) {
  stop();
  audio = new Audio(url);
  id = trackId;
  audio.play().catch(()=>{});
  if (info) showOfflineNotification(info.title, info.artist);
  audio.onended = () => stop();
  audio.onerror = () => stop();
  return audio;
}

export function stop() {
  if (audio) { audio.pause(); audio.src = ''; audio = null; }
  hideOfflineNotification();
  id = null;
}

export function toggle(url: string, trackId: string, info?: { title: string; artist: string }) {
  if (id === trackId) { stop(); return false; }
  play(url, trackId, info);
  return true;
}

export function isPlaying(trackId: string) { return id === trackId && audio && !audio.paused; }
export function currentId() { return id; }
