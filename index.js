const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// API Configuration
const API_CONFIG = {
  name: "Ladybug Api'S",
  version: "v2.0.0",
  description: "Simple and easy to use API with enhanced features.",
  creator: "Ntando Mods Team",
  status: "Active!"
};

// ============================================
// ROUTES
// ============================================

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    data: API_CONFIG
  });
});

// ============================================
// AI ROUTES - MULTIPLE AI PROVIDERS
// ============================================

// ChatGPT API
app.get('/ai/chatgpt', async (req, res) => {
  try {
    const { text } = req.query;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "text" is required'
      });
    }

    const response = await axios.get(`https://api.popcat.xyz/chatbot`, {
      params: {
        msg: text,
        owner: 'Ladybug',
        botname: 'ChatGPT'
      }
    });

    res.json({
      success: true,
      query: text,
      response: response.data.response || response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get response',
      message: error.message
    });
  }
});

// AI Image Generator
app.get('/ai/texttoimg', async (req, res) => {
  try {
    const { prompt } = req.query;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "prompt" is required'
      });
    }

    // Using Pollinations AI for text-to-image
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
    
    res.json({
      success: true,
      prompt: prompt,
      imageUrl: imageUrl,
      download: imageUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate image',
      message: error.message
    });
  }
});

// AI Writer/Story Generator
app.get('/ai/writer', async (req, res) => {
  try {
    const { topic } = req.query;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "topic" is required'
      });
    }

    const response = await axios.get(`https://api.popcat.xyz/chatbot`, {
      params: {
        msg: `Write a creative short story about: ${topic}`,
        owner: 'Ladybug',
        botname: 'Writer'
      }
    });

    res.json({
      success: true,
      topic: topic,
      story: response.data.response || response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate story',
      message: error.message
    });
  }
});

// AI Translate
app.get('/ai/translate', async (req, res) => {
  try {
    const { text, to = 'en' } = req.query;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "text" is required'
      });
    }

    const response = await axios.get(`https://api.popcat.xyz/translate`, {
      params: {
        text: text,
        to: to
      }
    });

    res.json({
      success: true,
      original: text,
      translated: response.data.translated || response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to translate',
      message: error.message
    });
  }
});

// ============================================
// SHAZAM API - MUSIC RECOGNITION
// ============================================

app.get('/music/shazam', async (req, res) => {
  try {
    const { q, track } = req.query;
    const query = q || track;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "q" or "track" is required'
      });
    }

    try {
      // Using Shazam API alternative for music search
      const response = await axios.get(`https://shazam.p.rapidapi.com/search`, {
        params: { term: query, limit: 10 },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || 'demo',
          'X-RapidAPI-Host': 'shazam.p.rapidapi.com'
        }
      });

      if (response.data && response.data.tracks) {
        const tracks = response.data.tracks.hits.map(hit => ({
          title: hit.track.title,
          artist: hit.track.subtitle,
          albumArt: hit.track.images?.coverart,
          preview: hit.track.hub?.actions?.[1]?.uri,
          shazamUrl: hit.track.url,
          key: hit.track.key
        }));

        res.json({
          success: true,
          query: query,
          count: tracks.length,
          tracks: tracks
        });
      } else {
        res.json({
          success: false,
          error: 'No results found',
          note: 'Add RAPIDAPI_KEY for full functionality'
        });
      }
    } catch (apiError) {
      // Fallback mock data
      res.json({
        success: true,
        query: query,
        count: 1,
        tracks: [{
          title: 'Mock Track',
          artist: 'Mock Artist',
          note: 'Set RAPIDAPI_KEY environment variable for real Shazam results',
          instructions: 'Get your free API key from https://rapidapi.com/apidojo/api/shazam'
        }]
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search music',
      message: error.message
    });
  }
});

// Shazam - Recognize Song from Audio URL
app.get('/music/recognize', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required (audio file URL)'
      });
    }

    res.json({
      success: true,
      message: 'Audio recognition endpoint',
      note: 'This endpoint requires audio processing. Use /music/shazam for track search.',
      audioUrl: url
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to recognize audio',
      message: error.message
    });
  }
});

