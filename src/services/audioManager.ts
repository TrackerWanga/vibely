import { showNowPlaying, hideNowPlaying } from './notifications';

let currentAudio: HTMLAudioElement | null = null;
let currentTrackId: string | null = null;
let currentTrackInfo: { title: string; artist: string } | null = null;

export function playAudio(url: string, trackId: string, trackInfo?: { title: string; artist: string }): HTMLAudioElement {
  stopAll();
  
  const audio = new Audio(url);
  currentAudio = audio;
  currentTrackId = trackId;
  currentTrackInfo = trackInfo || null;
  
  audio.play().catch(e => console.error('Audio play failed:', e));
  
  // Show notification for offline playback
  if (trackInfo) {
    showNowPlaying({ title: trackInfo.title, artist: trackInfo.artist });
  }
  
  // Hide notification when audio ends
  audio.onended = () => {
    hideNowPlaying();
    currentAudio = null;
    currentTrackId = null;
  };
  
  audio.onerror = () => {
    hideNowPlaying();
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
    currentTrackInfo = null;
  }
  hideNowPlaying();
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

export function isPlaying(trackId: string): boolean {
  return currentTrackId === trackId && currentAudio !== null && !currentAudio.paused;
}
