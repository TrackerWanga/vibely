// Centralized audio manager - ensures only ONE audio plays at a time
let currentAudio: HTMLAudioElement | null = null;
let currentTrackId: string | null = null;

export function playAudio(url: string, trackId: string): HTMLAudioElement {
  // Stop any currently playing audio
  stopAll();
  
  const audio = new Audio(url);
  currentAudio = audio;
  currentTrackId = trackId;
  
  audio.play().catch(e => console.error('Audio play failed:', e));
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
