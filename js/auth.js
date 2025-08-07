// public/js/auth.js

import { showMessage, showConfirmationModal } from './utils.js';
import { fetchUserName, logoutUser } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.querySelector('.header-logout-btn');
    const currentUserDisplayName = document.getElementById('current-user-name');

    // Display the user's name in the header
    fetchUserName().then(name => {
        if (currentUserDisplayName) {
            currentUserDisplayName.textContent = name;
        }
    });

    // Add the event listener for the logout button
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            const confirmed = await showConfirmationModal('Are you sure you want to log out?', 'Confirm Logout');
            if (confirmed) {
                const success = await logoutUser();
                if (success) {
                    window.location.href = 'login_register.html';
                }
            }
        });
    }
});
