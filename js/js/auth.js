document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                // Example authentication logic
                const response = await authenticate(email, password);
                if (response.success) {
                    // Store user token
                    localStorage.setItem('userToken', response.token);
                    // Redirect to dashboard
                    window.location.href = '/dashboard.html';
                }
            } catch (error) {
                showError('Authentication failed. Please try again.');
            }
        });
    }

    // Social login handlers
    const googleBtn = document.querySelector('.google-btn');
    const facebookBtn = document.querySelector('.facebook-btn');

    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            initiateGoogleLogin();
        });
    }

    if (facebookBtn) {
        facebookBtn.addEventListener('click', () => {
            initiateFacebookLogin();
        });
    }
});

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    loginForm.insertBefore(errorDiv, loginForm.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

async function authenticate(email, password) {
    // Implementation would connect to your backend
    return new Promise((resolve, reject) => {
        // Simulate API call
        setTimeout(() => {
            if (email && password) {
                resolve({
                    success: true,
                    token: 'sample-token'
                });
            } else {
                reject(new Error('Invalid credentials'));
            }
        }, 1000);
    });
}