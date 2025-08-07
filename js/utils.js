// public/js/utils.js

/**
 * Shows a custom confirmation modal and returns a Promise that resolves to true (confirm) or false (cancel).
 * Dynamically inserts modal HTML if not already in the DOM.
 * Adds full cleanup to avoid memory leaks and supports background/overlay click to cancel.
 *
 * @param {string} message - The message to display in the modal.
 * @param {string} title - The title of the modal.
 * @returns {Promise<boolean>} - A promise resolving to user's confirmation.
 */
export function showConfirmationModal(message, title = 'Confirm Action') {
    return new Promise((resolve) => {
        let modal = document.getElementById('globalConfirmModal');

        // Inject modal HTML if not already present
        if (!modal) {
            const modalHtml = `
                <div id="globalConfirmModal" class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 hidden"
                     role="dialog" aria-modal="true" aria-labelledby="globalConfirmModalTitle" aria-describedby="globalConfirmModalMessage">
                    <div class="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
                        <h3 id="globalConfirmModalTitle" class="text-xl font-semibold text-gray-800 mb-4"></h3>
                        <p id="globalConfirmModalMessage" class="text-gray-700 mb-6"></p>
                        <div class="flex justify-center space-x-4">
                            <button id="globalCancelBtn"
                                class="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition duration-200">
                                Cancel
                            </button>
                            <button id="globalConfirmBtn"
                                class="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200">
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modal = document.getElementById('globalConfirmModal');
        }

        // Grab modal elements
        const modalTitle = document.getElementById('globalConfirmModalTitle');
        const modalMessage = document.getElementById('globalConfirmModalMessage');
        const confirmBtn = document.getElementById('globalConfirmBtn');
        const cancelBtn = document.getElementById('globalCancelBtn');

        // Fallback if something is wrong
        if (!modal || !modalTitle || !modalMessage || !confirmBtn || !cancelBtn) {
            console.error('Modal elements not found. Falling back to native confirm.');
            resolve(confirm(message));
            return;
        }

        // Update modal content
        modalTitle.textContent = title;
        modalMessage.textContent = message;

        // Helper to remove all event listeners and hide modal
        const cleanUpListeners = () => {
            confirmBtn.removeEventListener('click', confirmHandler);
            cancelBtn.removeEventListener('click', cancelHandler);
            modal.removeEventListener('click', overlayHandler);
            window.removeEventListener('keydown', keyHandler);
        };

        // Confirm action
        const confirmHandler = () => {
            cleanUpListeners();
            modal.classList.add('hidden');
            resolve(true);
        };

        // Cancel action
        const cancelHandler = () => {
            cleanUpListeners();
            modal.classList.add('hidden');
            resolve(false);
        };

        // Clicking outside the modal content cancels
        const overlayHandler = (event) => {
            if (event.target === modal) {
                cleanUpListeners();
                modal.classList.add('hidden');
                resolve(false);
            }
        };

        // Optional: Escape = cancel, Enter = confirm
        const keyHandler = (event) => {
            if (event.key === 'Escape') cancelHandler();
            if (event.key === 'Enter') confirmHandler();
        };

        // Attach listeners
        confirmBtn.addEventListener('click', confirmHandler);
        cancelBtn.addEventListener('click', cancelHandler);
        modal.addEventListener('click', overlayHandler);
        window.addEventListener('keydown', keyHandler);

        // Show modal
        modal.classList.remove('hidden');
    });
}

/**
 * Displays a temporary message at the top of the screen.
 * Auto-hides after 3 seconds and supports 'success', 'error', or neutral types.
 *
 * @param {string} message - Message to display.
 * @param {string} type - One of 'success', 'error', or 'info' (default: success).
 */
export function showMessage(message, type = 'success') {
    const messageBox = document.getElementById('message-box');

    if (!messageBox) {
        console.error('Message box element not found!');
        return;
    }

    // Set message and base styling
    messageBox.textContent = message;
    messageBox.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300';

    // Add contextual styles
    switch (type) {
        case 'error':
            messageBox.classList.add('bg-red-500', 'text-white');
            break;
        case 'success':
            messageBox.classList.add('bg-green-500', 'text-white');
            break;
        default:
            messageBox.classList.add('bg-gray-700', 'text-white');
    }

    // Display message
    messageBox.classList.remove('hidden');

    // Hide message after timeout
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 3000);
}

/**
 * Highlights the active navigation link based on current URL.
 * Adds `active-nav-link` and `aria-current="page"` to the active link.
 */
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.sidebar-menu a');
    const currentPage = window.location.pathname.split('/').pop();

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPage) {
            link.classList.add('active-nav-link');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active-nav-link');
            link.removeAttribute('aria-current');
        }
    });
});
