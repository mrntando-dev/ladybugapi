
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Only load dotenv in non-production
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 3000;

// Rate Limiting (Simple implementation)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // 100 requests per window

function rateLimit(req, res, next) {
  // Skip rate limiting in production environments that may have their own rate limiting
  if (process.env.NODE_ENV === 'production' && process.env.RENDER === 'true') {
    return next();
  }
  
  const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }
  
  const requests = requestCounts.get(ip);
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (recentRequests.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.'
    });
  }
  
  recentRequests.push(now);
  requestCounts.set(ip, recentRequests);
  next();
}

// Security Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(rateLimit);
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// API Configuration
const API_CONFIG = {
  name: "Ladybug Api'S",
  version: "v2.2.0",
  description: "Premium REST API with 65+ endpoints - Completely Free!",
  creator: "Ntando Mods Team",
  status: "Active!",
  endpoints: 65,
  uptime: process.uptime()
};

// Cache for performance
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cacheMiddleware(req, res, next) {
  const key = req.originalUrl;
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }
  
  next();
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Utility Functions
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function sanitizeInput(input) {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================
// MAIN ROUTES
// ============================================

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/info', cacheMiddleware, (req, res) => {
  const data = {
    success: true,
    data: {
      ...API_CONFIG,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        cachedEndpoints: cache.size
      },
      premium: {
        all_features_free: true,
        no_api_key_required: true,
        unlimited_requests: true,
        commercial_use_allowed: true
      }
    }
  };
  
  setCache(req.originalUrl, data);
  res.json(data);
});

// ============================================
// AI ENDPOINTS - FIXED & ENHANCED
// ============================================

app.get('/ai/chatgpt', cacheMiddleware, async (req, res) => {
  try {
    const { text, context } = req.query;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "text" is required and cannot be empty'
      });
    }

    const sanitizedText = sanitizeInput(text);
    if (sanitizedText.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Text is too long (max 1000 characters)'
      });
    }

    let response = '';
    let source = 'Fallback';
    
    try {
      const apiResponse = await axios.get(`https://api.popcat.xyz/chatbot`, {
        params: {
          msg: sanitizedText,
          owner: 'Ladybug API',
          botname: 'ChatGPT Premium'
        },
        timeout: 10000
      });
      response = apiResponse.data.response || apiResponse.data;
      source = 'AI';
    } catch (apiError) {
      // Fallback response
      response = `I understand you're asking about: "${sanitizedText}". This is a premium AI response. The actual AI service is temporarily unavailable, but this demonstrates the API functionality. Try again later for a real AI response.`;
    }

    const data = {
      success: true,
      query: sanitizedText,
      response: response,
      timestamp: new Date().toISOString(),
      model: 'ChatGPT Premium',
      source: source,
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get AI response',
      message: error.message
    });
  }
});

app.get('/ai/texttoimg', async (req, res) => {
  try {
    const { prompt, size = '1024x1024', style = 'realistic' } = req.query;
    
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "prompt" is required and cannot be empty'
      });
    }

    const sanitizedPrompt = sanitizeInput(prompt);
    if (sanitizedPrompt.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is too long (max 200 characters)'
      });
    }

    // Premium image APIs with fallbacks
    const imageApis = [
      `https://image.pollinations.ai/prompt/${encodeURIComponent(sanitizedPrompt)}?width=1024&height=1024&nologo=true&seed=${Math.random()}`,
      `https://source.unsplash.com/1600x900/?${encodeURIComponent(sanitizedPrompt)}`
    ];

    let imageUrl = imageApis[0];
    let apiUsed = 'Pollinations AI';
    
    try {
      await axios.head(imageUrl, { timeout: 5000 });
    } catch (imgError) {
      // Try alternative APIs
      imageUrl = imageApis[1];
      apiUsed = 'Unsplash';
    }

    const data = {
      success: true,
      prompt: sanitizedPrompt,
      imageUrl: imageUrl,
      download: imageUrl,
      metadata: {
        size: size,
        style: style,
        timestamp: new Date().toISOString(),
        api: apiUsed,
        premium: true,
        free: true
      }
    };
    
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate image',
      message: error.message
    });
  }
});

app.get('/ai/writer', cacheMiddleware, async (req, res) => {
  try {
    const { topic, type = 'story', length = 'medium' } = req.query;
    
    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "topic" is required and cannot be empty'
      });
    }

    const sanitizedTopic = sanitizeInput(topic);
    if (sanitizedTopic.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Topic is too long (max 100 characters)'
      });
    }

    const prompts = {
      story: `Write a creative and engaging story about: ${sanitizedTopic}`,
      article: `Write an informative article about: ${sanitizedTopic}`,
      poem: `Write a beautiful poem about: ${sanitizedTopic}`,
      script: `Write a short script about: ${sanitizedTopic}`,
      blog: `Write a blog post about: ${sanitizedTopic}`,
      essay: `Write an essay about: ${sanitizedTopic}`,
      speech: `Write a speech about: ${sanitizedTopic}`,
      lyrics: `Write song lyrics about: ${sanitizedTopic}`
    };

    let content = '';
    let source = 'Fallback';
    
    try {
      const response = await axios.get(`https://api.popcat.xyz/chatbot`, {
        params: {
          msg: prompts[type] || prompts.story,
          owner: 'Ladybug API',
          botname: 'AI Writer Premium'
        },
        timeout: 15000
      });
      content = response.data.response || response.data;
      source = 'AI';
    } catch (apiError) {
      // Fallback content
      content = generateFallbackContent(sanitizedTopic, type);
    }

    const data = {
      success: true,
      topic: sanitizedTopic,
      type: type,
      story: content,
      metadata: {
        length: length,
        timestamp: new Date().toISOString(),
        words: content.split(' ').length,
        source: source,
        premium: true,
        free: true
      }
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate content',
      message: error.message
    });
  }
});

function generateFallbackContent(topic, type) {
  const templates = {
    story: `Once upon a time, in a world where ${topic} played a central role, there existed an extraordinary tale that would change everything. This story takes us on a journey through imagination and wonder, exploring the depths of ${topic} in ways never before imagined.`,
    article: `${topic}: A Comprehensive Analysis\
\
In today's rapidly evolving world, ${topic} has emerged as a significant factor that demands our attention. This article explores the various aspects, implications, and future prospects of ${topic}.`,
    poem: `Ode to ${topic}\
\
In realms where thoughts take flight,\
And dreams embrace the light,\
There stands ${topic}, bold and bright,\
A beacon in the darkest night.`,
    blog: `My Journey with ${topic}\
\
I wanted to share my experience with ${topic} and how it transformed my perspective. What started as curiosity evolved into a deep passion that continues to inspire me every day.`,
    essay: `The Significance of ${topic} in Modern Society\
\
Throughout history, humanity has grappled with various challenges and opportunities. Among these, ${topic} stands out as a particularly influential factor that shapes our collective experience.`,
    speech: `Friends, colleagues, fellow citizens of the world,\
\
Today I stand before you to speak about ${topic} - a subject that touches each of our lives in profound and meaningful ways.`,
    lyrics: `${topic}\
\
Verse 1:\
When I think about ${topic}\
My heart starts to race\
It's more than just a feeling\
It's my saving grace\
\
Chorus:\
Oh, ${topic}, ${topic}\
You're the rhythm in my soul\
${topic}, ${topic}\
Making me whole`
  };
  
  return templates[type] || templates.story;
}

app.get('/ai/translate', cacheMiddleware, async (req, res) => {
  try {
    const { text, to = 'en', from = 'auto' } = req.query;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "text" is required and cannot be empty'
      });
    }

    const sanitizedText = sanitizeInput(text);
    if (sanitizedText.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Text is too long (max 500 characters)'
      });
    }

    let translated = '';
    let source = 'Fallback';
    
    try {
      const response = await axios.get(`https://api.popcat.xyz/translate`, {
        params: {
          text: sanitizedText,
          to: to.toLowerCase(),
          from: from.toLowerCase()
        },
        timeout: 10000
      });
      translated = response.data.translated || response.data;
      source = 'AI';
    } catch (apiError) {
      // Fallback translation
      translated = `[Translated to ${to}]: ${sanitizedText}`;
    }

    const data = {
      success: true,
      original: sanitizedText,
      translated: translated,
      from: from,
      to: to,
      timestamp: new Date().toISOString(),
      source: source,
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to translate text',
      message: error.message
    });
  }
});

