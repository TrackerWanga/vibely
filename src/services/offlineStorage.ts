import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { isNativeApp } from './platform';

const VIBELY_DIR = 'Download/Vibely';

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

// Download audio to device storage
export async function downloadToDevice(
  videoId: string,
  title: string,
  artist: string,
  audioUrl: string
): Promise<string> {
  const safeName = `${title.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 40)}.mp3`;
  const response = await fetch(audioUrl);
  const blob = await response.blob();
  
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(blob);
  });

  const result = await Filesystem.writeFile({
    path: `${VIBELY_DIR}/${safeName}`,
    data: base64Data,
    directory: Directory.ExternalStorage,
    recursive: true
  });

  const downloads = await getVibelyDownloads();
  downloads.push({
    videoId,
    title,
    artist,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: '',
    filePath: result.uri,
    fileSize: blob.size,
    downloadedAt: new Date().toISOString(),
    source: 'vibely'
  });
  await Preferences.set({ key: 'vibely_downloads', value: JSON.stringify(downloads) });

  return result.uri;
}

// Get Vibely-specific downloads
export async function getVibelyDownloads(): Promise<DownloadedTrack[]> {
  const { value } = await Preferences.get({ key: 'vibely_downloads' });
  return value ? JSON.parse(value) : [];
}

// Scan entire device for all audio files
export async function scanDeviceAudio(): Promise<DownloadedTrack[]> {
  if (!isNativeApp()) return [];

  const audioFiles: DownloadedTrack[] = [];
  const audioExtensions = ['.mp3', '.m4a', '.aac', '.ogg', '.wav', '.flac', '.wma', '.opus'];

  async function scanDirectory(dirPath: string) {
    try {
      const result = await Filesystem.readdir({
        path: dirPath,
        directory: Directory.ExternalStorage
      });

      for (const file of result.files) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (audioExtensions.includes(ext)) {
          // Extract title from filename
          const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
          const artistMatch = nameWithoutExt.match(/^(.+?)\s*[-–]\s*(.+)/);
          
          audioFiles.push({
            videoId: `local_${file.name}`,
            title: artistMatch ? artistMatch[2].trim() : nameWithoutExt,
            artist: artistMatch ? artistMatch[1].trim() : 'Unknown Artist',
            thumbnail: '',
            duration: '',
            filePath: file.uri,
            fileSize: file.size || 0,
            downloadedAt: new Date().toISOString(),
            source: 'device'
          });
        }
      }
    } catch (e) {
      // Directory not accessible, skip
    }
  }

  // Scan common music directories
  const dirsToScan = ['Music', 'Download', 'Downloads', 'Download/Vibely', 'Audio', 'media/audio/music'];
  for (const dir of dirsToScan) {
    await scanDirectory(dir);
  }

  // Also scan root Download folder
  try {
    const rootFiles = await Filesystem.readdir({
      path: 'Download',
      directory: Directory.ExternalStorage
    });
    for (const file of rootFiles.files) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (audioExtensions.includes(ext)) {
        const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
        const artistMatch = nameWithoutExt.match(/^(.+?)\s*[-–]\s*(.+)/);
        
        // Avoid duplicates
        if (!audioFiles.find(f => f.filePath === file.uri)) {
          audioFiles.push({
            videoId: `local_${file.name}`,
            title: artistMatch ? artistMatch[2].trim() : nameWithoutExt,
            artist: artistMatch ? artistMatch[1].trim() : 'Unknown Artist',
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

  return audioFiles;
}

// Get all audio (Vibely downloads + device scan)
export async function getAllAudio(): Promise<DownloadedTrack[]> {
  const vibelyDownloads = await getVibelyDownloads();
  
  if (isNativeApp()) {
    const deviceAudio = await scanDeviceAudio();
    // Merge: Vibely downloads first, then device audio (no duplicates)
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

// Delete a download (Vibely only)
export async function deleteDownload(videoId: string): Promise<void> {
  const downloads = await getVibelyDownloads();
  const track = downloads.find(d => d.videoId === videoId);
  if (track) {
    try {
      await Filesystem.deleteFile({
        path: track.filePath,
        directory: Directory.ExternalStorage
      });
    } catch (e) {}
  }
  const updated = downloads.filter(d => d.videoId !== videoId);
  await Preferences.set({ key: 'vibely_downloads', value: JSON.stringify(updated) });
}

// Check if downloaded
export async function isDownloaded(videoId: string): Promise<boolean> {
  const downloads = await getVibelyDownloads();
  return downloads.some(d => d.videoId === videoId);
}

// Get file URI for playback
export async function getDownloadUri(videoId: string): Promise<string | null> {
  const downloads = await getVibelyDownloads();
  const track = downloads.find(d => d.videoId === videoId);
  return track?.filePath || null;
}

// Get total storage used
export async function getStorageUsed(): Promise<string> {
  const downloads = await getVibelyDownloads();
  const total = downloads.reduce((sum, d) => sum + (d.fileSize || 0), 0);
  if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
  return `${(total / (1024 * 1024)).toFixed(1)} MB`;
}
