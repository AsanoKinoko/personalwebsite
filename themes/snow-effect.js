/**
 * Snow Effect - Optimize performance with requestAnimationFrame
 */

(function () {
    "use strict";

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        density: 50, // Number of snowflakes      
        minSize: 2, // Minimum size (px)       
        maxSize: 8, // Maximum size (px)     
        minSpeed: 40, // Minimum falling speed (px/s)     
        maxSpeed: 140, // Maximum falling speed (px/s)     
        windStrength: 0.5, // Wind strength (0-1)     
        opacity: 0.8, // Opacity (0-1)     
        color: "#ffffff", // Snow color     
        reducedMotionMultiplier: 0.1, // Reduces the number when prefers-reduced-motion     
    };

    // ==================== GLOBAL VARIABLES ====================
    let container = null;
    let snowflakes = [];
    let animationId = null;
    let lastTime = 0;
    let isReducedMotion = false;
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;

    // ==================== CHECK PREFERS-REDUCED-MOTION ====================
    function checkReducedMotion() {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        isReducedMotion = mediaQuery.matches;

    // Listen to change
    mediaQuery.addEventListener("change", function (e) {
        isReducedMotion = e.matches;
        if (isReducedMotion) {
            // Reduce the number of snowflakes
            adjustSnowflakeCount();
        } else {
            // Restore quantity
            adjustSnowflakeCount();
        }
        });
    }

    // ==================== CREATE A CONTAINER ====================
    function createContainer() {
        if (!document.body) {
            console.error("Document body not ready");
            return false;
        }
        container = document.createElement("div");
        container.id = "snow-container";
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
        `;
        document.body.appendChild(container);
        return true;
    }

    // ==================== SNOWFLAKE CLASS ====================
    class Snowflake {
        constructor() {
            if (!container) {
                console.error("Snow container not initialized");
                return;
            }
            this.element = this.createElement();
            container.appendChild(this.element);
            this.reset(true);
        }

        createElement() {
            const el = document.createElement("div");
            el.className = "snowflake";
            el.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: ${CONFIG.color};
                will-change: transform;
                backface-visibility: hidden;
                transform: translate3d(0, 0, 0);
            `;
            return el;
        }

        reset(isInitial = false) {
            // Random size
            this.size = CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize);

            // Initial position: random x, y < 0 (on screen)
            this.x = Math.random() * windowWidth;
            this.y = isInitial
                ? -Math.random() * windowHeight * 0.5 // Spawn from above
                : -this.size; // Reset to the home screen.

            // Random falling velocity
            this.speed = CONFIG.minSpeed + Math.random() * (CONFIG.maxSpeed - CONFIG.minSpeed);

            // Phases for wind motion (each snowflake has its own phase)
            this.windPhase = Math.random() * Math.PI * 2;
            this.windSpeed = 0.3 + Math.random() * 0.4; // Wind speed change

            // Amplitude for horizontal movement (random for each flower)
            this.windAmplitude = (20 + Math.random() * 40) * CONFIG.windStrength;

            // Opacity is slightly random.
            this.opacity = CONFIG.opacity * (0.7 + Math.random() * 0.3);

            // Update DOM
            this.updateDOM();
        }

        updateDOM() {
            // Only set the size and opacity, do not set the position here.
            if (!this.element) return;
            this.element.style.width = this.size + "px";
            this.element.style.height = this.size + "px";
            this.element.style.opacity = this.opacity;
        }

        update(deltaTime) {
            if (!this.element) return;
            
            // Update position y (falls down)
            this.y += (this.speed * deltaTime) / 1000;

            // Horizontal wind-like motion (sinusoidal wave with varying phase)
            this.windPhase += (this.windSpeed * deltaTime) / 1000;
            const windOffset = Math.sin(this.windPhase) * this.windAmplitude;
            this.x += (windOffset * deltaTime) / 1000;

            // Keep x within the screen area (wrap around).
            if (this.x < -this.size) {
                this.x = windowWidth + this.size;
            } else if (this.x > windowWidth + this.size) {
                this.x = -this.size;
            }

            // If it falls off the screen, reset to the top
            if (this.y > windowHeight + this.size) {
                this.reset();
            }

            // Transform update (performance optimization)
            this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
        }

        destroy() {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }
    }

    // ==================== ADJUST THE NUMBER OF SNOWFLAKES ====================
    function adjustSnowflakeCount() {
        const targetCount = isReducedMotion
            ? Math.floor(CONFIG.density * CONFIG.reducedMotionMultiplier)
            : CONFIG.density;

        const currentCount = snowflakes.length;

        if (targetCount < currentCount) {
            // Remove some snowflakes
            const toRemove = currentCount - targetCount;
            for (let i = 0; i < toRemove; i++) {
                const snowflake = snowflakes.pop();
                if (snowflake) {
                    snowflake.destroy();
                }
            }
        } else if (targetCount > currentCount) {
            // Add new snowflakes
            const toAdd = targetCount - currentCount;
            for (let i = 0; i < toAdd; i++) {
                snowflakes.push(new Snowflake());
            }
        }
    }

    // ==================== INITIALIZING A SNOWFLAKE ====================
    function initSnowflakes() {
        // Remove any old snowflakes if present.
        snowflakes.forEach((snowflake) => snowflake.destroy());
        snowflakes = [];

        // Create a new snowflake.
        const count = isReducedMotion
            ? Math.floor(CONFIG.density * CONFIG.reducedMotionMultiplier)
            : CONFIG.density;

        for (let i = 0; i < count; i++) {
            snowflakes.push(new Snowflake());
        }
    }

    // ==================== ANIMATION LOOP ====================
    function animate(currentTime) {
        if (!container || snowflakes.length === 0) {
            return;
        }

        // Calculate delta time
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        // If deltaTime is too large (tab inactive), skip this frame.
        if (deltaTime > 100) {
            animationId = requestAnimationFrame(animate);
            return;
        }

        // Update each snowflake individually.
        snowflakes.forEach((snowflake) => {
            snowflake.update(deltaTime);
        });

        animationId = requestAnimationFrame(animate);
    }

    // ==================== RESIZE PROCESSING ====================
    let resizeTimeout;
    function handleResize() {
        // Debounce resize
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            windowWidth = window.innerWidth;
            windowHeight = window.innerHeight;

            // Reset the snowflakes if necessary (to avoid losing them when resizing)
            snowflakes.forEach((snowflake) => {
                // If the snowflake is off-screen, reset.
                if (
                    snowflake.x < -snowflake.size ||
                    snowflake.x > windowWidth + snowflake.size ||
                    snowflake.y > windowHeight + snowflake.size
                ) {
                    snowflake.reset();
                }
            });
        }, 150);
    }

    // ==================== CHECK THEME STATE ====================
    function isThemeEnabled() {
        try {
            const themesState = localStorage.getItem('website_themes');
            if (themesState) {
                const state = JSON.parse(themesState);
                return state.snow === true;
            }
        } catch (err) {
            console.error('Error checking theme state:', err);
        }
        return false;
    }

    // ==================== INITIALIZING ====================
    function init() {
        // Check if theme is enabled
        if (!isThemeEnabled()) {
            return;
        }

        // Check if body is ready
        if (!document.body) {
            // Wait a bit more if body is not ready
            setTimeout(init, 10);
            return;
        }

        // Check prefers-reduced-motion
        checkReducedMotion();

        // Create a container
        if (!createContainer()) {
            return;
        }

        // Initialize the snowflake.
        initSnowflakes();

        // Start animation
        lastTime = performance.now();
        animationId = requestAnimationFrame(animate);

        // Listen to resize
        window.addEventListener("resize", handleResize);
    }

    // ==================== LISTEN FOR THEME STATE CHANGES ====================
    function handleThemeStateChange() {
        const enabled = isThemeEnabled();
        
        if (enabled && !container) {
            // Theme was enabled, initialize
            init();
        } else if (!enabled && container) {
            // Theme was disabled, destroy
            destroy();
        }
    }

    // Listen to theme state changes
    window.addEventListener('themeStateChanged', function(e) {
        if (e.detail.themeId === 'snow') {
            handleThemeStateChange();
        }
    });

    // Check theme state periodically (in case localStorage was changed in another tab)
    setInterval(handleThemeStateChange, 1000);

    // ==================== STOP AND CLEAN UP ====================
    function destroy() {
        // Stop animation
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        // Remove the snowflake
        snowflakes.forEach((snowflake) => snowflake.destroy());
        snowflakes = [];

        // Remove the container
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
            container = null;
        }

        // Remove event listeners
        window.removeEventListener("resize", handleResize);
    }

    // ==================== API PUBLIC ====================
    window.SnowEffect = {
        init: init,
        destroy: destroy,
        config: CONFIG,
        adjustSnowflakeCount: adjustSnowflakeCount,
    };

    // Automatically initialize when DOM is ready.
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();