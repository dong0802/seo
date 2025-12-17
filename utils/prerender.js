/**
 * Prerender Utility
 * =================
 * Generate static HTML files from EJS templates for faster serving
 */

const ejs = require('ejs');
const fs = require('fs').promises;
const path = require('path');
const { minify } = require('html-minifier-terser');

const VIEWS_DIR = path.join(__dirname, '../views');
const OUTPUT_DIR = path.join(__dirname, '../public/prerendered');

// Default data for prerendering
const defaultData = {
    seo: {
        canonical: 'http://localhost:3000',
        siteName: 'SEO Express',
        siteUrl: 'http://localhost:3000',
        title: 'SEO Express',
        description: 'A SEO-optimized Express.js application',
        keywords: '',
        author: '',
        robots: 'index, follow',
        ogType: 'website',
        ogImage: 'http://localhost:3000/images/og-default.jpg',
        twitterCard: 'summary_large_image',
        twitterSite: '',
        alternates: [],
        jsonLd: null,
    },
    csrfToken: '',
};

// Minify options
const minifyOptions = {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true,
};

/**
 * Pages to prerender
 */
const pagesToPrerender = [
    {
        template: 'pages/home',
        output: 'index.html',
        data: {
            title: 'SEO Express - Home',
        },
    },
    {
        template: 'pages/about',
        output: 'about.html',
        data: {
            title: 'About Us - SEO Express',
        },
    },
    {
        template: 'pages/services',
        output: 'services.html',
        data: {
            title: 'Our Services - SEO Express',
        },
    },
    {
        template: 'pages/privacy',
        output: 'privacy-policy.html',
        data: {
            title: 'Privacy Policy - SEO Express',
        },
    },
    {
        template: 'pages/terms',
        output: 'terms-of-service.html',
        data: {
            title: 'Terms of Service - SEO Express',
        },
    },
];

/**
 * Render a single page
 */
const renderPage = async (template, data = {}) => {
    const templatePath = path.join(VIEWS_DIR, `${template}.ejs`);
    const mergedData = {
        ...defaultData,
        ...data,
        seo: { ...defaultData.seo, ...data.seo },
    };

    try {
        const html = await ejs.renderFile(templatePath, mergedData, {
            views: [VIEWS_DIR],
        });
        return html;
    } catch (error) {
        console.error(`[Render Error] ${template}:`, error);
        throw error;
    }
};

/**
 * Prerender all configured pages
 */
const prerenderAll = async (shouldMinify = true) => {
    console.log('🔄 Starting prerender...\n');

    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    for (const page of pagesToPrerender) {
        try {
            console.log(`📄 Rendering: ${page.template}`);

            let html = await renderPage(page.template, page.data);

            if (shouldMinify) {
                html = await minify(html, minifyOptions);
            }

            const outputPath = path.join(OUTPUT_DIR, page.output);
            await fs.writeFile(outputPath, html, 'utf-8');

            const size = (Buffer.byteLength(html, 'utf-8') / 1024).toFixed(2);
            console.log(`   ✅ Saved: ${page.output} (${size} KB)\n`);
        } catch (error) {
            console.error(`   ❌ Error: ${page.template}\n`, error);
        }
    }

    console.log('✨ Prerender complete!');
};

/**
 * Prerender middleware - serves prerendered files if available
 */
const prerenderMiddleware = (req, res, next) => {
    // Only for GET requests
    if (req.method !== 'GET') return next();

    // Skip for API routes
    if (req.path.startsWith('/api')) return next();

    // Map URL to file
    const urlToFile = {
        '/': 'index.html',
        '/about': 'about.html',
        '/services': 'services.html',
        '/privacy-policy': 'privacy-policy.html',
        '/terms-of-service': 'terms-of-service.html',
    };

    const fileName = urlToFile[req.path];
    if (!fileName) return next();

    const filePath = path.join(OUTPUT_DIR, fileName);

    res.sendFile(filePath, (err) => {
        if (err) {
            // File doesn't exist, fall through to dynamic rendering
            next();
        }
    });
};

module.exports = {
    renderPage,
    prerenderAll,
    prerenderMiddleware,
    pagesToPrerender,
};

// CLI support
if (require.main === module) {
    const args = process.argv.slice(2);
    const shouldMinify = !args.includes('--no-minify');
    prerenderAll(shouldMinify);
}
