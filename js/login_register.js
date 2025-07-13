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
    const tabButtons = document.querySelectorAll('.tab-navigation .tab');
    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const formFeedbackMessage = document.getElementById('form-feedback-message'); // For general form feedback

    // Password toggle functionality
    document.querySelectorAll('.password-toggle').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const passwordInput = document.getElementById(targetId);
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.textContent = '🙈'; // Hide icon
            } else {
                passwordInput.type = 'password';
                this.textContent = '👁'; // Show icon
            }
        });
    });

    // Tab navigation logic
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const formType = button.dataset.form;

            // Update active tab styling
            tabButtons.forEach(btn => btn.classList.remove('active', 'text-green-700', 'font-semibold', 'border-b-2', 'border-green-600'));
            tabButtons.forEach(btn => btn.classList.add('text-gray-600', 'hover:text-green-700'));
            button.classList.add('active', 'text-green-700', 'font-semibold', 'border-b-2', 'border-green-600');
            button.classList.remove('text-gray-600', 'hover:text-green-700');

            // Show/hide forms
            if (formType === 'login') {
                loginForm.classList.add('active');
                loginForm.classList.remove('hidden');
                registrationForm.classList.add('hidden');
                registrationForm.classList.remove('active');
                formTitle.textContent = 'Welcome Back!';
                formSubtitle.innerHTML = `Don't have an account? <a href="#" data-toggle="register">Register here</a>`;
            } else {
                registrationForm.classList.add('active');
                registrationForm.classList.remove('hidden');
                loginForm.classList.add('hidden');
                loginForm.classList.remove('active');
                formTitle.textContent = 'Create Your Account';
                formSubtitle.innerHTML = `Already have an account? <a href="#" data-toggle="login">Sign in here</a>`;
            }
            clearInlineErrors(); // Clear errors when switching tabs
            formFeedbackMessage.textContent = ''; // Clear general feedback
        });
    });

    // Handle subtitle link clicks (for toggling forms)
    document.querySelector('.form-header').addEventListener('click', (event) => {
        if (event.target.tagName === 'A' && event.target.dataset.toggle) {
            event.preventDefault();
            const toggleType = event.target.dataset.toggle;
            const targetButton = document.querySelector(`.tab-navigation button[data-form="${toggleType}"]`);
            if (targetButton) {
                targetButton.click(); // Simulate click on the tab button
            }
        }
    });

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
            const response = await fetch('php/login.php', {
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

        // Get values for new name fields
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();

        let isValid = true;

        // Client-side validation for new name fields
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
        } else if (password.length < 8 || !/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
            showInlineError('registerPassword', 'Password must be at least 8 characters and contain numbers and letters.');
            isValid = false;
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

        // Prepare data to send to PHP, including new name fields
        const userData = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password
        };

        try {
            const response = await fetch('php/register.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showMessage(result.message, 'success');
                // Optionally redirect to login page after successful registration
                setTimeout(() => {
                    // Switch to login tab after successful registration
                    const loginTabButton = document.querySelector('.tab-navigation button[data-form="login"]');
                    if (loginTabButton) {
                        loginTabButton.click();
                        document.getElementById('loginEmail').value = email; // Pre-fill email
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
}); // End DOMContentLoaded