app.get('/ai/summarize', cacheMiddleware, async (req, res) => {
  try {
    const { text, length = 'medium' } = req.query;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "text" is required'
      });
    }

    const sanitizedText = sanitizeInput(text);
    if (sanitizedText.length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Text is too short to summarize (min 50 characters)'
      });
    }

    const lengthPrompts = {
      short: 'Summarize this text in 1-2 sentences:',
      medium: 'Summarize this text in a brief paragraph:',
      long: 'Provide a detailed summary of this text:'
    };

    let summary = '';
    let source = 'Fallback';
    
    try {
      const response = await axios.get(`https://api.popcat.xyz/chatbot`, {
        params: {
          msg: `${lengthPrompts[length]} ${sanitizedText}`,
          owner: 'Ladybug API',
          botname: 'AI Summarizer Premium'
        },
        timeout: 15000
      });
      summary = response.data.response || response.data;
      source = 'AI';
    } catch (apiError) {
      // Fallback summary
      summary = `Summary (${length}): This text discusses ${sanitizedText.substring(0, 50)}... The original content spans ${sanitizedText.length} characters and contains multiple key points that would normally be summarized here with AI assistance. Please try again for a detailed summary.`;
    }

    const data = {
      success: true,
      originalLength: sanitizedText.length,
      summary: summary,
      length: length,
      timestamp: new Date().toISOString(),
      source: source,
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to summarize text',
      message: error.message
    });
  }
});

app.get('/ai/sentiment', cacheMiddleware, async (req, res) => {
  try {
    const { text } = req.query;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "text" is required'
      });
    }

    const sanitizedText = sanitizeInput(text);
    
    // Analyze sentiment based on keywords
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'happy', 'joy', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'sad', 'angry', 'worst', 'disappointed', 'fail'];
    
    const lowerText = sanitizedText.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    let sentiment = 'neutral';
    let score = 0;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = Math.min((positiveCount - negativeCount) * 20, 100);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = Math.max((positiveCount - negativeCount) * 20, -100);
    } else {
      score = 0;
    }

    const data = {
      success: true,
      text: sanitizedText,
      sentiment: sentiment,
      score: score,
      confidence: Math.min(Math.abs(score), 100),
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze sentiment',
      message: error.message
    });
  }
});

app.get('/ai/grammar', cacheMiddleware, async (req, res) => {
  try {
    const { text } = req.query;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "text" is required'
      });
    }

    const sanitizedText = sanitizeInput(text);
    
    // Simple grammar checks
    const issues = [];
    const corrected = sanitizedText;
    
    // Check for common issues
    if (sanitizedText.match(/\s\s+/)) {
      issues.push('Multiple spaces detected');
    }
    if (!sanitizedText.match(/^[A-Z]/)) {
      issues.push('Missing capitalization at start');
    }
    if (!sanitizedText.match(/[.!?]$/)) {
      issues.push('Missing punctuation at end');
    }
    
    const data = {
      success: true,
      original: sanitizedText,
      corrected: corrected,
      issues: issues,
      score: Math.max(0, 100 - (issues.length * 10)),
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check grammar',
      message: error.message
    });
  }
});

app.get('/ai/keyword', cacheMiddleware, async (req, res) => {
  try {
    const { text, max = 10 } = req.query;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "text" is required'
      });
    }

    const sanitizedText = sanitizeInput(text);
    const maxKeywords = Math.min(parseInt(max), 20);
    
    // Extract keywords (simple word frequency)
    const words = sanitizedText.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'she', 'use', 'her', 'than', 'when', 'make', 'time'];
    
    const filteredWords = words.filter(word => !stopWords.includes(word));
    
    const wordCount = {};
    filteredWords.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    const keywords = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word, count]) => ({
        keyword: word,
        frequency: count,
        relevance: Math.round((count / filteredWords.length) * 100)
      }));

    const data = {
      success: true,
      text: sanitizedText,
      keywords: keywords,
      totalWords: words.length,
      uniqueKeywords: Object.keys(wordCount).length,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to extract keywords',
      message: error.message
    });
  }
});

// ============================================
// BUSINESS APIS
// ============================================

app.get('/business/email-validator', cacheMiddleware, async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email || email.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "email" is required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    // Simple domain check
    const domain = email.split('@')[1];
    const domainExists = domain && domain.includes('.');

    const data = {
      success: true,
      email: email,
      isValid: isValid,
      domain: domain,
      domainExists: domainExists,
      isDisposable: isDisposableDomain(domain),
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to validate email',
      message: error.message
    });
  }
});

function isDisposableDomain(domain) {
  const disposableDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com', 'mailinator.com'];
  return disposableDomains.some(disposable => domain.includes(disposable));
}

app.get('/business/phone-validator', cacheMiddleware, async (req, res) => {
  try {
    const { phone, country = 'US' } = req.query;
    
    if (!phone || phone.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "phone" is required'
      });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const isValid = cleanPhone.length >= 10 && cleanPhone.length <= 15;
    
    const data = {
      success: true,
      phone: phone,
      cleanPhone: cleanPhone,
      isValid: isValid,
      country: country,
      type: detectPhoneType(cleanPhone),
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to validate phone',
      message: error.message
    });
  }
});

function detectPhoneType(phone) {
  if (phone.startsWith('1')) return 'mobile';
  if (phone.startsWith('2')) return 'landline';
  if (phone.startsWith('800') || phone.startsWith('888') || phone.startsWith('877') || phone.startsWith('866')) return 'toll-free';
  return 'unknown';
}

app.get('/business/color-palette', cacheMiddleware, async (req, res) => {
  try {
    const { theme = 'vibrant', count = 5 } = req.query;
    
    const themes = {
      vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
      pastel: ['#FFB6C1', '#E6E6FA', '#F0E68C', '#DDA0DD', '#B0E0E6'],
      dark: ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7'],
      nature: ['#228B22', '#32CD32', '#90EE90', '#006400', '#8FBC8F'],
      ocean: ['#006994', '#0099CC', '#00B4D8', '#48CAE4', '#90E0EF'],
      sunset: ['#FF6B35', '#F77B71', '#FFA07A', '#FFB347', '#FFD700']
    };
    
    const selectedTheme = themes[theme] || themes.vibrant;
    const palette = selectedTheme.slice(0, Math.min(parseInt(count), selectedTheme.length));
    
    const data = {
      success: true,
      theme: theme,
      colors: palette.map((color, index) => ({
        color: color,
        hex: color,
        rgb: hexToRgb(color),
        name: getColorName(index)
      })),
      count: palette.length,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate color palette',
      message: error.message
    });
  }
});

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getColorName(index) {
  const names = ['Primary', 'Secondary', 'Accent', 'Highlight', 'Background'];
  return names[index] || 'Color';
}

// ============================================
// DEVELOPER APIS
// ============================================

app.get('/dev/json-formatter', cacheMiddleware, async (req, res) => {
  try {
    const { json, indent = 2 } = req.query;
    
    if (!json || json.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "json" is required'
      });
    }

    let formatted;
    let isValid = true;
    
    try {
      const parsed = JSON.parse(json);
      formatted = JSON.stringify(parsed, null, parseInt(indent));
    } catch (parseError) {
      isValid = false;
      formatted = json; // Return original if invalid
    }

    const data = {
      success: true,
      original: json,
      formatted: formatted,
      isValid: isValid,
      indent: indent,
      size: {
        original: json.length,
        formatted: formatted.length
      },
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to format JSON',
      message: error.message
    });
  }
});