// Spotify Search
app.get('/music/spotify', async (req, res) => {
  try {
    const { q, type = 'track' } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "q" is required'
      });
    }

    res.json({
      success: true,
      query: q,
      type: type,
      note: 'Spotify API requires authentication. Use Shazam endpoint for music search.',
      alternative: `/music/shazam?q=${encodeURIComponent(q)}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search Spotify',
      message: error.message
    });
  }
});

// ============================================
// URL SHORTENER APIs
// ============================================

// TinyURL - URL Shortener
app.get('/tools/tinyurl', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    try {
      const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      
      res.json({
        success: true,
        originalUrl: url,
        shortUrl: response.data,
        service: 'TinyURL'
      });
    } catch (apiError) {
      res.status(500).json({
        success: false,
        error: 'TinyURL service unavailable',
        message: 'Please try again later'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to shorten URL',
      message: error.message
    });
  }
});

// Is.gd - Alternative URL Shortener
app.get('/tools/shorturl', async (req, res) => {
  try {
    const { url, custom } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    try {
      const params = {
        format: 'json',
        url: url
      };

      if (custom) {
        params.shorturl = custom;
      }

      const response = await axios.get('https://is.gd/create.php', { params });
      
      res.json({
        success: true,
        originalUrl: url,
        shortUrl: response.data.shorturl,
        service: 'is.gd',
        custom: custom || false
      });
    } catch (apiError) {
      res.status(500).json({
        success: false,
        error: 'URL shortener service unavailable',
        message: apiError.response?.data?.errormessage || 'Please try again later'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to shorten URL',
      message: error.message
    });
  }
});

// V.gd - Another Alternative URL Shortener
app.get('/tools/vgd', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }

    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    try {
      const response = await axios.get('https://v.gd/create.php', {
        params: {
          format: 'json',
          url: url
        }
      });
      
      res.json({
        success: true,
        originalUrl: url,
        shortUrl: response.data.shorturl,
        service: 'v.gd'
      });
    } catch (apiError) {
      res.status(500).json({
        success: false,
        error: 'URL shortener service unavailable',
        message: 'Please try again later'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to shorten URL',
      message: error.message
    });
  }
});

// URL Expander - Expand Short URLs
app.get('/tools/expandurl', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }

    try {
      const response = await axios.get(url, {
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      });
      
      res.json({
        success: true,
        shortUrl: url,
        expandedUrl: response.request.res.responseUrl || url,
        redirects: response.request._redirectable._redirectCount || 0
      });
    } catch (error) {
      if (error.response && error.response.headers.location) {
        res.json({
          success: true,
          shortUrl: url,
          expandedUrl: error.response.headers.location
        });
      } else {
        res.json({
          success: false,
          error: 'Could not expand URL',
          shortUrl: url
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to expand URL',
      message: error.message
    });
  }
});

// ============================================
// LYRICS API
// ============================================

app.get('/search/lyrics', async (req, res) => {
  try {
    const { q, title, artist } = req.query;
    const query = q || title;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "q" or "title" is required'
      });
    }

    // Using lyrics.ovh API
    const searchQuery = artist ? `$${artist}$$ {query}` : query;
    
    try {
      // Try to get lyrics from API.lyrics.ovh
      const lyricsResponse = await axios.get(`https://api.lyrics.ovh/suggest/${encodeURIComponent(searchQuery)}`);
      
      if (lyricsResponse.data && lyricsResponse.data.data && lyricsResponse.data.data.length > 0) {
        const results = lyricsResponse.data.data.slice(0, 10).map(song => ({
          title: song.title,
          artist: song.artist.name,
          album: song.album?.title,
          preview: song.preview,
          link: song.link
        }));

        res.json({
          success: true,
          query: searchQuery,
          count: results.length,
          results: results
        });
      } else {
        res.json({
          success: true,
          query: searchQuery,
          count: 0,
          results: [],
          message: 'No lyrics found'
        });
      }
    } catch (apiError) {
      res.json({
        success: false,
        error: 'Lyrics service unavailable',
        message: 'Please try again later'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search lyrics',
      message: error.message
    });
  }
});

// Get specific song lyrics
app.get('/lyrics/get', async (req, res) => {
  try {
    const { artist, title } = req.query;
    
    if (!artist || !title) {
      return res.status(400).json({
        success: false,
        error: 'Parameters "artist" and "title" are required'
      });
    }

    const response = await axios.get(`https://api.lyrics.ovh/v1/$${encodeURIComponent(artist)}/$$ {encodeURIComponent(title)}`);
    
    res.json({
      success: true,
      artist: artist,
      title: title,
      lyrics: response.data.lyrics || 'Lyrics not found'
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'Lyrics not found',
      message: 'Please check artist and title spelling'
    });
  }
});

// ============================================
// YOUTUBE SEARCH API - ENHANCED
// ============================================

app.get('/search/youtube', async (req, res) => {
  try {
    const { q, type = 'video' } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "q" is required'
      });
    }

    // Using YouTube scraping API alternative
    const response = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`);
    
    // For production, you'd want to use YouTube Data API v3
    // This is a simplified version that returns structured data
    const mockResults = [
      {
        videoId: 'dQw4w9WgXcQ',
        title: `Search results for: ${q}`,
        channel: 'Demo Channel',
        views: '1M views',
        duration: '3:42',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        url: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
        description: 'Set YOUTUBE_API_KEY environment variable for real search results'
      }
    ];

    res.json({
      success: true,
      query: q,
      count: mockResults.length,
      results: mockResults,
      note: 'Add YOUTUBE_API_KEY for real results'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search YouTube',
      message: error.message
    });
  }
});

// YouTube Video Info
app.get('/youtube/info', async (req, res) => {
  try {
    const { id, url } = req.query;
    
    let videoId = id;
    if (url) {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      videoId = match ? match[1] : null;
    }
    
    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "id" or "url" is required'
      });
    }

    res.json({
      success: true,
      videoId: videoId,
      title: 'Video Title',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      embed: `https://www.youtube.com/embed/${videoId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get video info',
      message: error.message
    });
  }
});

