// js/security_settings.js

document.addEventListener('DOMContentLoaded', () => {
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


    // Function to show messages
    function showMessage(message, type = 'success') {
        messageBox.textContent = message;
        messageBox.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} block`;
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 3000);
    }

    // Function to toggle password visibility
    function togglePasswordVisibility(inputElement, toggleButton) {
        const icon = toggleButton.querySelector('i');
        if (inputElement.type === 'password') {
            inputElement.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            inputElement.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    // Event listeners for password toggles
    toggleCurrentPasswordBtn.addEventListener('click', () => togglePasswordVisibility(currentPasswordInput, toggleCurrentPasswordBtn));
    toggleNewPasswordBtn.addEventListener('click', () => togglePasswordVisibility(newPasswordInput, toggleNewPasswordBtn));
    toggleConfirmPasswordBtn.addEventListener('click', () => togglePasswordVisibility(confirmPasswordInput, toggleConfirmPasswordBtn));

    // Function to load user security settings
    async function loadSecuritySettings() {
        try {
            const response = await fetch('php/api/get_security_settings.php');
            const data = await response.json();

            if (data.success) {
                // Update the display name in the header
                if (currentUserDisplayName && data.user.first_name && data.user.last_name) {
                    currentUserDisplayName.textContent = `${data.user.first_name} ${data.user.last_name}`;
                } else if (currentUserDisplayName && data.user.email) {
                    currentUserDisplayName.textContent = data.user.email;
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


    // Function to validate password strength
    function validatePassword(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push("Password must be at least 8 characters long.");
        }
        if (!/[A-Z]/.test(password)) {
            errors.push("Password must contain at least one uppercase letter.");
        }
        if (!/[a-z]/.test(password)) {
            errors.push("Password must contain at least one lowercase letter.");
        }
        if (!/[0-9]/.test(password)) {
            errors.push("Password must contain at least one number.");
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push("Password must contain at least one special character.");
        }
        return errors;
    }

    // Form submission handler
    securitySettingsForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Clear previous validation messages
        document.querySelectorAll('.validation-message').forEach(el => {
            el.textContent = '';
            el.classList.add('hidden');
        });

        let isValid = true;

        // Get and trim the password values to avoid issues with whitespace
        const currentPassword = currentPasswordInput.value.trim();
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        // Password change validation
        if (newPassword || confirmPassword) { // Only validate if new password fields are being used
            if (!currentPassword) {
                // Corrected selector: Find the validation message within the parent form-group
                const validationMessageElement = currentPasswordInput.closest('.form-group').querySelector('.validation-message');
                if (validationMessageElement) {
                    validationMessageElement.textContent = 'Current password is required to change password.';
                    validationMessageElement.classList.remove('hidden');
                }
                isValid = false;
            }

            const newPasswordErrors = validatePassword(newPassword);
            if (newPasswordErrors.length > 0) {
                // Corrected selector: Find the validation message within the parent form-group
                const validationMessageElement = newPasswordInput.closest('.form-group').querySelector('.validation-message');
                if (validationMessageElement) {
                    validationMessageElement.textContent = newPasswordErrors.join(' ');
                    validationMessageElement.classList.remove('hidden');
                }
                isValid = false;
            }

            // Compare the trimmed password values
            if (newPassword !== confirmPassword) {
                // Corrected selector: Find the validation message within the parent form-group
                const validationMessageElement = confirmPasswordInput.closest('.form-group').querySelector('.validation-message');
                if (validationMessageElement) {
                    validationMessageElement.textContent = 'New password and confirm password do not match.';
                    validationMessageElement.classList.remove('hidden');
                }
                isValid = false;
            }
        }

        if (!isValid) {
            showMessage('Please correct the errors in the form.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('current_password', currentPassword);
        formData.append('new_password', newPassword);
        // Add this line to send the confirm password value to the server
        formData.append('confirm_password', confirmPassword); 
        

        try {
            const response = await fetch('php/api/update_security_settings.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                showMessage(data.message || 'Security settings updated successfully!');
                // Clear password fields after successful update
                currentPasswordInput.value = '';
                newPasswordInput.value = '';
                newPasswordInput.classList.remove('border-red-500'); // Ensure no red border
                confirmPasswordInput.value = '';
                confirmPasswordInput.classList.remove('border-red-500'); // Ensure no red border
            } else {
                showMessage(data.message || 'Failed to update security settings.', 'error');
                if (data.errors) {
                    // Display specific validation errors from the backend
                    if (data.errors.current_password) {
                        const validationMessageElement = currentPasswordInput.closest('.form-group').querySelector('.validation-message');
                        if (validationMessageElement) {
                            validationMessageElement.textContent = data.errors.current_password;
                            validationMessageElement.classList.remove('hidden');
                        }
                    }
                    if (data.errors.new_password) {
                        const validationMessageElement = newPasswordInput.closest('.form-group').querySelector('.validation-message');
                        if (validationMessageElement) {
                            validationMessageElement.textContent = data.errors.new_password;
                            validationMessageElement.classList.remove('hidden');
                        }
                    }
                    if (data.errors.confirm_password) {
                        const validationMessageElement = confirmPasswordInput.closest('.form-group').querySelector('.validation-message');
                        if (validationMessageElement) {
                            validationMessageElement.textContent = data.errors.confirm_password;
                            validationMessageElement.classList.remove('hidden');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error updating security settings:', error);
            showMessage('An unexpected error occurred.', 'error');
        }
    });

    // Logout functionality
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('php/auth/logout.php', {
                    method: 'POST'
                });
                const data = await response.json();
                if (data.success) {
                    window.location.href = 'login_register.html'; // Redirect to login page
                } else {
                    showMessage(data.message || 'Failed to log out.', 'error');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                showMessage('An error occurred during logout.', 'error');
            }
        });
    }

    // Initial load of settings
    loadSecuritySettings();

    // --- New Dynamic Password Feedback Logic ---
    const requirementsList = document.getElementById('password-requirements');

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

    // Show requirements when the user focuses on the password field
    if (newPasswordInput && requirementsList) {
        newPasswordInput.addEventListener('focus', () => {
            requirementsList.classList.remove('hidden');
        });

        // Hide requirements when the user leaves the password field, but only if all requirements are met
        newPasswordInput.addEventListener('blur', () => {
            const password = newPasswordInput.value;
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

        // Validate and update requirements as the user types
        newPasswordInput.addEventListener('input', () => {
            const password = newPasswordInput.value;

            updateRequirement('req-length', password.length >= 8);
            updateRequirement('req-uppercase', /[A-Z]/.test(password));
            updateRequirement('req-lowercase', /[a-z]/.test(password));
            updateRequirement('req-number', /[0-9]/.test(password));
            updateRequirement('req-special', /[!@$%]/.test(password));
        });
    }
}); // End DOMContentLoaded