app.get('/dev/base64-encoder', cacheMiddleware, async (req, res) => {
  try {
    const { text, action = 'encode' } = req.query;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "text" is required'
      });
    }

    let result;
    if (action === 'encode') {
      result = Buffer.from(text).toString('base64');
    } else {
      try {
        result = Buffer.from(text, 'base64').toString('utf-8');
      } catch (decodeError) {
        result = 'Invalid base64 string';
      }
    }

    const data = {
      success: true,
      action: action,
      input: text,
      output: result,
      size: {
        input: text.length,
        output: result.length
      },
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process base64',
      message: error.message
    });
  }
});

app.get('/dev/uuid-generator', cacheMiddleware, async (req, res) => {
  try {
    const { version = 4, count = 1 } = req.query;
    
    const uuids = [];
    for (let i = 0; i < Math.min(parseInt(count), 10); i++) {
      uuids.push(generateUUID());
    }

    const data = {
      success: true,
      version: version,
      count: uuids.length,
      uuids: uuids,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate UUID',
      message: error.message
    });
  }
});

// ============================================
// SOCIAL MEDIA APIS
// ============================================

app.get('/social/twitter-screenshot', cacheMiddleware, async (req, res) => {
  try {
    const { username, theme = 'light' } = req.query;
    
    if (!username || username.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "username" is required'
      });
    }

    const screenshotUrl = `https://shot.screenshotapi.net/screenshot?token=DZ8XQ3N-LYRJ3-6Q9S8-Y4A6A-JK8P7R&url=https://twitter.com/${username}&width=800&height=600&format=png&download=0&device=desktop&waitForSelector=.tweet&fullPage=false`;

    const data = {
      success: true,
      username: username,
      screenshotUrl: screenshotUrl,
      theme: theme,
      twitterUrl: `https://twitter.com/${username}`,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'Screenshot will be generated automatically'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate Twitter screenshot',
      message: error.message
    });
  }
});

app.get('/social/instagram-downloader', cacheMiddleware, async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }

    // Mock response for demonstration
    const data = {
      success: true,
      url: url,
      downloadUrl: 'https://instagram.com/p/download/example',
      mediaType: 'image',
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is a demo. Real download would require Instagram API access'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process Instagram media',
      message: error.message
    });
  }
});

// ============================================
// DATA APIS
// ============================================

app.get('/data/currency-converter', cacheMiddleware, async (req, res) => {
  try {
    const { amount, from = 'USD', to = 'EUR' } = req.query;
    
    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "amount" is required and must be a number'
      });
    }

    // Mock exchange rates (in production, use real API)
    const exchangeRates = {
      'USD-EUR': 0.85,
      'USD-GBP': 0.73,
      'USD-JPY': 110.5,
      'EUR-USD': 1.18,
      'EUR-GBP': 0.86,
      'GBP-USD': 1.37,
      'GBP-EUR': 1.16
    };

    const pair = `${from}-${to}`;
    const rate = exchangeRates[pair] || 1;
    const converted = (parseFloat(amount) * rate).toFixed(2);

    const data = {
      success: true,
      amount: parseFloat(amount),
      from: from,
      to: to,
      rate: rate,
      converted: parseFloat(converted),
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'Rates are for demonstration. Use real API for production.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to convert currency',
      message: error.message
    });
  }
});

app.get('/data/weather', cacheMiddleware, async (req, res) => {
  try {
    const { city = 'New York', units = 'metric' } = req.query;
    
    // Mock weather data
    const mockWeather = {
      city: city,
      temperature: Math.round(Math.random() * 30 + 10),
      humidity: Math.round(Math.random() * 60 + 40),
      windSpeed: Math.round(Math.random() * 20 + 5),
      description: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
      icon: '01d',
      units: units
    };

    const data = {
      success: true,
      weather: mockWeather,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is demo weather data. Use real weather API for production.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get weather data',
      message: error.message
    });
  }
});

// ============================================
// MUSIC APIS (5 endpoints)
// ============================================

app.get('/music/shazam', cacheMiddleware, async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }

    // Mock music recognition response
    const data = {
      success: true,
      url: url,
      song: {
        title: 'Shape of You',
        artist: 'Ed Sheeran',
        album: 'Divide',
        year: 2017,
        genre: 'Pop',
        duration: '3:54',
        lyrics: 'Sample lyrics for demonstration purposes'
      },
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is a demo. Real music recognition would require audio processing API.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to identify music',
      message: error.message
    });
  }
});

app.get('/music/lyrics', cacheMiddleware, async (req, res) => {
  try {
    const { song, artist } = req.query;
    
    if (!song || song.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "song" is required'
      });
    }

    // Mock lyrics response
    const data = {
      success: true,
      song: song,
      artist: artist || 'Unknown Artist',
      lyrics: `Sample lyrics for "${song}" by ${artist || 'Unknown Artist'}\
\
This is demo text for illustration purposes.\
Real lyrics would require licensing and API integration.`,
      metadata: {
        genre: 'Pop',
        year: 2023,
        album: 'Demo Album',
        duration: '3:30'
      },
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is demo content. Real lyrics require proper licensing.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get lyrics',
      message: error.message
    });
  }
});

app.get('/music/spotify', cacheMiddleware, async (req, res) => {
  try {
    const { query, type = 'track', limit = 10 } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "query" is required'
      });
    }

    // Mock Spotify search response
    const data = {
      success: true,
      query: query,
      type: type,
      tracks: [
        {
          id: 'demo1',
          name: `Demo Track 1 for "${query}"`,
          artist: 'Demo Artist',
          album: 'Demo Album',
          duration: '3:45',
          preview_url: 'https://p.scdn.co/mp3-preview/demo.mp3',
          external_url: 'https://open.spotify.com/track/demo'
        },
        {
          id: 'demo2',
          name: `Demo Track 2 for "${query}"`,
          artist: 'Demo Artist 2',
          album: 'Demo Album 2',
          duration: '4:12',
          preview_url: 'https://p.scdn.co/mp3-preview/demo2.mp3',
          external_url: 'https://open.spotify.com/track/demo2'
        }
      ].slice(0, parseInt(limit)),
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is demo data. Real Spotify API requires authentication.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search Spotify',
      message: error.message
    });
  }
});

app.get('/music/youtube', cacheMiddleware, async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "query" is required'
      });
    }

    // Mock YouTube music search response
    const data = {
      success: true,
      query: query,
      videos: [
        {
          id: 'demo1',
          title: `Demo Music Video 1 for "${query}"`,
          channel: 'Demo Music Channel',
          duration: '3:45',
          views: '1,234,567',
          thumbnail: 'https://img.youtube.com/vi/demo1/mqdefault.jpg',
          url: 'https://youtube.com/watch?v=demo1'
        },
        {
          id: 'demo2',
          title: `Demo Music Video 2 for "${query}"`,
          channel: 'Demo Music Channel 2',
          duration: '4:12',
          views: '987,654',
          thumbnail: 'https://img.youtube.com/vi/demo2/mqdefault.jpg',
          url: 'https://youtube.com/watch?v=demo2'
        }
      ].slice(0, parseInt(limit)),
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is demo data. Real YouTube API requires API key.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search YouTube music',
      message: error.message
    });
  }
});

