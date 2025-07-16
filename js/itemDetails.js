document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements for header functionality (keep these)
    const messageBox = document.getElementById('message-box');
    const logoutButton = document.querySelector('.header-logout-btn');
    const currentUserDisplayName = document.getElementById('current-user-name');

    // NEW DOM Elements for Item Selection
    const itemSelectDropdown = document.getElementById('item-select-dropdown');
    const loadItemButton = document.getElementById('load-item-btn');
    const itemDetailsContent = document.getElementById('item-details-content'); // The div containing all item details sections

    // DOM Elements for Item Details (existing)
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

    // State variable for the current item ID
    let currentItemId = null;

    // --- NEW: Initialize Select2 on your dropdown ---
    // Make sure the dropdown is empty before initializing Select2
    // Select2 needs an empty select element or just the default option to start cleanly
    itemSelectDropdown.innerHTML = '<option value="" disabled selected>-- Select an Item --</option>';

    // Initialize Select2 after all necessary scripts (jQuery, Select2) are loaded
    // We wrap this in a check for jQuery just in case
    if (typeof jQuery !== 'undefined' && typeof jQuery().select2 !== 'undefined') {
        $(itemSelectDropdown).select2({
            placeholder: "-- Select an Item --",
            allowClear: true // Allows users to clear the selection
        });
    } else {
        console.warn("Select2 or jQuery not loaded. Search functionality will not be available.");
    }
    // --- END NEW Select2 Initialization ---

    /**
     * Converts a room value (e.g., 'bedroom_1') to its display name (e.g., 'Bedroom 1').
     * This function should ideally be in utils.js or a shared file if used across pages.
     * For now, including it here for completeness.
     */
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
    function getDisplayRoomName(roomValue) {
        return roomDisplayNames[roomValue] || roomValue;
    }


    // Function to fetch and display the logged-in user's name (from your existing code)
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
     * NEW: Fetches all items for the user and populates the item selection dropdown.
     */
    async function fetchAllItemsAndPopulateDropdown() {
        try {
            const response = await fetch('php/api/get_items.php'); // Assuming get_items.php fetches all user items
            const result = await response.json();

            // Clear existing options *before* adding new ones for Select2
            // Note: Select2 might automatically handle this on .empty()
            // but it's good practice to ensure.
            $(itemSelectDropdown).empty().append('<option value="" disabled selected>-- Select an Item --</option>');


            if (response.ok && result.success && result.items.length > 0) {
                result.items.forEach(item => {
                    const option = new Option(item.item_name, item.item_id, false, false); // Select2 recommended way to add options
                    $(itemSelectDropdown).append(option);
                });
                // Trigger Select2 to update its display after options are added
                $(itemSelectDropdown).trigger('change');
                loadItemButton.disabled = false; // Enable load button if items exist
            } else {
                showMessage(result.message || 'No items found. Please add items on the Dashboard or Inventory page.', 'info');
                $(itemSelectDropdown).empty().append('<option value="" disabled selected>-- No Items Found --</option>');
                $(itemSelectDropdown).trigger('change'); // Update Select2
                loadItemButton.disabled = true;
            }
        } catch (error) {
            console.error('Network error fetching items for dropdown:', error);
            showMessage('Network error. Could not load items for selection.', 'error');
            $(itemSelectDropdown).empty().append('<option value="" disabled selected>-- Error Loading Items --</option>');
            $(itemSelectDropdown).trigger('change'); // Update Select2
            loadItemButton.disabled = true;
        }
    }

    // Function to fetch and display item details
    async function fetchAndDisplayItemDetails(itemId) {
        if (!itemId) {
            showMessage('No item ID provided. Please select an item.', 'error');
            return;
        }

        // Show the item details content area
        itemDetailsContent.classList.remove('hidden');

        try {
            const response = await fetch(`php/api/get_item_details.php?item_id=${itemId}`);
            const result = await response.json();

            if (response.ok && result.success && result.item) {
                const item = result.item;
                currentItemId = item.item_id; // Update currentItemId state
                itemNameDisplay.textContent = item.item_name;
                itemCategoryDisplay.textContent = item.category_name;
                itemQuantityDisplay.textContent = item.quantity;
                itemRoomDisplay.textContent = getDisplayRoomName(item.room);
                itemValueDisplay.textContent = `$${parseFloat(item.value).toFixed(2)}`;
                itemCreatedAtDisplay.textContent = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A';
                itemUpdatedAtDisplay.textContent = item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'N/A';

                // Set page title and update the main heading
                document.title = `${item.item_name} Details - Home Inventory`;
                document.querySelector('.content-area h2').innerHTML = `Manage Item Details: <span id="item-detail-name" class="text-primary">${item.item_name}</span>`;

                // Set the dropdown to the currently loaded item (Select2 needs a specific way to set value)
                if (typeof jQuery !== 'undefined' && typeof jQuery().select2 !== 'undefined') {
                    $(itemSelectDropdown).val(itemId).trigger('change.select2'); // Use trigger('change.select2') for programmatically setting value
                } else {
                    itemSelectDropdown.value = itemId; // Fallback for standard dropdown
                }

                // Fetch and display images for this item
                fetchAndDisplayItemPhotos(itemId);

            } else {
                showMessage(result.message || 'Failed to load item details.', 'error');
                console.error('Error fetching item details:', result.message);
                
                // Clear display and hide content if item not found
                itemNameDisplay.textContent = 'Item Not Found';
                itemCategoryDisplay.textContent = '';
                itemQuantityDisplay.textContent = '';
                itemRoomDisplay.textContent = '';
                itemValueDisplay.textContent = '';
                itemCreatedAtDisplay.textContent = '';
                itemUpdatedAtDisplay.textContent = '';
                itemPhotoGallery.innerHTML = ''; // Clear photos
                noImagesMessage.classList.remove('hidden');
                itemDetailsContent.classList.add('hidden'); // Hide the content again
            }
        } catch (error) {
            console.error('Network error fetching item details:', error);
            showMessage('Network error. Could not load item details.', 'error');
            itemDetailsContent.classList.add('hidden'); // Hide on network error
        }
    }

    // Function to fetch and display item photos
    async function fetchAndDisplayItemPhotos(itemId) {
        itemPhotoGallery.innerHTML = ''; // Clear existing photos
        noImagesMessage.classList.add('hidden'); // Hide no images message by default

        try {
            const response = await fetch(`php/api/get_item_photos.php?item_id=${itemId}`);
            const result = await response.json();

            if (response.ok && result.success && result.photos.length > 0) {
                result.photos.forEach(photo => {
                    const photoDiv = document.createElement('div');
                    photoDiv.className = 'relative group'; // For delete overlay
                    photoDiv.innerHTML = `
                        <img src="${photo.file_path}" alt="Item Photo" class="w-full h-48 object-cover rounded-lg shadow-md transition-transform duration-200 transform group-hover:scale-105">
                        <button class="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" data-photo-id="${photo.photo_id}" aria-label="Delete photo">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clip-rule="evenodd"></path></svg>
                        </button>
                    `;
                    itemPhotoGallery.appendChild(photoDiv);
                });

                // Add event listeners for delete photo buttons
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

    // Function to handle image upload
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

            const result = await response.json();

            if (response.ok && result.success) {
                showMessage(result.message, 'success');
                imageUploadInput.value = ''; // Clear the file input
                fetchAndDisplayItemPhotos(currentItemId); // Refresh photos
            } else {
                showMessage(result.message || 'Image upload failed.', 'error');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            showMessage('Network error or server unreachable during image upload.', 'error');
        }
    }

    // Function to handle photo deletion
    async function handleDeletePhoto(photoId) {
        const confirmed = await showConfirmationModal('Are you sure you want to delete this photo?', 'Confirm Photo Deletion');
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch('php/api/delete_item_photo.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Correct header for JSON body
                },
                body: JSON.stringify({ photo_id: photoId }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showMessage(result.message, 'success');
                fetchAndDisplayItemPhotos(currentItemId); // Refresh photos
            } else {
                showMessage(result.message || 'Failed to delete photo.', 'error');
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
            showMessage('Network error during photo deletion.', 'error');
        }
    }

    // Tab switching logic (from your original HTML) - kept for completeness but not directly used by new feature
    window.switchTab = function(tabId) {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active', 'text-green-700', 'font-semibold', 'border-b-2', 'border-green-600');
            tab.classList.add('text-gray-600', 'hover:text-green-700');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
            content.classList.remove('active');
        });

        const clickedTab = document.querySelector(`.tab[onclick*="${tabId}"]`);
        if (clickedTab) {
            clickedTab.classList.add('active', 'text-green-700', 'font-semibold', 'border-b-2', 'border-green-600');
            clickedTab.classList.remove('text-gray-600', 'hover:text-green-700');
        }
        document.getElementById(tabId + '-content').classList.remove('hidden');
        document.getElementById(tabId + '-content').classList.add('active');
    };

    // Event Listeners
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

    uploadImageBtn.addEventListener('click', handleImageUpload);

    // NEW: Select2's change event is typically triggered on the original select element
    // This listener can remain, but Select2 will handle the UI aspect.
    itemSelectDropdown.addEventListener('change', () => {
        const selectedItemId = itemSelectDropdown.value;
        if (selectedItemId) {
            fetchAndDisplayItemDetails(selectedItemId);
        } else {
            itemDetailsContent.classList.add('hidden');
            document.querySelector('.content-area h2').innerHTML = `Manage Item Details: <span id="item-detail-name" class="text-primary">No Item Selected</span>`;
            showMessage('Please select an item from the list.', 'info');
        }
    });

    // Load Item button listener remains the same
    loadItemButton.addEventListener('click', () => {
        const selectedItemId = itemSelectDropdown.value;
        if (selectedItemId) {
            fetchAndDisplayItemDetails(selectedItemId);
        } else {
            showMessage('Please select an item from the dropdown first.', 'error');
        }
    });


    // Initial calls on page load
    fetchAndDisplayUserName(); // Display user name in header

    // Get item ID from URL (if navigating from dashboard/rooms)
    const urlParams = new URLSearchParams(window.location.search);
    const initialItemId = urlParams.get('itemId');

    if (initialItemId) {
        // If an itemId is in the URL, load it directly
        // Call fetchAllItemsAndPopulateDropdown first so Select2 can be ready
        // Then, fetchAndDisplayItemDetails will set the Select2 value.
        fetchAllItemsAndPopulateDropdown().then(() => {
            fetchAndDisplayItemDetails(initialItemId);
        });
    } else {
        // If no itemId in URL, just populate the dropdown and keep details hidden
        fetchAllItemsAndPopulateDropdown();
        itemDetailsContent.classList.add('hidden');
        document.querySelector('.content-area h2').innerHTML = `Manage Item Details: <span id="item-detail-name" class="text-primary">No Item Selected</span>`;
        showMessage('Please select an item from the dropdown above to view or edit its details.', 'info');
    }
});