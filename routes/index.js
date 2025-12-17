/**
 * Main Routes
 * ===========
 * Public pages with SEO optimization
 */

const express = require('express');
const router = express.Router();
const { webPageSchema, organizationSchema } = require('../middleware/seoMiddleware');

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const SITE_NAME = process.env.SITE_NAME || 'SEO Express';

/**
 * Home Page
 */
router.get('/', (req, res) => {
    // Set SEO data
    res.setSEO({
        title: `${SITE_NAME} - SEO-Optimized Express.js Boilerplate`,
        description: 'Build fast, secure, and SEO-friendly web applications with our Express.js boilerplate. Features include helmet, rate-limiting, compression, and more.',
        keywords: 'expressjs, seo, nodejs, web development, security, performance',
        ogImage: `${SITE_URL}/images/og-home.jpg`,
    });

    // Set JSON-LD structured data
    res.setJsonLd([
        organizationSchema({
            name: SITE_NAME,
            url: SITE_URL,
            socialLinks: [
                'https://twitter.com/yourhandle',
                'https://github.com/yourhandle',
            ],
        }),
        webPageSchema({
            title: SITE_NAME,
            description: 'Build fast, secure, and SEO-friendly web applications',
            url: SITE_URL,
        }),
    ]);

    res.render('pages/home', {
        title: `${SITE_NAME} - SEO-Optimized Express.js Boilerplate`,
    });
});

/**
 * About Page
 */
router.get('/about', (req, res) => {
    res.setSEO({
        title: `About Us - ${SITE_NAME}`,
        description: 'Learn about our mission to make web development faster, more secure, and SEO-friendly.',
        keywords: 'about, team, mission, expressjs',
    });

    res.setJsonLd(webPageSchema({
        title: `About Us - ${SITE_NAME}`,
        description: 'Learn about our mission',
        url: `${SITE_URL}/about`,
        breadcrumbs: [
            { name: 'Home', url: SITE_URL },
            { name: 'About', url: `${SITE_URL}/about` },
        ],
    }));

    res.render('pages/about', {
        title: `About Us - ${SITE_NAME}`,
    });
});

/**
 * Services Page
 */
router.get('/services', (req, res) => {
    res.setSEO({
        title: `Our Services - ${SITE_NAME}`,
        description: 'Explore our comprehensive web development services including SEO optimization, security implementation, and performance tuning.',
        keywords: 'services, web development, seo, security, performance',
    });

    res.render('pages/services', {
        title: `Our Services - ${SITE_NAME}`,
    });
});

/**
 * Contact Page
 */
router.get('/contact', (req, res) => {
    res.setSEO({
        title: `Contact Us - ${SITE_NAME}`,
        description: 'Get in touch with our team. We are here to help you build amazing web applications.',
        keywords: 'contact, support, help',
    });

    res.render('pages/contact', {
        title: `Contact Us - ${SITE_NAME}`,
    });
});

/**
 * Blog Listing
 */
router.get('/blog', (req, res) => {
    res.setSEO({
        title: `Blog - ${SITE_NAME}`,
        description: 'Read our latest articles about web development, SEO, security, and performance optimization.',
        keywords: 'blog, articles, tutorials, web development',
    });

    // Sample blog posts (replace with database query)
    const posts = [
        {
            slug: 'getting-started-with-seo',
            title: 'Getting Started with SEO in Express.js',
            excerpt: 'Learn the basics of implementing SEO in your Express.js applications.',
            date: '2024-12-15',
            image: '/images/blog/seo-basics.jpg',
        },
        {
            slug: 'security-best-practices',
            title: 'Security Best Practices for Node.js',
            excerpt: 'Protect your application with these essential security measures.',
            date: '2024-12-10',
            image: '/images/blog/security.jpg',
        },
    ];

    res.render('pages/blog', {
        title: `Blog - ${SITE_NAME}`,
        posts,
    });
});

/**
 * Privacy Policy
 */
router.get('/privacy-policy', (req, res) => {
    res.setSEO({
        title: `Privacy Policy - ${SITE_NAME}`,
        description: 'Read our privacy policy to understand how we collect, use, and protect your data.',
        robots: 'noindex, follow', // Don't index policy pages
    });

    res.render('pages/privacy', {
        title: `Privacy Policy - ${SITE_NAME}`,
    });
});

/**
 * Terms of Service
 */
router.get('/terms-of-service', (req, res) => {
    res.setSEO({
        title: `Terms of Service - ${SITE_NAME}`,
        description: 'Read our terms of service to understand the rules and regulations for using our platform.',
        robots: 'noindex, follow',
    });

    res.render('pages/terms', {
        title: `Terms of Service - ${SITE_NAME}`,
    });
});

/**
 * Documentation Page
 */
router.get('/docs', (req, res) => {
    res.setSEO({
        title: `Documentation - ${SITE_NAME}`,
        description: 'Comprehensive documentation for the SEO Express boilerplate. Learn how to get started, configure, and deploy your application.',
        keywords: 'documentation, docs, guide, tutorial, expressjs',
    });

    res.render('pages/docs', {
        title: `Documentation - ${SITE_NAME}`,
    });
});

module.exports = router;
