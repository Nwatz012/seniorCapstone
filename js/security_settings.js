// js/security_settings.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM element references
    const securitySettingsForm = document.getElementById('securitySettingsForm');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const toggleCurrentPasswordBtn = document.getElementById('toggleCurrentPassword');
    const toggleNewPasswordBtn = document.getElementById('toggleNewPassword');
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
    const messageBox = document.getElementById('message-box');
    const currentUserDisplayName = document.getElementById('current-user-name');
    const logoutButton = document.querySelector('.header-logout-btn');
    const requirementsList = document.getElementById('password-requirements');

    /**
     * Shows a temporary message to the user.
     * @param {string} message - The message content.
     * @param {'success'|'error'} [type='success'] - The type of message for styling.
     */
    function showMessage(message, type = 'success') {
        messageBox.textContent = message;
        messageBox.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        } block`;
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 3000);
    }

    /**
     * Toggles password input visibility and icon.
     * @param {HTMLInputElement} inputElement - The password input element.
     * @param {HTMLElement} toggleButton - The toggle button element.
     */
    function togglePasswordVisibility(inputElement, toggleButton) {
        const icon = toggleButton.querySelector('i');
        if (inputElement.type === 'password') {
            inputElement.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            inputElement.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    }

    // Attach toggle password visibility events
    toggleCurrentPasswordBtn?.addEventListener('click', () => togglePasswordVisibility(currentPasswordInput, toggleCurrentPasswordBtn));
    toggleNewPasswordBtn?.addEventListener('click', () => togglePasswordVisibility(newPasswordInput, toggleNewPasswordBtn));
    toggleConfirmPasswordBtn?.addEventListener('click', () => togglePasswordVisibility(confirmPasswordInput, toggleConfirmPasswordBtn));

    /**
     * Load current user security settings and update the UI.
     */
    async function loadSecuritySettings() {
        try {
            const response = await fetch('php/api/get_security_settings.php');
            const data = await response.json();

            if (data.success) {
                if (currentUserDisplayName) {
                    if (data.user.first_name && data.user.last_name) {
                        currentUserDisplayName.textContent = `${data.user.first_name} ${data.user.last_name}`;
                    } else if (data.user.email) {
                        currentUserDisplayName.textContent = data.user.email;
                    }
                }
            } else {
                showMessage(data.message || 'Failed to load security settings.', 'error');
            }
        } catch (error) {
            console.error('Error loading security settings:', error);
            showMessage('An error occurred while loading settings.', 'error');
        }
    }
    loadSecuritySettings();

    /**
     * Validate password against security requirements.
     * @param {string} password - The password to validate.
     * @returns {string[]} - List of error messages.
     */
    function validatePassword(password) {
        const errors = [];
        if (password.length < 8) errors.push("Password must be at least 8 characters long.");
        if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter.");
        if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter.");
        if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number.");
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Password must contain at least one special character.");
        return errors;
    }

    /**
     * Helper to show validation message below an input.
     * @param {HTMLInputElement} input - Input element.
     * @param {string} message - Validation message.
     */
    function showValidationMessage(input, message) {
        const validationMessageElement = input.closest('.form-group')?.querySelector('.validation-message');
        if (validationMessageElement) {
            validationMessageElement.textContent = message;
            validationMessageElement.classList.remove('hidden');
        }
        input.classList.add('border-red-500');
    }

    /**
     * Helper to clear validation message below an input.
     * @param {HTMLInputElement} input - Input element.
     */
    function clearValidationMessage(input) {
        const validationMessageElement = input.closest('.form-group')?.querySelector('.validation-message');
        if (validationMessageElement) {
            validationMessageElement.textContent = '';
            validationMessageElement.classList.add('hidden');
        }
        input.classList.remove('border-red-500');
    }

    /**
     * Validate the entire form, show errors inline.
     * @returns {boolean} - True if form is valid.
     */
    function validateForm() {
        let isValid = true;

        // Clear previous messages
        [currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach(input => clearValidationMessage(input));

        const currentPassword = currentPasswordInput.value.trim();
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        // Only validate password change fields if new or confirm password is filled
        if (newPassword || confirmPassword) {
            if (!currentPassword) {
                showValidationMessage(currentPasswordInput, 'Current password is required to change password.');
                isValid = false;
            }
            const passwordErrors = validatePassword(newPassword);
            if (passwordErrors.length) {
                showValidationMessage(newPasswordInput, passwordErrors.join(' '));
                isValid = false;
            }
            if (newPassword !== confirmPassword) {
                showValidationMessage(confirmPasswordInput, 'New password and confirm password do not match.');
                isValid = false;
            }
        }

        return isValid;
    }

    // Handle form submission
    securitySettingsForm?.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            showMessage('Please correct the errors in the form.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('current_password', currentPasswordInput.value.trim());
        formData.append('new_password', newPasswordInput.value.trim());
        formData.append('confirm_password', confirmPasswordInput.value.trim());

        try {
            const response = await fetch('php/api/update_security_settings.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                showMessage(data.message || 'Security settings updated successfully!');
                // Clear password fields and validation styles
                [currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach(input => {
                    input.value = '';
                    input.classList.remove('border-red-500');
                });
            } else {
                showMessage(data.message || 'Failed to update security settings.', 'error');
                if (data.errors) {
                    if (data.errors.current_password) showValidationMessage(currentPasswordInput, data.errors.current_password);
                    if (data.errors.new_password) showValidationMessage(newPasswordInput, data.errors.new_password);
                    if (data.errors.confirm_password) showValidationMessage(confirmPasswordInput, data.errors.confirm_password);
                }
            }
        } catch (error) {
            console.error('Error updating security settings:', error);
            showMessage('An unexpected error occurred.', 'error');
        }
    });

    // Logout handler
    logoutButton?.addEventListener('click', async () => {
        try {
            const response = await fetch('php/auth/logout.php', { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                window.location.href = 'login_register.html';
            } else {
                showMessage(data.message || 'Failed to log out.', 'error');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            showMessage('An error occurred during logout.', 'error');
        }
    });

    /**
     * Update the UI for each password requirement.
     * @param {string} elementId - ID of requirement element.
     * @param {boolean} isValid - Whether requirement is met.
     */
    function updateRequirement(elementId, isValid) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.classList.toggle('text-green-500', isValid);
        el.classList.toggle('text-red-500', !isValid);
    }

    // Show/hide password requirements and update as user types
    if (newPasswordInput && requirementsList) {
        newPasswordInput.addEventListener('focus', () => {
            requirementsList.classList.remove('hidden');
        });

        newPasswordInput.addEventListener('blur', () => {
            const pw = newPasswordInput.value;
            const allValid =
                pw.length >= 8 &&
                /[A-Z]/.test(pw) &&
                /[a-z]/.test(pw) &&
                /[0-9]/.test(pw) &&
                /[!@#$%^&*(),.?":{}|<>]/.test(pw);

            if (allValid) requirementsList.classList.add('hidden');
        });

        newPasswordInput.addEventListener('input', () => {
            const pw = newPasswordInput.value;

            updateRequirement('req-length', pw.length >= 8);
            updateRequirement('req-uppercase', /[A-Z]/.test(pw));
            updateRequirement('req-lowercase', /[a-z]/.test(pw));
            updateRequirement('req-number', /[0-9]/.test(pw));
            updateRequirement('req-special', /[!@#$%^&*(),.?":{}|<>]/.test(pw));
        });
    }
});
