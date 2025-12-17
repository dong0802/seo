/**
 * CSRF Protection Middleware
 * ==========================
 * Protects against Cross-Site Request Forgery attacks.
 * Uses the double submit cookie pattern.
 */

const crypto = require('crypto');

// Token storage (in production, use Redis or similar)
const tokenStore = new Map();

// Cleanup expired tokens every hour
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of tokenStore.entries()) {
        if (now > data.expires) {
            tokenStore.delete(key);
        }
    }
}, 60 * 60 * 1000);

/**
 * Generate a secure random token
 */
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF Protection Middleware
 */
const csrfProtection = (req, res, next) => {
    // Skip for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        // Generate token for forms
        const token = generateToken();
        const sessionId = req.sessionID || req.cookies?.sessionId || generateToken();

        // Store token with session
        tokenStore.set(sessionId, {
            token,
            expires: Date.now() + (60 * 60 * 1000), // 1 hour
        });

        // Set token in cookie and make available to templates
        res.cookie('csrf-token', token, {
            httpOnly: false, // Must be readable by JS for AJAX
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        res.locals.csrfToken = token;
        return next();
    }

    // Validate token for state-changing requests
    const sessionId = req.sessionID || req.cookies?.sessionId;
    const tokenFromRequest =
        req.body?._csrf ||
        req.headers['x-csrf-token'] ||
        req.cookies?.['csrf-token'];

    if (!sessionId || !tokenFromRequest) {
        const error = new Error('CSRF token missing');
        error.statusCode = 403;
        error.code = 'EBADCSRFTOKEN';
        return next(error);
    }

    const storedData = tokenStore.get(sessionId);

    if (!storedData || storedData.token !== tokenFromRequest) {
        const error = new Error('Invalid CSRF token');
        error.statusCode = 403;
        error.code = 'EBADCSRFTOKEN';
        return next(error);
    }

    // Token is valid, generate new one for next request
    const newToken = generateToken();
    tokenStore.set(sessionId, {
        token: newToken,
        expires: Date.now() + (60 * 60 * 1000),
    });

    res.cookie('csrf-token', newToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000,
    });

    res.locals.csrfToken = newToken;
    next();
};

/**
 * CSRF Error Handler
 */
const csrfErrorHandler = (err, req, res, next) => {
    if (err.code !== 'EBADCSRFTOKEN') {
        return next(err);
    }

    // CSRF token error
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(403).json({
            status: 'error',
            message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
        });
    }

    res.status(403).render('errors/403', {
        title: 'Forbidden',
        message: 'Invalid security token. Please go back and try again.',
    });
};

module.exports = {
    csrfProtection,
    csrfErrorHandler,
    generateToken,
};