app.get('/music/playlist', cacheMiddleware, async (req, res) => {
  try {
    const { genre, mood, count = 20 } = req.query;
    
    // Mock playlist generation
    const data = {
      success: true,
      playlist: {
        name: `${mood || 'Mixed'} ${genre || 'All'} Music Playlist`,
        description: `A curated playlist of ${count} ${mood || 'mixed'} ${genre || 'music'} songs`,
        tracks: Array.from({ length: Math.min(parseInt(count), 50) }, (_, i) => ({
          id: `track${i + 1}`,
          title: `Demo ${genre || 'Music'} Track ${i + 1}`,
          artist: `Demo Artist ${i + 1}`,
          album: `Demo ${mood || 'Mixed'} Album`,
          duration: `${3 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
          mood: mood || 'Mixed',
          genre: genre || 'Various'
        }))
      },
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is a demo playlist. Real playlists would use music streaming APIs.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate playlist',
      message: error.message
    });
  }
});

// ============================================
// TOOLS APIS (10 endpoints)
// ============================================

app.get('/tools/tinyurl', cacheMiddleware, async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    const shortUrl = `https://tinyurl.com/${Math.random().toString(36).substring(2, 8)}`;
    
    const data = {
      success: true,
      original: url,
      short: shortUrl,
      stats: {
        clicks: Math.floor(Math.random() * 1000),
        created: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is a demo URL. Real shortening requires URL shortening service API.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to shorten URL',
      message: error.message
    });
  }
});

app.get('/tools/qr-code', cacheMiddleware, async (req, res) => {
  try {
    const { text, size = '200' } = req.query;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "text" is required'
      });
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
    
    const data = {
      success: true,
      text: text,
      qrCodeUrl: qrUrl,
      size: size,
      format: 'png',
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code',
      message: error.message
    });
  }
});

app.get('/tools/password', cacheMiddleware, async (req, res) => {
  try {
    const { length = '16', includeSymbols = 'true' } = req.query;
    
    const len = Math.min(parseInt(length), 32);
    const symbols = includeSymbols === 'true' ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : '';
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' + symbols;
    
    let password = '';
    for (let i = 0; i < len; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    const data = {
      success: true,
      password: password,
      strength: calculatePasswordStrength(password),
      metadata: {
        length: len,
        includeSymbols: includeSymbols === 'true',
        entropy: Math.log2(Math.pow(charset.length, len))
      },
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate password',
      message: error.message
    });
  }
});

function calculatePasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;
  if (/[a-z]/.test(password)) strength += 12.5;
  if (/[A-Z]/.test(password)) strength += 12.5;
  if (/[0-9]/.test(password)) strength += 12.5;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
  return Math.min(strength, 100);
}

app.get('/tools/hash', cacheMiddleware, async (req, res) => {
  try {
    const { text, algorithm = 'sha256' } = req.query;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "text" is required'
      });
    }

    const crypto = require('crypto');
    const hash = crypto.createHash(algorithm).update(text).digest('hex');
    
    const data = {
      success: true,
      text: text,
      algorithm: algorithm,
      hash: hash,
      length: hash.length,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate hash',
      message: error.message
    });
  }
});

app.get('/tools/timestamp', cacheMiddleware, async (req, res) => {
  try {
    const { timestamp, format = 'datetime' } = req.query;
    
    let date;
    if (timestamp) {
      date = new Date(parseInt(timestamp) * 1000);
    } else {
      date = new Date();
    }
    
    let result;
    switch (format) {
      case 'datetime':
        result = date.toISOString();
        break;
      case 'unix':
        result = Math.floor(date.getTime() / 1000);
        break;
      case 'readable':
        result = date.toLocaleString();
        break;
      default:
        result = date.toISOString();
    }
    
    const data = {
      success: true,
      input: timestamp || 'current',
      format: format,
      result: result,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to convert timestamp',
      message: error.message
    });
  }
});

app.get('/tools/calculator', cacheMiddleware, async (req, res) => {
  try {
    const { expression } = req.query;
    
    if (!expression || expression.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "expression" is required'
      });
    }

    // Safe evaluation (basic math only)
    const safeExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
    let result;
    
    try {
      result = Function('"use strict"; return (' + safeExpression + ')')();
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mathematical expression'
      });
    }
    
    const data = {
      success: true,
      expression: expression,
      result: result,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to calculate',
      message: error.message
    });
  }
});

app.get('/tools/units', cacheMiddleware, async (req, res) => {
  try {
    const { value, from, to } = req.query;
    
    if (!value || isNaN(value)) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "value" is required and must be a number'
      });
    }
    
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Parameters "from" and "to" are required'
      });
    }
    
    // Mock unit conversion (basic examples)
    let converted = parseFloat(value);
    const conversionKey = `${from}-${to}`;
    
    const conversions = {
      'kg-lbs': 2.20462,
      'lbs-kg': 0.453592,
      'cm-inches': 0.393701,
      'inches-cm': 2.54,
      'celsius-fahrenheit': (c) => (c * 9/5) + 32,
      'fahrenheit-celsius': (f) => (f - 32) * 5/9
    };
    
    if (typeof conversions[conversionKey] === 'function') {
      converted = conversions[conversionKey](converted);
    } else if (conversions[conversionKey]) {
      converted = converted * conversions[conversionKey];
    } else {
      converted = value; // No conversion available
    }
    
    const data = {
      success: true,
      value: parseFloat(value),
      from: from,
      to: to,
      result: converted,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'Basic unit conversion. Advanced conversions would require specialized APIs.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to convert units',
      message: error.message
    });
  }
});

app.get('/tools/ascii', cacheMiddleware, async (req, res) => {
  try {
    const { text, font = 'standard' } = req.query;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "text" is required'
      });
    }

    // Simple ASCII art (mock)
    const asciiArt = `
    \u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
    \u2551  ${text.toUpperCase().padEnd(22)} \u2551
    \u2551  Simple ASCII Art Demo    \u2551
    \u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d
    `;
    
    const data = {
      success: true,
      text: text,
      font: font,
      asciiArt: asciiArt,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is demo ASCII art. Real ASCII art requires specialized libraries.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate ASCII art',
      message: error.message
    });
  }
});

app.get('/tools/morse', cacheMiddleware, async (req, res) => {
  try {
    const { text, action = 'encode' } = req.query;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "text" is required'
      });
    }

    const morseCode = {
      'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
      'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
      'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
      'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
      'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
      '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
      '8': '---..', '9': '----.', ' ': '/'
    };
    
    let result;
    if (action === 'encode') {
      result = text.toUpperCase().split('').map(char => morseCode[char] || char).join(' ');
    } else {
      // Simple decode (reverse mapping)
      const reverseMorse = Object.fromEntries(Object.entries(morseCode).map(([k, v]) => [v, k]));
      result = text.split(' ').map(code => reverseMorse[code] || code).join('');
    }
    
    const data = {
      success: true,
      text: text,
      action: action,
      result: result,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process morse code',
      message: error.message
    });
  }
});

app.get('/tools/roman', cacheMiddleware, async (req, res) => {
  try {
    const { number, action = 'toRoman' } = req.query;
    
    if (!number || isNaN(number)) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "number" is required and must be a number'
      });
    }
    
    let result;
    if (action === 'toRoman') {
      result = toRoman(parseInt(number));
    } else {
      result = fromRoman(number.toUpperCase());
    }
    
    const data = {
      success: true,
      number: number,
      action: action,
      result: result,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to convert roman numerals',
      message: error.message
    });
  }
});

function toRoman(num) {
  const roman = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  const arabic = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  let result = '';
  
  for (let i = 0; i < arabic.length; i++) {
    while (num >= arabic[i]) {
      result += roman[i];
      num -= arabic[i];
    }
  }
  return result;
}

function fromRoman(roman) {
  const romanNumerals = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let result = 0;
  
  for (let i = 0; i < roman.length; i++) {
    const current = romanNumerals[roman[i]];
    const next = romanNumerals[roman[i + 1]];
    
    if (next && current < next) {
      result += next - current;
      i++;
    } else {
      result += current;
    }
  }
  return result;
}

// ============================================
// RANDOM APIS (8 endpoints)
// ============================================

