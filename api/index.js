const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const MEGAN_API = 'https://apis.megan.qzz.io';
const MEGAN_KEY = 'megan_admin_master';
const DATA_DIR = path.join(__dirname, '..', 'data', 'countries');

// Cache
let countryCache = {};
let artistCache = [];
let bannerArtists = [];
let lastBannerUpdate = 0;

function loadData() {
    countryCache = {};
    artistCache = [];
    if (fs.existsSync(DATA_DIR)) {
        const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'));
        files.forEach(file => {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
                countryCache[file.replace('.json', '')] = data;
                ['secular', 'gospel'].forEach(cat => {
                    (data?.categories?.[cat]?.artists || []).forEach(artist => {
                        if (artist.name && artist.topSongs?.length > 0) {
                            artistCache.push({ ...artist, country: data.country, countryCode: data.code, flag: data.flag, continent: data.continent, category: cat });
                        }
                    });
                });
            } catch(e) {}
        });
    }
}

function getBannerArtists() {
    const now = Date.now();
    if (bannerArtists.length === 0 || now - lastBannerUpdate > 30 * 60 * 1000) {
        bannerArtists = artistCache.filter(a => a.channel?.image).sort(() => Math.random() - 0.5).slice(0, 5);
        lastBannerUpdate = now;
    }
    return bannerArtists;
}

loadData();

// ============ CORE ENDPOINTS ============

app.get('/api/homepage', async (req, res) => {
    const banner = getBannerArtists();
    const trending = artistCache.filter(a => a.channel?.image).sort(() => Math.random() - 0.5).slice(0, 20);
    const topArtists = artistCache.filter(a => a.topSongs?.[0]?.views).sort((a, b) => (b.topSongs[0]?.views || 0) - (a.topSongs[0]?.views || 0)).slice(0, 10);
    const countries = Object.entries(countryCache).filter(([,d]) => d.code).map(([,d]) => ({ code: d.code, name: d.country, flag: d.flag, continent: d.continent, artists: (d.categories?.secular?.count || 0) + (d.categories?.gospel?.count || 0) })).filter(c => c.artists > 0);
    
    res.json({ success: true, banner, trending, topArtists, countries, stats: { artists: artistCache.length, songs: artistCache.reduce((s,a) => s + (a.songCount || 0), 0), countries: countries.length } });
});

app.get('/api/countries', (req, res) => {
    const countries = Object.entries(countryCache).filter(([,d]) => d.code).map(([,d]) => ({ code: d.code, name: d.country, flag: d.flag, continent: d.continent, secularArtists: d.categories?.secular?.count || 0, gospelArtists: d.categories?.gospel?.count || 0, totalArtists: (d.categories?.secular?.count || 0) + (d.categories?.gospel?.count || 0) })).filter(c => c.totalArtists > 0).sort((a,b) => b.totalArtists - a.totalArtists);
    res.json({ success: true, count: countries.length, countries });
});

app.get('/api/country/:code', (req, res) => {
    for (const [, data] of Object.entries(countryCache)) {
        if ((data.code || '').toUpperCase() === req.params.code.toUpperCase()) return res.json({ success: true, country: data });
    }
    res.status(404).json({ error: 'Not found' });
});

app.get('/api/artists', (req, res) => {
    let results = [...artistCache];
    if (req.query.country) results = results.filter(a => a.countryCode === req.query.country);
    if (req.query.category) results = results.filter(a => a.category === req.query.category);
    const start = parseInt(req.query.offset) || 0;
    const end = start + (parseInt(req.query.limit) || results.length);
    res.json({ success: true, total: results.length, artists: results.slice(start, end) });
});

app.get('/api/artist/:name', (req, res) => {
    const name = req.params.name.toLowerCase().replace(/-/g, ' ');
    const artist = artistCache.find(a => a.name?.toLowerCase() === name);
    if (!artist) return res.status(404).json({ error: 'Not found' });
    const similar = artistCache.filter(a => a.country === artist.country && a.name !== artist.name).slice(0, 10);
    res.json({ success: true, artist, similar });
});

