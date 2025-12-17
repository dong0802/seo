/**
 * MongoDB Sanitization Middleware
 * ==============================
 * Prevents MongoDB Operator Injection by sanitizing request data.
 * Compatible with Express 5.x (mutates objects in-place instead of reassignment).
 */

/**
 * Sanitize a value recursively
 * @param {any} value - The value to sanitize
 * @param {string} replaceWith - Character to replace forbidden characters with
 * @param {function} onSanitize - Callback when a key is sanitized
 * @param {object} req - Request object (for logging)
 * @returns {any} - Sanitized value
 */
const clean = (value, replaceWith = '_', onSanitize = null, req = null) => {
    if (!value || typeof value !== 'object') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(v => clean(v, replaceWith, onSanitize, req));
    }

    // Process object keys
    for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            let newKey = key;
            let keyChanged = false;

            // Check for forbidden characters ($ and .)
            if (key.startsWith('$') || key.includes('.')) {
                newKey = key.replace(/^\$|\./g, replaceWith);
                keyChanged = true;

                // Invoke callback if provided
                if (onSanitize && typeof onSanitize === 'function') {
                    onSanitize({ req, key });
                }
            }

            // Recursively clean the value
            const cleanedValue = clean(value[key], replaceWith, onSanitize, req);

            // If key changed, delete old key and assign new key
            if (keyChanged) {
                delete value[key];
                value[newKey] = cleanedValue;
            } else if (value[key] !== cleanedValue) {
                // If value changed but key didn't (e.g. nested object cleaned), update it
                value[key] = cleanedValue;
            }
        }
    }

    return value;
};

/**
 * Middleware factory
 */
const mongoSanitize = ({ replaceWith = '_', onSanitize = null } = {}) => {
    return (req, res, next) => {
        if (req.body) {
            clean(req.body, replaceWith, onSanitize, req);
        }
        if (req.query) {
            clean(req.query, replaceWith, onSanitize, req);
        }
        if (req.params) {
            clean(req.params, replaceWith, onSanitize, req);
        }
        next();
    };
};

module.exports = mongoSanitize;
