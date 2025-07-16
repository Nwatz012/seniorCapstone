document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const messageBox = document.getElementById('message-box');
    const logoutButton = document.querySelector('.header-logout-btn'); 
    const currentUserDisplayName = document.getElementById('current-user-name'); // User name display element

    // Utility Functions (kept general for messages)
    function showMessage(message, type = 'success') {
        if (!messageBox) {
            console.error('Message box element not found!');
            return;
        }
        messageBox.textContent = message;
        messageBox.className = 'hidden'; // Start clean

        if (type === 'success') {
            messageBox.classList.add('success');
            messageBox.classList.remove('error');
        } else if (type === 'error') {
            messageBox.classList.add('error');
            messageBox.classList.remove('success');
        } else {
            messageBox.classList.remove('success', 'error');
        }
        
        messageBox.classList.remove('hidden'); // Show the message box

        setTimeout(() => {
            messageBox.classList.add('hidden'); // Hide after 3 seconds
            messageBox.classList.remove('success', 'error'); 
        }, 3000);
    }

    // Function to fetch and display the logged-in user's name
    async function fetchAndDisplayUserName() {
        try {
            const response = await fetch('php/api/get_user_info.php');
            const result = await response.json();

            if (response.ok && result.success && result.user_info) {
                const firstName = result.user_info.first_name || '';
                const lastName = result.user_info.last_name || '';
                if (firstName || lastName) {
                    currentUserDisplayName.textContent = `${firstName} ${lastName}`.trim();
                } else {
                    currentUserDisplayName.textContent = result.user_info.email || 'Guest';
                }
            } else {
                currentUserDisplayName.textContent = 'Guest'; 
                console.error('Failed to fetch user info:', result.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Network error fetching user info:', error);
            currentUserDisplayName.textContent = 'Guest'; 
        }
    }

    // Logout functionality using the showConfirmationModal from utils.js
    logoutButton.addEventListener('click', async () => {
        // Ensure utils.js is loaded before dashboard.js for showConfirmationModal to be available
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
    });

    // Initial fetch and display of user name when the dashboard loads
    fetchAndDisplayUserName(); 
});