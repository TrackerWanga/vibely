import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { isNativeApp } from './platform';

export interface DownloadedTrack {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: string;
  filePath: string;
  fileSize: number;
  downloadedAt: string;
  source: 'vibely' | 'device';
}

// Convert file:// URI to a URL playable in WebView
export function getPlayableUrl(filePath: string): string {
  if (isNativeApp() && filePath) {
    // Use Capacitor's file src converter for native playback
    return Capacitor.convertFileSrc(filePath);
  }
  return filePath;
}

export async function saveDownloadRecord(track: Omit<DownloadedTrack, 'downloadedAt' | 'source'>): Promise<void> {
  const downloads = await getVibelyDownloads();
  if (!downloads.find(d => d.videoId === track.videoId)) {
    downloads.push({
      ...track,
      downloadedAt: new Date().toISOString(),
      source: 'vibely'
    });
    await Preferences.set({ key: 'vibely_downloads', value: JSON.stringify(downloads) });
  }
}

export async function getVibelyDownloads(): Promise<DownloadedTrack[]> {
  const { value } = await Preferences.get({ key: 'vibely_downloads' });
  return value ? JSON.parse(value) : [];
}

export async function scanDeviceAudio(): Promise<DownloadedTrack[]> {
  const audioFiles: DownloadedTrack[] = [];
  const audioExtensions = ['.mp3', '.m4a', '.aac', '.ogg', '.wav', '.flac', '.wma', '.opus', '.m4p', '.3gp'];

  if (!isNativeApp()) {
    const saved = JSON.parse(localStorage.getItem('vibely_downloads') || '[]');
    return saved.map((d: any) => ({ ...d, source: 'device' as const }));
  }

  async function scanDir(dirPath: string, dir: Directory = Directory.ExternalStorage) {
    try {
      const result = await Filesystem.readdir({ path: dirPath, directory: dir });
      for (const file of result.files) {
        const name = file.name.toLowerCase();
        const ext = name.substring(name.lastIndexOf('.'));
        if (audioExtensions.includes(ext)) {
          const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
          const dashIdx = nameWithoutExt.indexOf(' - ');
          const artist = dashIdx > 0 ? nameWithoutExt.substring(0, dashIdx).trim() : 'Unknown Artist';
          const title = dashIdx > 0 ? nameWithoutExt.substring(dashIdx + 3).trim() : nameWithoutExt;

          if (!audioFiles.find(f => f.filePath === file.uri)) {
            audioFiles.push({
              videoId: `local_${file.name}_${audioFiles.length}`,
              title,
              artist,
              thumbnail: '',
              duration: '',
              filePath: file.uri,
              fileSize: file.size || 0,
              downloadedAt: new Date().toISOString(),
              source: 'device'
            });
          }
        }
      }
    } catch (e) {}
  }

  await scanDir('Download/Vibely');
  await scanDir('Download');
  await scanDir('Music');

  try {
    const root = await Filesystem.readdir({ path: '', directory: Directory.ExternalStorage });
    for (const file of root.files) {
      if (file.type === 'directory' && ['download', 'downloads', 'music', 'audio'].includes(file.name.toLowerCase())) {
        await scanDir(file.name);
      }
    }
  } catch (e) {}

  return audioFiles;
}

export async function getAllAudio(): Promise<DownloadedTrack[]> {
  const vibelyDownloads = await getVibelyDownloads();
  
  if (isNativeApp()) {
    const deviceAudio = await scanDeviceAudio();
    const merged = [...vibelyDownloads];
    for (const deviceTrack of deviceAudio) {
      if (!merged.find(m => m.filePath === deviceTrack.filePath)) {
        merged.push(deviceTrack);
      }
    }
    return merged;
  }
  
  return vibelyDownloads;
}

export async function deleteDownload(videoId: string): Promise<void> {
  const downloads = await getVibelyDownloads();
  const updated = downloads.filter(d => d.videoId !== videoId);
  await Preferences.set({ key: 'vibely_downloads', value: JSON.stringify(updated) });
}

export async function getStorageUsed(): Promise<string> {
  const downloads = await getVibelyDownloads();
  const total = downloads.reduce((sum, d) => sum + (d.fileSize || 0), 0);
  if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
  return `${(total / (1024 * 1024)).toFixed(1)} MB`;
}

export async function isDownloaded(videoId: string): Promise<boolean> {
  const downloads = await getVibelyDownloads();
  return downloads.some(d => d.videoId === videoId);
}