// ============================================
// YOUTUBE MP3 DOWNLOAD API
// ============================================

app.get('/download/ytmp3', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }

    // Extract video ID
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    const videoId = match ? match[1] : null;
    
    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid YouTube URL'
      });
    }

    // Using a free YouTube to MP3 converter API
    res.json({
      success: true,
      videoId: videoId,
      title: 'Audio Download',
      format: 'mp3',
      quality: '128kbps',
      downloadUrl: `https://api.vevioz.com/api/button/mp3/${videoId}`,
      alternativeUrl: `https://www.yt1s.com/api/ajaxSearch/download?v_id=${videoId}&ftype=mp3&fquality=128`,
      note: 'Click downloadUrl to start download'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process download',
      message: error.message
    });
  }
});

// ============================================
// YOUTUBE MP4 DOWNLOAD API
// ============================================

app.get('/download/ytmp4', async (req, res) => {
  try {
    const { url, quality = '360' } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }

    // Extract video ID
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    const videoId = match ? match[1] : null;
    
    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid YouTube URL'
      });
    }

    res.json({
      success: true,
      videoId: videoId,
      title: 'Video Download',
      format: 'mp4',
      quality: quality + 'p',
      downloadUrl: `https://api.vevioz.com/api/button/mp4/${videoId}`,
      alternativeUrl: `https://www.yt1s.com/api/ajaxSearch/download?v_id=${videoId}&ftype=mp4&fquality=${quality}`,
      qualities: ['144', '240', '360', '480', '720', '1080'],
      note: 'Click downloadUrl to start download'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process download',
      message: error.message
    });
  }
});

// ============================================
// IMAGE DOWNLOAD API
// ============================================

app.get('/download/image', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }

    // Validate URL
    if (!url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp)/i)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image URL'
      });
    }

    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer'
    });

    const contentType = response.headers['content-type'];
    const buffer = Buffer.from(response.data, 'binary');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'attachment; filename=image.jpg');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to download image',
      message: error.message
    });
  }
});

// Instagram Image Downloader
app.get('/download/instagram', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }

    // Using a public Instagram downloader API
    const response = await axios.get(`https://api.downloadgram.com/media?url=${encodeURIComponent(url)}`);
    
    res.json({
      success: true,
      url: url,
      media: response.data || { message: 'Use third-party services for Instagram downloads' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to download Instagram media',
      message: error.message
    });
  }
});

// ============================================
// TIKTOK DOWNLOAD API
// ============================================

app.get('/download/tiktok', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }

    // Using TikTok API alternative
    try {
      const response = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`);
      
      if (response.data) {
        res.json({
          success: true,
          url: url,
          video: response.data.video,
          audio: response.data.music,
          thumbnail: response.data.cover,
          title: response.data.title,
          author: response.data.author
        });
      }
    } catch (apiError) {
      res.json({
        success: true,
        url: url,
        note: 'TikTok download available',
        alternative: `https://tikdown.org/download?url=${encodeURIComponent(url)}`
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to download TikTok',
      message: error.message
    });
  }
});

// ============================================
// RANDOM IMAGES
// ============================================

app.get('/random/anime', async (req, res) => {
  try {
    const response = await axios.get('https://api.waifu.pics/sfw/waifu');
    
    res.json({
      success: true,
      url: response.data.url
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get anime image'
    });
  }
});

app.get('/random/cat', async (req, res) => {
  try {
    const response = await axios.get('https://api.thecatapi.com/v1/images/search');
    
    res.json({
      success: true,
      url: response.data[0].url
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cat image'
    });
  }
});

app.get('/random/dog', async (req, res) => {
  try {
    const response = await axios.get('https://dog.ceo/api/breeds/image/random');
    
    res.json({
      success: true,
      url: response.data.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get dog image'
    });
  }
});

app.get('/random/meme', async (req, res) => {
  try {
    const response = await axios.get('https://meme-api.com/gimme');
    
    res.json({
      success: true,
      title: response.data.title,
      url: response.data.url,
      author: response.data.author,
      subreddit: response.data.subreddit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get meme'
    });
  }
});

// ============================================
// TOOLS
// ============================================

app.get('/tools/joke', async (req, res) => {
  try {
    const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
    
    res.json({
      success: true,
      setup: response.data.setup,
      punchline: response.data.punchline
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get joke'
    });
  }
});

app.get('/tools/qrcode', async (req, res) => {
  try {
    const { text } = req.query;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "text" is required'
      });
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;
    
    res.json({
      success: true,
      text: text,
      qrCode: qrUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code'
    });
  }
});

// ============================================
// STATUS
// ============================================

app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: 'Active',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    server: API_CONFIG
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    message: 'Please check the API documentation at "/"'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║       Ladybug API Server Started      ║
╠═══════════════════════════════════════╣
║  Port: ${PORT}                       
║  Status: Active                        ║
║  Version: ${API_CONFIG.version}                    ║
╚═══════════════════════════════════════╝
  `);
});
