// backend/src/middleware/sanitize.js

// ─── Request Body Size Limiter ─────────────────────────────────

export const bodySizeLimiter = (req, res, next) => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > MAX_SIZE) {
    return res.status(413).json({ 
      error: `Request body too large. Max ${MAX_SIZE / (1024 * 1024)} MB.` 
    });
  }
  next();
};

// ─── Query String Whitelist ────────────────────────────────────

export const sanitizeQuery = (req, res, next) => {
  const allowedParams = ['limit', 'offset', 'sort', 'order', 'search', 'filter'];
  for (const key in req.query) {
    if (!allowedParams.includes(key)) {
      delete req.query[key];
    }
  }
  next();
};

// ─── Prevent Parameter Pollution ──────────────────────────────

export const preventParamPollution = (req, res, next) => {
  for (const key in req.query) {
    if (Array.isArray(req.query[key])) {
      req.query[key] = req.query[key][0];
    }
  }
  next();
};

// ─── SQL Injection Warning (already handled by pg parameterization) ──
// We just log a warning if we detect suspicious patterns in raw queries.
// (But we don't have raw queries – we use parameterized queries.)