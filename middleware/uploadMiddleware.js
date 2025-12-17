/**
 * File Upload Middleware (Multer)
 * ================================
 * Secure file upload handling with:
 * - File type validation
 * - File size limits
 * - Secure filename generation
 */

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    all: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
};

// Max file sizes (in bytes)
const MAX_FILE_SIZES = {
    image: 5 * 1024 * 1024,     // 5MB
    document: 10 * 1024 * 1024, // 10MB
    default: 5 * 1024 * 1024,   // 5MB
};

/**
 * Generate secure filename
 */
const generateFilename = (originalname) => {
    const ext = path.extname(originalname).toLowerCase();
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `${timestamp}-${randomBytes}${ext}`;
};

/**
 * Storage configuration
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Organize by file type
        let subDir = 'misc';
        if (file.mimetype.startsWith('image/')) {
            subDir = 'images';
        } else if (file.mimetype.startsWith('application/')) {
            subDir = 'documents';
        }

        const destDir = path.join(uploadDir, subDir);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        cb(null, destDir);
    },
    filename: (req, file, cb) => {
        cb(null, generateFilename(file.originalname));
    },
});

/**
 * File filter function
 */
const createFileFilter = (allowedTypes) => {
    return (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            const error = new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
            error.statusCode = 400;
            cb(error, false);
        }
    };
};

/**
 * Create multer instance for images
 */
const uploadImage = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZES.image,
        files: 5, // Max 5 files at once
    },
    fileFilter: createFileFilter(ALLOWED_MIME_TYPES.images),
});

/**
 * Create multer instance for documents
 */
const uploadDocument = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZES.document,
        files: 3,
    },
    fileFilter: createFileFilter(ALLOWED_MIME_TYPES.documents),
});

/**
 * Create multer instance for any allowed file
 */
const uploadAny = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZES.default,
        files: 5,
    },
    fileFilter: createFileFilter(ALLOWED_MIME_TYPES.all),
});

/**
 * Error handler for multer
 */
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        let message = 'File upload error';

        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'File is too large. Maximum size allowed is 5MB.';
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Too many files. Maximum 5 files allowed.';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Unexpected field name for file upload.';
                break;
            default:
                message = err.message;
        }

        return res.status(400).json({
            status: 'error',
            message,
        });
    }

    if (err.statusCode === 400) {
        return res.status(400).json({
            status: 'error',
            message: err.message,
        });
    }

    next(err);
};

/**
 * Delete uploaded file
 */
const deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err && err.code !== 'ENOENT') {
                return reject(err);
            }
            resolve();
        });
    });
};

/**
 * Get file info
 */
const getFileInfo = (file) => ({
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path.replace(/\\/g, '/'),
    url: `/uploads/${file.destination.split('uploads')[1]}/${file.filename}`.replace(/\\/g, '/'),
});

module.exports = {
    uploadImage,
    uploadDocument,
    uploadAny,
    handleUploadError,
    deleteFile,
    getFileInfo,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZES,
};