app.get('/random/anime', cacheMiddleware, async (req, res) => {
  try {
    const { genre, limit = 5 } = req.query;
    
    const animes = [
      { title: 'Attack on Titan', genre: 'Action', year: 2013, rating: 9.0 },
      { title: 'Death Note', genre: 'Thriller', year: 2006, rating: 9.0 },
      { title: 'One Piece', genre: 'Adventure', year: 1999, rating: 8.9 },
      { title: 'Naruto', genre: 'Action', year: 2002, rating: 8.3 },
      { title: 'Demon Slayer', genre: 'Action', year: 2019, rating: 8.7 },
      { title: 'My Hero Academia', genre: 'Action', year: 2016, rating: 8.5 },
      { title: 'Tokyo Ghoul', genre: 'Dark Fantasy', year: 2014, rating: 8.0 },
      { title: 'Steins;Gate', genre: 'Sci-Fi', year: 2011, rating: 8.8 }
    ];
    
    let filtered = animes;
    if (genre) {
      filtered = animes.filter(anime => anime.genre.toLowerCase().includes(genre.toLowerCase()));
    }
    
    const shuffled = filtered.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(parseInt(limit), filtered.length));
    
    const data = {
      success: true,
      genre: genre || 'All',
      count: selected.length,
      animes: selected,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get random anime',
      message: error.message
    });
  }
});

app.get('/random/movie', cacheMiddleware, async (req, res) => {
  try {
    const { genre, year } = req.query;
    
    const movies = [
      { title: 'Inception', genre: 'Sci-Fi', year: 2010, rating: 8.8, director: 'Christopher Nolan' },
      { title: 'The Dark Knight', genre: 'Action', year: 2008, rating: 9.0, director: 'Christopher Nolan' },
      { title: 'Pulp Fiction', genre: 'Crime', year: 1994, rating: 8.9, director: 'Quentin Tarantino' },
      { title: 'The Matrix', genre: 'Sci-Fi', year: 1999, rating: 8.7, director: 'The Wachowskis' },
      { title: 'Goodfellas', genre: 'Crime', year: 1990, rating: 8.7, director: 'Martin Scorsese' },
      { title: 'The Shawshank Redemption', genre: 'Drama', year: 1994, rating: 9.3, director: 'Frank Darabont' },
      { title: 'Fight Club', genre: 'Drama', year: 1999, rating: 8.8, director: 'David Fincher' },
      { title: 'Forrest Gump', genre: 'Drama', year: 1994, rating: 8.8, director: 'Robert Zemeckis' }
    ];
    
    let filtered = movies;
    if (genre) {
      filtered = filtered.filter(movie => movie.genre.toLowerCase().includes(genre.toLowerCase()));
    }
    if (year) {
      filtered = filtered.filter(movie => movie.year === parseInt(year));
    }
    
    const selected = filtered[Math.floor(Math.random() * filtered.length)];
    
    const data = {
      success: true,
      movie: selected,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get random movie',
      message: error.message
    });
  }
});

app.get('/random/quote', cacheMiddleware, async (req, res) => {
  try {
    const { category } = req.query;
    
    const quotes = [
      { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'motivational' },
      { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs', category: 'business' },
      { text: 'Life is what happens when you're busy making other plans.', author: 'John Lennon', category: 'life' },
      { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt', category: 'motivational' },
      { text: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle', category: 'philosophical' },
      { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb', category: 'wisdom' },
      { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill', category: 'motivational' },
      { text: 'Be yourself; everyone else is already taken.', author: 'Oscar Wilde', category: 'life' }
    ];
    
    let filtered = quotes;
    if (category) {
      filtered = quotes.filter(quote => quote.category === category);
    }
    
    const selected = filtered[Math.floor(Math.random() * filtered.length)];
    
    const data = {
      success: true,
      quote: selected,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get random quote',
      message: error.message
    });
  }
});

app.get('/random/joke', cacheMiddleware, async (req, res) => {
  try {
    const { type } = req.query;
    
    const jokes = [
      { setup: 'Why do programmers prefer dark mode?', punchline: 'Because light attracts bugs.', type: 'programming' },
      { setup: 'Why do Java developers wear glasses?', punchline: 'Because they don't see sharp.', type: 'programming' },
      { setup: 'Why was the computer cold?', punchline: 'It left its Windows open.', type: 'technology' },
      { setup: 'Why did the scarecrow win an award?', punchline: 'He was outstanding in his field.', type: 'general' },
      { setup: 'Why don't scientists trust atoms?', punchline: 'Because they make up everything.', type: 'science' },
      { setup: 'What do you call a bear with no teeth?', punchline: 'A gummy bear.', type: 'general' },
      { setup: 'Why did the math book look so sad?', punchline: 'Because it had too many problems.', type: 'education' },
      { setup: 'What do you call a fake noodle?', punchline: 'An impasta.', type: 'food' }
    ];
    
    let filtered = jokes;
    if (type) {
      filtered = jokes.filter(joke => joke.type === type);
    }
    
    const selected = filtered[Math.floor(Math.random() * filtered.length)];
    
    const data = {
      success: true,
      joke: selected,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get random joke',
      message: error.message
    });
  }
});

app.get('/random/fact', cacheMiddleware, async (req, res) => {
  try {
    const { category } = req.query;
    
    const facts = [
      { text: 'Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible.', category: 'science' },
      { text: 'Octopuses have three hearts and blue blood.', category: 'nature' },
      { text: 'A day on Venus is longer than a year on Venus.', category: 'space' },
      { text: 'Bananas are berries, but strawberries aren't.', category: 'science' },
      { text: 'The shortest war in history was between Britain and Zanzibar on August 27, 1896. Zanzibar surrendered after 38 minutes.', category: 'history' },
      { text: 'There are more stars in the universe than grains of sand on all the Earth's beaches.', category: 'space' },
      { text: 'A group of flamingos is called a "flamboyance."', category: 'nature' },
      { text: 'The Great Wall of China is not visible from space with the naked eye, contrary to popular belief.', category: 'myth' }
    ];
    
    let filtered = facts;
    if (category) {
      filtered = facts.filter(fact => fact.category === category);
    }
    
    const selected = filtered[Math.floor(Math.random() * filtered.length)];
    
    const data = {
      success: true,
      fact: selected,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get random fact',
      message: error.message
    });
  }
});

app.get('/random/word', cacheMiddleware, async (req, res) => {
  try {
    const { type, count = 5 } = req.query;
    
    const words = {
      noun: ['serendipity', 'ephemeral', 'quintessential', 'perseverance', 'mellifluous'],
      verb: ['elucidate', 'ameliorate', 'capitulate', 'extrapolate', 'mitigate'],
      adjective: ['ubiquitous', 'ephemeral', 'propitious', 'esoteric', 'magnanimous'],
      all: ['serendipity', 'elucidate', 'ubiquitous', 'ameliorate', 'ephemeral']
    };
    
    const wordList = words[type] || words.all;
    const shuffled = wordList.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(parseInt(count), wordList.length));
    
    const data = {
      success: true,
      type: type || 'all',
      words: selected.map(word => ({
        word: word,
        definition: `Definition for ${word} would be available with dictionary API integration.`,
        partOfSpeech: type || 'varies'
      })),
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'Demo words. Real definitions would require dictionary API.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get random words',
      message: error.message
    });
  }
});

app.get('/random/color', cacheMiddleware, async (req, res) => {
  try {
    const { format, count = 3 } = req.query;
    
    const generateRandomColor = () => {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      return { r, g, b };
    };
    
    const colors = Array.from({ length: Math.min(parseInt(count), 10) }, () => {
      const color = generateRandomColor();
      let formatted;
      
      switch (format) {
        case 'hex':
          formatted = '#' + [color.r, color.g, color.b].map(x => x.toString(16).padStart(2, '0')).join('');
          break;
        case 'rgb':
          formatted = `rgb(${color.r}, ${color.g}, ${color.b})`;
          break;
        case 'hsl':
          const hsl = rgbToHsl(color.r, color.g, color.b);
          formatted = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
          break;
        default:
          formatted = '#' + [color.r, color.g, color.b].map(x => x.toString(16).padStart(2, '0')).join('');
      }
      
      return {
        ...color,
        formatted: formatted,
        format: format || 'hex'
      };
    });
    
    const data = {
      success: true,
      format: format || 'hex',
      count: colors.length,
      colors: colors,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate random colors',
      message: error.message
    });
  }
});

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

app.get('/random/number', cacheMiddleware, async (req, res) => {
  try {
    const { min = '1', max = '100', count = 5 } = req.query;
    
    const minVal = parseInt(min);
    const maxVal = parseInt(max);
    const countVal = Math.min(parseInt(count), 20);
    
    if (minVal >= maxVal) {
      return res.status(400).json({
        success: false,
        error: 'Min must be less than max'
      });
    }
    
    const numbers = Array.from({ length: countVal }, () => 
      Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal
    );
    
    const data = {
      success: true,
      range: { min: minVal, max: maxVal },
      count: numbers.length,
      numbers: numbers,
      statistics: {
        sum: numbers.reduce((a, b) => a + b, 0),
        average: numbers.reduce((a, b) => a + b, 0) / numbers.length,
        min: Math.min(...numbers),
        max: Math.max(...numbers)
      },
      timestamp: new Date().toISOString(),
      premium: true,
      free: true
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate random numbers',
      message: error.message
    });
  }
});

// ============================================
// SEARCH APIS (8 endpoints)
// ============================================

app.get('/search/youtube', cacheMiddleware, async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "query" is required'
      });
    }
    
    // Mock YouTube search results
    const videos = Array.from({ length: Math.min(parseInt(limit), 20) }, (_, i) => ({
      id: `demo${i + 1}`,
      title: `Demo video about "${query}" - Part ${i + 1}`,
      channel: `Demo Channel ${i + 1}`,
      duration: `${3 + Math.floor(Math.random() * 10)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      views: `${Math.floor(Math.random() * 1000000).toLocaleString()}`,
      thumbnail: `https://img.youtube.com/vi/demo${i + 1}/mqdefault.jpg`,
      url: `https://youtube.com/watch?v=demo${i + 1}`,
      publishedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }));
    
    const data = {
      success: true,
      query: query,
      results: videos,
      total: videos.length,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is demo data. Real YouTube search requires YouTube Data API.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search YouTube',
      message: error.message
    });
  }
});

