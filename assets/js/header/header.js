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
                const backHref = isLocal ? 'index.html' : `${baseUrl}/index.html`;
                backBtn.setAttribute('href', backHref);
            }
            if (headerEl) {
                headerEl.classList.toggle('about-header', currentPage === 'about');
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
            // Use relative path on local to preserve subfolder, absolute with repo on GitHub Pages
            const logoHref = isLocal ? 'index.html' : `${baseUrl}/index.html`;
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