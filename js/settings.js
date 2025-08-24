// settings.js

/**
 * This script manages the user settings page, including fetching user data,
 * handling form validation, submitting updates, and providing real-time feedback.
 */

// -------------------------------------------------------------------------
// 1. UI Utility Functions
// -------------------------------------------------------------------------

/**
 * Displays a status message to the user in a designated message box.
 * The message is automatically hidden after a short duration.
 * @param {string} message - The message text to display.
 * @param {'success' | 'error' | 'info'} type - The type of message, which determines the color scheme.
 */
function showMessage(message, type = 'success') {
    const messageBox = document.getElementById('message-box');
    if (!messageBox) return;

    // Reset classes and set message text.
    messageBox.textContent = message;
    messageBox.className = '';
    messageBox.classList.add('animate-fade-in', 'px-4', 'py-2', 'rounded', 'text-sm');

    // Apply specific color classes based on the message type.
    const classes = {
        success: ['bg-green-100', 'text-green-800'],
        error: ['bg-red-100', 'text-red-800'],
        info: ['bg-blue-100', 'text-blue-800']
    };

    messageBox.classList.add(...(classes[type] || classes.info));

    // Make the message box visible and set a timer to hide it.
    messageBox.classList.remove('hidden');
    setTimeout(() => {
        messageBox.classList.add('hidden');
        messageBox.classList.remove('animate-fade-in');
    }, 5000);
}

// -------------------------------------------------------------------------
// 2. Form Validation Logic
// -------------------------------------------------------------------------

/**
 * Validates the profile settings form fields.
 * It checks for required fields, email format, and phone number length.
 * Displays inline error messages next to invalid fields.
 * @returns {boolean} - True if the form is valid, otherwise false.
 */
function validateForm() {
    let isValid = true;
    const form = document.getElementById('profileSettingsForm');
    const firstName = form.querySelector('#first-name');
    const lastName = form.querySelector('#last-name');
    const email = form.querySelector('#email');
    const phone = form.querySelector('#phone');

    /**
     * Helper function to show a validation error message for a specific input.
     * @param {HTMLElement} input - The form input element.
     * @param {string} msg - The error message to display.
     */
    const showError = (input, msg) => {
        const errorElem = input.nextElementSibling;
        if (errorElem && errorElem.classList.contains('validation-message')) {
            errorElem.textContent = msg;
            errorElem.classList.remove('hidden');
        }
        input.classList.add('border-red-500');
    };

    /**
     * Helper function to clear a validation error message for a specific input.
     * @param {HTMLElement} input - The form input element.
     */
    const clearError = (input) => {
        const errorElem = input.nextElementSibling;
        if (errorElem && errorElem.classList.contains('validation-message')) {
            errorElem.textContent = '';
            errorElem.classList.add('hidden');
        }
        input.classList.remove('border-red-500');
    };

    // --- Apply validation rules for each field ---
    // First Name validation
    if (!firstName.value.trim()) {
        showError(firstName, 'First Name is required.');
        isValid = false;
    } else clearError(firstName);

    // Last Name validation
    if (!lastName.value.trim()) {
        showError(lastName, 'Last Name is required.');
        isValid = false;
    } else clearError(lastName);

    // Email validation
    if (!email.value.trim()) {
        showError(email, 'Email Address is required.');
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        showError(email, 'Please enter a valid email address.');
        isValid = false;
    } else clearError(email);

    // Phone number validation (optional but checks length if provided)
    const digitsOnly = phone.value.replace(/\D/g, '');
    if (digitsOnly.length > 0 && digitsOnly.length !== 10) {
        showError(phone, 'Please enter a valid 10-digit phone number.');
        isValid = false;
    } else clearError(phone);

    return isValid;
}

// -------------------------------------------------------------------------
// 3. Data Fetching and Submission Functions
// -------------------------------------------------------------------------

/**
 * Fetches the current user's profile data from the backend.
 * Populates the form fields and various UI elements with the retrieved data.
 */
