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

// Serve static files
app.use(express.static('public'));

// API Configuration
const API_CONFIG = {
  name: "Ladybug Api'S",
  version: "v1.0.0",
  description: "Simple and easy to use API.",
  creator: "Ntando Mods Team",
  status: "Active!"
};

// ============================================
// ROUTES
// ============================================

// Home/Documentation Route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// API Info Route
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    data: API_CONFIG
  });
});

// ============================================
// AI ROUTES
// ============================================

// ChatGPT API (using free alternative)
app.get('/ai/chatgpt', async (req, res) => {
  try {
    const { text } = req.query;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "text" is required'
      });
    }

    // Using a free AI API alternative
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
      error: 'Failed to get response from ChatGPT',
      message: error.message
    });
  }
});

// ============================================
// RANDOM IMAGE ROUTES
// ============================================

// Random Anime Image
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
      error: 'Failed to get anime image',
      message: error.message
    });
  }
});

// Random Cat Image
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
      error: 'Failed to get cat image',
      message: error.message
    });
  }
});

// ============================================
// SEARCH ROUTES
// ============================================

// YouTube Search
app.get('/search/youtube', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "q" is required'
      });
    }

    // Using a free YouTube search API
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
      params: {
        part: 'snippet',
        q: q,
        type: 'video',
        maxResults: 10,
        key: process.env.YOUTUBE_API_KEY || 'demo'
      }
    }).catch(() => {
      // Fallback mock data if no API key
      return {
        data: {
          items: [
            {
              id: { videoId: 'dQw4w9WgXcQ' },
              snippet: {
                title: `Search results for: ${q}`,
                description: 'Configure YOUTUBE_API_KEY in environment variables for real results',
                channelTitle: 'Demo Channel'
              }
            }
          ]
        }
      };
    });

    const results = response.data.items?.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channel: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    })) || [];

    res.json({
      success: true,
      query: q,
      results: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search YouTube',
      message: error.message
    });
  }
});

// ============================================
// TOOLS ROUTES
// ============================================

// Random Joke
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
      error: 'Failed to get joke',
      message: error.message
    });
  }
});

// QR Code Generator
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
      error: 'Failed to generate QR code',
      message: error.message
    });
  }
});

// ============================================
// STATUS ROUTE
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

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    message: 'Please check the API documentation at the root path "/"'
  });
});

// Error Handler
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
