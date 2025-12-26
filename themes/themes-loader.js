/**
 * Themes Loader - Automatically load themes that have been enabled.
 * Simply include this file once per page, and it will automatically load the themes.
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'website_themes';
    const THEMES_CONFIG = {
        snow: {
            script: 'themes/snow-effect.js'
        }
        // Add other themes here as needed
    };

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

    // Load a theme script
    function loadThemeScript(themeId, scriptPath) {
        // Check if script already loaded
        const existingScript = document.querySelector(`script[data-theme="${themeId}"]`);
        if (existingScript) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = scriptPath;
            script.setAttribute('data-theme', themeId);
            script.async = true;
            
            script.onload = () => {
                console.log(`Theme "${themeId}" loaded successfully`);
                resolve();
            };
            
            script.onerror = () => {
                console.error(`Failed to load theme "${themeId}" from ${scriptPath}`);
                reject(new Error(`Failed to load theme: ${themeId}`));
            };
            
            document.head.appendChild(script);
        });
    }

    // Initialize themes
    function initThemes() {
        const themesState = loadThemesState();
        const loadPromises = [];

        Object.keys(THEMES_CONFIG).forEach(themeId => {
            if (themesState[themeId] === true) {
                const theme = THEMES_CONFIG[themeId];
                loadPromises.push(loadThemeScript(themeId, theme.script));
            }
        });

        return Promise.allSettled(loadPromises);
    }

    // Listen for theme state changes
    window.addEventListener('themeStateChanged', function(e) {
        const { themeId, enabled } = e.detail;
        
        if (!THEMES_CONFIG[themeId]) {
            return;
        }

        const existingScript = document.querySelector(`script[data-theme="${themeId}"]`);
        
        if (enabled && !existingScript) {
            // Theme was enabled, load it
            const theme = THEMES_CONFIG[themeId];
            loadThemeScript(themeId, theme.script);
        } else if (!enabled && existingScript) {
            // Theme was disabled, destroy it if possible
            if (window.SnowEffect && themeId === 'snow') {
                window.SnowEffect.destroy();
            }
            // Remove script tag
            existingScript.remove();
        }
    });

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemes);
    } else {
        initThemes();
    }
})();