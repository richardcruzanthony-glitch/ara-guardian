import express from 'express';
import helmet from 'helmet';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'"]
    }
  }
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 
    (process.env.NODE_ENV === 'production' 
      ? (() => { throw new Error('SESSION_SECRET is required in production'); })() 
      : 'dev-session-secret-change-in-production'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
    sameSite: 'strict', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Simple CSRF protection middleware using double-submit cookie pattern
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests (they should be safe)
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  // Get CSRF token from session
  const sessionToken = req.session?.csrfToken;
  
  // Get CSRF token from request (header or body)
  const requestToken = req.headers['x-csrf-token'] || req.body?._csrf;
  
  // Validate token
  if (!sessionToken || !requestToken || sessionToken !== requestToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  next();
};

// Generate CSRF token for session
app.use((req, res, next) => {
  if (req.session && !req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// CSRF token endpoint
app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.session.csrfToken });
});

// Demo login endpoint (for development/testing only)
// Disabled in production for security
app.post('/login', csrfProtection, (req, res) => {
  if (process.env.NODE_ENV === 'production' && !process.env.DEMO_PASSWORD) {
    return res.status(403).json({ 
      success: false, 
      message: 'Demo login is disabled in production. Use proper authentication.' 
    });
  }
  
  const { password } = req.body;
  
  // In production, use proper authentication
  const demoPassword = process.env.DEMO_PASSWORD;
  
  if (!demoPassword) {
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication not configured' 
    });
  }
  
  if (password === demoPassword) {
    req.session.authenticated = true;
    req.session.userId = 'demo-user';
    res.json({ success: true, message: 'Logged in successfully' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

// Logout endpoint
app.post('/logout', csrfProtection, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ success: false, message: 'Logout failed' });
    } else {
      res.json({ success: true, message: 'Logged out successfully' });
    }
  });
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Please login first.' });
  }
};

// Chat endpoint with session authentication
app.post('/api/chat', csrfProtection, requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    // Example: Call external API using server-side API key
    const chatApiKey = process.env.CHAT_API_KEY;
    
    if (!chatApiKey) {
      console.error('CHAT_API_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Example API call (replace with actual implementation)
    // For now, just echo back with a prefix
    const reply = `Echo from server (authenticated user ${req.session.userId}): ${message}`;
    
    res.json({ text: reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (!process.env.SESSION_SECRET) {
    console.warn('WARNING: Using default SESSION_SECRET. Set SESSION_SECRET in environment for production!');
  }
  if (!process.env.CHAT_API_KEY) {
    console.warn('WARNING: CHAT_API_KEY not set. Set CHAT_API_KEY in environment!');
  }
});
