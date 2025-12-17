/**
 * Authentication Middleware
 * =========================
 * JWT-based authentication with:
 * - Token verification
 * - Role-based access control
 * - Token refresh handling
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token
 */
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'seo-express',
    });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Extract token from request
 */
const extractToken = (req) => {
    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Check cookies
    if (req.cookies?.token) {
        return req.cookies.token;
    }

    // Check query parameter (for special cases like password reset links)
    if (req.query?.token) {
        return req.query.token;
    }

    return null;
};

/**
 * Authentication middleware - requires valid JWT
 */
const authenticate = (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required. Please login.',
        });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid or expired token. Please login again.',
        });
    }

    // Attach user info to request
    req.user = decoded;
    next();
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = (req, res, next) => {
    const token = extractToken(req);

    if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
            req.user = decoded;
        }
    }

    next();
};

/**
 * Role-based access control middleware
 * Usage: authorize('admin', 'moderator')
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication required.',
            });
        }

        const userRole = req.user.role || 'user';

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have permission to perform this action.',
            });
        }

        next();
    };
};

/**
 * Refresh token middleware
 */
const refreshToken = (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });

        // Check if token expires within 1 hour
        const expiresIn = decoded.exp * 1000 - Date.now();
        const oneHour = 60 * 60 * 1000;

        if (expiresIn < oneHour && expiresIn > 0) {
            // Refresh token
            const newToken = generateToken({
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
            });

            // Set new token in cookie
            res.cookie('token', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            // Also include in response header for API clients
            res.setHeader('X-New-Token', newToken);
        }
    } catch (error) {
        // Token is invalid, continue without refresh
    }

    next();
};

/**
 * Check if user owns the resource
 */
const isOwner = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication required.',
            });
        }

        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

        // Admin can access any resource
        if (req.user.role === 'admin') {
            return next();
        }

        if (req.user.id !== resourceUserId) {
            return res.status(403).json({
                status: 'error',
                message: 'You can only access your own resources.',
            });
        }

        next();
    };
};

module.exports = {
    generateToken,
    verifyToken,
    extractToken,
    authenticate,
    optionalAuth,
    authorize,
    refreshToken,
    isOwner,
    JWT_SECRET,
    JWT_EXPIRES_IN,
};
