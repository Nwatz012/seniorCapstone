
import { showMessage } from './utils.js';
import { showConfirmationModal } from './utils.js';

// Function to show messages (reused from other pages)
function showMessage(message, type = 'success') {
    const msgBox = document.getElementById('message-box');
    if (!msgBox) {
        console.error('Message box element not found!');
        return;
    }
    msgBox.textContent = message;
    msgBox.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300';
    
    if (type === 'success') {
        msgBox.classList.add('bg-green-500', 'text-white');
    } else if (type === 'error') {
        msgBox.classList.add('bg-red-500', 'text-white');
    } else {
        msgBox.classList.add('bg-gray-700', 'text-white');
    }
    
    msgBox.classList.remove('hidden');

    setTimeout(() => {
        msgBox.classList.add('hidden');
    }, 3000);
}

// Function to display inline error messages (reused from other pages)
function showInlineError(elementId, message) {
    const errorDiv = document.getElementById(elementId + 'Error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = message ? 'block' : 'none';
        errorDiv.style.color = '#ef4444';
        errorDiv.style.fontSize = '13px';
        errorDiv.style.marginTop = '6px';
    }
}

// Function to clear all inline errors (reused from other pages)
function clearInlineErrors() {
    const errorDivs = document.querySelectorAll('.error-message');
    errorDivs.forEach(div => {
        div.textContent = '';
        div.style.display = 'none';
    });
}

// A helper function to update the style of a requirement list item
const updateRequirement = (elementId, isValid) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    if (isValid) {
        element.classList.add('text-green-500');
        element.classList.remove('text-red-500');
    } else {
        element.classList.remove('text-green-500');
        element.classList.add('text-red-500');
    }
};

// Main logic for the reset password page
document.addEventListener('DOMContentLoaded', () => {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const requirementsList = document.getElementById('password-requirements');
    const formFeedbackMessage = document.getElementById('form-feedback-message');
    
    // --- Initial checks and setup ---
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
        showMessage("Invalid or missing password reset token.", 'error');
        if (resetPasswordForm) resetPasswordForm.classList.add('hidden');
        return;
    }

    // Password toggle functionality (reused)
    document.querySelectorAll('.password-toggle').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const passwordInput = document.getElementById(targetId);
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                this.textContent = '👁';
            }
        });
    });

    // --- Dynamic Password Feedback Logic (reused) ---
    if (newPasswordInput && requirementsList) {
        newPasswordInput.addEventListener('focus', () => {
            requirementsList.classList.remove('hidden');
        });

        newPasswordInput.addEventListener('blur', () => {
            const password = newPasswordInput.value.trim();
            const allRequirementsMet = 
                password.length >= 8 &&
                /[A-Z]/.test(password) &&
                /[a-z]/.test(password) &&
                /[0-9]/.test(password) &&
                /[!@$%]/.test(password);

            if (allRequirementsMet) {
                requirementsList.classList.add('hidden');
            }
        });

        newPasswordInput.addEventListener('input', () => {
            const password = newPasswordInput.value.trim();
            updateRequirement('req-length', password.length >= 8);
            updateRequirement('req-uppercase', /[A-Z]/.test(password));
            updateRequirement('req-lowercase', /[a-z]/.test(password));
            updateRequirement('req-number', /[0-9]/.test(password));
            updateRequirement('req-special', /[!@$%]/.test(password));
        });
    }

    // --- Form Submission Handler for Password Reset ---
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            clearInlineErrors();
            formFeedbackMessage.textContent = '';

            const newPassword = newPasswordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();

            let isValid = true;
            
            // Password validation logic
            if (!newPassword) {
                showInlineError('newPassword', 'New password is required.');
                isValid = false;
            } else {
                const passwordErrors = [];
                if (newPassword.length < 8) passwordErrors.push("Password must be at least 8 characters long.");
                if (!/[A-Z]/.test(newPassword)) passwordErrors.push("Password must contain at least one uppercase letter.");
                if (!/[a-z]/.test(newPassword)) passwordErrors.push("Password must contain at least one lowercase letter.");
                if (!/[0-9]/.test(newPassword)) passwordErrors.push("Password must contain at least one number.");
                if (!/[!@$%]/.test(newPassword)) passwordErrors.push("Password must contain at least one special character (!@$%).");

                if (passwordErrors.length > 0) {
                    showInlineError('newPassword', passwordErrors.join(' '));
                    isValid = false;
                }
            }

            if (!confirmPassword) {
                showInlineError('confirmPassword', 'Confirm Password is required.');
                isValid = false;
            } else if (newPassword !== confirmPassword) {
                showInlineError('confirmPassword', 'Passwords do not match.');
                isValid = false;
            }

            if (!isValid) {
                showMessage('Please correct the errors in the form.', 'error');
                return;
            }

            const resetData = { token: token, new_password: newPassword };

            try {
                const response = await fetch('php/auth/request_password_reset.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(resetData)
                });
                const result = await response.json();

                if (response.ok && result.success) {
                    showMessage(result.message, 'success');
                    // Optionally, redirect to the login page after a successful reset
                    setTimeout(() => {
                         window.location.href = 'login_register.html';
                    }, 2000);
                } else {
                    showMessage(result.message || 'Failed to reset password.', 'error');
                }
            } catch (error) {
                console.error('Network error during password reset:', error);
                showMessage('Network error. Could not connect to server.', 'error');
            }
        });
    }
});