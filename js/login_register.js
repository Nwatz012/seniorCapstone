// Utility function for displaying messages
function showMessage(message, type = 'success') {
    const msgBox = document.getElementById('message-box');
    if (!msgBox) {
        console.error('Message box element not found!');
        return;
    }
    msgBox.textContent = message;
    msgBox.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300'; // Reset classes
    
    if (type === 'success') {
        msgBox.classList.add('bg-green-500', 'text-white');
    } else if (type === 'error') {
        msgBox.classList.add('bg-red-500', 'text-white');
    } else {
        msgBox.classList.add('bg-gray-700', 'text-white'); // Default
    }
    
    msgBox.classList.remove('hidden');

    setTimeout(() => {
        msgBox.classList.add('hidden');
    }, 3000);
}

// Function to display inline error messages
function showInlineError(elementId, message) {
    const errorDiv = document.getElementById(elementId + 'Error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = message ? 'block' : 'none';
        errorDiv.style.color = '#ef4444'; // Tailwind red-500
        errorDiv.style.fontSize = '13px';
        errorDiv.style.marginTop = '6px';
    }
}

// Clear all inline errors
function clearInlineErrors() {
    const errorDivs = document.querySelectorAll('.error-message');
    errorDivs.forEach(div => {
        div.textContent = '';
        div.style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements for Login/Register Page
    const loginForm = document.getElementById('loginForm');
    const registrationForm = document.getElementById('registrationForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const tabButtons = document.querySelectorAll('.tab-navigation .tab');
    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const formFeedbackMessage = document.getElementById('form-feedback-message');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const backToLoginBtn = document.getElementById('backToLoginBtn');

    // Password toggle functionality
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
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const formType = button.dataset.form;
            
            tabButtons.forEach(btn => btn.classList.remove('active', 'text-green-700', 'font-semibold', 'border-b-2', 'border-green-600'));
            tabButtons.forEach(btn => btn.classList.add('text-gray-600', 'hover:text-green-700'));
            button.classList.add('active', 'text-green-700', 'font-semibold', 'border-b-2', 'border-green-600');
            button.classList.remove('text-gray-600', 'hover:text-green-700');

            if (formType === 'login') {
                showForm('loginForm');
                formTitle.textContent = 'Welcome Back!';
                formSubtitle.innerHTML = `Don't have an account? <a href="#" data-toggle="register">Register here</a>`;
            } else {
                showForm('registrationForm');
                formTitle.textContent = 'Create Your Account';
                formSubtitle.innerHTML = `Already have an account? <a href="#" data-toggle="login">Sign in here</a>`;
            }
            clearInlineErrors();
            formFeedbackMessage.textContent = '';
        });
    });

    // Handle subtitle link clicks (for toggling forms)
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
            formTitle.textContent = 'Forgot Password?';
            formSubtitle.textContent = 'We\'ll send a reset link to your email.';
            tabButtons.forEach(btn => btn.classList.remove('active', 'text-green-700', 'font-semibold', 'border-b-2', 'border-green-600'));
            clearInlineErrors();
            formFeedbackMessage.textContent = '';
        });
    }

    // Handle "Back to Login" button click
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', () => {
            showForm('loginForm');
            formTitle.textContent = 'Welcome Back!';
            formSubtitle.innerHTML = `Don't have an account? <a href="#" data-toggle="register">Register here</a>`;
            const loginTabButton = document.querySelector(`.tab-navigation button[data-form="login"]`);
            if (loginTabButton) {
                loginTabButton.classList.add('active', 'text-green-700', 'font-semibold', 'border-b-2', 'border-green-600');
            }
            clearInlineErrors();
            formFeedbackMessage.textContent = '';
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
                    formFeedbackMessage.textContent = result.message;
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
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        clearInlineErrors();
        formFeedbackMessage.textContent = '';

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

    // Registration form submission handler
    registrationForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        clearInlineErrors();
        formFeedbackMessage.textContent = '';

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
                        document.getElementById('loginEmail').value = email;
                    }
                    formFeedbackMessage.textContent = 'Registration successful! Please log in.';
                    formFeedbackMessage.classList.add('success');
                }, 2000);
            } else {
                showMessage(result.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Network error during registration:', error);
            showMessage('Network error. Could not connect to server.', 'error');
        }
    });

    // Dynamic Password Feedback Logic
    const passwordInput = document.getElementById('registerPassword');
    const requirementsList = document.getElementById('password-requirements');

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

    if (passwordInput && requirementsList) {
        passwordInput.addEventListener('focus', () => {
            requirementsList.classList.remove('hidden');
        });

        passwordInput.addEventListener('blur', () => {
            const password = passwordInput.value;
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

        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;

            updateRequirement('req-length', password.length >= 8);
            updateRequirement('req-uppercase', /[A-Z]/.test(password));
            updateRequirement('req-lowercase', /[a-z]/.test(password));
            updateRequirement('req-number', /[0-9]/.test(password));
            updateRequirement('req-special', /[!@$%]/.test(password));
        });
    }
});