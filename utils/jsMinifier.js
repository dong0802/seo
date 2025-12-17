/**
 * JavaScript Minifier Utility
 * ===========================
 * Uses Terser to minify JavaScript files for production
 */

const { minify } = require('terser');
const fs = require('fs').promises;
const path = require('path');

/**
 * Terser options for optimal minification
 */
const terserOptions = {
    compress: {
        dead_code: true,
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2,
    },
    mangle: {
        toplevel: true,
        safari10: true,
    },
    format: {
        comments: false,
    },
    sourceMap: false,
};

/**
 * Minify a JavaScript string
 */
const minifyJs = async (code) => {
    try {
        const result = await minify(code, terserOptions);
        return result.code;
    } catch (error) {
        console.error('[JS Minify Error]', error);
        return code;
    }
};

/**
 * Minify a JavaScript file
 */
const minifyJsFile = async (inputPath, outputPath = null) => {
    try {
        const code = await fs.readFile(inputPath, 'utf-8');
        const minified = await minifyJs(code);

        const outPath = outputPath || inputPath.replace('.js', '.min.js');
        await fs.writeFile(outPath, minified, 'utf-8');

        // Log size reduction
        const originalSize = Buffer.byteLength(code, 'utf-8');
        const minifiedSize = Buffer.byteLength(minified, 'utf-8');
        const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(1);

        console.log(`✅ Minified: ${path.basename(inputPath)}`);
        console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
        console.log(`   Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
        console.log(`   Reduction: ${reduction}%`);

        return outPath;
    } catch (error) {
        console.error(`[JS Minify Error] ${inputPath}:`, error);
        return null;
    }
};

/**
 * Minify all JS files in a directory
 */
const minifyDirectory = async (dirPath, recursive = true) => {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory() && recursive) {
                await minifyDirectory(fullPath, recursive);
            } else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.endsWith('.min.js')) {
                await minifyJsFile(fullPath);
            }
        }
    } catch (error) {
        console.error('[Directory Minify Error]', error);
    }
};

module.exports = {
    minifyJs,
    minifyJsFile,
    minifyDirectory,
    terserOptions,
};

// CLI support
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length > 0) {
        minifyJsFile(args[0], args[1]).then(() => {
            console.log('Done!');
        });
    } else {
        console.log('Usage: node jsMinifier.js <input.js> [output.min.js]');
    }
}
