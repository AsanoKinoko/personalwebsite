/**
 * Falling Cherry Blossom Effect
 */
(function () {
    // Prevent double execution
    if (window.CherryBlossomEffect) return;

    function getScriptBaseUrl() {
        const script = document.currentScript || document.querySelector('script[src*="falling-small-cherry-blossom-petals-effect.js"]');
        if (script && script.src) {
            const url = new URL(script.src);
            url.pathname = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
            return url.toString();
        }
        return '/themes/falling-small-cherry-blossom-petals-effect/';
    }
    const BASE_URL = getScriptBaseUrl();

    const CONFIG = {
        petalCount: 75,
        baseFallSpeed: 1.5,
        baseWindX: 1.5,
        windWavering: true,
        baseRotationSpeed: 1.2,
        minSize: 10,
        maxSize: 24,
        depthBlur: true,
        blendMode: 'normal', // Change to 'screen' if the background image is black, 'multiply' if the background image is white
        petalImages: [
            BASE_URL + 'images/petal-1.png',
            BASE_URL + 'images/petal-2.png',
            BASE_URL + 'images/petal-3.png',
            BASE_URL + 'images/petal-4.png'
        ]
    };

    class Petal {
        constructor(container) {
            this.element = document.createElement('div');
            this.element.className = 'petal';
            this.element.style.position = 'absolute';
            this.element.style.backgroundSize = 'contain';
            this.element.style.backgroundRepeat = 'no-repeat';
            this.element.style.backgroundPosition = 'center';

            // Random image from the list
            const randomImage = CONFIG.petalImages[Math.floor(Math.random() * CONFIG.petalImages.length)];
            this.element.style.backgroundImage = `url('${randomImage}')`;
            this.element.style.mixBlendMode = CONFIG.blendMode;

            this.element.style.willChange = 'transform';

            container.appendChild(this.element);

            this.reset();
            this.y = Math.random() * window.innerHeight;
        }

        reset() {
            this.x = Math.random() * window.innerWidth;
            this.y = -CONFIG.maxSize - (Math.random() * 100);
            this.z = Math.random();

            this.size = CONFIG.minSize + (this.z * (CONFIG.maxSize - CONFIG.minSize));
            this.element.style.width = `${this.size}px`;
            this.element.style.height = `${this.size * 1.25}px`;

            const depthMultiplier = 0.5 + (this.z * 0.5);
            this.vy = (CONFIG.baseFallSpeed + (Math.random() * 1.0)) * depthMultiplier;
            this.vx = (CONFIG.baseWindX + ((Math.random() - 0.5) * 1.0)) * depthMultiplier;

            this.swayPhase = Math.random() * Math.PI * 2;
            this.swaySpeed = 0.01 + Math.random() * 0.03;
            this.swayAmplitude = 0.5 + Math.random() * 1.5;

            this.rotX = Math.random() * 360;
            this.rotY = Math.random() * 360;
            this.rotZ = Math.random() * 360;

            this.rotSpeedX = (Math.random() - 0.5) * 3 * CONFIG.baseRotationSpeed;
            this.rotSpeedY = (Math.random() - 0.5) * 3 * CONFIG.baseRotationSpeed;
            this.rotSpeedZ = (Math.random() - 0.5) * 2 * CONFIG.baseRotationSpeed;

            if (CONFIG.depthBlur) {
                const blurAmount = (1 - this.z) * 2.5;
                this.element.style.filter = `blur(${blurAmount}px)`;
            }
            this.element.style.opacity = 0.3 + (this.z * 0.7);
        }

        update(globalWindOffsetX) {
            this.y += this.vy;
            const localSway = Math.sin(this.swayPhase) * this.swayAmplitude;
            this.x += this.vx + globalWindOffsetX + localSway;
            this.swayPhase += this.swaySpeed;

            this.rotX += this.rotSpeedX;
            this.rotY += this.rotSpeedY;
            this.rotZ += this.rotSpeedZ;

            this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) rotateX(${this.rotX}deg) rotateY(${this.rotY}deg) rotateZ(${this.rotZ}deg)`;

            if (this.y > window.innerHeight + 50 || this.x < -100 || this.x > window.innerWidth + 100) {
                if (this.y > window.innerHeight + 50) {
                    this.reset();
                } else if (this.x < -100) {
                    this.reset();
                    this.x = window.innerWidth + 50;
                } else {
                    this.reset();
                    this.x = -50;
                }
            }
        }
    }

    class BlossomSystem {
        constructor() {
            this.container = document.createElement('div');
            this.container.id = 'cherry-blossom-container';
            this.container.style.position = 'fixed';
            this.container.style.top = '0';
            this.container.style.left = '0';
            this.container.style.width = '100vw';
            this.container.style.height = '100vh';
            this.container.style.perspective = '600px';
            this.container.style.zIndex = '9998'; // Just below generic things if needed
            this.container.style.pointerEvents = 'none';
            this.container.style.overflow = 'hidden';

            document.body.appendChild(this.container);

            this.petals = [];
            this.globalTime = 0;
            this.animationFrameId = null;
            this.isRunning = true;

            for (let i = 0; i < CONFIG.petalCount; i++) {
                this.petals.push(new Petal(this.container));
            }

            this.animate = this.animate.bind(this);
            this.animationFrameId = requestAnimationFrame(this.animate);
        }

        animate() {
            if (!this.isRunning) return;
            this.globalTime += 0.01;

            let globalWindOffsetX = 0;
            if (CONFIG.windWavering) {
                globalWindOffsetX = Math.sin(this.globalTime) * 1.5;
            }

            for (let petal of this.petals) {
                petal.update(globalWindOffsetX);
            }

            this.animationFrameId = requestAnimationFrame(this.animate);
        }

        destroy() {
            this.isRunning = false;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
            }
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
            this.petals = [];
            window.CherryBlossomEffect = null;
        }
    }

    // Initialize and expose
    window.CherryBlossomEffect = new BlossomSystem();
})();