app.get('/search/google', cacheMiddleware, async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "query" is required'
      });
    }
    
    // Mock Google search results
    const results = Array.from({ length: Math.min(parseInt(limit), 10) }, (_, i) => ({
      title: `Demo Result ${i + 1} for "${query}"`,
      url: `https://example${i + 1}.com/${query.replace(/\s+/g, '-')}`,
      description: `This is a demo search result for "${query}". Real search results would require Google Search API integration.`,
      snippet: `Find the best information about ${query} on our comprehensive website...`,
      cached: Math.random() > 0.5
    }));
    
    const data = {
      success: true,
      query: query,
      results: results,
      total: results.length,
      searchTime: `${(Math.random() * 0.5 + 0.1).toFixed(2)} seconds`,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is demo data. Real Google search requires Custom Search API.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search Google',
      message: error.message
    });
  }
});

app.get('/search/image', cacheMiddleware, async (req, res) => {
  try {
    const { query, limit = 20 } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "query" is required'
      });
    }
    
    // Mock image search results
    const images = Array.from({ length: Math.min(parseInt(limit), 30) }, (_, i) => ({
      url: `https://picsum.photos/seed/${query}${i}/400/300.jpg`,
      thumbnail: `https://picsum.photos/seed/${query}${i}/150/150.jpg`,
      title: `Demo image of ${query} - ${i + 1}`,
      width: 400,
      height: 300,
      size: `${Math.floor(Math.random() * 500 + 100)} KB`,
      source: `Demo Source ${i + 1}`
    }));
    
    const data = {
      success: true,
      query: query,
      images: images,
      total: images.length,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is demo data. Real image search requires image search API.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search images',
      message: error.message
    });
  }
});

app.get('/search/news', cacheMiddleware, async (req, res) => {
  try {
    const { query, category } = req.query;
    
    // Mock news search results
    const articles = Array.from({ length: 10 }, (_, i) => ({
      title: `Breaking News: ${query || 'Latest Updates'} - Story ${i + 1}`,
      description: `This is a demo news article about ${query || 'current events'}. Real news would require news API integration.`,
      url: `https://demonews.com/article${i + 1}`,
      source: `Demo News ${i + 1}`,
      author: `Demo Author ${i + 1}`,
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      category: category || 'general',
      image: `https://picsum.photos/seed/news${i}/600/400.jpg`
    }));
    
    const data = {
      success: true,
      query: query || 'latest',
      category: category || 'all',
      articles: articles,
      total: articles.length,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is demo data. Real news requires news API integration.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search news',
      message: error.message
    });
  }
});

app.get('/search/book', cacheMiddleware, async (req, res) => {
  try {
    const { title, author, genre } = req.query;
    
    // Mock book search results
    const books = Array.from({ length: 10 }, (_, i) => ({
      title: title || `Demo Book Title ${i + 1}`,
      author: author || `Demo Author ${i + 1}`,
      genre: genre || ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi'][Math.floor(Math.random() * 5)],
      year: 2000 + Math.floor(Math.random() * 24),
      isbn: `978-${Math.floor(Math.random() * 10000000000)}`,
      description: `This is a demo book description. Real book data would require book API integration.`,
      rating: (Math.random() * 2 + 3).toFixed(1),
      pages: Math.floor(Math.random() * 500 + 200),
      cover: `https://picsum.photos/seed/book${i}/200/300.jpg`
    }));
    
    const data = {
      success: true,
      search: { title, author, genre },
      books: books,
      total: books.length,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is demo data. Real book search requires Google Books API or similar.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search books',
      message: error.message
    });
  }
});

app.get('/search/recipe', cacheMiddleware, async (req, res) => {
  try {
    const { ingredients, cuisine } = req.query;
    
    // Mock recipe search results
    const recipes = Array.from({ length: 10 }, (_, i) => ({
      title: `Demo ${cuisine || 'International'} Recipe ${i + 1}`,
      description: `A delicious ${cuisine || 'international'} dish featuring ${ingredients || 'fresh ingredients'}`,
      ingredients: ingredients ? [ingredients, 'salt', 'pepper', 'oil', 'herbs'] : ['flour', 'eggs', 'milk', 'sugar'],
      instructions: `1. Mix ingredients\
2. Cook thoroughly\
3. Serve hot\
\
Real recipes would require recipe API integration.`,
      prepTime: `${Math.floor(Math.random() * 30 + 10)} minutes`,
      cookTime: `${Math.floor(Math.random() * 60 + 20)} minutes`,
      servings: Math.floor(Math.random() * 4 + 2),
      difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)],
      cuisine: cuisine || 'International',
      image: `https://picsum.photos/seed/recipe${i}/400/300.jpg`
    }));
    
    const data = {
      success: true,
      search: { ingredients, cuisine },
      recipes: recipes,
      total: recipes.length,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is demo data. Real recipes require recipe API integration.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search recipes',
      message: error.message
    });
  }
});

app.get('/search/product', cacheMiddleware, async (req, res) => {
  try {
    const { query, category, priceRange } = req.query;
    
    // Parse price range
    let minPrice = 0, maxPrice = 1000;
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(p => parseInt(p));
      if (!isNaN(min)) minPrice = min;
      if (!isNaN(max)) maxPrice = max;
    }
    
    // Mock product search results
    const products = Array.from({ length: 10 }, (_, i) => {
      const price = Math.random() * (maxPrice - minPrice) + minPrice;
      return {
        id: `prod${i + 1}`,
        name: query ? `Demo ${query} Product ${i + 1}` : `Demo Product ${i + 1}`,
        description: `This is a demo product description for ${query || 'items'}. Real products would require e-commerce API integration.`,
        price: parseFloat(price.toFixed(2)),
        currency: 'USD',
        category: category || 'General',
        brand: `Demo Brand ${i + 1}`,
        rating: (Math.random() * 2 + 3).toFixed(1),
        reviews: Math.floor(Math.random() * 1000),
        inStock: Math.random() > 0.2,
        image: `https://picsum.photos/seed/product${i}/300/300.jpg`,
        url: `https://demo-shop.com/product/${i + 1}`
      };
    });
    
    const data = {
      success: true,
      search: { query, category, priceRange: `$${minPrice}-$${maxPrice}` },
      products: products,
      total: products.length,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is demo data. Real products require e-commerce API integration.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search products',
      message: error.message
    });
  }
});

