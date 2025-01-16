class Header {
    static async loadHeader() {
        try {
            const response = await fetch('/components/header/header.html');
            const html = await response.text();
            document.body.insertAdjacentHTML('afterbegin', html);
            
            // Add active class based on current page
            const currentPage = window.location.pathname.split('/').pop().split('.')[0].toLowerCase();
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