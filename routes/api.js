/**
 * API Routes
 * ==========
 * RESTful API endpoints with security
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { uploadImage, handleUploadError, getFileInfo } = require('../middleware/uploadMiddleware');

/**
 * Health Check
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
    });
});

/**
 * API Info
 */
router.get('/', (req, res) => {
    res.json({
        name: 'SEO Express API',
        version: '1.0.0',
        documentation: '/api/docs',
        endpoints: {
            health: 'GET /api/health',
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                logout: 'POST /api/auth/logout',
                me: 'GET /api/auth/me',
            },
            users: {
                list: 'GET /api/users (admin only)',
                get: 'GET /api/users/:id',
                update: 'PUT /api/users/:id',
                delete: 'DELETE /api/users/:id',
            },
            upload: {
                image: 'POST /api/upload/image',
            },
        },
    });
});

// ============================================
// Protected Routes (require authentication)
// ============================================

/**
 * Get Current User Profile
 */
router.get('/me', authenticate, (req, res) => {
    res.json({
        status: 'success',
        data: {
            user: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role,
            },
        },
    });
});

/**
 * Upload Image
 */
router.post(
    '/upload/image',
    authenticate,
    uploadImage.single('image'),
    handleUploadError,
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No file uploaded',
            });
        }

        res.json({
            status: 'success',
            data: {
                file: getFileInfo(req.file),
            },
        });
    }
);

/**
 * Upload Multiple Images
 */
router.post(
    '/upload/images',
    authenticate,
    uploadImage.array('images', 5),
    handleUploadError,
    (req, res) => {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No files uploaded',
            });
        }

        res.json({
            status: 'success',
            data: {
                files: req.files.map(getFileInfo),
            },
        });
    }
);

// ============================================
// Admin Routes (require admin role)
// ============================================

/**
 * Get All Users (Admin Only)
 */
router.get('/users', authenticate, authorize('admin'), (req, res) => {
    // In real app, fetch from database
    res.json({
        status: 'success',
        data: {
            users: [
                { id: 1, email: 'admin@example.com', role: 'admin' },
                { id: 2, email: 'user@example.com', role: 'user' },
            ],
        },
    });
});

/**
 * Delete User (Admin Only)
 */
router.delete('/users/:id', authenticate, authorize('admin'), (req, res) => {
    const { id } = req.params;

    // In real app, delete from database
    res.json({
        status: 'success',
        message: `User ${id} deleted successfully`,
    });
});

// ============================================
// Example CRUD Endpoints
// ============================================

/**
 * Get Posts (Public)
 */
router.get('/posts', (req, res) => {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;

    // In real app, fetch from database with pagination
    res.json({
        status: 'success',
        data: {
            posts: [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: 0,
                pages: 0,
            },
        },
    });
});

/**
 * Get Single Post (Public)
 */
router.get('/posts/:slug', (req, res) => {
    const { slug } = req.params;

    // In real app, fetch from database
    res.json({
        status: 'success',
        data: {
            post: {
                slug,
                title: 'Sample Post',
                content: 'This is a sample post.',
                createdAt: new Date().toISOString(),
            },
        },
    });
});

/**
 * Create Post (Authenticated)
 */
router.post('/posts', authenticate, (req, res) => {
    const { title, content, excerpt } = req.body;

    if (!title || !content) {
        return res.status(400).json({
            status: 'error',
            message: 'Title and content are required',
        });
    }

    // In real app, save to database
    res.status(201).json({
        status: 'success',
        data: {
            post: {
                id: Date.now(),
                title,
                content,
                excerpt,
                author: req.user.id,
                createdAt: new Date().toISOString(),
            },
        },
    });
});

/**
 * Update Post (Authenticated + Owner)
 */
router.put('/posts/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const { title, content, excerpt } = req.body;

    // In real app, check ownership and update in database
    res.json({
        status: 'success',
        data: {
            post: {
                id,
                title,
                content,
                excerpt,
                updatedAt: new Date().toISOString(),
            },
        },
    });
});

/**
 * Delete Post (Authenticated + Owner/Admin)
 */
router.delete('/posts/:id', authenticate, (req, res) => {
    const { id } = req.params;

    // In real app, check ownership and delete from database
    res.json({
        status: 'success',
        message: `Post ${id} deleted successfully`,
    });
});

module.exports = router;
