/**
 * SEO Express - Main JavaScript
 * =============================
 * Performance-optimized, SEO-friendly JavaScript
 */

(function () {
    'use strict';

    // ==========================================
    // Mobile Navigation
    // ==========================================
    const initMobileNav = () => {
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');

        if (!navToggle || !navMenu) return;

        navToggle.addEventListener('click', () => {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu on link click
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });

        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });
    };

    // ==========================================
    // Smooth Scroll
    // ==========================================
    const initSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Update URL without scrolling
                    history.pushState(null, null, targetId);
                }
            });
        });
    };

    // ==========================================
    // Lazy Loading Images
    // ==========================================
    const initLazyLoading = () => {
        if ('IntersectionObserver' in window) {
            const lazyImages = document.querySelectorAll('img[data-src]');

            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            document.querySelectorAll('img[data-src]').forEach(img => {
                img.src = img.dataset.src;
            });
        }
    };

    // ==========================================
    // Scroll Animations (AOS-like)
    // ==========================================
    const initScrollAnimations = () => {
        if ('IntersectionObserver' in window) {
            const animatedElements = document.querySelectorAll('[data-aos]');

            const animationObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const delay = entry.target.dataset.aosDelay || 0;
                        setTimeout(() => {
                            entry.target.classList.add('aos-animate');
                        }, delay);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            animatedElements.forEach(el => {
                el.classList.add('aos-init');
                animationObserver.observe(el);
            });
        }
    };

    // ==========================================
    // Form Handling
    // ==========================================
    const initForms = () => {
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                // Skip if form has data-no-ajax
                if (form.dataset.noAjax) return;

                e.preventDefault();

                const submitBtn = form.querySelector('[type="submit"]');
                const originalText = submitBtn.innerHTML;

                // Disable button and show loading
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner"></span> Sending...';

                try {
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());

                    const response = await fetch(form.action, {
                        method: form.method || 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': window.csrfToken || '',
                        },
                        body: JSON.stringify(data),
                    });

                    const result = await response.json();

                    if (result.status === 'success') {
                        showNotification('Success!', result.message || 'Form submitted successfully.', 'success');
                        form.reset();
                    } else {
                        showNotification('Error', result.message || 'Something went wrong.', 'error');
                    }
                } catch (error) {
                    console.error('Form submission error:', error);
                    showNotification('Error', 'Failed to submit form. Please try again.', 'error');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            });
        });
    };

    // ==========================================
    // Notification System
    // ==========================================
    const showNotification = (title, message, type = 'info') => {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <strong>${title}</strong>
                <p>${message}</p>
            </div>
            <button class="notification-close" aria-label="Close notification">&times;</button>
        `;

        // Add styles if not present
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    max-width: 400px;
                    padding: 16px 20px;
                    background: #fff;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    z-index: 9999;
                    animation: slideIn 0.3s ease;
                    border-left: 4px solid #667eea;
                }
                .notification-success { border-left-color: #10b981; }
                .notification-error { border-left-color: #ef4444; }
                .notification-warning { border-left-color: #f59e0b; }
                .notification-content { flex: 1; }
                .notification-content strong { display: block; margin-bottom: 4px; }
                .notification-content p { margin: 0; color: #64748b; font-size: 14px; }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #94a3b8;
                    padding: 0;
                    line-height: 1;
                }
                .notification-close:hover { color: #475569; }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        });

        // Auto close after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    };

    // ==========================================
    // Header Scroll Effect
    // ==========================================
    const initHeaderScroll = () => {
        const header = document.querySelector('.header');
        if (!header) return;

        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            if (currentScroll > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Hide header on scroll down, show on scroll up
            if (currentScroll > lastScroll && currentScroll > 200) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }

            lastScroll = currentScroll;
        }, { passive: true });
    };

    // ==========================================
    // Back to Top Button
    // ==========================================
    const initBackToTop = () => {
        const button = document.createElement('button');
        button.className = 'back-to-top';
        button.innerHTML = '↑';
        button.setAttribute('aria-label', 'Back to top');

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            .back-to-top {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 50%;
                font-size: 20px;
                cursor: pointer;
                opacity: 0;
                visibility: hidden;
                transform: translateY(20px);
                transition: all 0.3s ease;
                z-index: 1000;
                box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
            }
            .back-to-top.visible {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            .back-to-top:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 30px rgba(102, 126, 234, 0.5);
            }
        `;
        document.head.appendChild(styles);
        document.body.appendChild(button);

        // Show/hide based on scroll
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 500) {
                button.classList.add('visible');
            } else {
                button.classList.remove('visible');
            }
        }, { passive: true });

        // Scroll to top on click
        button.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    };

    // ==========================================
    // Performance: Defer non-critical resources
    // ==========================================
    const deferNonCritical = () => {
        // Load Google Fonts after page load
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                document.body.classList.add('fonts-loaded');
            });
        }
    };

    // ==========================================
    // Initialize Everything
    // ==========================================
    const init = () => {
        initMobileNav();
        initSmoothScroll();
        initLazyLoading();
        initScrollAnimations();
        initForms();
        initHeaderScroll();
        initBackToTop();
        deferNonCritical();

        console.log('🚀 SEO Express initialized!');
    };

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose notification globally
    window.showNotification = showNotification;
})();
