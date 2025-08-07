

import { showMessage } from './utils.js';
import { showConfirmationModal } from './utils.js';

// Utility function for displaying messages (reused from other pages)


document.addEventListener('DOMContentLoaded', () => {
    // Correctly get all DOM elements that exist on this page
    const downloadDataBtn = document.getElementById('downloadDataBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const logoutBtnBottom = document.getElementById('logoutBtnBottom');
    const currentUserDisplayName = document.getElementById('current-user-name');
    const logoutBtnTop = document.querySelector('.header-logout-btn');

    // Function to fetch and display user data
    async function fetchAndDisplayUserName() {
        try {
            // Re-using the same API endpoint from settings.js for simplicity
            const response = await fetch('php/api/settings.php?action=fetchUserData');
            const result = await response.json();
            if (result.success && currentUserDisplayName) {
                currentUserDisplayName.textContent = `${result.data.first_name} ${result.data.last_name}`;
            }
        } catch (error) {
            console.error('Error fetching user data for header:', error);
        }
    }

    // Call this function on page load
    fetchAndDisplayUserName();

    // Event listener for the Delete Account button
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async () => {
            const confirmed = await showConfirmationModal("WARNING: This action is permanent and cannot be undone. All of your data will be deleted. Are you sure you want to delete your account?", "Confirm Account Deletion");
            
            if (confirmed) {
                try {
                    const response = await fetch('php/api/delete_account.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    const result = await response.json();
                    
                    if (result.success) {
                        showMessage(result.message || "Your account has been successfully deleted.", 'success');
                        setTimeout(() => {
                            window.location.href = 'login_register.html'; // Redirect to login page
                        }, 2000);
                    } else {
                        showMessage(result.message || "Failed to delete account. Please try again.", 'error');
                    }
                } catch (error) {
                    console.error('Error during account deletion:', error);
                    showMessage("An unexpected error occurred during account deletion.", 'error');
                }
            } else {
                showMessage("Account deletion cancelled.", 'info');
            }
        });
    }

    // Consolidated Logout Functionality for both top and bottom buttons
    const handleLogout = async () => {
        const confirmed = await showConfirmationModal('Are you sure you want to log out?', 'Confirm Logout'); 

        if (!confirmed) {
            return; 
        }

        try {
            const response = await fetch('php/auth/logout.php', { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                window.location.href = 'login_register.html';
            } else {
                showMessage(result.message || 'Logout failed.', 'error');
            }
        } catch (error) {
            console.error('Logout error:', error);
            showMessage('Network error during logout.', 'error');
        }
    };
    
    if (logoutBtnTop) {
        logoutBtnTop.addEventListener('click', handleLogout);
    }
    if (logoutBtnBottom) {
        logoutBtnBottom.addEventListener('click', handleLogout);
    }
});