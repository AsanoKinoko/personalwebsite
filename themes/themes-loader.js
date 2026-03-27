/**
 * Themes Loader - Automatically load themes that have been enabled.
 * Simply include this file once per page, and it will automatically load the themes.
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'website_themes';
    const FINGERPRINT_KEY = 'website_themes_fingerprint';
    const THEMES_DATA_PATH = '../data/themes/themes_data.json';

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

    // Generate a fingerprint from config defaults to detect changes
    function generateConfigFingerprint(themesConfig) {
        const entries = Object.keys(themesConfig)
            .sort()
            .map(id => `${id}:${themesConfig[id].enabled}`);
        return entries.join('|');
    }

    // Compare fingerprint and reset localStorage if config defaults changed
    function syncWithConfigDefaults(themesConfig) {
        const currentFingerprint = generateConfigFingerprint(themesConfig);
        try {
            const savedFingerprint = localStorage.getItem(FINGERPRINT_KEY);
            if (savedFingerprint !== null && savedFingerprint !== currentFingerprint) {
                // Config defaults changed → clear old user overrides
                localStorage.removeItem(STORAGE_KEY);
                console.log('Theme config defaults changed, resetting saved preferences.');
            }
            localStorage.setItem(FINGERPRINT_KEY, currentFingerprint);
        } catch (err) {
            console.error('Error syncing theme fingerprint:', err);
        }
    }

    // Resolve URL relative to themes-loader.js location (works with GitHub Pages subpaths)
    function resolveFromLoaderPath(relativePath) {
        const loaderScript = document.querySelector('script[src*="themes-loader.js"]');
        if (loaderScript && loaderScript.src) {
            return new URL(relativePath, loaderScript.src).toString();
        }
        return relativePath;
    }

    async function loadThemesConfig() {
        const dataUrl = resolveFromLoaderPath(THEMES_DATA_PATH);
        const response = await fetch(dataUrl);
        if (!response.ok) {
            throw new Error(`Failed to load themes config: ${response.status}`);
        }

        const payload = await response.json();
        const themesArray = Array.isArray(payload?.themes) ? payload.themes : [];
        const config = {};

        themesArray.forEach(theme => {
            if (theme && theme.id && theme.script) {
                config[theme.id] = {
                    script: theme.script,
                    enabled: theme.enabled === true
                };
            }
        });

        return config;
    }

    // Resolve theme script path with backward compatibility for "themes/..." values
    function resolveThemeScriptPath(scriptPath) {
        if (typeof scriptPath !== 'string' || !scriptPath.trim()) {
            return scriptPath;
        }

        // If JSON still uses "themes/snow-effect.js", resolve relative to loader folder.
        if (scriptPath.startsWith('themes/')) {
            return resolveFromLoaderPath(scriptPath.replace(/^themes\//, './'));
        }

        return resolveFromLoaderPath(scriptPath);
    }

    // Load a theme script
    function loadThemeScript(themeId, scriptPath) {
        // Check if script already loaded
        const existingScript = document.querySelector(`script[data-theme="${themeId}"]`);
        if (existingScript) {
            return Promise.resolve();
        }

        const resolvedPath = resolveThemeScriptPath(scriptPath);

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = resolvedPath;
            script.setAttribute('data-theme', themeId);
            script.async = true;

            script.onload = () => {
                console.log(`Theme "${themeId}" loaded successfully from ${resolvedPath}`);
                resolve();
            };

            script.onerror = () => {
                console.error(`Failed to load theme "${themeId}" from ${resolvedPath}`);
                reject(new Error(`Failed to load theme: ${themeId}`));
            };

            document.head.appendChild(script);
        });
    }

    // Initialize themes
    async function initThemes() {
        let themesConfig = {};

        try {
            themesConfig = await loadThemesConfig();
        } catch (err) {
            console.error(err);
            return;
        }

        window.__THEMES_CONFIG__ = themesConfig;

        // Reset localStorage if admin changed the config defaults
        syncWithConfigDefaults(themesConfig);

        const themesState = loadThemesState();
        const loadPromises = [];

        Object.keys(themesConfig).forEach(themeId => {
            const theme = themesConfig[themeId];
            const hasSavedState = Object.prototype.hasOwnProperty.call(themesState, themeId);
            const shouldEnable = hasSavedState ? themesState[themeId] === true : theme.enabled === true;

            if (shouldEnable) {
                loadPromises.push(loadThemeScript(themeId, theme.script));
            }
        });

        return Promise.allSettled(loadPromises);
    }

    // Listen for theme state changes
    window.addEventListener('themeStateChanged', function (e) {
        const { themeId, enabled } = e.detail;
        const themesConfig = window.__THEMES_CONFIG__ || {};

        if (!themesConfig[themeId]) {
            return;
        }

        const existingScript = document.querySelector(`script[data-theme="${themeId}"]`);

        if (enabled && !existingScript) {
            const theme = themesConfig[themeId];
            loadThemeScript(themeId, theme.script);
        } else if (!enabled && existingScript) {
            if (window.SnowEffect && themeId === 'snow') {
                window.SnowEffect.destroy();
            }
            if (window.CherryBlossomEffect && themeId === 'cherry_blossoms') {
                window.CherryBlossomEffect.destroy();
            }
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