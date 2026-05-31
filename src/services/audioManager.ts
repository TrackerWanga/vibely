import { showOfflineNotification, hideOfflineNotification } from './notifications';

let audio: HTMLAudioElement | null = null;
let currentId: string | null = null;
let queue: Array<{ url: string; trackId: string; info?: { title: string; artist: string } }> = [];
let queueIndex = 0;

// Setup media session for earphone controls
function setupMediaSession() {
  if (!('mediaSession' in navigator)) return;
  
  navigator.mediaSession.setActionHandler('play', () => {
    if (audio) audio.play();
  });
  navigator.mediaSession.setActionHandler('pause', () => {
    if (audio) audio.pause();
  });
  navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
  navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
  navigator.mediaSession.setActionHandler('stop', () => stop());
}

setupMediaSession();

export function play(url: string, trackId: string, info?: { title: string; artist: string }) {
  stop();
  audio = new Audio(url);
  currentId = trackId;
  
  if (info) {
    showOfflineNotification(info.title, info.artist);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: info.title,
        artist: info.artist,
      });
      navigator.mediaSession.playbackState = 'playing';
    }
  }
  
  audio.play().catch(() => {});
  
  audio.onended = () => {
    playNext();
  };
  
  audio.onerror = () => {
    playNext();
  };
  
  return audio;
}

export function setQueue(tracks: Array<{ url: string; trackId: string; info?: { title: string; artist: string } }>, startIndex = 0) {
  queue = tracks;
  queueIndex = startIndex;
  if (tracks.length > 0) {
    const track = tracks[startIndex];
    play(track.url, track.trackId, track.info);
  }
}

export function playNext() {
  if (queue.length > 0 && queueIndex < queue.length - 1) {
    queueIndex++;
    const track = queue[queueIndex];
    play(track.url, track.trackId, track.info);
  } else {
    stop();
  }
}

export function playPrevious() {
  if (queue.length > 0 && queueIndex > 0) {
    queueIndex--;
    const track = queue[queueIndex];
    play(track.url, track.trackId, track.info);
  }
}

export function stop() {
  if (audio) { audio.pause(); audio.src = ''; audio = null; }
  hideOfflineNotification();
  currentId = null;
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'none';
  }
}

export function toggle(url: string, trackId: string, info?: { title: string; artist: string }) {
  if (currentId === trackId) { stop(); return false; }
  queue = []; // Clear queue when manually selecting
  play(url, trackId, info);
  return true;
}

export function isPlaying(trackId: string) { return currentId === trackId && audio && !audio.paused; }
export function currentId_() { return currentId; }