app.get('/api/search', async (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    const local = artistCache.filter(a => a.name?.toLowerCase().includes(q)).slice(0, 10);
    const [ytR, spR] = await Promise.allSettled([
        axios.get(`${MEGAN_API}/api/search?q=${encodeURIComponent(q)}&apikey=${MEGAN_KEY}`, { timeout: 8000 }),
        axios.get(`${MEGAN_API}/api/spotify/search?q=${encodeURIComponent(q)}&type=track&apikey=${MEGAN_KEY}`, { timeout: 8000 })
    ]);
    res.json({ success: true, query: q, local, youtube: ytR.status === 'fulfilled' ? (ytR.value.data?.items || []).slice(0, 10) : [], spotify: spR.status === 'fulfilled' ? (spR.value.data?.tracks || []).slice(0, 10) : [] });
});

app.get('/api/genres', (req, res) => {
    res.json({ success: true, genres: [
        { name: 'Afrobeats', icon: '🕺', countries: ['Nigeria','Ghana'] }, { name: 'Amapiano', icon: '🎹', countries: ['South Africa'] }, { name: 'Bongo Flava', icon: '🔥', countries: ['Tanzania'] }, { name: 'Genge', icon: '💥', countries: ['Kenya'] }, { name: 'K-Pop', icon: '💜', countries: ['South Korea'] }, { name: 'Gospel', icon: '🙏', countries: ['Nigeria','Kenya','USA'] }, { name: 'Nasheed', icon: '☪️', countries: ['Saudi Arabia','Egypt'] }, { name: 'Reggaeton', icon: '💃', countries: ['Colombia','Mexico'] }, { name: 'Samba', icon: '🥁', countries: ['Brazil'] }, { name: 'Bollywood', icon: '🎬', countries: ['India'] }, { name: 'Rock', icon: '🎸', countries: ['USA','UK'] }, { name: 'Hip Hop', icon: '🎤', countries: ['USA','UK'] }
    ]});
});

app.get('/api/stats', (req, res) => {
    res.json({ success: true, totalArtists: artistCache.length, totalSongs: artistCache.reduce((s,a) => s + (a.songCount || 0), 0), totalCountries: Object.keys(countryCache).filter(k => countryCache[k].code).length });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', artists: artistCache.length, songs: artistCache.reduce((s,a) => s + (a.songCount || 0), 0), countries: Object.keys(countryCache).length });
});

// ============ VIDEO & MUSIC ENDPOINTS ============

// Get video info
app.get('/api/video/:id', async (req, res) => {
    try {
        const response = await axios.get(`${MEGAN_API}/api/download/youtube/info?url=https://youtu.be/${req.params.id}&apikey=${MEGAN_KEY}`, { timeout: 8000 });
        res.json({ success: true, ...response.data });
    } catch(e) { res.status(500).json({ error: 'Failed to get video info' }); }
});

// Stream audio
app.get('/api/stream/:videoId', async (req, res) => {
    try {
        const response = await axios.get(`${MEGAN_API}/stream?q=${req.params.videoId}&type=mp3&apikey=${MEGAN_KEY}`, { responseType: 'stream', timeout: 30000 });
        res.setHeader('Content-Type', response.headers['content-type'] || 'audio/mpeg');
        response.data.pipe(res);
    } catch(e) { res.status(500).json({ error: 'Stream failed' }); }
});

// Download
app.get('/api/download/:query', async (req, res) => {
    try {
        const response = await axios.get(`${MEGAN_API}/download/audio?q=${encodeURIComponent(req.params.query)}&apikey=${MEGAN_KEY}`, { timeout: 15000 });
        res.json({ success: true, ...response.data });
    } catch(e) { res.status(500).json({ error: 'Download failed' }); }
});

// Lyrics
app.get('/api/lyrics/:query', async (req, res) => {
    try {
        const response = await axios.get(`${MEGAN_API}/download/lyrics?q=${encodeURIComponent(req.params.query)}&apikey=${MEGAN_KEY}`, { timeout: 10000 });
        res.json({ success: true, ...response.data });
    } catch(e) { res.status(500).json({ error: 'Lyrics failed' }); }
});

