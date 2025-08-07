// settings.js

/**
 * Display a status message to the user.
 * @param {string} message - The message to show.
 * @param {'success' | 'error' | 'info'} type - Type of message.
 */
function showMessage(message, type = 'success') {
    const messageBox = document.getElementById('message-box');
    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = ''; // Reset all classes
    messageBox.classList.add('animate-fade-in', 'px-4', 'py-2', 'rounded', 'text-sm');

    // Apply color classes based on message type
    const classes = {
        success: ['bg-green-100', 'text-green-800'],
        error: ['bg-red-100', 'text-red-800'],
        info: ['bg-blue-100', 'text-blue-800']
    };

    messageBox.classList.add(...(classes[type] || classes.info));

    // Show and auto-hide message
    messageBox.classList.remove('hidden');
    setTimeout(() => {
        messageBox.classList.add('hidden');
        messageBox.classList.remove('animate-fade-in');
    }, 5000);
}

/**
 * Validates profile form fields and shows inline messages.
 * @returns {boolean} - True if form is valid, otherwise false.
 */
function validateForm() {
    let isValid = true;
    const form = document.getElementById('profileSettingsForm');
    const firstName = form.querySelector('#first-name');
    const lastName = form.querySelector('#last-name');
    const email = form.querySelector('#email');
    const phone = form.querySelector('#phone');

    const showError = (input, msg) => {
        const errorElem = input.nextElementSibling;
        if (errorElem && errorElem.classList.contains('validation-message')) {
            errorElem.textContent = msg;
            errorElem.classList.remove('hidden');
        }
        input.classList.add('border-red-500');
    };

    const clearError = (input) => {
        const errorElem = input.nextElementSibling;
        if (errorElem && errorElem.classList.contains('validation-message')) {
            errorElem.textContent = '';
            errorElem.classList.add('hidden');
        }
        input.classList.remove('border-red-500');
    };

    // Validation rules
    if (!firstName.value.trim()) {
        showError(firstName, 'First Name is required.');
        isValid = false;
    } else clearError(firstName);

    if (!lastName.value.trim()) {
        showError(lastName, 'Last Name is required.');
        isValid = false;
    } else clearError(lastName);

    if (!email.value.trim()) {
        showError(email, 'Email Address is required.');
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        showError(email, 'Please enter a valid email address.');
        isValid = false;
    } else clearError(email);

    const digitsOnly = phone.value.replace(/\D/g, '');
    if (digitsOnly.length > 0 && digitsOnly.length !== 10) {
        showError(phone, 'Please enter a valid 10-digit phone number.');
        isValid = false;
    } else clearError(phone);

    return isValid;
}

/**
 * Fetch the current user data from the backend and populate the form.
 */
async function fetchUserData() {
    try {
        const res = await fetch('php/api/settings.php?action=fetchUserData');
        const result = await res.json();

        if (!result.success) {
            return showMessage('Failed to load user data: ' + (result.message || 'Unknown error'), 'error');
        }

        const { first_name, last_name, email, phone_number, timezone, member_since, last_login } = result.data;

        document.getElementById('first-name').value = first_name || '';
        document.getElementById('last-name').value = last_name || '';
        document.getElementById('email').value = email || '';
        document.getElementById('phone').value = phone_number || '';
        document.getElementById('timezone').value = timezone || 'America/New_York';

        document.getElementById('profileFullName').textContent = `${first_name} ${last_name}`;
        document.getElementById('memberSince').textContent = member_since;
        document.getElementById('lastLogin').textContent = last_login;
        document.getElementById('current-user-name').textContent = `${first_name} ${last_name}`;

        const initials = `${first_name?.[0] ?? ''}${last_name?.[0] ?? ''}`.toUpperCase();
        document.querySelector('.profile-avatar').textContent = initials;

    } catch (err) {
        console.error('Error fetching user data:', err);
        showMessage('An error occurred while loading user data.', 'error');
    }
}

/**
 * Handles the form submit event to update profile.
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
        return showMessage('Please correct the errors in the form.', 'error');
    }

    const form = event.target;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
        const res = await fetch('php/api/settings.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (result.success) {
            showMessage(result.message, 'success');
            fetchUserData(); // Refresh view
        } else {
            showMessage(result.message || 'Profile update failed.', 'error');
        }
    } catch (err) {
        console.error('Error updating profile:', err);
        showMessage('An error occurred while updating your profile.', 'error');
    }
}

/**
 * Formats the phone number input dynamically as the user types.
 */
function attachPhoneInputMask() {
    const phone = document.getElementById('phone');
    if (!phone) return;

    phone.addEventListener('input', (e) => {
        const digits = e.target.value.replace(/\D/g, '');
        let formatted = '';

        if (digits.length > 0) formatted += '(' + digits.substring(0, 3);
        if (digits.length >= 4) formatted += ') ' + digits.substring(3, 6);
        if (digits.length >= 7) formatted += ' ' + digits.substring(6, 10);

        e.target.value = formatted;
    });
}

/**
 * Cancels edits and reverts form to original data.
 */
function attachCancelButtonListener() {
    const cancelButton = document.querySelector('.cancel-button');
    if (!cancelButton) return;

    cancelButton.addEventListener('click', () => {
        fetchUserData();
        showMessage('Changes cancelled.', 'info');
    });
}

/**
 * Adds live validation feedback as user types.
 */
function attachLiveValidationListeners() {
    const inputs = document.querySelectorAll('#profileSettingsForm input, #profileSettingsForm select');
    inputs.forEach(input => {
        input.addEventListener('input', validateForm);
    });
}

// Initialize settings logic on DOM load
document.addEventListener('DOMContentLoaded', () => {
    fetchUserData();
    attachPhoneInputMask();
    attachCancelButtonListener();
    attachLiveValidationListeners();

    const form = document.getElementById('profileSettingsForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});
