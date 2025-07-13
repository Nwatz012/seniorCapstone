document.addEventListener('DOMContentLoaded', () => { // Keep this outer wrapper from your local HEAD
    // DOM Elements for header functionality
    const messageBox = document.getElementById('message-box');
    const logoutButton = document.querySelector('.header-logout-btn'); 
    const currentUserDisplayName = document.getElementById('current-user-name'); // User name display element

    // Utility function for displaying messages (from your local HEAD)
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

    // Function to fetch and display the logged-in user's name (from your local HEAD)
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

    // Logout functionality with confirmation (from your local HEAD)
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

    // Tab switching logic (Combined and refined from both versions)
    // The local version seems more robust with CSS class manipulation
    // We'll keep the name 'switchTab' and integrate the existing logic within the DOMContentLoaded event
    window.switchTab = function(tabId) { // Keep window.switchTab for global access if needed, or remove window. if only used internally
        // Remove 'active' from all tabs and hide all content (from local HEAD)
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active', 'text-green-700', 'font-semibold', 'border-b-2', 'border-green-600');
            tab.classList.add('text-gray-600', 'hover:text-green-700');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
            content.classList.remove('active'); // Ensure consistency
        });

        // Add 'active' to the clicked tab and show its content (from local HEAD, adapted)
        const clickedTab = document.querySelector(`.tab[onclick*="${tabId}"]`);
        if (clickedTab) { // Added check for clickedTab
            clickedTab.classList.add('active', 'text-green-700', 'font-semibold', 'border-b-2', 'border-green-600');
            clickedTab.classList.remove('text-gray-600', 'hover:text-green-700');
        }
        document.getElementById(tabId + '-content').classList.remove('hidden');
        document.getElementById(tabId + '-content').classList.add('active'); // Added active class as well
    };

    // Photo upload preview (from remote version)
    document.getElementById('photo-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const photoUpload = document.querySelector('.photo-upload');
                photoUpload.style.backgroundImage = `url(${e.target.result})`;
                photoUpload.style.backgroundSize = 'cover';
                photoUpload.style.backgroundPosition = 'center';
                photoUpload.innerHTML = '<span style="background: rgba(0,0,0,0.7); color: white; padding: 8px 12px; border-radius: 6px;">Change Photo</span>';
            };
            reader.readAsDataURL(file);
        }
    });

    // Form validation (from remote version)
    document.querySelector('.btn-primary').addEventListener('click', function() {
        const name = document.getElementById('name').value;
        const category = document.getElementById('category').value;
        
        if (!name.trim()) {
            alert('Please enter an item name');
            return;
        }
        
        if (!category) {
            alert('Please select a category');
            return;
        }
        
        // Simulate save success
        alert('Item saved successfully!');
    });

    // Initial calls on page load (from your local HEAD)
    fetchAndDisplayUserName(); // Display user name in header
    // Any other itemDetails specific initialization would go here
});