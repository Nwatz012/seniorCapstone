
import { showMessage } from './utils.js';
import { showConfirmationModal } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const messageBox = document.getElementById('message-box');
    const roomList = document.getElementById('room-list'); // UL for room navigation
    const currentRoomTitle = document.getElementById('current-room-title'); // H1 for current room
    const inventoryGrid = document.getElementById('inventory-grid'); // Div for item cards
    const emptyState = document.getElementById('empty-state'); // Div for "No items" message
    const emptyStateTitle = document.getElementById('empty-state-title');
    const emptyStateText = document.getElementById('empty-state-text');
    const roomSummary = document.getElementById('room-summary'); // Div for room summary stats
    const totalItemsDisplay = document.getElementById('total-items');
    const totalValueDisplay = document.getElementById('total-value');
    const lastUpdatedDisplay = document.getElementById('last-updated');
    const searchInput = document.getElementById('item-search');
    const addItemToRoomBtn = document.getElementById('add-item-to-room-btn');
    const addFirstItemBtn = document.getElementById('add-first-item-btn'); // Button in empty state
    const logoutButton = document.querySelector('.header-logout-btn');
    const currentUserDisplayName = document.getElementById('current-user-name'); // User name display element (assuming it's in rooms.html header)

    // Home Info Display Elements
    const homeAddressDisplay = document.getElementById('home-address'); // This will now display concatenated address
    const homeSqFtDisplay = document.getElementById('home-sq-ft');
    const homeYearBuiltDisplay = document.getElementById('home-year-built');
    const homeRoofTypeDisplay = document.getElementById('home-roof-type');
    const homeRoofAgeDisplay = document.getElementById('home-roof-age');
    const editHomeInfoBtn = document.getElementById('edit-home-info-btn');

    // Add/Edit Item Modal Elements
    const addItemModal = document.getElementById('addItemModal');
    const modalTitle = document.getElementById('modal-title');
    const modalAddItemForm = document.getElementById('modalAddItemForm');
    const modalItemNameInput = document.getElementById('modal-item-name');
    const modalItemCategorySelect = document.getElementById('modal-item-category');
    const modalItemCategoryOtherInput = document.getElementById('modal-item-category-other');
    const modalOtherCategoryInputDiv = document.getElementById('modal-other-category-input');
    const modalItemQuantityInput = document.getElementById('modal-item-quantity');
    const modalItemRoomSelect = document.getElementById('modal-item-room');
    const modalItemRoomOtherInput = document.getElementById('modal-item-room-other');
    const modalOtherRoomInputDiv = document.getElementById('modal-other-room-input');
    const modalItemReplacementCostInput = document.getElementById('modal-item-replacement-cost');
    const modalAddItemBtn = document.getElementById('modal-add-item-btn');
    const cancelAddItemModalBtn = document.getElementById('cancelAddItemModal');

    // Edit Home Info Modal Elements
    const editHomeInfoModal = document.getElementById('editHomeInfoModal');
    const editHomeInfoForm = document.getElementById('editHomeInfoForm');
    const homeIdInput = document.getElementById('home-id-input'); // Hidden input
    const editHomeAddressStreetInput = document.getElementById('edit-home-address-street'); // New street address input
    const editHomeCityInput = document.getElementById('edit-home-city'); // New city input
    const editHomeStateSelect = document.getElementById('edit-home-state'); // New state select
    const editHomeZipCodeInput = document.getElementById('edit-home-zipcode'); // New zip code input
    const editHomeSqFtInput = document.getElementById('edit-home-sq-ft');
    const editHomeYearBuiltInput = document.getElementById('edit-home-year-built');
    const editHomeRoofTypeInput = document.getElementById('edit-home-roof-type');
    const editHomeRoofAgeInput = document.getElementById('edit-home-roof-age');
    const saveHomeInfoBtn = document.getElementById('save-home-info-btn');
    const cancelEditHomeInfoModalBtn = document.getElementById('cancelEditHomeInfoModal');


    // State variables
    let currentRoom = ''; // Initialize as empty, will be set to first room or 'All Items'
    let allItems = []; // Stores all items fetched, for filtering
    let editingItemId = null; // For item edit functionality in modal
    let currentHomeInfo = null; // Stores fetched home info

    // Mapping for display names of rooms
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
        'other': 'Other' // 'Other' will be handled dynamically if a custom name is entered
    };

    /**
     * Converts a room value (e.g., 'bedroom_1') to its display name (e.g., 'Bedroom 1').
     * If the room value is not found in the predefined map, it returns the value itself.
     * @param {string} roomValue - The internal room value.
     * @returns {string} The display name of the room.
     */
    function getDisplayRoomName(roomValue) {
        return roomDisplayNames[roomValue] || roomValue;
    }

    // Function to clear the add/edit item modal form
    function clearAddItemModalForm() {
        modalItemNameInput.value = '';
        modalItemCategorySelect.value = '';
        modalOtherCategoryInputDiv.classList.add('hidden');
        modalItemCategoryOtherInput.value = '';
        modalItemQuantityInput.value = '1';
        modalItemRoomSelect.value = '';
        modalOtherRoomInputDiv.classList.add('hidden');
        modalItemRoomOtherInput.value = '';
        modalItemReplacementCostInput.value = '0';
        modalAddItemBtn.textContent = 'Add Item'; // Reset button text
        modalTitle.textContent = 'Add New Item'; // Reset modal title
        editingItemId = null; // Reset editing state
    }

    // Function to open the add/edit item modal
    function openAddItemModal(item = null) {
        clearAddItemModalForm(); // Always clear form first
        if (item) {
            modalTitle.textContent = 'Edit Item';
            modalAddItemBtn.textContent = 'Update Item';
            editingItemId = item.item_id;

            modalItemNameInput.value = item.item_name;
            
            // Set category
            let categoryFound = false;
            Array.from(modalItemCategorySelect.options).forEach(option => {
                if (option.value === item.category_name) {
                    modalItemCategorySelect.value = item.category_name;
                    categoryFound = true;
                }
            });
            if (!categoryFound) {
                modalItemCategorySelect.value = 'other';
                modalOtherCategoryInputDiv.classList.remove('hidden');
                modalItemCategoryOtherInput.value = item.category_name;
            } else {
                modalOtherCategoryInputDiv.classList.add('hidden');
                modalItemCategoryOtherInput.value = '';
            }

            modalItemQuantityInput.value = item.quantity;
            
            // Set room
            let roomFound = false;
            Array.from(modalItemRoomSelect.options).forEach(option => {
                if (option.value === item.room) {
                    modalItemRoomSelect.value = item.room;
                    roomFound = true;
                }
            });
            if (!roomFound) {
                modalItemRoomSelect.value = 'other';
                modalOtherRoomInputDiv.classList.remove('hidden');
                modalItemRoomOtherInput.value = item.room;
            } else {
                modalOtherRoomInputDiv.classList.add('hidden');
                modalItemRoomOtherInput.value = '';
            }

            modalItemReplacementCostInput.value = parseFloat(item.value).toFixed(2);
        } else {
            // If adding a new item from a specific room, pre-select that room
            if (currentRoom !== 'All Items' && currentRoom !== '') { // Ensure currentRoom is set and not empty
                // Check if currentRoom is a predefined value or a custom one
                const roomValueForSelect = Object.keys(roomDisplayNames).find(key => roomDisplayNames[key] === currentRoom) || 'other';
                modalItemRoomSelect.value = roomValueForSelect;

                if (roomValueForSelect === 'other') {
                    modalOtherRoomInputDiv.classList.remove('hidden');
                    modalItemRoomOtherInput.value = currentRoom;
                } else {
                    modalOtherRoomInputDiv.classList.add('hidden');
                    modalItemRoomOtherInput.value = '';
                }
            }
        }
        addItemModal.classList.remove('hidden');
    }

    // Function to close the add/edit item modal
    function closeAddItemModal() {
        addItemModal.classList.add('hidden');
        clearAddItemModalForm();
    }

    // Function to handle adding or updating an item via modal
    async function handleModalAddItem() {
        const itemName = modalItemNameInput.value.trim();
        let itemCategory = modalItemCategorySelect.value;
        if (itemCategory === 'other') {
            itemCategory = modalItemCategoryOtherInput.value.trim();
        }
        const itemQuantity = parseInt(modalItemQuantityInput.value);
        let itemRoom = modalItemRoomSelect.value;
        if (itemRoom === 'other') {
            itemRoom = modalItemRoomOtherInput.value.trim();
        }
        const itemReplacementCost = parseFloat(modalItemReplacementCostInput.value);

        // Basic client-side validation
        if (!itemName || !itemCategory || !itemRoom || isNaN(itemQuantity) || isNaN(itemReplacementCost)) {
            showMessage('Please fill in all required item details.', 'error');
            return;
        }
        if (itemQuantity <= 0) {
            showMessage('Quantity must be at least 1.', 'error');
            return;
        }
        if (itemReplacementCost < 0) {
            showMessage('Replacement cost cannot be negative.', 'error');
            return;
        }

        const itemData = {
            name: itemName,
            category: itemCategory,
            quantity: itemQuantity,
            room: itemRoom,
            value: itemReplacementCost,
        };

        let endpoint = 'php/api/add_item.php';
        let method = 'POST';

        if (editingItemId) {
            endpoint = 'php/api/update_item.php';
            itemData.item_id = editingItemId;
        }

        try {
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(itemData),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showMessage(result.message, 'success');
                closeAddItemModal();
                // After adding/updating, re-fetch all items and then re-render
                await fetchAllItems(); // Ensure allItems is updated
                fetchAndDisplayRoomsSummary(); // This will now use the updated allItems
                // fetchAndDisplayItemsForRoom(currentRoom); // This call is redundant if fetchAndDisplayRoomsSummary handles it
            } else {
                showMessage(result.message || 'An error occurred while saving item.', 'error');
            }
        } catch (error) {
            console.error('Error saving item:', error);
            showMessage('Network error or server unreachable during item save.', 'error');
        }
    }

    // Function to handle deleting an item
    async function handleDeleteItem(itemId) {
        console.log('Attempting to delete item with ID:', itemId);
        const confirmed = await showConfirmationModal('Are you sure you want to delete this item?', 'Confirm Deletion');

        if (!confirmed) {
            console.log('Deletion cancelled by user.');
            return;
        }

        try {
            console.log('Sending delete request for item ID:', itemId);
            const response = await fetch('php/api/delete_item.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ item_id: itemId }),
            });

            console.log('Received response from delete_item.php. Status:', response.status, response.statusText);
            const result = await response.json();
            console.log('Parsed response result:', result);

            if (response.ok && result.success) {
                showMessage(result.message, 'success');
                console.log('Item deleted successfully. Refreshing UI...');
                // MODIFICATION: Ensure allItems is updated BEFORE re-rendering anything
                await fetchAllItems(); // Re-fetch all items to get the latest state
                fetchAndDisplayRoomsSummary(); // This will now use the updated allItems
                // fetchAndDisplayItemsForRoom(currentRoom); // This call is now redundant if fetchAndDisplayRoomsSummary handles it
            } else {
                showMessage(result.message || 'An error occurred while deleting item.', 'error');
                console.error('Deletion failed. Server message:', result.message);
            }
        } catch (error) {
            console.error('Network error or server unreachable during item deletion:', error);
            showMessage('Network error. Could not delete item.', 'error');
        }
    }

    // Function to render the room list in the sidebar
    function renderRoomsList(rooms) {
        roomList.innerHTML = ''; // Clear existing list

        // Add "All Items" option first
        const allItemsLink = document.createElement('li');
        allItemsLink.innerHTML = `
            <a href="#" data-room-name="All Items" class="${currentRoom === 'All Items' ? 'active' : ''}">
                <span>All Items</span>
                <span class="item-count">${allItems.length}</span>
            </a>
        `;
        roomList.appendChild(allItemsLink);

        // Add dynamic room links
        rooms.forEach(room => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <a href="#" data-room-name="${room.room}" class="${currentRoom === room.room ? 'active' : ''}">
                    <span>${getDisplayRoomName(room.room)}</span>
                    <span class="item-count">${room.item_count}</span>
                </a>
            `;
            roomList.appendChild(listItem);
        });

        // Add event listeners to newly rendered room links
        document.querySelectorAll('.room-nav a').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const selectedRoom = event.currentTarget.dataset.roomName;
                if (selectedRoom !== currentRoom) {
                    currentRoom = selectedRoom;
                    // Remove active class from all links
                    document.querySelectorAll('.room-nav a').forEach(l => l.classList.remove('active'));
                    // Add active class to clicked link
                    event.currentTarget.classList.add('active');
                    // MODIFICATION: Re-fetch all items to ensure consistency before rendering
                    fetchAllItems().then(() => {
                        fetchAndDisplayItemsForRoom(currentRoom);
                    });
                }
            });
        });
    }

    // Function to render items in the main content grid
    function renderItemsGrid(itemsToDisplay, roomName) {
        inventoryGrid.innerHTML = ''; // Clear existing items

        // Update main title
        currentRoomTitle.textContent = getDisplayRoomName(roomName) === 'All Items' ? 'All Items' : getDisplayRoomName(roomName);
        document.title = `${getDisplayRoomName(roomName) === 'All Items' ? 'All Items' : getDisplayRoomName(roomName)} - Home Inventory`;

        if (itemsToDisplay.length === 0) {
            inventoryGrid.style.display = 'none';
            emptyState.style.display = 'block';
            roomSummary.style.display = 'none';
            emptyStateTitle.textContent = `No items in ${getDisplayRoomName(roomName) === 'All Items' ? 'your inventory' : getDisplayRoomName(roomName)} yet`;
            emptyStateText.textContent = `Start building your inventory by adding your first item to ${getDisplayRoomName(roomName) === 'All Items' ? 'any room' : getDisplayRoomName(roomName)}.`;
            // Updated this line to use getDisplayRoomName for consistent display
            addFirstItemBtn.textContent = `+ Add Your First Item to ${getDisplayRoomName(roomName) === 'All Items' ? 'any room' : getDisplayRoomName(roomName)}`;
        } else {
            inventoryGrid.style.display = 'grid';
            emptyState.style.display = 'none';
            roomSummary.style.display = 'block';

            let totalItems = 0;
            let totalValue = 0;
            let lastUpdatedDate = null;

            itemsToDisplay.forEach(item => {
                totalItems += parseInt(item.quantity);
                totalValue += parseFloat(item.value) * parseInt(item.quantity);

                // Find the most recent update date
                const itemDate = new Date(item.created_at);
                if (!lastUpdatedDate || itemDate > lastUpdatedDate) {
                    lastUpdatedDate = itemDate;
                }

                const itemCard = document.createElement('article');
                // Using custom class 'item-card' from rooms.css, removing inline Tailwind
                itemCard.className = 'item-card group relative'; 
                itemCard.setAttribute('tabindex', '0');
                itemCard.setAttribute('role', 'button');
                itemCard.setAttribute('aria-label', `${item.item_name}, Quantity: ${item.quantity}, valued at $${parseFloat(item.value).toFixed(2)}`);

                itemCard.innerHTML = `
                    <div class="item-image" role="img" aria-label="${item.category_name} icon">
                        ${item.photo_url ? `<img src="${item.photo_url}" alt="${item.item_name}" class="max-w-full max-h-full object-contain rounded-md" onerror="this.onerror=null;this.src='https://placehold.co/100x100/e0e0e0/000000?text=No+Image';"/>` : `<span style="font-size: 3rem;">📦</span>`}
                    </div>
                    <div class="p-4 flex-grow">
                        <h3 class="item-name">${item.item_name}</h3>
                        <p class="item-category">Category: ${item.category_name}</p>
                        <p class="text-sm text-gray-600">Quantity: ${item.quantity}</p>
                        <p class="text-sm text-gray-600">Room: ${getDisplayRoomName(item.room)}</p>
                        <div class="item-value" aria-label="Value: $${parseFloat(item.value).toFixed(2)}">$${parseFloat(item.value).toFixed(2)}</div>
                    </div>
                    <!-- Overlay for Edit/Delete buttons -->
                    <div class="item-card-overlay">
                        <button class="edit-item-btn btn-primary-small" data-item-id="${item.item_id}">Edit</button>
                        <button class="delete-item-btn btn-secondary-small" data-item-id="${item.item_id}">Delete</button>
                    </div>
                `;
                inventoryGrid.appendChild(itemCard);
            });

            totalItemsDisplay.textContent = totalItems;
            totalValueDisplay.textContent = `$${totalValue.toFixed(2)}`;
            lastUpdatedDisplay.textContent = lastUpdatedDate ? lastUpdatedDate.toLocaleDateString() : 'N/A';
        }

        // Add event listeners to newly rendered buttons
        document.querySelectorAll('.edit-item-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const itemId = parseInt(event.target.dataset.itemId);
                const itemToEdit = allItems.find(item => parseInt(item.item_id) === itemId);
                if (itemToEdit) {
                    openAddItemModal(itemToEdit);
                } else {
                    console.error('Item not found for ID:', itemId);
                }
            });
        });

        document.querySelectorAll('.delete-item-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const itemId = parseInt(event.target.dataset.itemId);
                handleDeleteItem(itemId);
            });
        });
    }

    // Function to fetch all items (used for "All Items" view and for edit lookup)
    async function fetchAllItems() {
        try {
            const response = await fetch('php/api/get_items.php'); // Use the general get_items.php
            const result = await response.json();
            if (response.ok && result.success) {
                allItems = result.items; // Store all items globally
                console.log('fetchAllItems: allItems updated.', allItems.length, 'items.');
            } else {
                showMessage(result.message || 'Failed to load all items.', 'error');
                allItems = [];
                console.error('fetchAllItems: Failed to load items:', result.message);
            }
        } catch (error) {
            console.error('Network error fetching all items:', error);
            showMessage('Network error. Could not load all inventory.', 'error');
            allItems = [];
        }
    }

    // Function to fetch and display room summaries
    async function fetchAndDisplayRoomsSummary() {
        // MODIFICATION: Ensure allItems is fetched/updated BEFORE rendering room list
        await fetchAllItems(); // This ensures allItems is fresh

        try {
            const response = await fetch('php/api/get_rooms_summary.php');
            const result = await response.json();

            if (response.ok && result.success) {
                const rooms = result.rooms;
                renderRoomsList(rooms);

                // Determine the initial room to display
                if (currentRoom === '') { // Only set initial room if not already set by a previous action
                    if (rooms.length > 0) {
                        currentRoom = rooms[0].room; // Select the first room by default
                    } else {
                        currentRoom = 'All Items'; // Fallback if no rooms exist
                    }
                }
                
                // Ensure the correct room link is active
                document.querySelectorAll('.room-nav a').forEach(link => {
                    if (link.dataset.roomName === currentRoom) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });

                fetchAndDisplayItemsForRoom(currentRoom); // Load items for the determined initial room

            } else {
                showMessage(result.message || 'Failed to load room summaries.', 'error');
                renderRoomsList([]); // Render empty list if failed
                renderItemsGrid([], 'All Items'); // Show empty state for items
            }
        } catch (error) {
            console.error('Network error fetching room summaries:', error);
            showMessage('Network error. Could not load room summaries.', 'error');
            renderRoomsList([]);
            renderItemsGrid([], 'All Items');
        }
    }

    // Function to fetch and display items for a specific room
    async function fetchAndDisplayItemsForRoom(roomName) {
        let itemsToRender = [];
        if (roomName === 'All Items') {
            itemsToRender = allItems; // Use the globally stored allItems
        } else {
            // MODIFICATION: Filter from the already fetched allItems, instead of a new API call
            itemsToRender = allItems.filter(item => item.room === roomName);
        }
        renderItemsGrid(itemsToRender, roomName);
    }

    // --- Home Info Functions ---
    // Function to display home info in the sidebar
    function displayHomeInfo(homeInfo) {
        if (homeInfo) {
            // Concatenate address components for display
            const fullAddress = [
                homeInfo.street_address,
                homeInfo.city,
                homeInfo.state,
                homeInfo.zip_code
            ].filter(Boolean).join(', '); // Filter out null/empty values and join with comma
            homeAddressDisplay.textContent = fullAddress || 'N/A';

            homeSqFtDisplay.textContent = homeInfo.square_footage ? `${parseFloat(homeInfo.square_footage).toFixed(2)} sq ft` : 'N/A';
            homeYearBuiltDisplay.textContent = homeInfo.year_built || 'N/A';
            homeRoofTypeDisplay.textContent = homeInfo.roof_type || 'N/A';
            homeRoofAgeDisplay.textContent = homeInfo.roof_age ? `${homeInfo.roof_age} years` : 'N/A';
            currentHomeInfo = homeInfo; // Store for later editing
        } else {
            homeAddressDisplay.textContent = 'N/A';
            homeSqFtDisplay.textContent = 'N/A';
            homeYearBuiltDisplay.textContent = 'N/A';
            homeRoofTypeDisplay.textContent = 'N/A';
            homeRoofAgeDisplay.textContent = 'N/A';
            currentHomeInfo = null;
        }
    }

    // Function to fetch and display home info
    async function fetchAndDisplayHomeInfo() {
        try {
            const response = await fetch('php/api/get_home_info.php');
            const result = await response.json();

            if (response.ok && result.success) {
                displayHomeInfo(result.home_info);
            } else {
                showMessage(result.message || 'Failed to load home information.', 'error');
                displayHomeInfo(null); // Clear display on error
            }
        } catch (error) {
            console.error('Network error fetching home info:', error);
            showMessage('Network error. Could not load home information.', 'error');
            displayHomeInfo(null);
        }
    }

    // Function to open the Edit Home Info modal
    function openEditHomeInfoModal() {
        // Populate form if currentHomeInfo exists
        if (currentHomeInfo) {
            homeIdInput.value = currentHomeInfo.home_id || '';
            editHomeAddressStreetInput.value = currentHomeInfo.street_address || ''; // Populate new street address
            editHomeCityInput.value = currentHomeInfo.city || ''; // Populate new city
            editHomeStateSelect.value = currentHomeInfo.state || ''; // Populate new state
            editHomeZipCodeInput.value = currentHomeInfo.zip_code || ''; // Populate new zip code
            editHomeSqFtInput.value = currentHomeInfo.square_footage || '';
            editHomeYearBuiltInput.value = currentHomeInfo.year_built || '';
            editHomeRoofTypeInput.value = currentHomeInfo.roof_type || '';
            editHomeRoofAgeInput.value = currentHomeInfo.roof_age || '';
        } else {
            // Clear form for new entry
            homeIdInput.value = '';
            editHomeAddressStreetInput.value = '';
            editHomeCityInput.value = '';
            editHomeStateSelect.value = '';
            editHomeZipCodeInput.value = '';
            editHomeSqFtInput.value = '';
            editHomeYearBuiltInput.value = '';
            editHomeRoofTypeInput.value = '';
            editHomeRoofAgeInput.value = '';
        }
        editHomeInfoModal.classList.remove('hidden');
    }

    // Function to close the Edit Home Info modal
    function closeEditHomeInfoModal() {
        editHomeInfoModal.classList.add('hidden');
        editHomeInfoForm.reset(); // Clear form fields
    }

    // Function to handle saving home info
    async function handleSaveHomeInfo() {
        const homeData = {
            home_id: homeIdInput.value || null, // Send null if it's a new entry
            street_address: editHomeAddressStreetInput.value.trim(), // New field
            city: editHomeCityInput.value.trim(), // New field
            state: editHomeStateSelect.value, // New field
            zip_code: parseInt(editHomeZipCodeInput.value) || null, // New field
            square_footage: parseFloat(editHomeSqFtInput.value) || null,
            year_built: parseInt(editHomeYearBuiltInput.value) || null,
            roof_type: editHomeRoofTypeInput.value.trim(),
            roof_age: parseInt(editHomeRoofAgeInput.value) || null,
        };

        // Basic validation for new address fields
        if (!homeData.street_address || !homeData.city || !homeData.state || !homeData.zip_code) {
            showMessage('Street Address, City, State, and Zip Code are required.', 'error');
            return;
        }
        if (isNaN(homeData.zip_code) || homeData.zip_code.toString().length !== 5) {
            showMessage('Please enter a valid 5-digit Zip Code.', 'error');
            return;
        }


        try {
            const response = await fetch('php/api/update_home_info.php', {
                method: 'POST', // Always POST for this endpoint as it handles both insert/update
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(homeData),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showMessage(result.message, 'success');
                closeEditHomeInfoModal();
                fetchAndDisplayHomeInfo(); // Refresh home info display
            } else {
                showMessage(result.message || 'Failed to save home information.', 'error');
            }
        } catch (error) {
            console.error('Error saving home info:', error);
            showMessage('Network error or server unreachable during home info save.', 'error');
        }
    }

    // Function to fetch and display the logged-in user's name
    async function fetchAndDisplayUserName() {
        try {
            const response = await fetch('php/api/get_user_info.php');
            const result = await response.json();

            if (response.ok && result.success && result.user_info) {
                // Use first_name and last_name if available, otherwise default to email or 'Guest'
                const firstName = result.user_info.first_name || '';
                const lastName = result.user_info.last_name || '';
                if (firstName || lastName) {
                    currentUserDisplayName.textContent = `${firstName} ${lastName}`.trim();
                } else {
                    // Fallback to email if names are empty, or 'Guest'
                    currentUserDisplayName.textContent = result.user_info.email || 'Guest';
                }
            } else {
                currentUserDisplayName.textContent = 'Guest'; // Default if not logged in or error
                console.error('Failed to fetch user info:', result.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Network error fetching user info:', error);
            currentUserDisplayName.textContent = 'Guest'; // Default on network error
        }
    }


    // Event Listeners
    addItemToRoomBtn.addEventListener('click', () => openAddItemModal());
    addFirstItemBtn.addEventListener('click', () => openAddItemModal());
    cancelAddItemModalBtn.addEventListener('click', closeAddItemModal);
    modalAddItemForm.addEventListener('submit', (event) => {
        event.preventDefault();
        handleModalAddItem();
    });

    modalItemCategorySelect.addEventListener('change', () => {
        if (modalItemCategorySelect.value === 'other') {
            modalOtherCategoryInputDiv.classList.remove('hidden');
        } else {
            modalOtherCategoryInputDiv.classList.add('hidden');
            modalItemCategoryOtherInput.value = '';
        }
    });

    modalItemRoomSelect.addEventListener('change', () => {
        if (modalItemRoomSelect.value === 'other') {
            modalOtherRoomInputDiv.classList.remove('hidden');
        } else {
            modalOtherRoomInputDiv.classList.add('hidden');
            modalItemRoomOtherInput.value = '';
        }
    });

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredItems = allItems.filter(item => {
            // Filter by the stored room name, not the display name
            const matchesRoom = currentRoom === 'All Items' || item.room.toLowerCase() === currentRoom.toLowerCase();
            const matchesSearch = item.item_name.toLowerCase().includes(searchTerm) ||
                                     item.category_name.toLowerCase().includes(searchTerm) ||
                                     // Also search by the display name for better UX
                                     getDisplayRoomName(item.room).toLowerCase().includes(searchTerm);
            return matchesRoom && matchesSearch;
        });
        renderItemsGrid(filteredItems, currentRoom); // Re-render with filtered items
    });

logoutButton.addEventListener('click', async () => {
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

    // Event Listeners for Home Info Modal
    editHomeInfoBtn.addEventListener('click', openEditHomeInfoModal);
    cancelEditHomeInfoModalBtn.addEventListener('click', closeEditHomeInfoModal);
    editHomeInfoForm.addEventListener('submit', (event) => {
        event.preventDefault();
        handleSaveHomeInfo();
    });

    // Initial load
    fetchAndDisplayRoomsSummary(); // This also calls fetchAllItems
    fetchAndDisplayHomeInfo(); // Fetch and display home info on page load
    fetchAndDisplayUserName(); // Call this function on page load for the rooms page
});