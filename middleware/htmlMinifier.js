/**
 * HTML Minifier Middleware
 * ========================
 * Compresses HTML output by removing whitespace, comments, and unnecessary characters.
 * This significantly reduces page size and improves load times.
 */

const { minify } = require('html-minifier-terser');

const minifyOptions = {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true,
    minifyCSS: true,
    minifyJS: true,
    minifyURLs: true,
    removeEmptyAttributes: true,
    removeOptionalTags: false, // Keep for better compatibility
    sortAttributes: true,
    sortClassName: true,
};

/**
 * Express middleware to minify HTML responses
 */
const htmlMinifier = (req, res, next) => {
    // Store original render function
    const originalRender = res.render.bind(res);

    res.render = async (view, options, callback) => {
        originalRender(view, options, async (err, html) => {
            if (err) {
                return callback ? callback(err) : next(err);
            }

            try {
                // Minify the HTML
                const minifiedHtml = await minify(html, minifyOptions);

                // Set content type and send
                res.setHeader('Content-Type', 'text/html; charset=utf-8');

                if (callback) {
                    callback(null, minifiedHtml);
                } else {
                    res.send(minifiedHtml);
                }
            } catch (minifyError) {
                console.error('[HTML Minifier Error]', minifyError);
                // Fallback to non-minified HTML
                if (callback) {
                    callback(null, html);
                } else {
                    res.send(html);
                }
            }
        });
    };

    next();
};

/**
 * Minify HTML string directly
 * @param {string} html - HTML string to minify
 * @returns {Promise<string>} - Minified HTML
 */
const minifyHtml = async (html) => {
    try {
        return await minify(html, minifyOptions);
    } catch (error) {
        console.error('[HTML Minify Error]', error);
        return html;
    }
};

module.exports = {
    htmlMinifier,
    minifyHtml,
    minifyOptions,
};
