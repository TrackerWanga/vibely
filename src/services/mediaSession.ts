// Media Session API - shows now playing on lock screen & notification
export function updateMediaSession(track: {
  title: string;
  artist: string;
  thumbnail: string;
  videoId: string;
}) {
  if (!('mediaSession' in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title || 'Unknown',
    artist: track.artist || 'Unknown Artist',
    album: 'Vibely',
    artwork: track.thumbnail ? [
      { src: track.thumbnail, sizes: '480x360', type: 'image/jpg' },
      { src: `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`, sizes: '480x360', type: 'image/jpg' }
    ] : []
  });

  navigator.mediaSession.setActionHandler('play', () => {
    const audio = document.querySelector('audio');
    if (audio) audio.play();
  });
  navigator.mediaSession.setActionHandler('pause', () => {
    const audio = document.querySelector('audio');
    if (audio) audio.pause();
  });
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    // Handle via store
    const { useMusicStore } = require('../store/musicStore');
    useMusicStore.getState().prevTrack();
  });
  navigator.mediaSession.setActionHandler('nexttrack', () => {
    const { useMusicStore } = require('../store/musicStore');
    useMusicStore.getState().nextTrack();
  });
  navigator.mediaSession.setActionHandler('stop', () => {
    const audio = document.querySelector('audio');
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
}

export function updatePlaybackState(isPlaying: boolean) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
}

export function updatePositionState(duration: number, playbackRate: number, position: number) {
  if (!('mediaSession' in navigator)) return;
  if (duration && !isNaN(duration)) {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: playbackRate || 1,
      position: position || 0
    });
  }
}
