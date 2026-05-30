// Global persistent audio element - survives page navigation
let audio: HTMLAudioElement | null = null;
let listeners: Array<() => void> = [];

export function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.preload = 'auto';
  }
  return audio;
}

export function setAudioSource(url: string) {
  const a = getAudio();
  a.src = url;
  a.play().catch(() => {});
}

export function destroyAudio() {
  if (audio) {
    audio.pause();
    audio.src = '';
    audio = null;
  }
}
