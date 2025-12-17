# SEO Express

A production-ready, SEO-optimized, and secure Express.js boilerplate.

## ✨ Features

### 🔍 SEO Optimization
- **sitemap.xml** - Auto-generated XML sitemap
- **robots.txt** - Crawler rules with AI bot support
- **Canonical URLs** - Proper link canonicalization
- **Meta Tags** - Open Graph, Twitter Cards
- **JSON-LD** - Structured data support
- **Mobile-First** - Responsive design

### 🛡️ Security
- **Helmet.js** - Security headers (XSS, ClickJacking protection)
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - DDoS/brute force protection
- **CSRF Protection** - Cross-site request forgery prevention
- **MongoDB Sanitization** - NoSQL injection prevention
- **JWT Authentication** - Secure token-based auth
- **Bcrypt** - Password hashing
- **Body Size Limits** - Request payload limits
- **Multer** - Secure file uploads

### ⚡ Performance
- **GZIP Compression** - Response compression
- **HTML Minification** - Reduce HTML size
- **JS Minification** - Terser-based minification
- **Static File Caching** - Long-term caching
- **Prerendering** - Static HTML generation

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB (optional, for database features)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/seo-express.git
cd seo-express

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production server
npm start

# Generate prerendered HTML files
npm run prerender

# Minify JavaScript
npm run minify:js

# Full production build
npm run build
```

## 📁 Project Structure

```
seo-express/
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   ├── authMiddleware.js    # JWT authentication
│   ├── csrfMiddleware.js    # CSRF protection
│   ├── htmlMinifier.js      # HTML minification
│   ├── seoMiddleware.js     # SEO helpers
│   └── uploadMiddleware.js  # File upload handling
├── public/
│   ├── css/
│   │   └── style.css        # Main stylesheet
│   ├── js/
│   │   └── main.js          # Main JavaScript
│   └── images/              # Static images
├── routes/
│   ├── api.js               # API routes
│   ├── auth.js              # Authentication routes
│   ├── index.js             # Page routes
│   └── seo.js               # SEO routes (sitemap, robots)
├── utils/
│   ├── jsMinifier.js        # JS minification utility
│   └── prerender.js         # Prerendering utility
├── views/
│   ├── errors/              # Error pages
│   ├── layouts/             # Layout templates
│   ├── pages/               # Page templates
│   └── partials/            # Reusable partials
├── .env                     # Environment variables
├── .env.example             # Environment template
├── app.js                   # Main application
└── package.json
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `SITE_URL` | Your website URL | `http://localhost:3000` |
| `SITE_NAME` | Your site name | `SEO Express` |
| `JWT_SECRET` | JWT signing secret | - |
| `SESSION_SECRET` | Session secret | - |
| `MONGODB_URI` | MongoDB connection string | - |

### Security Recommendations for Production

1. **Always use HTTPS** in production
2. **Set strong secrets** for JWT and sessions
3. **Enable MongoDB authentication**
4. **Use environment-specific `.env` files**
5. **Set up Cloudflare** or similar CDN
6. **Configure rate limiting** appropriately

## 📊 SEO Endpoints

| Endpoint | Description |
|----------|-------------|
| `/robots.txt` | Crawler rules |
| `/sitemap.xml` | XML sitemap |
| `/manifest.json` | PWA manifest |
| `/.well-known/security.txt` | Security contact info |

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Change password

### Protected Routes
- `GET /api/me` - Get user profile
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images

### Admin Routes
- `GET /api/users` - List all users (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

## 📱 Mobile-First Design

The included CSS is built with a mobile-first approach:
- Responsive breakpoints at 480px, 768px, 1024px
- Touch-friendly UI elements
- PWA-ready manifest
- Optimized for Core Web Vitals

## 📄 License

MIT License - feel free to use for personal and commercial projects.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using Express.js
