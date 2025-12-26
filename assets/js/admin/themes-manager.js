// Theme configuration
const THEMES = {
    snow: {
        id: 'snow',
        name: 'Hiệu ứng tuyết rơi',
        description: 'Hiệu ứng tuyết rơi mùa đông với animation mượt mà và tối ưu hiệu năng',
        icon: '❄️',
        script: '../themes/snow-effect.js',
        enabled: false
    }
    // You can add other themes here.
};

// Storage key
const STORAGE_KEY = 'website_themes';

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadAdminLayout();
    loadThemes();
});

function loadAdminLayout() {
    fetch('../components/layout/AdminLayout.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('adminLayoutContainer').innerHTML = html;
            
            // Set active nav
            const navLink = document.querySelector('[data-nav="themes"]');
            if (navLink) {
                navLink.classList.add('active');
                // Remove active from other nav items
                document.querySelectorAll('.nav-link').forEach(link => {
                    if (link !== navLink) {
                        link.classList.remove('active');
                    }
                });
            }

            // Set breadcrumbs
            const breadcrumbs = document.getElementById('headerBreadcrumbs');
            if (breadcrumbs) {
                breadcrumbs.innerHTML = `
                    <a href="dashboard.html" style="color: var(--text-secondary); text-decoration: none;">Dashboard</a>
                    <span style="color: var(--text-muted);">/</span>
                    <span style="color: var(--text-primary);">Quản lý Themes</span>
                `;
            }

            // Initialize sidebar
            initAdminLayout();
        })
        .catch(err => console.error('Error loading admin layout:', err));
}

function initAdminLayout() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('adminSidebar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    if (mobileMenuBtn && sidebar && sidebarOverlay) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.add('mobile-open');
            sidebarOverlay.classList.add('active');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
            sidebarOverlay.classList.remove('active');
        });
    }
}

// Load themes state from localStorage
function loadThemesState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (err) {
        console.error('Error loading themes state:', err);
    }
    return {};
}

// Save themes state to localStorage
function saveThemesState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
        console.error('Error saving themes state:', err);
    }
}

// Get theme state
function getThemeState(themeId) {
    const state = loadThemesState();
    return state[themeId] || false;
}

// Set theme state
function setThemeState(themeId, enabled) {
    const state = loadThemesState();
    state[themeId] = enabled;
    saveThemesState(state);
    
    // Dispatch's custom event allows other sites to listen.
    window.dispatchEvent(new CustomEvent('themeStateChanged', {
        detail: { themeId, enabled }
    }));
}

// Load and render themes
function loadThemes() {
    const content = document.getElementById('adminContent');
    if (!content) {
        setTimeout(loadThemes, 100);
        return;
    }

    const themesState = loadThemesState();
    
    // Update themes with saved state
    Object.keys(THEMES).forEach(themeId => {
        THEMES[themeId].enabled = themesState[themeId] || false;
    });

    renderThemes();
}

function renderThemes() {
    const content = document.getElementById('adminContent');
    if (!content) return;

    const themesList = Object.values(THEMES);
    
    if (themesList.length === 0) {
        content.innerHTML = `
            <div class="page-header">
                <h1 class="heading-1" style="color: #f1c232; text-shadow: 1px 1px 4px rgba(255, 242, 204, 0.5);">Quản lý Themes</h1>
                <p class="body-text" style="color: #fff2cc; opacity: 0.9;">Quản lý các hiệu ứng và themes cho website</p>
            </div>
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class='bx bx-palette'></i>
                </div>
                <h3 class="empty-state-title">Chưa có themes nào</h3>
                <p class="empty-state-description">Các themes sẽ được hiển thị ở đây khi được thêm vào hệ thống.</p>
            </div>
        `;
        return;
    }

    const themesHTML = themesList.map(theme => {
        const isEnabled = theme.enabled;
        return `
            <div class="theme-card">
                <div class="theme-card-header">
                    <div class="theme-card-header-left">
                        <div class="theme-icon-wrapper">
                            <div class="theme-icon">${theme.icon}</div>
                        </div>
                        <div class="theme-card-title-wrapper">
                            <h3 class="theme-card-title">${theme.name}</h3>
                            <p class="theme-card-description">${theme.description}</p>
                        </div>
                    </div>
                    <span class="status-badge ${isEnabled ? 'active' : 'inactive'}">
                        ${isEnabled ? 'Đang bật' : 'Đang tắt'}
                    </span>
                </div>
                <div class="theme-card-footer">
                    <div class="theme-toggle">
                        <span class="theme-toggle-label">${isEnabled ? 'Bật' : 'Tắt'}</span>
                        <div class="toggle-switch ${isEnabled ? 'active' : ''}" 
                             data-theme-id="${theme.id}"
                             onclick="toggleTheme('${theme.id}')"
                             role="switch"
                             aria-checked="${isEnabled}"
                             aria-label="${theme.name} - ${isEnabled ? 'Bật' : 'Tắt'}">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    content.innerHTML = `
        <div class="page-header">
            <h1 class="heading-1" style="color: #f1c232; text-shadow: 1px 1px 4px rgba(255, 242, 204, 0.5);">Quản lý Themes</h1>
            <p class="body-text" style="color: #fff2cc; opacity: 0.9;">Bật/tắt các hiệu ứng và themes cho website</p>
        </div>

        <div class="dashboard-section">
            <h2 class="section-title">Hiệu ứng hiện có</h2>
            <div class="themes-grid">
                ${themesHTML}
            </div>
        </div>
    `;
}

// Toggle theme on/off
function toggleTheme(themeId) {
    const theme = THEMES[themeId];
    if (!theme) {
        console.error('Theme not found:', themeId);
        return;
    }

    const newState = !theme.enabled;
    setThemeState(themeId, newState);
    theme.enabled = newState;
    
    // Re-render to update the UI
    renderThemes();
    
    // Show notification
    showNotification(
        newState 
            ? `${theme.name} đã được bật` 
            : `${theme.name} đã được tắt`,
        newState ? 'success' : 'info'
    );
}

// Show notification using Notification component
function showNotification(message, type = 'info') {
    if (window.Notification && typeof window.Notification.show === 'function') {
        window.Notification.show(message, type, 3000);
    } else {
        // Fallback if Notification component not loaded
        console.warn('Notification component not available, using console fallback');
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Export functions to global scope for onclick handlers
window.toggleTheme = toggleTheme;