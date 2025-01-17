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

            // Initialize menu button functionality
            this.initializeMenuButton();
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
    }
}

// Load header when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Header.loadHeader();
});