// YouTube search
app.get('/api/youtube/search', async (req, res) => {
    try {
        const response = await axios.get(`${MEGAN_API}/api/search/youtube?q=${encodeURIComponent(req.query.q || '')}&apikey=${MEGAN_KEY}`, { timeout: 8000 });
        res.json({ success: true, ...response.data });
    } catch(e) { res.status(500).json({ error: 'YouTube search failed' }); }
});

// YouTube trending
app.get('/api/youtube/trending', async (req, res) => {
    try {
        const response = await axios.get(`${MEGAN_API}/api/youtube/trending?apikey=${MEGAN_KEY}`, { timeout: 8000 });
        res.json({ success: true, ...response.data });
    } catch(e) { res.status(500).json({ error: 'Trending failed' }); }
});

// Spotify search
app.get('/api/spotify/search', async (req, res) => {
    try {
        const response = await axios.get(`${MEGAN_API}/api/spotify/search?q=${encodeURIComponent(req.query.q || '')}&type=${req.query.type || 'track'}&apikey=${MEGAN_KEY}`, { timeout: 8000 });
        res.json({ success: true, ...response.data });
    } catch(e) { res.status(500).json({ error: 'Spotify search failed' }); }
});

// Embed URL (for iframe)
app.get('/api/embed/:videoId', (req, res) => {
    res.json({ success: true, embedUrl: `https://www.youtube.com/embed/${req.params.videoId}?autoplay=1`, watchUrl: `https://www.youtube.com/watch?v=${req.params.videoId}` });
});

// Play endpoint (returns everything needed for player)
app.get('/api/play/:videoId', async (req, res) => {
    const videoId = req.params.videoId;
    try {
        const [infoRes, lyricsRes] = await Promise.allSettled([
            axios.get(`${MEGAN_API}/api/download/youtube/info?url=https://youtu.be/${videoId}&apikey=${MEGAN_KEY}`, { timeout: 8000 }),
            axios.get(`${MEGAN_API}/download/lyrics?q=${req.query.title || videoId}&apikey=${MEGAN_KEY}`, { timeout: 8000 })
        ]);
        res.json({
            success: true,
            videoId,
            streamUrl: `/api/stream/${videoId}`,
            downloadUrl: `/api/download/${videoId}`,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            info: infoRes.status === 'fulfilled' ? infoRes.value.data : null,
            lyrics: lyricsRes.status === 'fulfilled' ? lyricsRes.value.data : null
        });
    } catch(e) { res.status(500).json({ error: 'Play failed' }); }
});

// Recommendations (based on artist)
app.get('/api/recommendations/:artistName', (req, res) => {
    const name = req.params.artistName.toLowerCase();
    const artist = artistCache.find(a => a.name?.toLowerCase() === name);
    if (!artist) return res.json({ success: true, recommendations: artistCache.sort(() => Math.random() - 0.5).slice(0, 10) });
    const sameCountry = artistCache.filter(a => a.country === artist.country && a.name !== artist.name).slice(0, 5);
    const sameCategory = artistCache.filter(a => a.category === artist.category && a.country !== artist.country).slice(0, 5);
    res.json({ success: true, artist, sameCountry, sameCategory, all: [...sameCountry, ...sameCategory] });
});

// Next play queue
app.get('/api/queue/:videoId', (req, res) => {
    const videoId = req.params.videoId;
    const artist = artistCache.find(a => a.topSongs?.some(s => s.videoId === videoId));
    if (!artist) return res.json({ success: true, queue: artistCache.sort(() => Math.random() - 0.5).slice(0, 10) });
    const moreFromArtist = artist.topSongs?.filter(s => s.videoId !== videoId).slice(0, 3) || [];
    const similar = artistCache.filter(a => a.country === artist.country && a.name !== artist.name).slice(0, 5);
    res.json({ success: true, currentArtist: artist.name, nextUp: [...moreFromArtist, ...similar.map(a => a.topSongs?.[0]).filter(Boolean)].slice(0, 10) });
});

// Vocals/Instrumental info
app.get('/api/audio/effects', (req, res) => {
    res.json({ success: true, effects: ['bass-boost', 'speed-up', 'nightcore', '8d-audio', 'slowed-reverb', 'vocal-extract', 'reverse'] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🎵 MegaMusic API on port ${PORT}`));
module.exports = app;
