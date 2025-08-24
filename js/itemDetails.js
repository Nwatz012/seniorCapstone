import { showConfirmationModal } from './utils.js';
import { showMessage } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // 1. DOM Element Declarations
    // -------------------------------------------------------------------------
    // Cache all necessary DOM elements at the start for performance and readability.
    // This section is for elements related to the overall page and user info.
    const messageBox = document.getElementById('message-box');
    const logoutButton = document.querySelector('.header-logout-btn');
    const currentUserDisplayName = document.getElementById('current-user-name');

    // These are for the new item selection and loading functionality.
    const itemSelectDropdown = document.getElementById('item-select-dropdown');
    const loadItemButton = document.getElementById('load-item-btn');
    // The main container for all item details, used to show/hide the section.
    const itemDetailsContent = document.getElementById('item-details-content');

    // These are for displaying the details of a selected item.
    const itemNameDisplay = document.getElementById('item-detail-name');
    const itemCategoryDisplay = document.getElementById('item-detail-category');
    const itemQuantityDisplay = document.getElementById('item-detail-quantity');
    const itemRoomDisplay = document.getElementById('item-detail-room');
    const itemValueDisplay = document.getElementById('item-detail-value');
    const itemCreatedAtDisplay = document.getElementById('item-detail-created-at');
    const itemUpdatedAtDisplay = document.getElementById('item-detail-updated-at');
    const itemPhotoGallery = document.getElementById('item-photo-gallery');
    const imageUploadInput = document.getElementById('image-upload-input');
    const uploadImageBtn = document.getElementById('upload-image-btn');
    const noImagesMessage = document.getElementById('no-images-message');

    // -------------------------------------------------------------------------
    // 2. State and Configuration Variables
    // -------------------------------------------------------------------------
    // This state variable keeps track of the ID of the item currently being viewed.
    // It's crucial for functions like image upload and deletion.
    let currentItemId = null;

    // A mapping of database room values to user-friendly display names.
    const roomDisplayNames = {
        'master_bedroom': 'Master Bedroom',
        'bedroom_1': 'Bedroom 1',
        'bedroom_2': 'Bedroom 2',
        'bedroom_3': 'Bedroom 3',
        'bathroom': 'Bathroom',
        'kitchen': 'Kitchen',
        'living_room': 'Living Room',
        'dining_room': 'Dining Room',
        'office': 'Office',
        'garage': 'Garage',
        'other': 'Other'
    };

    // -------------------------------------------------------------------------
    // 3. Initialization Logic
    // -------------------------------------------------------------------------
    // Initialize the Select2 library on the dropdown for search functionality.
    // This check prevents errors if the library isn't loaded.
    if (typeof jQuery !== 'undefined' && typeof jQuery().select2 !== 'undefined') {
        $(itemSelectDropdown).select2({
            placeholder: "-- Select an Item --",
            allowClear: true // Allows users to clear the selection.
        });
    } else {
        console.warn("Select2 or jQuery not loaded. Search functionality will not be available.");
    }
    
    // -------------------------------------------------------------------------
    // 4. Helper Functions
    // -------------------------------------------------------------------------
    /**
     * Converts a database room key into a human-readable name.
     * @param {string} roomValue - The room key from the database (e.g., 'master_bedroom').
     * @returns {string} The display name (e.g., 'Master Bedroom') or the original value if not found.
     */
    function getDisplayRoomName(roomValue) {
        return roomDisplayNames[roomValue] || roomValue;
    }

    // -------------------------------------------------------------------------
    // 5. Asynchronous Data Fetching and Display Functions
    // -------------------------------------------------------------------------

    /**
     * Fetches the current user's first and last name from the server and displays it.
     * Handles cases where the user info is not found or there's a network error.
     */
    async function fetchAndDisplayUserName() {
        try {
            const response = await fetch('php/api/get_user_info.php');
            const result = await response.json();
            if (response.ok && result.success && result.user_info) {
                const firstName = result.user_info.first_name || '';
                const lastName = result.user_info.last_name || '';
                currentUserDisplayName.textContent = `${firstName} ${lastName}`.trim() || result.user_info.email || 'Guest';
            } else {
                currentUserDisplayName.textContent = 'Guest';
                console.error('Failed to fetch user info:', result.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Network error fetching user info:', error);
            currentUserDisplayName.textContent = 'Guest';
        }
    }

    /**
     * Fetches all items from the server and populates the item selection dropdown.
     * This allows the user to select an item to view its details.
     */
    async function fetchAllItemsAndPopulateDropdown() {
        try {
            const response = await fetch('php/api/get_items.php');
            const result = await response.json();

            // Always clear and add a default option first to prevent duplicates.
            $(itemSelectDropdown).empty().append('<option value="" disabled selected>-- Select an Item --</option>');

            if (response.ok && result.success && result.items.length > 0) {
                result.items.forEach(item => {
                    const option = new Option(item.item_name, item.item_id, false, false);
                    $(itemSelectDropdown).append(option);
                });
                // Trigger a change to let Select2 know the options have been updated.
                $(itemSelectDropdown).trigger('change');
                loadItemButton.disabled = false;
            } else {
                showMessage(result.message || 'No items found. Please add items on the Dashboard or Inventory page.', 'info');
                $(itemSelectDropdown).empty().append('<option value="" disabled selected>-- No Items Found --</option>');
                $(itemSelectDropdown).trigger('change');
                loadItemButton.disabled = true;
            }
        } catch (error) {
            console.error('Network error fetching items for dropdown:', error);
            showMessage('Network error. Could not load items for selection.', 'error');
            $(itemSelectDropdown).empty().append('<option value="" disabled selected>-- Error Loading Items --</option>');
            $(itemSelectDropdown).trigger('change');
            loadItemButton.disabled = true;
        }
    }

    /**
     * Fetches and displays the detailed information for a specific item ID.
     * Also updates the page title and the H2 heading.
     * @param {string|number} itemId - The unique ID of the item to fetch.
     */
    async function fetchAndDisplayItemDetails(itemId) {
        if (!itemId) {
            showMessage('No item ID provided. Please select an item.', 'error');
            return;
        }
        itemDetailsContent.classList.remove('hidden');

        try {
            const response = await fetch(`php/api/get_item_details.php?item_id=${itemId}`);
            const result = await response.json();

            if (response.ok && result.success && result.item) {
                const item = result.item;
                currentItemId = item.item_id; // Update the state variable.
                
                // Populate the detail fields with fetched data.
                itemNameDisplay.textContent = item.item_name;
                itemCategoryDisplay.textContent = item.category_name;
                itemQuantityDisplay.textContent = item.quantity;
                itemRoomDisplay.textContent = getDisplayRoomName(item.room);
                itemValueDisplay.textContent = `$${parseFloat(item.value).toFixed(2)}`;
                itemCreatedAtDisplay.textContent = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A';
                itemUpdatedAtDisplay.textContent = item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'N/A';

                // Update dynamic page content.
                document.title = `${item.item_name} Details - Home Inventory`;
                document.querySelector('.content-area h2').innerHTML = `Manage Item Details: <span id="item-detail-name" class="text-primary">${item.item_name}</span>`;

                // Set the dropdown's value to the current item and update Select2.
                if (typeof jQuery !== 'undefined' && typeof jQuery().select2 !== 'undefined') {
                    $(itemSelectDropdown).val(itemId).trigger('change.select2');
                } else {
                    itemSelectDropdown.value = itemId;
                }

                fetchAndDisplayItemPhotos(itemId);

            } else {
                // Handle cases where item details are not found.
                showMessage(result.message || 'Failed to load item details.', 'error');
                console.error('Error fetching item details:', result.message);
                itemDetailsContent.classList.add('hidden'); // Hide the details section.
            }
        } catch (error) {
            console.error('Network error fetching item details:', error);
            showMessage('Network error. Could not load item details.', 'error');
            itemDetailsContent.classList.add('hidden');
        }
    }

    /**
     * Fetches and displays photos for a given item ID.
     * It dynamically creates image and delete button elements.
     * @param {string|number} itemId - The ID of the item whose photos to fetch.
     */
    async function fetchAndDisplayItemPhotos(itemId) {
        itemPhotoGallery.innerHTML = '';
        noImagesMessage.classList.add('hidden');

        try {
            const response = await fetch(`php/api/get_item_photos.php?item_id=${itemId}`);
            const result = await response.json();

            if (response.ok && result.success && result.photos.length > 0) {
                result.photos.forEach(photo => {
                    const photoDiv = document.createElement('div');
                    photoDiv.className = 'relative group';
                    photoDiv.innerHTML = `
                        <img src="${photo.file_path}" alt="Item Photo" class="w-full h-48 object-cover rounded-lg shadow-md transition-transform duration-200 transform group-hover:scale-105">
                        <button class="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" data-photo-id="${photo.photo_id}" aria-label="Delete photo">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clip-rule="evenodd"></path></svg>
                        </button>
                    `;
                    itemPhotoGallery.appendChild(photoDiv);
                });

                // Attach event listeners to the newly created delete buttons.
                document.querySelectorAll('#item-photo-gallery button').forEach(button => {
                    button.addEventListener('click', (event) => {
                        const photoId = event.currentTarget.dataset.photoId;
                        handleDeletePhoto(photoId);
                    });
                });

            } else {
                noImagesMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Network error fetching item photos:', error);
            showMessage('Network error. Could not load item photos.', 'error');
            noImagesMessage.classList.remove('hidden');
        }
    }

    /**
     * Handles the image upload process.
     * Validates the selected file and sends it to the server using FormData.
     */
    async function handleImageUpload() {
        if (!currentItemId) {
            showMessage('Please select an item first before uploading images.', 'error');
            return;
        }
        if (imageUploadInput.files.length === 0) {
            showMessage('Please select an image file to upload.', 'error');
            return;
        }

        const file = imageUploadInput.files[0];
        const formData = new FormData();
        formData.append('item_id', currentItemId);
        formData.append('image', file);

        try {
            const response = await fetch('php/api/upload_item_photo.php', {
                method: 'POST',
                body: formData,
            });

            // Check if the server response was successful.
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server responded with non-OK status:', response.status, errorText);
                showMessage(`Upload failed: Server error (${response.status}).`, 'error');
                return;
            }

            const result = await response.json(); 

            if (result.success) {
                showMessage(result.message, 'success');
                imageUploadInput.value = ''; // Clear the file input field.
                fetchAndDisplayItemPhotos(currentItemId); // Refresh photos.
            } else {
                showMessage(result.message || 'Image upload failed.', 'error');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            showMessage('Network error or server unreachable during image upload.', 'error');
        }
    }

    /**
     * Sends a request to the server to delete a photo by its ID.
     * Asks for user confirmation before proceeding.
     * @param {string|number} photoId - The ID of the photo to delete.
     */
    async function handleDeletePhoto(photoId) {
        const confirmed = await showConfirmationModal('Are you sure you want to delete this photo?', 'Confirm Photo Deletion');
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch('php/api/delete_item_photo.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ photo_id: photoId }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server responded with non-OK status for delete:', response.status, errorText);
                showMessage(`Delete failed: Server error (${response.status}).`, 'error');
                return;
            }

            const result = await response.json();

            if (result.success) {
                showMessage(result.message, 'success');
                fetchAndDisplayItemPhotos(currentItemId); // Refresh the photo gallery.
            } else {
                showMessage(result.message || 'Failed to delete photo.', 'error');
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
            showMessage('Network error during photo deletion.', 'error');
        }
    }

    // A placeholder for a potential tab-switching function.
    window.switchTab = function(tabId) { /* ... (tab switching logic) ... */ };

    // -------------------------------------------------------------------------
    // 6. Event Listeners
    // -------------------------------------------------------------------------

    // Logout button click handler with confirmation.
    logoutButton.addEventListener('click', async () => {
        const confirmed = await showConfirmationModal('Are you sure you want to log out?', 'Confirm Logout');
        if (!confirmed) { return; }
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

    // Button to trigger the photo upload.
    uploadImageBtn.addEventListener('click', handleImageUpload);

    // This listener handles changes to the Select2 dropdown.
    itemSelectDropdown.addEventListener('change', () => {
        const selectedItemId = itemSelectDropdown.value;
        if (selectedItemId) {
            // Note: This directly fetches details on change. 
            // The 'loadItemButton' could be considered redundant depending on the desired UX.
            fetchAndDisplayItemDetails(selectedItemId);
        } else {
            // If the user clears the selection, hide the details section.
            itemDetailsContent.classList.add('hidden');
            document.querySelector('.content-area h2').innerHTML = `Manage Item Details: <span id="item-detail-name" class="text-primary">No Item Selected</span>`;
            showMessage('Please select an item from the list.', 'info');
        }
    });

    // The 'Load Item' button, which performs the same action as the dropdown's change listener.
    loadItemButton.addEventListener('click', () => {
        const selectedItemId = itemSelectDropdown.value;
        if (selectedItemId) {
            fetchAndDisplayItemDetails(selectedItemId);
        } else {
            showMessage('Please select an item from the dropdown first.', 'error');
        }
    });

    // -------------------------------------------------------------------------
    // 7. Initial Page Load Execution
    // -------------------------------------------------------------------------
    
    // Always fetch and display the user's name on page load.
    fetchAndDisplayUserName();

    // Check URL parameters to see if an item ID was passed in.
    const urlParams = new URLSearchParams(window.location.search);
    const initialItemId = urlParams.get('itemId');

    if (initialItemId) {
        // If an item ID is in the URL, fetch all items first (to populate dropdown)
        // then fetch and display the specific item's details.
        fetchAllItemsAndPopulateDropdown().then(() => {
            fetchAndDisplayItemDetails(initialItemId);
        });
    } else {
        // If no item ID in the URL, just populate the dropdown and show a prompt.
        fetchAllItemsAndPopulateDropdown();
        itemDetailsContent.classList.add('hidden');
        document.querySelector('.content-area h2').innerHTML = `Manage Item Details: <span id="item-detail-name" class="text-primary">No Item Selected</span>`;
        showMessage('Please select an item from the dropdown above to view or edit its details.', 'info');
    }
});