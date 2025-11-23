// Password Generator
class PasswordGenerator {
    constructor() {
        this.lowercase = 'abcdefghijklmnopqrstuvwxyz';
        this.uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.digits = '0123456789';
        this.special = '@#$%^&*()_+-=[]{}|;:,.<>?';
        
        this.init();
    }

    init() {
        const generateBtn = document.getElementById('generateBtn');
        const copyBtn = document.getElementById('copyBtn');
        const lengthSlider = document.getElementById('passwordLength');
        const lengthValue = document.getElementById('lengthValue');
        const passwordOutput = document.getElementById('passwordOutput');

        // Update length display
        lengthSlider.addEventListener('input', (e) => {
            lengthValue.textContent = e.target.value;
        });

        // Generate password
        generateBtn.addEventListener('click', () => {
            const length = parseInt(lengthSlider.value);
            const password = this.generatePassword(length);
            passwordOutput.value = password;
        });

        // Copy password
        copyBtn.addEventListener('click', () => {
            this.copyToClipboard(passwordOutput.value);
        });

        // Generate initial password
        generateBtn.click();
    }

    generatePassword(length) {
        // Ensure length is within valid range
        length = Math.max(8, Math.min(50, length));
        
        let password = '';
        const allChars = this.lowercase + this.uppercase + this.digits + this.special;
        
        // Ensure at least one of each required type
        password += this.getRandomChar(this.lowercase);
        password += this.getRandomChar(this.uppercase);
        password += this.getRandomChar(this.digits);
        
        // Add 1-10 special characters (at least 1, max 10)
        const specialCount = Math.min(10, Math.max(1, Math.floor(length * 0.15)));
        for (let i = 0; i < specialCount; i++) {
            password += this.getRandomChar(this.special);
        }
        
        // Fill the rest with random characters
        while (password.length < length) {
            password += this.getRandomChar(allChars);
        }
        
        // Shuffle the password to randomize positions
        password = this.shuffleString(password);
        
        return password;
    }

    getRandomChar(str) {
        return str[Math.floor(Math.random() * str.length)];
    }

    shuffleString(str) {
        const arr = str.split('');
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.join('');
    }

    copyToClipboard(text) {
        if (text && text !== 'Click \'Generate Password\' to create a password') {
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification('Password copied to clipboard!');
            }).catch(() => {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    this.showNotification('Password copied to clipboard!');
                } catch (err) {
                    this.showNotification('Failed to copy password');
                }
                document.body.removeChild(textarea);
            });
        } else {
            this.showNotification('Please generate a password first');
        }
    }

    showNotification(message) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PasswordGenerator();
});