const API = 'https://music-discovery-platform.vercel.app/api';

export interface Artist {
  name: string; country: string; flag: string; countryCode: string;
  category: string; songCount: number;
  channel?: { id: string; name: string; image: string; subscribers: number; verified: boolean };
  topSongs?: Song[];
}

export interface Song {
  videoId: string; title: string; views: number; duration: string; thumbnail: string;
}

export interface Country {
  code: string; name: string; flag: string; continent: string;
  totalArtists: number; secularArtists: number; gospelArtists: number;
}

export interface HomepageData {
  banner: Artist[]; trending: Artist[]; topArtists: Artist[];
  countries: Country[]; stats: { artists: number; songs: number; countries: number };
}

async function fetchAPI(path: string) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export const getHomepage = (): Promise<HomepageData> => fetchAPI('/homepage');
export const getCountries = async (): Promise<Country[]> => { const d = await fetchAPI('/countries'); return d.countries || []; };
export const getArtists = async (f?: { country?: string; limit?: number }): Promise<Artist[]> => {
  const p = new URLSearchParams();
  if (f?.country) p.set('country', f.country);
  if (f?.limit) p.set('limit', String(f.limit));
  const d = await fetchAPI(`/artists?${p}`);
  return d.artists || [];
};
export const getArtist = (name: string): Promise<{ artist: Artist; similar: Artist[] }> => fetchAPI(`/artist/${encodeURIComponent(name)}`);
export const searchAll = (q: string): Promise<any> => fetchAPI(`/search?q=${encodeURIComponent(q)}`);
export const getPlayData = (vid: string, title?: string): Promise<any> => fetchAPI(`/play/${vid}${title ? `?title=${encodeURIComponent(title)}` : ''}`);
export const getStreamUrl = (vid: string): string => `${API}/stream/${vid}`;
export const getLyrics = (q: string): Promise<any> => fetchAPI(`/lyrics/${encodeURIComponent(q)}`);
export const getRecommendations = (artist: string): Promise<any> => fetchAPI(`/recommendations/${encodeURIComponent(artist)}`);
export const getQueue = (vid: string): Promise<any> => fetchAPI(`/queue/${vid}`);