app.get('/search/meme', cacheMiddleware, async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    
    // Mock meme search results
    const memes = Array.from({ length: Math.min(parseInt(limit), 20) }, (_, i) => ({
      id: `meme${i + 1}`,
      name: `Demo ${category || 'General'} Meme ${i + 1}`,
      url: `https://img.memecdn.com/demo${i + 1}.jpg`,
      caption: `This is a demo meme caption for ${category || 'general'} memes. Real memes would require meme API integration.`,
      category: category || 'general',
      upvotes: Math.floor(Math.random() * 10000),
      comments: Math.floor(Math.random() * 1000),
      created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
    
    const data = {
      success: true,
      category: category || 'all',
      memes: memes,
      total: memes.length,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is demo data. Real memes require meme API integration.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search memes',
      message: error.message
    });
  }
});

// ============================================
// DOWNLOAD APIS (8 endpoints)
// ============================================

app.get('/download/ytmp3', cacheMiddleware, async (req, res) => {
  try {
    const { url, quality = 'high' } = req.query;
    
    if (!url || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }
    
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid YouTube URL'
      });
    }
    
    // Mock YouTube MP3 download response
    const data = {
      success: true,
      url: url,
      downloadUrl: `https://demo-download.com/audio/${Math.random().toString(36).substring(2)}.mp3`,
      title: 'Demo YouTube Video Title',
      artist: 'Demo Channel',
      duration: '3:45',
      quality: quality,
      size: quality === 'high' ? '8.5 MB' : '3.2 MB',
      format: 'mp3',
      bitrate: quality === 'high' ? '320kbps' : '128kbps',
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is a demo download. Real YouTube download requires ytdl-core or similar.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process YouTube download',
      message: error.message
    });
  }
});

app.get('/download/ytmp4', cacheMiddleware, async (req, res) => {
  try {
    const { url, quality = '1080p' } = req.query;
    
    if (!url || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }
    
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid YouTube URL'
      });
    }
    
    // Mock YouTube MP4 download response
    const data = {
      success: true,
      url: url,
      downloadUrl: `https://demo-download.com/video/${Math.random().toString(36).substring(2)}.mp4`,
      title: 'Demo YouTube Video Title',
      duration: '3:45',
      quality: quality,
      size: quality === '1080p' ? '125 MB' : quality === '720p' ? '65 MB' : '25 MB',
      format: 'mp4',
      resolution: quality,
      fps: 30,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is a demo download. Real YouTube download requires ytdl-core or similar.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process YouTube download',
      message: error.message
    });
  }
});

app.get('/download/instagram', cacheMiddleware, async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }
    
    if (!url.includes('instagram.com')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Instagram URL'
      });
    }
    
    // Mock Instagram download response
    const data = {
      success: true,
      url: url,
      downloadUrl: `https://demo-download.com/instagram/${Math.random().toString(36).substring(2)}.jpg`,
      mediaType: Math.random() > 0.5 ? 'image' : 'video',
      caption: 'Demo Instagram post caption',
      author: 'Demo Instagram User',
      likes: Math.floor(Math.random() * 10000),
      comments: Math.floor(Math.random() * 500),
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is a demo download. Real Instagram download requires specialized API.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process Instagram download',
      message: error.message
    });
  }
});

app.get('/download/tiktok', cacheMiddleware, async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }
    
    if (!url.includes('tiktok.com')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid TikTok URL'
      });
    }
    
    // Mock TikTok download response
    const data = {
      success: true,
      url: url,
      downloadUrl: `https://demo-download.com/tiktok/${Math.random().toString(36).substring(2)}.mp4`,
      description: 'Demo TikTok video description',
      author: 'Demo TikTok User',
      music: 'Demo TikTok Sound',
      views: Math.floor(Math.random() * 1000000),
      likes: Math.floor(Math.random() * 100000),
      shares: Math.floor(Math.random() * 10000),
      duration: '15s',
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is a demo download. Real TikTok download requires specialized API.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process TikTok download',
      message: error.message
    });
  }
});

app.get('/download/facebook', cacheMiddleware, async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }
    
    if (!url.includes('facebook.com')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Facebook URL'
      });
    }
    
    // Mock Facebook download response
    const data = {
      success: true,
      url: url,
      downloadUrl: `https://demo-download.com/facebook/${Math.random().toString(36).substring(2)}.mp4`,
      description: 'Demo Facebook video description',
      author: 'Demo Facebook Page',
      views: Math.floor(Math.random() * 500000),
      reactions: Math.floor(Math.random() * 10000),
      shares: Math.floor(Math.random() * 1000),
      duration: '2:30',
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is a demo download. Real Facebook download requires specialized API.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process Facebook download',
      message: error.message
    });
  }
});

app.get('/download/twitter', cacheMiddleware, async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }
    
    if (!url.includes('twitter.com') && !url.includes('x.com')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Twitter/X URL'
      });
    }
    
    // Mock Twitter download response
    const data = {
      success: true,
      url: url,
      downloadUrl: `https://demo-download.com/twitter/${Math.random().toString(36).substring(2)}.mp4`,
      text: 'Demo Twitter post text with #hashtags @mentions',
      author: 'Demo Twitter User',
      retweets: Math.floor(Math.random() * 1000),
      likes: Math.floor(Math.random() * 5000),
      replies: Math.floor(Math.random() * 500),
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is a demo download. Real Twitter download requires specialized API.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process Twitter download',
      message: error.message
    });
  }
});

app.get('/download/soundcloud', cacheMiddleware, async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }
    
    if (!url.includes('soundcloud.com')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid SoundCloud URL'
      });
    }
    
    // Mock SoundCloud download response
    const data = {
      success: true,
      url: url,
      downloadUrl: `https://demo-download.com/soundcloud/${Math.random().toString(36).substring(2)}.mp3`,
      title: 'Demo SoundCloud Track',
      artist: 'Demo SoundCloud Artist',
      genre: 'Electronic',
      duration: '4:20',
      plays: Math.floor(Math.random() * 100000),
      likes: Math.floor(Math.random() * 10000),
      reposts: Math.floor(Math.random() * 1000),
      quality: '128kbps',
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is a demo download. Real SoundCloud download requires specialized API.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process SoundCloud download',
      message: error.message
    });
  }
});

app.get('/download/spotify', cacheMiddleware, async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }
    
    if (!url.includes('open.spotify.com')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Spotify URL'
      });
    }
    
    // Mock Spotify download response
    const data = {
      success: true,
      url: url,
      downloadUrl: `https://demo-download.com/spotify/${Math.random().toString(36).substring(2)}.mp3`,
      title: 'Demo Spotify Track',
      artist: 'Demo Spotify Artist',
      album: 'Demo Spotify Album',
      duration: '3:30',
      popularity: Math.floor(Math.random() * 100),
      danceability: (Math.random()).toFixed(2),
      energy: (Math.random()).toFixed(2),
      valence: (Math.random()).toFixed(2),
      quality: '320kbps',
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is a demo download. Real Spotify download requires Spotify API and conversion.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process Spotify download',
      message: error.message
    });
  }
});

// ============================================
// IMAGE APIS (5 endpoints)
// ============================================

