document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const messageBox = document.getElementById('message-box');
    const roomOrganizedInventory = document.getElementById('room-organized-inventory');
    const noItemsMessage = document.getElementById('no-items-message');
    const inventorySummary = document.getElementById('inventory-summary');
    const totalItemsCountDisplay = document.getElementById('total-items-count');
    const totalReplacementCostDisplay = document.getElementById('total-replacement-cost');
    const logoutButton = document.querySelector('.header-logout-btn'); 
    const currentUserDisplayName = document.getElementById('current-user-name'); // User name display element

    // Add/Edit Item Form Elements
    const itemNameInput = document.getElementById('item-name');
    const itemCategorySelect = document.getElementById('item-category');
    const itemCategoryOtherInput = document.getElementById('item-category-other');
    const otherCategoryInputDiv = document.getElementById('other-category-input');
    const itemQuantityInput = document.getElementById('item-quantity');
    const itemRoomSelect = document.getElementById('item-room');
    const itemRoomOtherInput = document.getElementById('item-room-other');
    const otherRoomInputDiv = document.getElementById('other-room-input');
    const itemReplacementCostInput = document.getElementById('item-replacement-cost');
    const addItemButton = document.getElementById('add-item'); // This button will now also serve as "Update Item"

    // State variable to track if we are editing an item
    let editingItemId = null; // Stores the item_id of the item being edited

    // Utility Functions
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

    // Function to clear the add/edit item form
    function clearAddItemForm() {
        itemNameInput.value = '';
        itemCategorySelect.value = '';
        otherCategoryInputDiv.classList.add('hidden');
        itemCategoryOtherInput.value = '';
        itemQuantityInput.value = '1';
        itemRoomSelect.value = '';
        otherRoomInputDiv.classList.add('hidden');
        itemRoomOtherInput.value = '';
        itemReplacementCostInput.value = '0';
        addItemButton.textContent = 'Add Item'; // Reset button text
        editingItemId = null; // Reset editing state
    }

    // Function to handle adding or updating an item
    async function handleAddItem() {
        const itemName = itemNameInput.value.trim();
        let itemCategory = itemCategorySelect.value;
        if (itemCategory === 'other') {
            itemCategory = itemCategoryOtherInput.value.trim();
        }
        const itemQuantity = parseInt(itemQuantityInput.value);
        let itemRoom = itemRoomSelect.value;
        if (itemRoom === 'other') {
            itemRoom = itemRoomOtherInput.value.trim();
        }
        const itemReplacementCost = parseFloat(itemReplacementCostInput.value);

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

        let endpoint = 'php/add_item.php';
        let method = 'POST';

        if (editingItemId) { // If editingItemId is set, we are updating
            endpoint = 'php/update_item.php';
            method = 'POST'; 
            itemData.item_id = editingItemId; // Add the ID for the item to be updated
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
                clearAddItemForm();
                fetchAndDisplayItems(); // Re-fetch and display items after adding/updating
            } else {
                showMessage(result.message || 'An error occurred while saving item.', 'error');
            }
        } catch (error) {
            console.error('Error saving item:', error);
            showMessage('Network error or server unreachable during item save.', 'error');
        }
    }

    // Function to handle editing an item (populates the form)
    function handleEditItem(item) {
        itemNameInput.value = item.item_name;
        
        // Use item.category_name to set the select value
        const categoryName = item.category_name;
        let categoryFound = false;
        Array.from(itemCategorySelect.options).forEach(option => {
            if (option.value === categoryName) {
                itemCategorySelect.value = categoryName;
                categoryFound = true;
            }
        });

        // If category name is not in predefined options, set 'other' and fill custom input
        if (!categoryFound) {
            itemCategorySelect.value = 'other';
            otherCategoryInputDiv.classList.remove('hidden');
            itemCategoryOtherInput.value = categoryName; 
        } else {
            otherCategoryInputDiv.classList.add('hidden');
            itemCategoryOtherInput.value = '';
        }

        itemQuantityInput.value = item.quantity;

        // Use item.room to set the select value
        const roomName = item.room;
        let roomFound = false;
        Array.from(itemRoomSelect.options).forEach(option => {
            if (option.value === roomName) {
                itemRoomSelect.value = roomName;
                roomFound = true;
            }
        });

        // If room is not in predefined options, set 'other' and fill custom input
        if (!roomFound) {
            itemRoomSelect.value = 'other';
            otherRoomInputDiv.classList.remove('hidden');
            itemRoomOtherInput.value = roomName; 
        } else {
            otherRoomInputDiv.classList.add('hidden');
            itemRoomOtherInput.value = '';
        }
        
        itemReplacementCostInput.value = parseFloat(item.value).toFixed(2); // Ensure 2 decimal places
        addItemButton.textContent = 'Update Item'; // Change button text
        editingItemId = item.item_id; // Set the ID of the item being edited
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top to see the form
    }

    // Function to handle deleting an item
    async function handleDeleteItem(itemId) {
        if (!confirm('Are you sure you want to delete this item?')) {
            return; // User cancelled
        }

        try {
            const response = await fetch('php/delete_item.php', {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ item_id: itemId }), // Send the ID of the item to delete
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showMessage(result.message, 'success');
                fetchAndDisplayItems(); // Re-fetch and display items after deletion
            } else {
                showMessage(result.message || 'An error occurred while deleting item.', 'error');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            showMessage('Network error or server unreachable during item deletion.', 'error');
        }
    }

    // Function to render items into the DOM
    function renderItems(items) {
        roomOrganizedInventory.innerHTML = ''; // Clear existing items

        if (items.length === 0) {
            noItemsMessage.classList.remove('hidden');
            inventorySummary.classList.add('hidden');
            return;
        } else {
            noItemsMessage.classList.add('hidden');
            inventorySummary.classList.remove('hidden');
        }

        let totalItems = 0;
        let totalValue = 0;
        const itemsByRoom = {};

        // Group items by room
        items.forEach(item => {
            const roomName = item.room || 'Uncategorized Room';
            if (!itemsByRoom[roomName]) {
                itemsByRoom[roomName] = [];
            }
            itemsByRoom[roomName].push(item);
            totalItems += parseInt(item.quantity);
            totalValue += parseFloat(item.value) * parseInt(item.quantity);
        });

        // Display items organized by room
        for (const room in itemsByRoom) {
            const roomSection = document.createElement('div');
            roomSection.className = 'room-section bg-gray-50 p-4 rounded-lg shadow-sm mb-4';
            roomSection.innerHTML = `
                <h3 class="text-lg font-semibold text-gray-700 mb-4">${room}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${itemsByRoom[room].map(item => `
                        <div class="item-card bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
                            <div class="flex-shrink-0">
                                <!-- Placeholder for image/icon -->
                                <svg class="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <div class="flex-grow">
                                <h4 class="text-md font-semibold text-gray-800">${item.item_name}</h4>
                                <p class="text-sm text-gray-600">Category: ${item.category_name}</p>
                                <p class="text-sm text-gray-600">Quantity: ${item.quantity}</p>
                                <p class="text-sm text-green-600 font-bold">Value: $${parseFloat(item.value).toFixed(2)}</p>
                            </div>
                            <div class="flex-shrink-0 flex flex-col space-y-2">
                                <button class="edit-item-btn bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1 px-2 rounded" data-item-id="${item.item_id}">Edit</button>
                                <button class="delete-item-btn bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded" data-item-id="${item.item_id}">Delete</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            roomOrganizedInventory.appendChild(roomSection);
        }

        // Update summary
        totalItemsCountDisplay.textContent = totalItems;
        totalReplacementCostDisplay.textContent = `$${totalValue.toFixed(2)}`;

        // Add event listeners to newly rendered buttons
        document.querySelectorAll('.edit-item-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const itemId = parseInt(event.target.dataset.itemId);
                // CORRECTED: Parse item.item_id to integer for strict comparison
                const itemToEdit = items.find(item => parseInt(item.item_id) === itemId); 
                if (itemToEdit) {
                    handleEditItem(itemToEdit);
                } else {
                    console.error('Item not found for ID:', itemId); // Log if item not found
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

    // Function to fetch items from the backend
    async function fetchAndDisplayItems() {
        try {
            const response = await fetch('php/get_items.php');
            const result = await response.json();

            if (response.ok && result.success) {
                renderItems(result.items);
            } else {
                showMessage(result.message || 'Failed to load items.', 'error');
                // If user not logged in, redirect to login page
                if (result.message === 'User not logged in.') {
                    setTimeout(() => {
                        window.location.href = 'login_register.html'; // Redirect to combined login/register
                    }, 1500);
                }
            }
        } catch (error) {
            console.error('Network error fetching items:', error);
            showMessage('Network error. Could not load inventory.', 'error');
        }
    }

    // Function to fetch and display the logged-in user's name
    async function fetchAndDisplayUserName() {
        try {
            const response = await fetch('php/get_user_info.php');
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


    // Event Listeners for Add Item Form
    itemCategorySelect.addEventListener('change', () => {
        if (itemCategorySelect.value === 'other') {
            otherCategoryInputDiv.classList.remove('hidden');
        } else {
            otherCategoryInputDiv.classList.add('hidden');
            itemCategoryOtherInput.value = '';
        }
    });

    itemRoomSelect.addEventListener('change', () => {
        if (itemRoomSelect.value === 'other') {
            otherRoomInputDiv.classList.remove('hidden');
        } else {
            otherRoomInputDiv.classList.add('hidden');
            itemRoomOtherInput.value = '';
        }
    });

    addItemButton.addEventListener('click', handleAddItem);

    // Logout functionality with confirmation
    logoutButton.addEventListener('click', async () => {
        // Confirmation dialog before logging out
        if (!confirm('Are you sure you want to log out?')) {
            return; // Stop if user cancels
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

    // Initial fetch and display of items when the dashboard loads
    fetchAndDisplayItems();
    fetchAndDisplayUserName(); // Call this function on page load
});
