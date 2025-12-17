    /**
 * SEO-Optimized & Secure Express.js Application
 * ==============================================
 * 
 * Features:
 * - SEO: sitemap.xml, robots.txt, canonical links, mobile-first
 * - Performance: rate-limit, compression, html-minifier, caching
 * - Security: helmet, cors, mongo-sanitize, csrf, jwt, bcrypt
 */

require('dotenv').config();
const express = require('express');
const path = require('path');

// Security Modules
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('./middleware/mongoSanitizer');
const rateLimit = require('express-rate-limit');

// Performance Modules
const compression = require('compression');

// Session & Cookies
const cookieParser = require('cookie-parser');
const session = require('express-session');

// Custom Middleware
const { htmlMinifier } = require('./middleware/htmlMinifier');
const { seoMiddleware } = require('./middleware/seoMiddleware');
const { csrfProtection, csrfErrorHandler } = require('./middleware/csrfMiddleware');

// Routes
const indexRoutes = require('./routes/index');
const apiRoutes = require('./routes/api');
const seoRoutes = require('./routes/seo');
const authRoutes = require('./routes/auth');

const app = express();

// ===========================================
// SECURITY CONFIGURATION
// ===========================================

// Helmet - Security Headers (XSS, ClickJacking, etc.)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS Configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
    maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));

// Rate Limiting - Prevent DDoS/Brute Force
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        status: 429,
        error: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 login attempts per hour
    message: {
        status: 429,
        error: 'Too many login attempts, please try again after an hour.',
    },
});
app.use('/api/auth/login', authLimiter);

// ===========================================
// BODY PARSING & SIZE LIMITS
// ===========================================

// Parse JSON with size limit (IMPORTANT: Always limit body size!)
app.use(express.json({
    limit: '10kb' // Limit JSON body to 10KB
}));

// Parse URL-encoded with size limit
app.use(express.urlencoded({
    extended: true,
    limit: '10kb'
}));

// MongoDB Sanitization - Prevent NoSQL Injection
app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`[SECURITY] Sanitized key "${key}" in request from ${req.ip}`);
    }
}));

// Cookie Parser
app.use(cookieParser(process.env.COOKIE_SECRET || 'your-cookie-secret-key'));

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict',
    },
}));

// ===========================================
// PERFORMANCE OPTIMIZATION
// ===========================================

// Compression - GZIP all responses
app.use(compression({
    level: 6,
    threshold: 1024, // Only compress if size > 1KB
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
}));

// Static Files with Caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        // Set immutable for hashed files
        if (filePath.includes('.min.') || filePath.match(/\.[a-f0-9]{8}\./)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    },
}));

// ===========================================
// VIEW ENGINE & SEO
// ===========================================

// EJS Template Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// SEO Middleware - Adds canonical, meta tags
app.use(seoMiddleware);

// HTML Minifier (Production only)
if (process.env.NODE_ENV === 'production') {
    app.use(htmlMinifier);
}

// ===========================================
// CSRF PROTECTION (for forms)
// ===========================================

// Apply CSRF protection to non-API routes
app.use(/^(?!\/api).*$/, csrfProtection);

// ===========================================
// ROUTES
// ===========================================

// SEO Routes (sitemap.xml, robots.txt)
app.use('/', seoRoutes);

// Main Routes
app.use('/', indexRoutes);

// API Routes
app.use('/api', apiRoutes);

// Auth Routes
app.use('/api/auth', authRoutes);

// ===========================================
// ERROR HANDLING
// ===========================================

// CSRF Error Handler
app.use(csrfErrorHandler);

// 404 Handler
app.use((req, res, next) => {
    res.status(404).render('errors/404', {
        title: 'Page Not Found - 404',
        url: req.originalUrl,
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.stack);

    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Something went wrong!'
        : err.message;

    // API Error Response
    if (req.originalUrl.startsWith('/api')) {
        return res.status(statusCode).json({
            status: 'error',
            message,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
        });
    }

    // HTML Error Response
    res.status(statusCode).render('errors/500', {
        title: 'Server Error',
        message,
    });
});

// ===========================================
// SERVER START
// ===========================================

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 SEO-Express Server Started!                          ║
║                                                            ║
║   🌐 URL: http://${HOST}:${PORT}                            ║
║   📊 Environment: ${process.env.NODE_ENV || 'development'}                        ║
║                                                            ║
║   📁 Sitemap: http://${HOST}:${PORT}/sitemap.xml            ║
║   🤖 Robots: http://${HOST}:${PORT}/robots.txt              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
