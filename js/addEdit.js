document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements for header functionality
    const messageBox = document.getElementById('message-box');
    const logoutButton = document.querySelector('.header-logout-btn'); 
    const currentUserDisplayName = document.getElementById('current-user-name'); // User name display element

    // Utility function for displaying messages
    function showMessage(message, type = 'success') {
        if (!messageBox) {
            console.error('Message box element not found!');
            return;
        }
        messageBox.textContent = message;
        messageBox.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300'; // Reset classes
        
        if (type === 'success') {
            messageBox.classList.add('bg-green-500', 'text-white');
        } else if (type === 'error') {
            messageBox.classList.add('bg-red-500', 'text-white');
        } else {
            messageBox.classList.add('bg-gray-700', 'text-white'); // Default
        }
        
        messageBox.classList.remove('hidden');

        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 3000);
    }

    // Function to fetch and display the logged-in user's name
    async function fetchAndDisplayUserName() {
        try {
            const response = await fetch('php/get_user_info.php');
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

    // Logout functionality with confirmation
    logoutButton.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to log out?')) {
            return;
        }

        try {
            const response = await fetch('php/logout.php', { method: 'POST' });
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

    // Tab switching logic (from your original HTML)
    window.switchTab = function(tabId) {
        // Remove 'active' from all tabs and hide all content
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active', 'text-green-700', 'font-semibold', 'border-b-2', 'border-green-600');
            tab.classList.add('text-gray-600', 'hover:text-green-700');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
            content.classList.remove('active');
        });

        // Add 'active' to the clicked tab and show its content
        const clickedTab = document.querySelector(`.tab[onclick*="${tabId}"]`);
        if (clickedTab) {
            clickedTab.classList.add('active', 'text-green-700', 'font-semibold', 'border-b-2', 'border-green-600');
            clickedTab.classList.remove('text-gray-600', 'hover:text-green-700');
        }
        document.getElementById(tabId + '-content').classList.remove('hidden');
        document.getElementById(tabId + '-content').classList.add('active');
    };

    // Initial calls on page load
    fetchAndDisplayUserName(); // Display user name in header
    // Any other itemDetails specific initialization would go here
});
