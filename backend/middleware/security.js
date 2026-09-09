// backend/middleware/security.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss');

// ─── Rate Limiting ───────────────────────────────────────────────

// General API limiter
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests, please try again later.', status: 429 },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, please try again after 1 minute.', status: 429 },
});

// Password reset limiter
const passwordResetLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: { error: 'Too many password reset requests, please try again later.', status: 429 },
});

// API key limiter (if you use API keys)
const apiKeyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: { error: 'API rate limit exceeded.', status: 429 },
});

// ─── Security Headers (Helmet) ──────────────────────────────────

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.render.com"],
      connectSrc: ["'self'", "https://*.render.com", "https://api.openai.com", "https://api.groq.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

// ─── XSS Protection ─────────────────────────────────────────────

const xssProtection = (req, res, next) => {
  // Sanitize body, query, params
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = xss(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
};

// ─── IP Blocklist ──────────────────────────────────────────────

const blockedIPs = new Set([]); // populate with IPs to block
const ipBlocklist = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  if (blockedIPs.has(clientIP)) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  next();
};

// ─── Request Logger ────────────────────────────────────────────

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
    };
    if (res.statusCode >= 400) {
      console.warn('⚠️ Suspicious request:', logEntry);
    } else {
      console.log('📊 Request:', logEntry);
    }
  });
  next();
};

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  apiKeyLimiter,
  securityHeaders,
  xssProtection,
  ipBlocklist,
  requestLogger,
};