async function fetchUserData() {
    try {
        const res = await fetch('php/api/settings.php?action=fetchUserData');
        const result = await res.json();

        if (!result.success) {
            return showMessage('Failed to load user data: ' + (result.message || 'Unknown error'), 'error');
        }

        const { first_name, last_name, email, phone_number, timezone, member_since, last_login } = result.data;

        // Populate form inputs
        document.getElementById('first-name').value = first_name || '';
        document.getElementById('last-name').value = last_name || '';
        document.getElementById('email').value = email || '';
        document.getElementById('phone').value = phone_number || '';
        document.getElementById('timezone').value = timezone || 'America/New_York';

        // Update display elements
        document.getElementById('profileFullName').textContent = `${first_name} ${last_name}`;
        document.getElementById('memberSince').textContent = member_since;
        document.getElementById('lastLogin').textContent = last_login;
        document.getElementById('current-user-name').textContent = `${first_name} ${last_name}`;

        // Generate and display initials for the avatar.
        const initials = `${first_name?.[0] ?? ''}${last_name?.[0] ?? ''}`.toUpperCase();
        document.querySelector('.profile-avatar').textContent = initials;

    } catch (err) {
        console.error('Error fetching user data:', err);
        showMessage('An error occurred while loading user data.', 'error');
    }
}

/**
 * Handles the profile form submission.
 * Validates the form, sends the updated data to the backend via POST request,
 * and handles the server's response.
 * @param {Event} event - The form submit event.
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    // Run validation before attempting to submit.
    if (!validateForm()) {
        return showMessage('Please correct the errors in the form.', 'error');
    }

    const form = event.target;
    // Collect form data into a plain JavaScript object.
    const data = Object.fromEntries(new FormData(form).entries());

    try {
        const res = await fetch('php/api/settings.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data) // Send data as JSON.
        });

        const result = await res.json();
        if (result.success) {
            showMessage(result.message, 'success');
            fetchUserData(); // Refresh the page with the newly saved data.
        } else {
            showMessage(result.message || 'Profile update failed.', 'error');
        }
    } catch (err) {
        console.error('Error updating profile:', err);
        showMessage('An error occurred while updating your profile.', 'error');
    }
}

// -------------------------------------------------------------------------
// 4. Event Listener Attachments
// -------------------------------------------------------------------------

/**
 * Attaches an event listener to the phone input to format the number
 * dynamically as the user types (e.g., (123) 456 7890).
 */
function attachPhoneInputMask() {
    const phone = document.getElementById('phone');
    if (!phone) return;

    phone.addEventListener('input', (e) => {
        // Remove all non-digit characters.
        const digits = e.target.value.replace(/\D/g, '');
        let formatted = '';

        // Apply the formatting logic based on the number of digits.
        if (digits.length > 0) formatted += '(' + digits.substring(0, 3);
        if (digits.length >= 4) formatted += ') ' + digits.substring(3, 6);
        if (digits.length >= 7) formatted += ' ' + digits.substring(6, 10);

        e.target.value = formatted;
    });
}

/**
 * Attaches a click listener to the 'Cancel' button.
 * When clicked, it reverts the form fields to their original fetched state.
 */
function attachCancelButtonListener() {
    const cancelButton = document.querySelector('.cancel-button');
    if (!cancelButton) return;

    cancelButton.addEventListener('click', () => {
        fetchUserData(); // Re-fetch the data to reset the form.
        showMessage('Changes cancelled.', 'info');
    });
}

/**
 * Attaches 'input' event listeners to all form inputs to provide
 * real-time validation feedback as the user types.
 */
function attachLiveValidationListeners() {
    const inputs = document.querySelectorAll('#profileSettingsForm input, #profileSettingsForm select');
    inputs.forEach(input => {
        // The event listener calls the main validation function on every keystroke.
        input.addEventListener('input', validateForm);
    });
}

// -------------------------------------------------------------------------
// 5. Initialization
// -------------------------------------------------------------------------

// Entry point of the script. This ensures the DOM is ready before we
// try to access any elements or attach listeners.
document.addEventListener('DOMContentLoaded', () => {
    // Call the initial functions to set up the page.
    fetchUserData();
    attachPhoneInputMask();
    attachCancelButtonListener();
    attachLiveValidationListeners();

    // Attach the main form submit handler to the form.
    const form = document.getElementById('profileSettingsForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});