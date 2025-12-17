/**
 * SEO Middleware
 * ==============
 * Adds essential SEO headers and data to every response:
 * - Canonical URLs
 * - Alternate language links
 * - Open Graph meta data
 * - Twitter Card meta data
 * - JSON-LD structured data
 */

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const SITE_NAME = process.env.SITE_NAME || 'SEO Express';

/**
 * Generate canonical URL from request
 */
const getCanonicalUrl = (req) => {
    // Remove query parameters for canonical
    const pathWithoutQuery = req.originalUrl.split('?')[0];
    // Remove trailing slash (except for root)
    const cleanPath = pathWithoutQuery === '/' ? '/' : pathWithoutQuery.replace(/\/$/, '');
    return `${SITE_URL}${cleanPath}`;
};

/**
 * SEO Middleware - Adds SEO data to res.locals
 */
const seoMiddleware = (req, res, next) => {
    const canonical = getCanonicalUrl(req);

    // Default SEO data (can be overridden in routes)
    res.locals.seo = {
        canonical,
        siteName: SITE_NAME,
        siteUrl: SITE_URL,
        title: SITE_NAME,
        description: process.env.SITE_DESCRIPTION || 'A SEO-optimized Express.js application',
        keywords: '',
        author: '',
        robots: 'index, follow',
        ogType: 'website',
        ogImage: `${SITE_URL}/images/og-default.jpg`,
        twitterCard: 'summary_large_image',
        twitterSite: '',
        alternates: [],
        jsonLd: null,
    };

    // Helper function to set SEO data in routes
    res.setSEO = (data) => {
        res.locals.seo = { ...res.locals.seo, ...data };
    };

    // Helper to add JSON-LD structured data
    res.setJsonLd = (data) => {
        res.locals.seo.jsonLd = data;
    };

    // Helper to set alternate language links
    res.setAlternates = (alternates) => {
        res.locals.seo.alternates = alternates;
    };

    next();
};

/**
 * Generate JSON-LD for Organization
 */
const organizationSchema = (data = {}) => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name || SITE_NAME,
    url: data.url || SITE_URL,
    logo: data.logo || `${SITE_URL}/images/logo.png`,
    sameAs: data.socialLinks || [],
    contactPoint: data.contactPoint || {
        '@type': 'ContactPoint',
        telephone: '',
        contactType: 'customer service',
    },
});

/**
 * Generate JSON-LD for WebPage
 */
const webPageSchema = (data = {}) => ({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: data.title || SITE_NAME,
    description: data.description || '',
    url: data.url || SITE_URL,
    isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
    },
    ...(data.breadcrumbs && {
        breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: data.breadcrumbs.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                item: item.url,
            })),
        },
    }),
});

/**
 * Generate JSON-LD for Article
 */
const articleSchema = (data = {}) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title || '',
    description: data.description || '',
    image: data.image || '',
    author: {
        '@type': 'Person',
        name: data.author || '',
    },
    publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/images/logo.png`,
        },
    },
    datePublished: data.publishedAt || new Date().toISOString(),
    dateModified: data.updatedAt || new Date().toISOString(),
    mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': data.url || SITE_URL,
    },
});

/**
 * Generate JSON-LD for FAQ
 */
const faqSchema = (faqs = []) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
        },
    })),
});

/**
 * Generate JSON-LD for Product
 */
const productSchema = (data = {}) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name || '',
    description: data.description || '',
    image: data.image || '',
    brand: {
        '@type': 'Brand',
        name: data.brand || SITE_NAME,
    },
    offers: {
        '@type': 'Offer',
        price: data.price || 0,
        priceCurrency: data.currency || 'USD',
        availability: data.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: data.url || SITE_URL,
    },
    ...(data.rating && {
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: data.rating.value,
            reviewCount: data.rating.count,
        },
    }),
});

module.exports = {
    seoMiddleware,
    organizationSchema,
    webPageSchema,
    articleSchema,
    faqSchema,
    productSchema,
    getCanonicalUrl,
};
