// =======================================================
// Global Utility Functions
// =======================================================

// Function to display a global message/alert box
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

// Function to display inline error messages below form fields
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

// Function to clear all inline error messages
function clearInlineErrors() {
    const errorDivs = document.querySelectorAll('.error-message');
    errorDivs.forEach(div => {
        div.textContent = '';
        div.style.display = 'none';
    });
}

// A helper function to update the style of a password requirement list item
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

// =======================================================
// Main DOMContentLoaded Event Listener
// =======================================================

document.addEventListener('DOMContentLoaded', () => {

    // Common Elements
    const formFeedbackMessage = document.getElementById('form-feedback-message');
    const passwordToggles = document.querySelectorAll('.password-toggle');

    // Password toggle functionality - robust for any page
    if (passwordToggles) {
        passwordToggles.forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.dataset.target;
                const passwordInput = document.getElementById(targetId);
                if (passwordInput) {
                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        this.textContent = '🙈';
                    } else {
                        passwordInput.type = 'password';
                        this.textContent = '👁';
                    }
                }
            });
        });
    }

    // =======================================================
    // Logic for Login/Register Page (only if elements exist)
    // =======================================================

    const loginForm = document.getElementById('loginForm');
    const registrationForm = document.getElementById('registrationForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const tabButtons = document.querySelectorAll('.tab-navigation .tab');
    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const backToLoginBtn = document.getElementById('backToLoginBtn');
    const registerPasswordInput = document.getElementById('registerPassword');
    const requirementsListForRegister = document.getElementById('password-requirements-register');

    if (loginForm || registrationForm) { // Only run this block if on the login/register page
        // Function to switch form views
        function showForm(formId) {
            const forms = [loginForm, registrationForm, forgotPasswordForm];
            forms.forEach(form => {
                if (form) {
                    if (form.id === formId) {
                        form.classList.remove('hidden');
                        form.classList.add('active');
                    } else {
                        form.classList.add('hidden');
                        form.classList.remove('active');
                    }
                }
            });
        }

        // Tab navigation logic
        if (tabButtons.length > 0) {
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const formType = button.dataset.form;
                    
                    tabButtons.forEach(btn => btn.classList.remove('active', 'text-green-700', 'font-semibold', 'border-b-2', 'border-green-600'));
                    tabButtons.forEach(btn => btn.classList.add('text-gray-600', 'hover:text-green-700'));
                    button.classList.add('active', 'text-green-700', 'font-semibold', 'border-b-2', 'border-green-600');
                    button.classList.remove('text-gray-600', 'hover:text-green-700');

                    if (formType === 'login' && formTitle && formSubtitle) {
                        showForm('loginForm');
                        formTitle.textContent = 'Welcome Back!';
                        formSubtitle.innerHTML = `Don't have an account? <a href="#" data-toggle="register">Register here</a>`;
                    } else if (formTitle && formSubtitle) {
                        showForm('registrationForm');
                        formTitle.textContent = 'Create Your Account';
                        formSubtitle.innerHTML = `Already have an account? <a href="#" data-toggle="login">Sign in here</a>`;
                    }
                    clearInlineErrors();
                    if (formFeedbackMessage) formFeedbackMessage.textContent = '';
                });
            });
        }

        // Handle subtitle link clicks
        document.querySelector('.form-header').addEventListener('click', (event) => {
            if (event.target.tagName === 'A' && event.target.dataset.toggle) {
                event.preventDefault();
                const toggleType = event.target.dataset.toggle;
                const targetButton = document.querySelector(`.tab-navigation button[data-form="${toggleType}"]`);
                if (targetButton) {
                    targetButton.click();
                }
            }
        });

        // Handle forgot password link click
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (event) => {
                event.preventDefault();
                showForm('forgotPasswordForm');
                if (formTitle && formSubtitle) {
                    formTitle.textContent = 'Forgot Password?';
                    formSubtitle.textContent = 'We\'ll send a reset link to your email.';
                }
                if (tabButtons.length > 0) {
                    tabButtons.forEach(btn => btn.classList.remove('active', 'text-green-700', 'font-semibold', 'border-b-2', 'border-green-600'));
                }
                clearInlineErrors();
                if (formFeedbackMessage) formFeedbackMessage.textContent = '';
            });
        }

        // Handle "Back to Login" button click
        if (backToLoginBtn) {
            backToLoginBtn.addEventListener('click', () => {
                showForm('loginForm');
                if (formTitle && formSubtitle) {
                    formTitle.textContent = 'Welcome Back!';
                    formSubtitle.innerHTML = `Don't have an account? <a href="#" data-toggle="register">Register here</a>`;
                }
                const loginTabButton = document.querySelector(`.tab-navigation button[data-form="login"]`);
                if (loginTabButton) {
                    loginTabButton.classList.add('active', 'text-green-700', 'font-semibold', 'border-b-2', 'border-green-600');
                }
                clearInlineErrors();
                if (formFeedbackMessage) formFeedbackMessage.textContent = '';
            });
        }

        // Handle forgot password form submission
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', async function(event) {
                event.preventDefault();
                clearInlineErrors();

                const email = document.getElementById('forgotEmail').value.trim();

                if (!email) {
                    showInlineError('forgotEmail', 'Email is required.');
                    return;
                }

                try {
                    const response = await fetch('php/auth/request_password_reset.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: email })
                    });
                    const result = await response.json();

                    if (result.success) {
                        showMessage(result.message, 'success');
                        forgotPasswordForm.classList.add('hidden');
                        forgotPasswordForm.classList.remove('active');
                        if (formFeedbackMessage) formFeedbackMessage.textContent = result.message;
                    } else {
                        showMessage(result.message || 'Failed to send password reset link.', 'error');
                    }
                } catch (error) {
                    console.error('Network error during password reset request:', error);
                    showMessage('Network error. Could not connect to server.', 'error');
                }
            });
        }
        
        // Login form submission handler
        if (loginForm) {
            loginForm.addEventListener('submit', async function(event) {
                event.preventDefault();
                clearInlineErrors();
                if (formFeedbackMessage) formFeedbackMessage.textContent = '';

                const email = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPassword').value.trim();

                let isValid = true;
                if (!email) {
                    showInlineError('loginEmail', 'Email is required.');
                    isValid = false;
                } else if (!/\S+@\S+\.\S+/.test(email)) {
                    showInlineError('loginEmail', 'Please enter a valid email address.');
                    isValid = false;
                }
                if (!password) {
                    showInlineError('loginPassword', 'Password is required.');
                    isValid = false;
                }

                if (!isValid) {
                    showMessage('Please correct the errors in the form.', 'error');
                    return;
                }

                const loginData = { email, password };

                try {
                    const response = await fetch('php/auth/login.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(loginData)
                    });
                    const result = await response.json();

                    if (response.ok && result.success) {
                        showMessage(result.message, 'success');
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 1500);
                    } else {
                        showMessage(result.message || 'Login failed. Please try again.', 'error');
                    }
                } catch (error) {
                    console.error('Network error during login:', error);
                    showMessage('Network error. Could not connect to server.', 'error');
                    }
            });
        }

        // Registration form submission handler
        if (registrationForm) {
            registrationForm.addEventListener('submit', async function(event) {
                event.preventDefault();
                clearInlineErrors();
                if (formFeedbackMessage) formFeedbackMessage.textContent = '';

                const firstName = document.getElementById('firstName').value.trim();
                const lastName = document.getElementById('lastName').value.trim();
                const email = document.getElementById('registerEmail').value.trim();
                const password = document.getElementById('registerPassword').value.trim();
                const confirmPassword = document.getElementById('confirmPassword').value.trim();

                let isValid = true;

                if (!firstName) {
                    showInlineError('firstName', 'First Name is required.');
                    isValid = false;
                }
                if (!lastName) {
                    showInlineError('lastName', 'Last Name is required.');
                    isValid = false;
                }

                if (!email) {
                    showInlineError('registerEmail', 'Email Address is required.');
                    isValid = false;
                } else if (!/\S+@\S+\.\S+/.test(email)) {
                    showInlineError('registerEmail', 'Please enter a valid email address.');
                    isValid = false;
                }

                if (!password) {
                    showInlineError('registerPassword', 'Password is required.');
                    isValid = false;
                } else {
                    const passwordErrors = [];
                    if (password.length < 8) {
                        passwordErrors.push("Password must be at least 8 characters long.");
                    }
                    if (!/[A-Z]/.test(password)) {
                        passwordErrors.push("Password must contain at least one uppercase letter.");
                    }
                    if (!/[a-z]/.test(password)) {
                        passwordErrors.push("Password must contain at least one lowercase letter.");
                    }
                    if (!/[0-9]/.test(password)) {
                        passwordErrors.push("Password must contain at least one number.");
                    }
                    if (!/[!@$%]/.test(password)) {
                        passwordErrors.push("Password must contain at least one special character (!@$%).");
                    }

                    if (passwordErrors.length > 0) {
                        showInlineError('registerPassword', passwordErrors.join(' '));
                        isValid = false;
                    }
                }
                
                if (!confirmPassword) {
                    showInlineError('confirmPassword', 'Confirm Password is required.');
                    isValid = false;
                } else if (password !== confirmPassword) {
                    showInlineError('confirmPassword', 'Passwords do not match.');
                    isValid = false;
                }
                
                if (!isValid) {
                    showMessage('Please correct the errors in the form.', 'error');
                    return;
                }

                const userData = {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    password: password
                };

                try {
                    const response = await fetch('php/auth/register.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(userData)
                    });
                    const result = await response.json();

                    if (response.ok && result.success) {
                        showMessage(result.message, 'success');
                        setTimeout(() => {
                            const loginTabButton = document.querySelector('.tab-navigation button[data-form="login"]');
                            if (loginTabButton) {
                                loginTabButton.click();
                                if (document.getElementById('loginEmail')) {
                                    document.getElementById('loginEmail').value = email;
                                }
                            }
                            if (formFeedbackMessage) {
                                formFeedbackMessage.textContent = 'Registration successful! Please log in.';
                                formFeedbackMessage.classList.add('success');
                            }
                        }, 2000);
                    } else {
                        showMessage(result.message || 'Registration failed. Please try again.', 'error');
                    }
                } catch (error) {
                    console.error('Network error during registration:', error);
                    showMessage('Network error. Could not connect to server.', 'error');
                }
            });
        }

        // Dynamic Password Feedback Logic for Register Form
        if (registerPasswordInput && requirementsListForRegister) {
            registerPasswordInput.addEventListener('focus', () => {
                requirementsListForRegister.classList.remove('hidden');
            });

            registerPasswordInput.addEventListener('blur', () => {
                const password = registerPasswordInput.value;
                const allRequirementsMet = 
                    password.length >= 8 &&
                    /[A-Z]/.test(password) &&
                    /[a-z]/.test(password) &&
                    /[0-9]/.test(password) &&
                    /[!@$%]/.test(password);

                if (allRequirementsMet) {
                    requirementsListForRegister.classList.add('hidden');
                }
            });

            registerPasswordInput.addEventListener('input', () => {
                const password = registerPasswordInput.value;

                updateRequirement('req-length', password.length >= 8, requirementsListForRegister);
                updateRequirement('req-uppercase', /[A-Z]/.test(password), requirementsListForRegister);
                updateRequirement('req-lowercase', /[a-z]/.test(password), requirementsListForRegister);
                updateRequirement('req-number', /[0-9]/.test(password), requirementsListForRegister);
                updateRequirement('req-special', /[!@$%]/.test(password), requirementsListForRegister);
            });
        }
    }


    // =======================================================
    // Logic for Reset Password Page (only if elements exist)
    // =======================================================
    
    if (resetPasswordForm) {
        // Dynamic password feedback logic for the reset form
        if (newPasswordInput && requirementsList) {
            newPasswordInput.addEventListener('focus', () => {
                requirementsList.classList.remove('hidden');
            });
            newPasswordInput.addEventListener('blur', () => {
                const password = newPasswordInput.value.trim();
                const allRequirementsMet = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[!@$%]/.test(password);
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
        
        // Final Password Reset Form Submission Handler
        resetPasswordForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            clearInlineErrors();
            if (formFeedbackMessage) formFeedbackMessage.textContent = '';

            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');

            if (!token) {
                showMessage('Invalid or missing password reset token.', 'error');
                return;
            }

            const newPassword = newPasswordInput ? newPasswordInput.value.trim() : '';
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';

            let isValid = true;
            
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
                const response = await fetch('php/auth/update_password.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(resetData)
                });
                const result = await response.json();

                if (response.ok && result.success) {
                    showMessage(result.message, 'success');
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
