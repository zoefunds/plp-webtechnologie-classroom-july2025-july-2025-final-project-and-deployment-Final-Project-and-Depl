class LoginManager {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.passwordResetModal = document.getElementById('passwordResetModal');
        this.twoFactorModal = document.getElementById('twoFactorModal');
        this.currentTime = '2025-08-31 15:31:41';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPasswordToggle();
        this.setup2FAInputs();
        this.setupSocialLogin();
        this.initializeRecaptcha();
    }

    setupEventListeners() {
        // Login form submission
        this.form.addEventListener('submit', (e) => this.handleLogin(e));

        // Password reset
        document.querySelector('.forgot-password').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPasswordResetModal();
        });

        // Reset password form submission
        document.getElementById('resetPasswordForm').addEventListener('submit', (e) => 
            this.handlePasswordReset(e));

        // 2FA form submission
        document.getElementById('twoFactorForm').addEventListener('submit', (e) => 
            this.handle2FAVerification(e));

        // Close modals
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', () => this.closeModals());
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    }

    setupPasswordToggle() {
        const toggleBtn = document.querySelector('.toggle-password');
        const passwordInput = document.getElementById('password');

        toggleBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            toggleBtn.querySelector('i').classList.toggle('fa-eye');
            toggleBtn.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    setup2FAInputs() {
        const inputs = document.querySelectorAll('.code-input');
        
        inputs.forEach((input, index) => {
            input.addEventListener('keyup', (e) => {
                if (e.key >= 0 && e.key <= 9) {
                    if (index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                } else if (e.key === 'Backspace') {
                    if (index > 0) {
                        inputs[index - 1].focus();
                    }
                }
            });
        });
    }

    setupSocialLogin() {
        document.querySelector('.social-btn.google').addEventListener('click', () => 
            this.handleSocialLogin('google'));
        document.querySelector('.social-btn.apple').addEventListener('click', () => 
            this.handleSocialLogin('apple'));
    }

    async handleLogin(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(this.form);
            const credentials = {
                username: formData.get('email'),
                password: formData.get('password'),
                remember: formData.get('remember') === 'on',
                timestamp: this.currentTime
            };

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (data.requires2FA) {
                this.show2FAModal();
                this.startVerificationTimer();
            } else if (response.ok) {
                this.handleLoginSuccess(data);
            } else {
                this.handleLoginError(data.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showErrorNotification('An error occurred during login. Please try again.');
        }
    }

    async handlePasswordReset(e) {
        e.preventDefault();
        
        const email = document.getElementById('resetEmail').value;
        
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, timestamp: this.currentTime })
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccessNotification(
                    'Password reset instructions have been sent to your email.'
                );
                this.closeModals();
            } else {
                this.showErrorNotification(data.message);
            }
        } catch (error) {
            console.error('Password reset error:', error);
            this.showErrorNotification('An error occurred. Please try again.');
        }
    }

    async handle2FAVerification(e) {
        e.preventDefault();
        
        const inputs = document.querySelectorAll('.code-input');
        const code = Array.from(inputs).map(input => input.value).join('');
        
        try {
            const response = await fetch('/api/auth/verify-2fa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    code,
                    timestamp: this.currentTime
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.handleLoginSuccess(data);
            } else {
                this.showErrorNotification(data.message);
            }
        } catch (error) {
            console.error('2FA verification error:', error);
            this.showErrorNotification('Verification failed. Please try again.');
        }
    }

    async handleSocialLogin(provider) {
        try {
            const response = await fetch(`/api/auth/social/${provider}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ timestamp: this.currentTime })
            });

            const data = await response.json();

            if (response.ok) {
                window.location.href = data.authUrl;
            } else {
                this.showErrorNotification(data.message);
            }
        } catch (error) {
            console.error('Social login error:', error);
            this.showErrorNotification('Unable to initialize social login.');
        }
    }

    handleLoginSuccess(data) {
        // Store auth token
        localStorage.setItem('authToken', data.token);
        
        // Update last login time
        this.updateLastLogin();
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
    }

    async updateLastLogin() {
        try {
            await fetch('/api/auth/update-last-login', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ timestamp: this.currentTime })
            });
        } catch (error) {
            console.error('Error updating last login:', error);
        }
    }

    showPasswordResetModal() {
        this.passwordResetModal.style.display = 'block';
    }

    show2FAModal() {
        this.twoFactorModal.style.display = 'block';
    }

    closeModals() {
        this.passwordResetModal.style.display = 'none';
        this.twoFactorModal.style.display = 'none';
    }

    startVerificationTimer() {
        let timeLeft = 60;
        const timerElement = document.querySelector('.timer');
        const resendButton = document.querySelector('.resend-code');
        
        resendButton.disabled = true;
        
        const timer = setInterval(() => {
            timeLeft--;
            timerElement.textContent = `Resend in: ${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                resendButton.disabled = false;
                timerElement.textContent = '';
            }
        }, 1000);
    }

    showSuccessNotification(message) {
        // Implementation of success notification
        console.log('Success:', message);
    }

    showErrorNotification(message) {
        // Implementation of error notification
        console.error('Error:', message);
    }

    initializeRecaptcha() {
        // Implementation of reCAPTCHA
        if (typeof grecaptcha !== 'undefined') {
            grecaptcha.ready(() => {
                grecaptcha.render('recaptcha', {
                    'sitekey': 'your-recaptcha-site-key'
                });
            });
        }
    }
}

// Initialize login manager
const loginManager = new LoginManager();