app.get('/image/resize', cacheMiddleware, async (req, res) => {
  try {
    const { url, width, height } = req.query;
    
    if (!url || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }
    
    if (!width || !height) {
      return res.status(400).json({
        success: false,
        error: 'Parameters "width" and "height" are required'
      });
    }
    
    const resizedUrl = `https://picsum.photos/${width}/${height}?random=${Math.random()}`;
    
    const data = {
      success: true,
      original: {
        url: url,
        size: 'Original size would be detected with image processing'
      },
      resized: {
        url: resizedUrl,
        width: parseInt(width),
        height: parseInt(height),
        size: `${Math.floor(parseInt(width) * parseInt(height) / 1000)} KB (estimated)`
      },
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is a demo resize. Real image resizing requires sharp or jimp library.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to resize image',
      message: error.message
    });
  }
});

app.get('/image/convert', cacheMiddleware, async (req, res) => {
  try {
    const { url, format } = req.query;
    
    if (!url || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }
    
    if (!format) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "format" is required'
      });
    }
    
    const validFormats = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'];
    if (!validFormats.includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid format. Supported formats: ${validFormats.join(', ')}`
      });
    }
    
    const convertedUrl = `https://picsum.photos/400/300?random=${Math.random()}.${format}`;
    
    const data = {
      success: true,
      original: {
        url: url,
        format: 'detected format would go here'
      },
      converted: {
        url: convertedUrl,
        format: format.toLowerCase(),
        size: 'Converted size would be calculated'
      },
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is a demo conversion. Real image conversion requires sharp or jimp library.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to convert image',
      message: error.message
    });
  }
});

app.get('/image/compress', cacheMiddleware, async (req, res) => {
  try {
    const { url, quality = '80' } = req.query;
    
    if (!url || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }
    
    const qualityNum = parseInt(quality);
    if (isNaN(qualityNum) || qualityNum < 1 || qualityNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Quality must be a number between 1 and 100'
      });
    }
    
    const originalSize = Math.floor(Math.random() * 5000 + 1000);
    const compressedSize = Math.floor(originalSize * (qualityNum / 100));
    const savings = originalSize - compressedSize;
    
    const data = {
      success: true,
      original: {
        url: url,
        size: `${originalSize} KB`,
        estimatedPixels: '1920x1080'
      },
      compressed: {
        url: `https://picsum.photos/400/300?random=${Math.random()}`,
        size: `${compressedSize} KB`,
        quality: `${qualityNum}%`,
        compressionRatio: `${((savings / originalSize) * 100).toFixed(1)}% smaller`
      },
      savings: `${savings} KB (${((savings / originalSize) * 100).toFixed(1)}%)`,
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is a demo compression. Real compression requires sharp or imagemin library.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to compress image',
      message: error.message
    });
  }
});

app.get('/image/filter', cacheMiddleware, async (req, res) => {
  try {
    const { url, filter } = req.query;
    
    if (!url || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }
    
    if (!filter) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "filter" is required'
      });
    }
    
    const validFilters = ['grayscale', 'sepia', 'blur', 'sharpen', 'brightness', 'contrast', 'vintage', 'cold', 'warm'];
    if (!validFilters.includes(filter.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid filter. Supported filters: ${validFilters.join(', ')}`
      });
    }
    
    const filteredUrl = `https://picsum.photos/400/300?random=${Math.random()}`;
    
    const data = {
      success: true,
      original: {
        url: url
      },
      filtered: {
        url: filteredUrl,
        filter: filter.toLowerCase(),
        intensity: '100%'
      },
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is a demo filter. Real filters require canvas, sharp, or image processing library.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to apply filter',
      message: error.message
    });
  }
});

app.get('/image/metadata', cacheMiddleware, async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "url" is required'
      });
    }
    
    // Mock image metadata extraction
    const data = {
      success: true,
      url: url,
      metadata: {
        format: 'JPEG',
        dimensions: {
          width: 1920,
          height: 1080
        },
        fileSize: '2.4 MB',
        colorSpace: 'RGB',
        hasAlpha: false,
        orientation: 1,
        density: {
          x: 72,
          y: 72
        },
        exif: {
          make: 'Demo Camera',
          model: 'Demo Model',
          dateTime: new Date().toISOString(),
          gps: null,
          flash: false
        },
        colorProfile: 'sRGB',
        compression: 'JPEG',
        quality: '85%'
      },
      timestamp: new Date().toISOString(),
      premium: true,
      free: true,
      note: 'This is demo metadata. Real metadata extraction requires sharp or exif-reader library.'
    };
    
    setCache(req.originalUrl, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to extract metadata',
      message: error.message
    });
  }
});

// ============================================
// SYSTEM APIS
// ============================================

app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: 'Active',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    server: {
      ...API_CONFIG,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cachedEndpoints: cache.size,
      version: process.version,
      platform: process.platform
    },
    features: {
      rateLimit: '15 minutes / 100 requests',
      cache: '5 minutes TTL',
      security: 'Security headers enabled',
      endpoints: 65,
      premium_features: 'All FREE',
      no_api_key: true,
      commercial_use: true
    },
    premium: {
      all_features_free: true,
      no_subscription_required: true,
      unlimited_requests: true,
      commercial_use_allowed: true
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    premium: 'All features are FREE!',
    endpoints: '65+ APIs Available'
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
    message: 'Please check the API documentation at "/"',
    availableEndpoints: [
      '/ai/chatgpt', '/ai/texttoimg', '/ai/writer', '/ai/translate', '/ai/summarize',
      '/ai/sentiment', '/ai/grammar', '/ai/keyword',
      '/business/email-validator', '/business/phone-validator', '/business/color-palette',
      '/dev/json-formatter', '/dev/base64-encoder', '/dev/uuid-generator',
      '/social/twitter-screenshot', '/social/instagram-downloader',
      '/data/currency-converter', '/data/weather',
      '/music/shazam', '/music/lyrics', '/music/spotify', '/music/youtube', '/music/playlist',
      '/tools/tinyurl', '/tools/qr-code', '/tools/password', '/tools/hash', '/tools/timestamp',
      '/tools/calculator', '/tools/units', '/tools/ascii', '/tools/morse', '/tools/roman',
      '/random/anime', '/random/movie', '/random/quote', '/random/joke', '/random/fact',
      '/random/word', '/random/color', '/random/number',
      '/search/youtube', '/search/google', '/search/image', '/search/news', '/search/book',
      '/search/recipe', '/search/product', '/search/meme',
      '/download/ytmp3', '/download/ytmp4', '/download/instagram', '/download/tiktok',
      '/download/facebook', '/download/twitter', '/download/soundcloud', '/download/spotify',
      '/image/resize', '/image/convert', '/image/compress', '/image/filter', '/image/metadata',
      '/api/info', '/api/status', '/health'
    ]
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551   \ud83d\udc1e Ladybug API v2.2.0 - PREMIUM     \u2551
\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563
\u2551  Port: ${PORT}                       
\u2551  Status: Active                        \u2551
\u2551  Endpoints: 65 (ALL FREE)              \u2551
\u2551  Security: Enabled                     \u2551
\u2551  Cache: Enabled                        \u2551
\u2551  Rate Limit: 100/15min                 \u2551
\u2551  Premium Features: 100% FREE           \u2551
\u2551  Commercial Use: ALLOWED               \u2551
\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d

\ud83d\ude80 PREMIUM FEATURES - ALL FREE:
\u2022 Advanced AI APIs (8 endpoints)
\u2022 Business Tools (3 endpoints) 
\u2022 Developer Tools (3 endpoints)
\u2022 Social Media Tools (2 endpoints)
\u2022 Data APIs (2 endpoints)
\u2022 Music APIs (5 endpoints)
\u2022 Tools APIs (10 endpoints)
\u2022 Random APIs (8 endpoints)
\u2022 Search APIs (8 endpoints)
\u2022 Download APIs (8 endpoints)
\u2022 Image APIs (5 endpoints)
\u2022 System APIs (3 endpoints)

\ud83d\udc9d All Premium Features are COMPLETELY FREE!
\ud83d\udcf1 WhatsApp: +263 71 845 6744
\ud83c\udf10 Official: ntandostore.zone.id
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  cache.clear();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  cache.clear();
  process.exit(0);
});
