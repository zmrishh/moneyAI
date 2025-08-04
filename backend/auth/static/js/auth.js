// Authentication JavaScript for Agent-Cofounder

class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupFormValidation();
        this.setupPasswordRequirements();
        this.setupFormSubmission();
        this.setupTokenManagement();
    }

    setupFormValidation() {
        const forms = document.querySelectorAll('.auth-form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('.form-input');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateInput(input));
                input.addEventListener('input', () => this.clearInputError(input));
            });
        });
    }

    setupPasswordRequirements() {
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            if (input.name === 'password' || input.name === 'new_password') {
                input.addEventListener('input', () => this.checkPasswordRequirements(input));
            }
        });
    }

    setupFormSubmission() {
        const forms = document.querySelectorAll('.auth-form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        });
    }

    setupTokenManagement() {
        // Check for tokens in URL (for password reset, etc.)
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        if (accessToken) {
            this.storeTokens(accessToken, refreshToken);
        }

        // Auto-logout on token expiration
        this.setupTokenExpiration();
    }

    validateInput(input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (input.type) {
            case 'email':
                isValid = this.validateEmail(value);
                errorMessage = 'Please enter a valid email address';
                break;
            case 'password':
                if (input.name === 'password') {
                    isValid = this.validatePassword(value);
                    errorMessage = 'Password must be at least 8 characters with letters and numbers';
                } else {
                    isValid = value.length > 0;
                    errorMessage = 'Password is required';
                }
                break;
            default:
                if (input.required) {
                    isValid = value.length > 0;
                    errorMessage = 'This field is required';
                }
        }

        this.updateInputValidation(input, isValid, errorMessage);
        return isValid;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        return password.length >= 8 && 
               /[A-Za-z]/.test(password) && 
               /[0-9]/.test(password);
    }

    checkPasswordRequirements(input) {
        const password = input.value;
        const requirements = document.querySelector('.password-requirements');
        
        if (requirements) {
            const lengthReq = requirements.querySelector('.length-req');
            const letterReq = requirements.querySelector('.letter-req');
            const numberReq = requirements.querySelector('.number-req');

            if (lengthReq) {
                lengthReq.className = password.length >= 8 ? 'requirement-met' : 'requirement-unmet';
            }
            if (letterReq) {
                letterReq.className = /[A-Za-z]/.test(password) ? 'requirement-met' : 'requirement-unmet';
            }
            if (numberReq) {
                numberReq.className = /[0-9]/.test(password) ? 'requirement-met' : 'requirement-unmet';
            }
        }
    }

    updateInputValidation(input, isValid, errorMessage) {
        input.classList.toggle('error', !isValid);
        
        // Remove existing error message
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add error message if invalid
        if (!isValid && errorMessage) {
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.style.color = 'var(--error-color)';
            errorElement.style.fontSize = '0.8rem';
            errorElement.style.marginTop = '0.25rem';
            errorElement.textContent = errorMessage;
            input.parentNode.appendChild(errorElement);
        }
    }

    clearInputError(input) {
        input.classList.remove('error');
        const errorMessage = input.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const formType = form.dataset.form || 'unknown';
        
        // Validate all inputs
        const inputs = form.querySelectorAll('.form-input[required]');
        let isFormValid = true;
        
        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showAlert('Please fix the errors below', 'error');
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span>Processing...';

        try {
            const response = await this.submitForm(formType, formData);
            await this.handleFormResponse(response, formType);
        } catch (error) {
            this.showAlert(`Error: ${error.message}`, 'error');
        } finally {
            // Restore button state
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    async submitForm(formType, formData) {
        const data = Object.fromEntries(formData);
        
        // Handle checkboxes properly
        if (formType === 'signup') {
            // Convert checkbox values to booleans
            data.terms = data.terms === 'on' || data.terms === true;
            data.newsletter = data.newsletter === 'on' || data.newsletter === true;
            data.remember = data.remember === 'on' || data.remember === true;
            
            // Remove empty optional fields
            if (!data.company_name) delete data.company_name;
            if (!data.startup_stage) delete data.startup_stage;
        }
        
        if (formType === 'login') {
            data.remember = data.remember === 'on' || data.remember === true;
        }
        
        console.log('Submitting data:', data); // Debug log
        
        let endpoint = '';
        switch (formType) {
            case 'signup':
                endpoint = '/auth/signup';
                break;
            case 'login':
                endpoint = '/auth/login';
                break;
            case 'reset':
                endpoint = '/auth/reset-password';
                break;
            case 'update-password':
                endpoint = '/auth/update-password';
                break;
            default:
                throw new Error('Unknown form type');
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        return await response.json();
    }

    async handleFormResponse(response, formType) {
        if (response.success) {
            this.showAlert(response.message, 'success');
            
            if (formType === 'login' || formType === 'signup') {
                if (response.access_token) {
                    this.storeTokens(response.access_token, response.refresh_token);
                }
                
                // Redirect to dashboard after successful login/signup
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            } else if (formType === 'reset') {
                // Stay on page, show success message
            } else if (formType === 'update-password') {
                // Redirect to login
                setTimeout(() => {
                    window.location.href = '/auth/login';
                }, 1500);
            }
        } else {
            this.showAlert(response.message, 'error');
        }
    }

    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        // Insert at top of form
        const form = document.querySelector('.auth-form');
        if (form) {
            form.insertBefore(alert, form.firstChild);
        }

        // Auto-remove success alerts
        if (type === 'success') {
            setTimeout(() => {
                alert.remove();
            }, 5000);
        }
    }

    storeTokens(accessToken, refreshToken) {
        if (accessToken) {
            localStorage.setItem('access_token', accessToken);
        }
        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
        }
    }

    getTokens() {
        return {
            access_token: localStorage.getItem('access_token'),
            refresh_token: localStorage.getItem('refresh_token')
        };
    }

    clearTokens() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
    }

    setupTokenExpiration() {
        // Check token validity periodically
        setInterval(() => {
            this.checkTokenValidity();
        }, 5 * 60 * 1000); // Check every 5 minutes
    }

    async checkTokenValidity() {
        const tokens = this.getTokens();
        if (!tokens.access_token) return;

        try {
            const response = await fetch('/auth/validate', {
                headers: {
                    'Authorization': `Bearer ${tokens.access_token}`
                }
            });

            if (!response.ok) {
                // Token is invalid, try to refresh
                await this.refreshToken();
            }
        } catch (error) {
            console.error('Token validation error:', error);
            this.logout();
        }
    }

    async refreshToken() {
        const tokens = this.getTokens();
        if (!tokens.refresh_token) {
            this.logout();
            return;
        }

        try {
            const response = await fetch('/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh_token: tokens.refresh_token
                })
            });

            const data = await response.json();
            if (data.success && data.access_token) {
                this.storeTokens(data.access_token, data.refresh_token);
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
        }
    }

    async logout() {
        const tokens = this.getTokens();
        
        try {
            await fetch('/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokens.access_token}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        this.clearTokens();
        window.location.href = '/auth/login';
    }

    // Utility function to check if user is authenticated
    isAuthenticated() {
        const tokens = this.getTokens();
        return !!tokens.access_token;
    }

    // Get current user data
    getCurrentUser() {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Utility functions for other scripts
window.AuthUtils = {
    isLoggedIn: () => window.authManager?.isAuthenticated() || false,
    getCurrentUser: () => window.authManager?.getCurrentUser() || null,
    logout: () => window.authManager?.logout(),
    getTokens: () => window.authManager?.getTokens() || {}
};