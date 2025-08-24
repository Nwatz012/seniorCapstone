// public/js/utils.js

/**
 * This file contains a collection of reusable utility functions for the application,
 * including showing custom modals, displaying messages, and managing navigation states.
 * All functions are exported for use in other modules.
 */

// -------------------------------------------------------------------------
// 1. Custom Confirmation Modal Function
// -------------------------------------------------------------------------

/**
 * Shows a custom confirmation modal and returns a Promise that resolves
 * to true (if the user clicks 'Confirm') or false (if they click 'Cancel' or outside).
 *
 * This function is designed to be a non-blocking alternative to the native `confirm()`
 * dialog, allowing for asynchronous user input with a custom look.
 *
 * @param {string} message - The message to display in the modal's body.
 * @param {string} title - The title of the modal window.
 * @returns {Promise<boolean>} - A promise that resolves to the user's choice.
 */
export function showConfirmationModal(message, title = 'Confirm Action') {
    return new Promise((resolve) => {
        let modal = document.getElementById('globalConfirmModal');

        // Check if the modal HTML already exists in the DOM.
        // If not, dynamically inject it to ensure it's available.
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

        // Cache references to the modal's interactive elements.
        const modalTitle = document.getElementById('globalConfirmModalTitle');
        const modalMessage = document.getElementById('globalConfirmModalMessage');
        const confirmBtn = document.getElementById('globalConfirmBtn');
        const cancelBtn = document.getElementById('globalCancelBtn');

        // Provide a fallback to the native `confirm()` in case the custom modal elements aren't found.
        if (!modal || !modalTitle || !modalMessage || !confirmBtn || !cancelBtn) {
            console.error('Modal elements not found. Falling back to native confirm.');
            resolve(confirm(message));
            return;
        }

        // Update the modal's content with the provided title and message.
        modalTitle.textContent = title;
        modalMessage.textContent = message;

        // Define a single cleanup function to remove all event listeners.
        // This is crucial for preventing memory leaks, especially when the modal is used multiple times.
        const cleanUpListeners = () => {
            confirmBtn.removeEventListener('click', confirmHandler);
            cancelBtn.removeEventListener('click', cancelHandler);
            modal.removeEventListener('click', overlayHandler);
            window.removeEventListener('keydown', keyHandler);
        };

        // Define the handler functions for each possible user action.
        const confirmHandler = () => {
            cleanUpListeners();
            modal.classList.add('hidden');
            resolve(true); // Resolve the promise with true for a confirmed action.
        };

        const cancelHandler = () => {
            cleanUpListeners();
            modal.classList.add('hidden');
            resolve(false); // Resolve the promise with false for a canceled action.
        };

        const overlayHandler = (event) => {
            // Check if the click event occurred directly on the modal's background overlay.
            if (event.target === modal) {
                cancelHandler();
            }
        };

        // Handle keyboard events for accessibility and convenience.
        const keyHandler = (event) => {
            if (event.key === 'Escape') cancelHandler();
            if (event.key === 'Enter') confirmHandler();
        };

        // Attach all the event listeners to their respective elements.
        confirmBtn.addEventListener('click', confirmHandler);
        cancelBtn.addEventListener('click', cancelHandler);
        modal.addEventListener('click', overlayHandler);
        window.addEventListener('keydown', keyHandler);

        // Finally, show the modal by removing the 'hidden' class.
        modal.classList.remove('hidden');
    });
}

// -------------------------------------------------------------------------
// 2. Temporary Message Display Function
// -------------------------------------------------------------------------

/**
 * Displays a temporary message at the top center of the screen.
 * The message fades out automatically after 3 seconds.
 *
 * @param {string} message - The text content of the message.
 * @param {string} type - Determines the message's color theme: 'success', 'error', or 'info' (default).
 */
export function showMessage(message, type = 'success') {
    const messageBox = document.getElementById('message-box');

    if (!messageBox) {
        console.error('Message box element not found!');
        return;
    }

    // Set the message text and apply a common set of styles.
    messageBox.textContent = message;
    messageBox.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300';

    // Apply specific color classes based on the message type using a switch statement.
    switch (type) {
        case 'error':
            messageBox.classList.add('bg-red-500', 'text-white');
            break;
        case 'success':
            messageBox.classList.add('bg-green-500', 'text-white');
            break;
        default: // 'info' or any other type
            messageBox.classList.add('bg-gray-700', 'text-white');
    }

    // Make the message box visible.
    messageBox.classList.remove('hidden');

    // Set a timeout to hide the message after a delay.
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 3000);
}

// -------------------------------------------------------------------------
// 3. Navigation Highlighting Logic
// -------------------------------------------------------------------------

/**
 * Highlights the active navigation link in the sidebar based on the current page's URL.
 * This ensures the user always knows their current location in the application.
 *
 * This listener is attached to the `DOMContentLoaded` event to ensure the script
 * runs after the page's HTML has been fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get all navigation links from the sidebar menu.
    const navLinks = document.querySelectorAll('.sidebar-menu a');
    // Extract the filename from the current URL to compare against link hrefs.
    const currentPage = window.location.pathname.split('/').pop();

    // Iterate through each link to check if its href matches the current page.
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPage) {
            // Add the active class and ARIA attribute for accessibility.
            link.classList.add('active-nav-link');
            link.setAttribute('aria-current', 'page');
        } else {
            // Remove the active class and ARIA attribute from all other links.
            link.classList.remove('active-nav-link');
            link.removeAttribute('aria-current');
        }
    });
});