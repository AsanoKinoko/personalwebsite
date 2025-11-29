class Header {
    static async loadHeader() {
        try {
            const pathSegments = window.location.pathname.split('/');
            const repoName = pathSegments[1];
            const baseUrl = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
                ? ''
                : `/${repoName}`;
            //console.log('Current pathname:', window.location.pathname);
            //console.log('Base URL:', baseUrl);
            const response = await fetch(`${baseUrl}/components/header/header.html`);
            const html = await response.text();
            document.body.insertAdjacentHTML('afterbegin', html);
            
            // Add active class based on current page
            let currentPage = window.location.pathname.split('/').pop().split('.')[0].toLowerCase();
            if (currentPage === '' || currentPage === 'personalwebsite' || currentPage === 'index') {
                currentPage = 'home';
            }
            // Check if it's a service page (in my_services folder)
            const pathname = window.location.pathname.toLowerCase();
            if (pathname.includes('my_services') || pathname.includes('randompassword')) {
                currentPage = 'service';
            }
            // Check if it's LearningNote page
            if (currentPage === 'learningnote' || currentPage === 'learning-note') {
                currentPage = 'learningnote';
            }
            const navLinks = document.querySelectorAll('[data-nav]');
            navLinks.forEach(link => {
                if (link.dataset.nav === currentPage) {
                    link.classList.add('active');
                }
            });

            const headerEl = document.querySelector('.header');
            const backBtn = document.querySelector('.back-btn');
            if (backBtn) {
                const isLocal = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost');
                
                // Calculate relative path to index.html based on current location
                let backHref;
                if (isLocal) {
                    // Get pathname and split into parts
                    const pathname = window.location.pathname;
                    // Split and filter: remove empty strings and HTML files (keep only directories)
                    const pathParts = pathname.split('/').filter(part => part && !part.endsWith('.html'));
                    // Calculate how many levels up we need to go to reach root
                    const levelsUp = pathParts.length;
                    backHref = levelsUp > 0 ? '../'.repeat(levelsUp) + 'index.html' : 'index.html';
                } else {
                    backHref = `${baseUrl}/index.html`;
                }
                backBtn.setAttribute('href', backHref);
            }
            if (headerEl) {
                headerEl.classList.toggle('about-header', currentPage === 'about');
                headerEl.classList.toggle('service-header', currentPage === 'service');
                headerEl.classList.toggle('blog-header', currentPage === 'blog');
                headerEl.classList.toggle('learning-note-header', currentPage === 'learningnote');
            }

            // Initialize menu button functionality
            this.initializeMenuButton();

            // Initialize scroll spy once sections are ready
            this.initializeScrollSpy();
            document.addEventListener('sectionsLoaded', () => {
                this.initializeScrollSpy();
            });

            // Enhance nav link behavior for smooth scroll
            this.initializeNavClicks();
        } catch (error) {
            console.error('Error loading header:', error);
        }
    }

    static initializeMenuButton() {
        const menuBtn = document.querySelector('.menu-btn');
        const navbar = document.querySelector('.navbar');
        
        if (menuBtn && navbar) {
            menuBtn.addEventListener('click', () => {
                navbar.classList.toggle('active');
            });
        }

        // Fix logo link for GitHub Pages vs local
        const logo = document.querySelector('.logo');
        if (logo) {
            const pathSegments = window.location.pathname.split('/');
            const repoName = pathSegments[1];
            const isLocal = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost');
            const baseUrl = isLocal ? '' : `/${repoName}`;
            
            // Calculate relative path to index.html based on current location
            let logoHref;
            if (isLocal) {
                const pathname = window.location.pathname;
                const pathParts = pathname.split('/').filter(part => part && !part.endsWith('.html'));
                const levelsUp = pathParts.length;
                logoHref = levelsUp > 0 ? '../'.repeat(levelsUp) + 'index.html' : 'index.html';
            } else {
                logoHref = `${baseUrl}/index.html`;
            }
            logo.setAttribute('href', logoHref);

            logo.addEventListener('click', (e) => {
                const pathname = window.location.pathname;
                const onHome = (
                    pathname.endsWith('/index.html') ||
                    pathname.endsWith(`${repoName}/`) ||
                    pathname === '/' ||
                    pathname === `${baseUrl}/index.html`
                );
                if (onHome) {
                    e.preventDefault();
                    const home = document.querySelector('.home');
                    if (home) home.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }
    }

    static initializeScrollSpy() {
        const sections = [
            { id: 'home', nav: 'home', el: document.querySelector('.home') },
            { id: 'language', nav: 'about', el: document.getElementById('language') },
            { id: 'project', nav: 'about', el: document.getElementById('project') },
            { id: 'services', nav: 'services', el: document.getElementById('services') },
            { id: 'blog', nav: 'blog', el: document.getElementById('blog') },
            { id: 'contact', nav: 'contact', el: document.getElementById('contact') },
        ].filter(s => s.el);

        if (sections.length === 0) return;

        const navLinks = document.querySelectorAll('[data-nav]');
        const setActive = (name) => {
            navLinks.forEach(link => {
                link.classList.toggle('active', link.dataset.nav === name);
            });
        };

        const observer = new IntersectionObserver((entries) => {
            let topMost = null;
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const section = sections.find(s => s.el === entry.target);
                    if (section) {
                        // Prioritize whichever section has highest intersection ratio
                        if (!topMost || entry.intersectionRatio > topMost.ratio) {
                            topMost = { name: section.nav, ratio: entry.intersectionRatio };
                        }
                    }
                }
            });
            if (topMost) setActive(topMost.name);
        }, { threshold: [0.35, 0.6, 0.9] });

        sections.forEach(s => observer.observe(s.el));

        // Set initial based on scroll position
        const y = window.scrollY || window.pageYOffset;
        if (y < window.innerHeight * 0.4) setActive('home');
    }

    static initializeNavClicks() {
        const baseUrl = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') ? '' : `/${window.location.pathname.split('/')[1]}`;
        const links = document.querySelectorAll('.navbar a[data-nav]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const target = link.dataset.nav;
                if (target === 'home') {
                    e.preventDefault();
                    const home = document.querySelector('.home');
                    if (home) home.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    history.replaceState(null, '', `${baseUrl}/index.html`);
                } else if (target === 'about') {
                    e.preventDefault();
                    const lang = document.getElementById('language');
                    if (lang) {
                        lang.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        history.replaceState(null, '', '#language');
                    }
                } else if (target === 'blog') {
                    e.preventDefault();
                    const blog = document.getElementById('blog');
                    if (blog) {
                        blog.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        history.replaceState(null, '', '#blog');
                    } else {
                        window.location.href = `${baseUrl}/index.html#blog`;
                    }
                } else if (target === 'services') {
                    e.preventDefault();
                    const services = document.getElementById('services');
                    if (services) {
                        services.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        history.replaceState(null, '', '#services');
                    } else {
                        window.location.href = `${baseUrl}/index.html#services`;
                    }
                } else if (target === 'contact') {
                    e.preventDefault();
                    const contact = document.getElementById('contact');
                    if (contact) {
                        contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        history.replaceState(null, '', '#contact');
                    }
                }
            });
        });
    }
}

// Load header when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Header.loadHeader();
});