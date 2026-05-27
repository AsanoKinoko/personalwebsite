// Caesar Cipher Component
class CaesarCipher {
    constructor(outputElement, notifyFn) {
        this.passwordOutput = outputElement;
        this.showNotification = notifyFn;
        this.init();
    }

    init() {
        // Caesar Elements
        const caesarInput = document.getElementById('caesarInput');
        const caesarShift = document.getElementById('caesarShift');
        const caesarGenerateBtn = document.getElementById('caesarGenerateBtn');

        // Caesar Decrypt Elements
        const caesarDecryptInput = document.getElementById('caesarDecryptInput');
        const caesarDecryptShift = document.getElementById('caesarDecryptShift');
        const caesarDecryptBtn = document.getElementById('caesarDecryptBtn');

        if (!caesarInput || !caesarShift || !caesarGenerateBtn || !caesarDecryptInput || !caesarDecryptShift || !caesarDecryptBtn) {
            return; // Elements not present on page
        }

        // Caesar encryption update logic
        const updateCaesar = (isManualClick = false) => {
            const text = caesarInput.value;
            let shiftVal = caesarShift.value;
            if (shiftVal === '') {
                shiftVal = 3;
            } else {
                shiftVal = parseInt(shiftVal);
                if (isNaN(shiftVal)) {
                    shiftVal = 3;
                }
            }

            if (text) {
                this.passwordOutput.value = this.encrypt(text, shiftVal);
            } else {
                this.passwordOutput.value = "The text after encryption";
                if (isManualClick) {
                    this.showNotification('Please enter plain text first');
                }
            }
        };

        // Caesar decryption update logic
        const updateCaesarDecrypt = (isManualClick = false) => {
            const text = caesarDecryptInput.value;
            let shiftVal = caesarDecryptShift.value;
            if (shiftVal === '') {
                shiftVal = 3;
            } else {
                shiftVal = parseInt(shiftVal);
                if (isNaN(shiftVal)) {
                    shiftVal = 3;
                }
            }

            if (text) {
                this.passwordOutput.value = this.decrypt(text, shiftVal);
            } else {
                this.passwordOutput.value = "The text after decryption";
                if (isManualClick) {
                    this.showNotification('Please enter cipher text first');
                }
            }
        };

        caesarInput.addEventListener('input', () => updateCaesar(false));
        caesarShift.addEventListener('input', () => updateCaesar(false));
        caesarGenerateBtn.addEventListener('click', () => updateCaesar(true));

        caesarDecryptInput.addEventListener('input', () => updateCaesarDecrypt(false));
        caesarDecryptShift.addEventListener('input', () => updateCaesarDecrypt(false));
        caesarDecryptBtn.addEventListener('click', () => updateCaesarDecrypt(true));
    }

    encrypt(text, shift) {
        shift = parseInt(shift);
        if (isNaN(shift)) shift = 3;

        // Normalize shift to be within 0-25
        shift = ((shift % 26) + 26) % 26;

        return text.split('').map(char => {
            if (char >= 'a' && char <= 'z') {
                const code = char.charCodeAt(0);
                return String.fromCharCode(((code - 97 + shift) % 26) + 97);
            } else if (char >= 'A' && char <= 'Z') {
                const code = char.charCodeAt(0);
                return String.fromCharCode(((code - 65 + shift) % 26) + 65);
            }
            return char; // keep symbols, numbers, spaces unchanged
        }).join('');
    }

    decrypt(text, shift) {
        return this.encrypt(text, -shift);
    }
}