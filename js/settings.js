// public/js/settings.js

document.addEventListener('DOMContentLoaded', () => {
    // Main page elements
    const editProfileBtn = document.getElementById('editProfileBtn');
    const profileFullNameDisplay = document.getElementById('profileFullName');
    const profileEmailDisplay = document.getElementById('profileEmail');
    const memberSinceDisplay = document.getElementById('memberSince');
    const lastLoginDisplay = document.getElementById('lastLogin');

    // Home Details display elements
    const homeAddressDisplay = document.getElementById('homeAddress');
    const homeSizeDisplay = document.getElementById('homeSize');
    const homeYearBuiltDisplay = document.getElementById('homeYearBuilt');
    const homeRoofTypeDisplay = document.getElementById('homeRoofType');

    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    const logoutBtnBottom = document.getElementById('logoutBtnBottom');

    // Modal elements
    const profileEditModal = document.getElementById('profileEditModal');
    const profileEditForm = document.getElementById('profileEditForm');
    const cancelProfileEditBtn = document.getElementById('cancelProfileEditBtn');

    // Modal form inputs
    const modalFirstName = document.getElementById('modal-first-name');
    const modalLastName = document.getElementById('modal-last-name');
    const modalEmail = document.getElementById('modal-email');
    const modalPhone = document.getElementById('modal-phone');
    const modalTimezone = document.getElementById('modal-timezone');

    // Security Form elements
    const securitySettingsForm = document.getElementById('securitySettingsForm');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // Password Toggle Buttons
    const toggleCurrentPasswordBtn = document.getElementById('toggleCurrentPassword');
    const toggleNewPasswordBtn = document.getElementById('toggleNewPassword');
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');

    // --- Utility functions (from utils.js, assumed to be loaded) ---
    // Make sure showMessageBox function is defined in public/js/utils.js

    function showValidationMessage(inputElement, message, isError = true) {
        const validationDiv = inputElement.nextElementSibling;
        if (validationDiv && validationDiv.classList.contains('validation-message')) {
            validationDiv.textContent = message;
            if (isError) {
                validationDiv.classList.add('text-red-500');
                validationDiv.classList.remove('text-gray-600');
            } else {
                validationDiv.classList.remove('text-red-500');
                validationDiv.classList.add('text-gray-600');
            }
            validationDiv.classList.remove('hidden');
        }
    }

    function hideValidationMessage(inputElement) {
        const validationDiv = inputElement.nextElementSibling;
        if (validationDiv && validationDiv.classList.contains('validation-message')) {
            validationDiv.classList.add('hidden');
            validationDiv.textContent = '';
        }
    }

    function clearAllValidationMessages(formElement) {
        formElement.querySelectorAll('.validation-message').forEach(msg => {
            msg.classList.add('hidden');
            msg.textContent = '';
        });
    }

    function validateProfileEditForm() {
        let isValid = true;
        // ... (existing validation logic for profile form)
        if (modalFirstName.value.trim() === '') {
            showValidationMessage(modalFirstName, 'First name is required.');
            isValid = false;
        } else {
            hideValidationMessage(modalFirstName);
        }

        if (modalLastName.value.trim() === '') {
            showValidationMessage(modalLastName, 'Last name is required.');
            isValid = false;
        } else {
            hideValidationMessage(modalLastName);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (modalEmail.value.trim() === '' || !emailRegex.test(modalEmail.value.trim())) {
            showValidationMessage(modalEmail, 'Please enter a valid email address.');
            isValid = false;
        } else {
            hideValidationMessage(modalEmail);
        }
        return isValid;
    }

    // Basic client-side validation for security form
    function validateSecurityForm() {
        let isValid = true;

        // Only validate password change if new password fields are filled
        if (newPasswordInput.value.trim() !== '' || confirmPasswordInput.value.trim() !== '') {
            if (currentPasswordInput.value.trim() === '') {
                showValidationMessage(currentPasswordInput, 'Current password is required to change password.');
                isValid = false;
            } else {
                hideValidationMessage(currentPasswordInput);
            }

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/; // Min 8 chars, 1 uppercase, 1 lowercase, 1 number
            if (!passwordRegex.test(newPasswordInput.value.trim())) {
                showValidationMessage(newPasswordInput, 'Password must be at least 8 characters with uppercase, lowercase, and number.');
                isValid = false;
            } else {
                hideValidationMessage(newPasswordInput);
            }

            if (newPasswordInput.value !== confirmPasswordInput.value) {
                showValidationMessage(confirmPasswordInput, 'Passwords do not match.');
                isValid = false;
            } else {
                hideValidationMessage(confirmPasswordInput);
            }
        } else {
            // Clear validation messages if new password fields are empty
            hideValidationMessage(currentPasswordInput);
            hideValidationMessage(newPasswordInput);
            hideValidationMessage(confirmPasswordInput);
        }
        return isValid;
    }


    // --- Modal Functions ---

    function openProfileEditModal() {
        clearAllValidationMessages(profileEditForm); // Clear any old messages
        profileEditModal.classList.remove('hidden');
        profileEditModal.classList.add('flex'); // Use flex to center
        populateProfileEditForm(); // Load current data into modal
    }

    function closeProfileEditModal() {
        profileEditModal.classList.add('hidden');
        profileEditModal.classList.remove('flex');
    }


    // --- Data Loading ---

    async function loadSettingsData() {
        try {
            const response = await fetch('settings.php?action=get_data');
            const data = await response.json();

            if (data.success) {
                const userData = data.user_data;
                const homeData = data.home_data;

                // Populate Profile Information section (main page)
                profileFullNameDisplay.textContent = `${userData.first_name || ''} ${userData.last_name || ''}`;
                profileEmailDisplay.textContent = userData.email || 'N/A';
                memberSinceDisplay.textContent = userData.member_since || 'N/A';
                lastLoginDisplay.textContent = userData.last_login || 'N/A';

                // Populate Home Details section (main page)
                homeAddressDisplay.textContent = homeData.address || 'N/A';
                homeSizeDisplay.textContent = homeData.square_footage ? `${homeData.square_footage} sq. ft.` : 'N/A';
                homeYearBuiltDisplay.textContent = homeData.year_built || 'N/A';
                homeRoofTypeDisplay.textContent = homeData.roof_type || 'N/A';

                // Populate Security settings toggles (only if security form is implemented fully)
                // For now, these are direct fetches as the form is simplified
                const twoFactorAuthCheckbox = document.getElementById('two-factor-auth');
                if (twoFactorAuthCheckbox) {
                    twoFactorAuthCheckbox.checked = userData.two_factor_auth === 1;
                }
                const loginNotificationsCheckbox = document.getElementById('login-notifications');
                if (loginNotificationsCheckbox) {
                    loginNotificationsCheckbox.checked = userData.login_notifications === 1;
                }

            } else {
                showMessageBox(data.message || 'Failed to load settings data.', 'error');
            }
        } catch (error) {
            console.error('Error loading settings data:', error);
            showMessageBox('An error occurred while loading settings. Please try again.', 'error');
        }
    }

    async function populateProfileEditForm() {
        try {
            const response = await fetch('settings.php?action=get_data');
            const data = await response.json();

            if (data.success) {
                const userData = data.user_data;
                modalFirstName.value = userData.first_name || '';
                modalLastName.value = userData.last_name || '';
                modalEmail.value = userData.email || '';
                modalPhone.value = userData.phone || '';
                modalTimezone.value = userData.timezone || 'America/New_York';
            } else {
                showMessageBox(data.message || 'Failed to load profile data for editing.', 'error');
                closeProfileEditModal();
            }
        } catch (error) {
            console.error('Error populating profile edit form:', error);
            showMessageBox('An error occurred loading profile data.', 'error');
            closeProfileEditModal();
        }
    }


    // --- Form Submissions ---

    async function handleProfileEditSubmit(event) {
        event.preventDefault();

        if (!validateProfileEditForm()) {
            showMessageBox('Please correct the errors in the form.', 'error');
            return;
        }

        const formData = new FormData(profileEditForm);
        formData.append('action', 'update_data');
        formData.append('form_id', 'profileSettingsForm');

        try {
            const response = await fetch('settings.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                showMessageBox(result.message, 'success');
                closeProfileEditModal();
                loadSettingsData();
            } else {
                if (result.errors) {
                    for (const field in result.errors) {
                        const inputElement = profileEditForm.querySelector(`[name="${field}"]`);
                        if (inputElement) {
                            showValidationMessage(inputElement, result.errors[field], true);
                        }
                    }
                    showMessageBox(result.message || 'Please correct the highlighted errors.', 'error');
                } else {
                    showMessageBox(result.message || 'An unexpected error occurred.', 'error');
                }
            }
        } catch (error) {
            console.error('Error submitting profile edit form:', error);
            showMessageBox('An error occurred while saving changes. Please try again.', 'error');
        }
    }

    async function handleSecuritySettingsSubmit(event) {
        event.preventDefault();

        if (!validateSecurityForm()) {
            showMessageBox('Please correct the errors in the form.', 'error');
            return;
        }

        const formData = new FormData(securitySettingsForm);
        formData.append('action', 'update_data');
        formData.append('form_id', 'securitySettingsForm');

        try {
            const response = await fetch('settings.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                showMessageBox(result.message, 'success');
                // Clear password fields after successful update
                currentPasswordInput.value = '';
                newPasswordInput.value = '';
                confirmPasswordInput.value = '';
                clearAllValidationMessages(securitySettingsForm);
                loadSettingsData(); // Re-load to ensure toggles are updated if backend changes them
            } else {
                if (result.errors) {
                    for (const field in result.errors) {
                        const inputElement = securitySettingsForm.querySelector(`[name="${field}"]`);
                        if (inputElement) {
                            showValidationMessage(inputElement, result.errors[field], true);
                        }
                    }
                    showMessageBox(result.message || 'Please correct the highlighted errors.', 'error');
                } else {
                    showMessageBox(result.message || 'An unexpected error occurred.', 'error');
                }
            }
        } catch (error) {
            console.error('Error submitting security form:', error);
            showMessageBox('An error occurred while saving security settings. Please try again.', 'error');
        }
    }


    // --- Password Toggle Functionality ---

    function setupPasswordToggle(inputElement, toggleButton) {
        toggleButton.addEventListener('click', () => {
            const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
            inputElement.setAttribute('type', type);
            // Toggle eye icon
            toggleButton.querySelector('i').classList.toggle('fa-eye');
            toggleButton.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    setupPasswordToggle(currentPasswordInput, toggleCurrentPasswordBtn);
    setupPasswordToggle(newPasswordInput, toggleNewPasswordBtn);
    setupPasswordToggle(confirmPasswordInput, toggleConfirmPasswordBtn);


    // --- Sidebar Navigation Scroll & Active State ---

    const sections = document.querySelectorAll('.section'); // All sections to observe

    const observerOptions = {
        root: null, // relative to the viewport
        rootMargin: '0px',
        threshold: 0.5 // Trigger when 50% of the section is visible
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentSectionId = entry.target.id;
                sidebarLinks.forEach(link => {
                    link.classList.remove('active', 'bg-blue-100', 'text-blue-700');
                    link.removeAttribute('aria-current');
                    if (link.getAttribute('href') === `#${currentSectionId}`) {
                        link.classList.add('active', 'bg-blue-100', 'text-blue-700');
                        link.setAttribute('aria-current', 'page');
                    }
                });
            }
        });
    }, observerOptions);

    // Observe each section
    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // Sidebar click listener (still needed for immediate smooth scroll)
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default anchor link behavior

            // Smooth scroll to the target section
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // Immediately set active class on click for responsiveness,
            // IntersectionObserver will correct if scroll goes elsewhere.
            sidebarLinks.forEach(item => item.classList.remove('active', 'bg-blue-100', 'text-blue-700'));
            this.classList.add('active', 'bg-blue-100', 'text-blue-700');
            this.setAttribute('aria-current', 'page');
        });
    });


    // --- Other Event Listeners ---

    // Open profile edit modal
    editProfileBtn.addEventListener('click', openProfileEditModal);

    // Close profile edit modal
    cancelProfileEditBtn.addEventListener('click', closeProfileEditModal);
    profileEditModal.addEventListener('click', (e) => {
        if (e.target === profileEditModal) { // Close only if clicking on overlay, not content
            closeProfileEditModal();
        }
    });

    // Submit profile edit form
    profileEditForm.addEventListener('submit', handleProfileEditSubmit);

    // Submit security settings form
    securitySettingsForm.addEventListener('submit', handleSecuritySettingsSubmit);

    // Add event listeners for "Cancel" buttons in forms
    document.querySelectorAll('.cancel-button').forEach(button => {
        button.addEventListener('click', (event) => {
            if (event.target.closest('form')) {
                event.target.closest('form').reset(); // Reset the form
                clearAllValidationMessages(event.target.closest('form')); // Clear validation messages
            }
        });
    });


    // Handle Logout button
    if (logoutBtnBottom) {
        logoutBtnBottom.addEventListener('click', async () => {
            showMessageBox('Logging out...', 'info');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
            window.location.href = 'index.html'; // Redirect to login/home page
        });
    }

    // Initial data load when the page loads
    loadSettingsData();
});