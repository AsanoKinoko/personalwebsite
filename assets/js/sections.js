class SectionsLoader {
    static baseUrl() {
        const pathSegments = window.location.pathname.split('/');
        const repoName = pathSegments[1];
        return (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
            ? ''
            : `/${repoName}`;
    }

    static async loadSection(path) {
        const response = await fetch(`${this.baseUrl()}${path}`);
        return await response.text();
    }

    static async init() {
        try {
            const homeSection = document.querySelector('.home');
            if (!homeSection) return;

            const [languageHTML, projectHTML, contactHTML, productCardHTML] = await Promise.all([
                this.loadSection('/components/language_section/language.html'),
                this.loadSection('/components/project_section/project.html'),
                this.loadSection('/components/contact_section/contact.html'),
                this.loadSection('/components/ui/projectcard/ProjectCard.html'),
            ]);

            homeSection.insertAdjacentHTML('afterend', languageHTML + projectHTML + contactHTML);

            if (window.ProjectCards) {
                await window.ProjectCards.render(productCardHTML);
            }

            // Simple contact handler
            const form = document.getElementById('contactForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    alert('Thanks! Your message has been sent.');
                    form.reset();
                });
            }

            // Notify header that sections are now in DOM
            document.dispatchEvent(new CustomEvent('sectionsLoaded'));

            // Handle deep link to contact after inject
            if (window.location.hash === '#contact') {
                const contact = document.getElementById('contact');
                contact && contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // Hook up Let's Talk button smooth scroll
            const talkBtn = document.getElementById('btn-talk');
            if (talkBtn) {
                talkBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const contact = document.getElementById('contact');
                    contact && contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    history.replaceState(null, '', '#contact');
                });
            }
        } catch (err) {
            console.error('Failed to load sections:', err);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    SectionsLoader.init();
});

