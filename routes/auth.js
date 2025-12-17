/**
 * Authentication Routes
 * =====================
 * User registration, login, logout with security best practices
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { generateToken, authenticate } = require('../middleware/authMiddleware');

// In-memory user storage (replace with MongoDB in production)
const users = new Map();

// Password requirements
const PASSWORD_MIN_LENGTH = 8;
const SALT_ROUNDS = 12;

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate password strength
 */
const isValidPassword = (password) => {
    if (password.length < PASSWORD_MIN_LENGTH) {
        return { valid: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long` };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true };
};

/**
 * Register New User
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email and password are required',
            });
        }

        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email format',
            });
        }

        // Validate password strength
        const passwordValidation = isValidPassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                status: 'error',
                message: passwordValidation.message,
            });
        }

        // Check if user already exists
        if (users.has(email.toLowerCase())) {
            return res.status(409).json({
                status: 'error',
                message: 'An account with this email already exists',
            });
        }

        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user
        const userId = Date.now().toString();
        const user = {
            id: userId,
            email: email.toLowerCase(),
            password: hashedPassword,
            name: name || '',
            role: 'user',
            createdAt: new Date().toISOString(),
        };

        users.set(email.toLowerCase(), user);

        // Generate JWT token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
                token,
            },
        });
    } catch (error) {
        console.error('[Register Error]', error);
        res.status(500).json({
            status: 'error',
            message: 'Registration failed. Please try again.',
        });
    }
});

/**
 * Login User
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email and password are required',
            });
        }

        // Find user
        const user = users.get(email.toLowerCase());

        if (!user) {
            // Use same message to prevent email enumeration
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password',
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password',
            });
        }

        // Generate JWT token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
                token,
            },
        });
    } catch (error) {
        console.error('[Login Error]', error);
        res.status(500).json({
            status: 'error',
            message: 'Login failed. Please try again.',
        });
    }
});

/**
 * Logout User
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
    // Clear token cookie
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    res.json({
        status: 'success',
        message: 'Logged out successfully',
    });
});

/**
 * Get Current User
 * GET /api/auth/me
 */
router.get('/me', authenticate, (req, res) => {
    const user = users.get(req.user.email);

    if (!user) {
        return res.status(404).json({
            status: 'error',
            message: 'User not found',
        });
    }

    res.json({
        status: 'success',
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt,
            },
        },
    });
});

/**
 * Change Password
 * PUT /api/auth/password
 */
router.put('/password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                status: 'error',
                message: 'Current password and new password are required',
            });
        }

        // Validate new password strength
        const passwordValidation = isValidPassword(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                status: 'error',
                message: passwordValidation.message,
            });
        }

        // Get user
        const user = users.get(req.user.email);

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found',
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Current password is incorrect',
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Update password
        user.password = hashedPassword;
        users.set(req.user.email, user);

        res.json({
            status: 'success',
            message: 'Password changed successfully',
        });
    } catch (error) {
        console.error('[Change Password Error]', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to change password. Please try again.',
        });
    }
});

/**
 * Verify Token
 * GET /api/auth/verify
 */
router.get('/verify', authenticate, (req, res) => {
    res.json({
        status: 'success',
        message: 'Token is valid',
        data: {
            user: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role,
            },
        },
    });
});

module.exports = router;
