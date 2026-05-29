import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
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

// Save download record
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

// Get Vibely-specific downloads
export async function getVibelyDownloads(): Promise<DownloadedTrack[]> {
  const { value } = await Preferences.get({ key: 'vibely_downloads' });
  return value ? JSON.parse(value) : [];
}

// Scan device for all audio files
export async function scanDeviceAudio(): Promise<DownloadedTrack[]> {
  const audioFiles: DownloadedTrack[] = [];
  const audioExtensions = ['.mp3', '.m4a', '.aac', '.ogg', '.wav', '.flac', '.wma', '.opus', '.m4p', '.3gp'];

  if (!isNativeApp()) {
    // Web fallback: use localStorage
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
          // Try to parse "Artist - Title" format
          const dashIdx = nameWithoutExt.indexOf(' - ');
          const artist = dashIdx > 0 ? nameWithoutExt.substring(0, dashIdx).trim() : 'Unknown Artist';
          const title = dashIdx > 0 ? nameWithoutExt.substring(dashIdx + 3).trim() : nameWithoutExt;

          // Skip duplicates
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
    } catch (e) {
      // Directory not accessible
    }
  }

  // Scan Vibely downloads folder
  await scanDir('Download/Vibely');
  
  // Scan root Download folder
  await scanDir('Download');
  
  // Scan Music folder
  await scanDir('Music');

  // Also scan external storage root for audio files
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

// Get all audio (Vibely downloads + device scan)
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

// Delete a download record
export async function deleteDownload(videoId: string): Promise<void> {
  const downloads = await getVibelyDownloads();
  const updated = downloads.filter(d => d.videoId !== videoId);
  await Preferences.set({ key: 'vibely_downloads', value: JSON.stringify(updated) });
}

// Get storage used
export async function getStorageUsed(): Promise<string> {
  const downloads = await getVibelyDownloads();
  const total = downloads.reduce((sum, d) => sum + (d.fileSize || 0), 0);
  if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
  return `${(total / (1024 * 1024)).toFixed(1)} MB`;
}

// Check if downloaded
export async function isDownloaded(videoId: string): Promise<boolean> {
  const downloads = await getVibelyDownloads();
  return downloads.some(d => d.videoId === videoId);
}
