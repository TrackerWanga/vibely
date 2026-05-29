import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

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

  // Save to /storage/emulated/0/Download/Vibely/
  const result = await Filesystem.writeFile({
    path: `${VIBELY_DIR}/${safeName}`,
    data: base64Data,
    directory: Directory.ExternalStorage,
    recursive: true
  });

  // Save metadata
  const downloads = await getDownloads();
  downloads.push({
    videoId,
    title,
    artist,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: '',
    filePath: result.uri,
    fileSize: blob.size,
    downloadedAt: new Date().toISOString()
  });
  await Preferences.set({ key: 'vibely_downloads', value: JSON.stringify(downloads) });

  return result.uri;
}

// Get all downloaded tracks
export async function getDownloads(): Promise<DownloadedTrack[]> {
  const { value } = await Preferences.get({ key: 'vibely_downloads' });
  return value ? JSON.parse(value) : [];
}

// Delete a download
export async function deleteDownload(videoId: string): Promise<void> {
  const downloads = await getDownloads();
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
  const downloads = await getDownloads();
  return downloads.some(d => d.videoId === videoId);
}

// Get file URI for playback
export async function getDownloadUri(videoId: string): Promise<string | null> {
  const downloads = await getDownloads();
  const track = downloads.find(d => d.videoId === videoId);
  return track?.filePath || null;
}

// Get total storage used
export async function getStorageUsed(): Promise<string> {
  const downloads = await getDownloads();
  const total = downloads.reduce((sum, d) => sum + (d.fileSize || 0), 0);
  if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
  return `${(total / (1024 * 1024)).toFixed(1)} MB`;
}
