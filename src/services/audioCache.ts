// Cache successful audio URLs to avoid re-fetching
const cache: Record<string, string> = {};

export function getCachedUrl(videoId: string): string | null {
  return cache[videoId] || null;
}

export function setCachedUrl(videoId: string, url: string) {
  cache[videoId] = url;
}
