// public/js/utils.js (revised showConfirmationModal function)

/**
 * Shows a custom confirmation modal and returns a Promise that resolves to true (confirm) or false (cancel).
 * The modal HTML is dynamically created and appended to the body if it doesn't already exist.
 * @param {string} message - The message to display in the modal body.
 * @param {string} title - The title of the modal.
 * @returns {Promise<boolean>} A promise that resolves to true if confirmed, false if cancelled.
 */
function showConfirmationModal(message, title = 'Confirm Action') {
    return new Promise((resolve) => {
        let modal = document.getElementById('globalConfirmModal'); // Give it a more generic ID

        // If the modal doesn't exist, create it and append to body
        if (!modal) {
            const modalHtml = `
                <div id="globalConfirmModal" class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 hidden">
                    <div class="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
                        <h3 id="globalConfirmModalTitle" class="text-xl font-semibold text-gray-800 mb-4"></h3>
                        <p id="globalConfirmModalMessage" class="text-gray-700 mb-6"></p>
                        <div class="flex justify-center space-x-4">
                            <button id="globalCancelBtn" class="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition duration-200">Cancel</button>
                            <button id="globalConfirmBtn" class="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200">Confirm</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modal = document.getElementById('globalConfirmModal'); // Get reference after insertion
        }

        const modalTitle = document.getElementById('globalConfirmModalTitle');
        const modalMessage = document.getElementById('globalConfirmModalMessage');
        const confirmBtn = document.getElementById('globalConfirmBtn');
        const cancelBtn = document.getElementById('globalCancelBtn');

        if (!modal || !modalTitle || !modalMessage || !confirmBtn || !cancelBtn) {
            console.error('Confirmation modal elements not found after creation attempt!');
            // Fallback to native confirm if elements are still missing (shouldn't happen)
            resolve(confirm(message));
            return;
        }

        modalTitle.textContent = title;
        modalMessage.textContent = message;

        // Clean up previous listeners and attach new ones to avoid multiple triggers
        const cleanUpListeners = () => {
            confirmBtn.removeEventListener('click', confirmHandler);
            cancelBtn.removeEventListener('click', cancelHandler);
            modal.removeEventListener('click', overlayHandler); // For outside click
        };

        const confirmHandler = () => {
            cleanUpListeners();
            modal.classList.add('hidden');
            resolve(true);
        };

        const cancelHandler = () => {
            cleanUpListeners();
            modal.classList.add('hidden');
            resolve(false);
        };

        const overlayHandler = (event) => {
            if (event.target === modal) { // Only if click is directly on the overlay
                cleanUpListeners();
                modal.classList.add('hidden');
                resolve(false); // Treat outside click as cancel
            }
        };

        confirmBtn.addEventListener('click', confirmHandler);
        cancelBtn.addEventListener('click', cancelHandler);
        modal.addEventListener('click', overlayHandler);

        modal.classList.remove('hidden'); // Show the modal
    });
}

/**
 * Displays a temporary message box at the top of the screen.
 * @param {string} message - The message to display.
 * @param {string} type - The type of message ('success', 'error', or default).
 */
function showMessage(message, type = 'success') {
    const messageBox = document.getElementById('message-box');
    if (!messageBox) {
        console.error('Message box element not found!');
        return;
    }
    messageBox.textContent = message;
    messageBox.className = 'hidden'; // Start clean by hiding and resetting classes

    if (type === 'success') {
        messageBox.classList.add('success');
        messageBox.classList.remove('error');
    } else if (type === 'error') {
        messageBox.classList.add('error');
        messageBox.classList.remove('success');
    } else {
        messageBox.classList.remove('success', 'error'); // For default/info messages
    }
    
    messageBox.classList.remove('hidden'); // Show the message box

    setTimeout(() => {
        messageBox.classList.add('hidden'); // Hide after 3 seconds
        messageBox.classList.remove('success', 'error'); // Clean up classes
    }, 3000);
}