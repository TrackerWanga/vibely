import { showOfflineNotification, hideOfflineNotification } from './notifications';

let currentAudio: HTMLAudioElement | null = null;
let currentTrackId: string | null = null;

export function playAudio(url: string, trackId: string, trackInfo?: { title: string; artist: string }): HTMLAudioElement {
  stopAll();
  
  const audio = new Audio(url);
  currentAudio = audio;
  currentTrackId = trackId;
  
  // Show OFFLINE notification (ID 2)
  if (trackInfo) {
    showOfflineNotification({ title: trackInfo.title, artist: trackInfo.artist });
  }
  
  audio.play().catch(e => console.error('Audio play failed:', e));
  
  audio.onended = () => {
    hideOfflineNotification();
    currentAudio = null;
    currentTrackId = null;
  };
  
  audio.onerror = () => {
    hideOfflineNotification();
    currentAudio = null;
    currentTrackId = null;
  };
  
  return audio;
}

export function stopAll(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio.src = '';
    currentAudio = null;
    currentTrackId = null;
  }
  hideOfflineNotification();
}

export function stopIfPlaying(trackId: string): boolean {
  if (currentTrackId === trackId && currentAudio) {
    stopAll();
    return true;
  }
  return false;
}

export function getCurrentTrackId(): string | null {
  return currentTrackId;
}
