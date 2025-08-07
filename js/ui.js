/**
 * @fileoverview Functions for handling all user interface updates and rendering.
 * These functions take DOM elements and data as arguments and manipulate the page.
 */

// Mapping for display names of rooms, centralized for consistency
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

/**
 * Converts a room value (e.g., 'living_room') to its display name (e.g., 'Living Room').
 * If the room value is not found in the predefined map, it returns the value itself, formatted.
 * @param {string} roomValue - The internal room value.
 * @returns {string} The display name of the room.
 */
export function getDisplayRoomName(roomValue) {
    if (roomDisplayNames[roomValue]) {
        return roomDisplayNames[roomValue];
    } else {
        return roomValue.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
}

/**
 * Toggles the visibility of the "other" category input field based on the selected value.
 * @param {object} elements - An object containing the necessary DOM elements.
 */
export function handleCategorySelectChange(elements) {
    if (elements.modalItemCategorySelect.value === 'other') {
        elements.modalOtherCategoryInputDiv.classList.remove('hidden');
    } else {
        elements.modalOtherCategoryInputDiv.classList.add('hidden');
        elements.modalItemCategoryOtherInput.value = '';
    }
}

/**
 * Toggles the visibility of the "other" room input field based on the selected value.
 * @param {object} elements - An object containing the necessary DOM elements.
 */
export function handleRoomSelectChange(elements) {
    if (elements.modalItemRoomSelect.value === 'other') {
        elements.modalOtherRoomInputDiv.classList.remove('hidden');
    } else {
        elements.modalOtherRoomInputDiv.classList.add('hidden');
        elements.modalItemRoomOtherInput.value = '';
    }
}


/**
 * Clears all input fields and resets the state of the add/edit item modal form.
 * @param {object} elements - An object containing all necessary modal DOM elements.
 */
export function clearAddItemModalForm(elements) {
    elements.modalItemNameInput.value = '';
    elements.modalItemCategorySelect.value = '';
    elements.modalOtherCategoryInputDiv.classList.add('hidden');
    elements.modalItemCategoryOtherInput.value = '';
    elements.modalItemQuantityInput.value = '1';
    elements.modalItemRoomSelect.value = '';
    elements.modalOtherRoomInputDiv.classList.add('hidden');
    elements.modalItemRoomOtherInput.value = '';
    elements.modalItemReplacementCostInput.value = '0';
    elements.modalAddItemBtn.textContent = 'Add Item';
    elements.modalTitle.textContent = 'Add New Item';
}

/**
 * Opens the add/edit item modal, populating it with existing item data if provided.
 * @param {object} elements - An object containing all necessary modal DOM elements.
 * @param {object|null} item - The item object to edit, or null for a new item.
 * @param {string} currentRoom - The name of the currently active room.
 * @param {function} setEditingItemId - Function to set the editing item's ID in the main state.
 */
export function openAddItemModal(elements, item = null, currentRoom, setEditingItemId) {
    // Reset the form first
    clearAddItemModalForm(elements);

    if (item) {
        console.log('Editing item:', item); // Optional: Keep this for debugging

        elements.modalTitle.textContent = 'Edit Item';
        elements.modalAddItemBtn.textContent = 'Update Item';
        setEditingItemId(item.item_id);

        // Populate name
        elements.modalItemNameInput.value = item.item_name || '';

        // Populate category
        const categoryOptions = Array.from(elements.modalItemCategorySelect.options).map(o => o.value);
        if (categoryOptions.includes(item.category_name)) {
            elements.modalItemCategorySelect.value = item.category_name;
            elements.modalOtherCategoryInputDiv.classList.add('hidden');
            elements.modalItemCategoryOtherInput.value = '';
        } else {
            elements.modalItemCategorySelect.value = 'other';
            elements.modalOtherCategoryInputDiv.classList.remove('hidden');
            elements.modalItemCategoryOtherInput.value = item.category_name || '';
        }

        // Populate quantity
        elements.modalItemQuantityInput.value = item.quantity || 1;

        // Populate room
        const roomOptions = Array.from(elements.modalItemRoomSelect.options).map(o => o.value);
        if (roomOptions.includes(item.room)) {
            elements.modalItemRoomSelect.value = item.room;
            elements.modalOtherRoomInputDiv.classList.add('hidden');
            elements.modalItemRoomOtherInput.value = '';
        } else {
            elements.modalItemRoomSelect.value = 'other';
            elements.modalOtherRoomInputDiv.classList.remove('hidden');
            elements.modalItemRoomOtherInput.value = item.room || '';
        }

        // Populate replacement cost
        const cost = parseFloat(item.value);
        elements.modalItemReplacementCostInput.value = isNaN(cost) ? '0.00' : cost.toFixed(2);

    } else {
        // Adding a new item
        elements.modalTitle.textContent = 'Add Item';
        elements.modalAddItemBtn.textContent = 'Add Item';
        setEditingItemId(null);

        // Pre-select room if currentRoom is passed
        if (currentRoom && currentRoom !== 'All Items') {
            const roomKey = Object.keys(roomDisplayNames).find(k => roomDisplayNames[k] === currentRoom);
            if (roomKey) {
                elements.modalItemRoomSelect.value = roomKey;
                elements.modalOtherRoomInputDiv.classList.add('hidden');
                elements.modalItemRoomOtherInput.value = '';
            } else {
                elements.modalItemRoomSelect.value = 'other';
                elements.modalOtherRoomInputDiv.classList.remove('hidden');
                elements.modalItemRoomOtherInput.value = currentRoom;
            }
        }
    }

    // Finally, show the modal
    elements.addItemModal.classList.remove('hidden');
}


/**
 * Closes the add/edit item modal and resets the form.
 * @param {object} elements - An object containing all necessary modal DOM elements.
 * @param {function} setEditingItemId - Function to reset the editing item's ID in the main state.
 */
export function closeAddItemModal(elements, setEditingItemId) {
    elements.addItemModal.classList.add('hidden');
    clearAddItemModalForm(elements);
    setEditingItemId(null);
}

/**
 * Renders the list of rooms in the sidebar navigation.
 * @param {object} elements - An object containing DOM elements like roomList.
 * @param {Array<object>} rooms - An array of room summary objects.
 * @param {string} currentRoom - The name of the currently active room.
 * @param {Array<object>} allItems - The full list of all items for item counts.
 */
export function renderRoomsList(elements, rooms, currentRoom, allItems) {
    elements.roomList.innerHTML = '';

    const allItemsLink = document.createElement('li');
    allItemsLink.innerHTML = `
        <a href="#" data-room-name="All Items" class="${currentRoom === 'All Items' ? 'active' : ''} room-link">
            <span>All Items</span>
            <span class="item-count">${allItems.length}</span>
        </a>
    `;
    elements.roomList.appendChild(allItemsLink);

    rooms.forEach(room => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <a href="#" data-room-name="${room.room}" class="${currentRoom === room.room ? 'active' : ''} room-link">
                <span>${getDisplayRoomName(room.room)}</span>
                <span class="item-count">${room.item_count}</span>
            </a>
        `;
        elements.roomList.appendChild(listItem);
    });
}

/**
 * Renders item cards in the main inventory grid.
 * @param {object} elements - An object containing DOM elements like inventoryGrid.
 * @param {Array<object>} itemsToDisplay - The items to be displayed.
 * @param {string} roomName - The name of the room being displayed.
 * @param {function} handleDeleteItem - The function to call on delete button click.
 * @param {Array<object>} allItems - The full list of all items for edit lookup.
 * @param {function} openAddItemModal - The function to call on edit button click.
 * @param {function} setEditingItemId - The function to set the editing item's ID.
 */
export function renderItemsGrid(elements, itemsToDisplay, roomName, handleDeleteItem, allItems, openAddItemModal, setEditingItemId) {
    elements.inventoryGrid.innerHTML = '';
    elements.currentRoomTitle.textContent = getDisplayRoomName(roomName) === 'All Items' ? 'All Items' : getDisplayRoomName(roomName);
    document.title = `${getDisplayRoomName(roomName) === 'All Items' ? 'All Items' : getDisplayRoomName(roomName)} - Home Inventory`;

    if (itemsToDisplay.length === 0) {
        elements.inventoryGrid.style.display = 'none';
        elements.emptyState.style.display = 'block';
        elements.roomSummary.style.display = 'none';
        elements.emptyStateTitle.textContent = `No items in ${getDisplayRoomName(roomName) === 'All Items' ? 'your inventory' : getDisplayRoomName(roomName)} yet`;
        elements.emptyStateText.textContent = `Start building your inventory by adding your first item to ${getDisplayRoomName(roomName) === 'All Items' ? 'any room' : getDisplayRoomName(roomName)}.`;
        elements.addFirstItemBtn.textContent = `+ Add Your First Item to ${getDisplayRoomName(roomName) === 'All Items' ? 'any room' : getDisplayRoomName(roomName)}`;
    } else {
        elements.inventoryGrid.style.display = 'grid';
        elements.emptyState.style.display = 'none';
        elements.roomSummary.style.display = 'block';

        let totalItems = 0;
        let totalValue = 0;
        let lastUpdatedDate = null;

        itemsToDisplay.forEach(item => {
            totalItems += parseInt(item.quantity);
            totalValue += parseFloat(item.value) * parseInt(item.quantity);

            const itemDate = new Date(item.created_at);
            if (!lastUpdatedDate || itemDate > lastUpdatedDate) {
                lastUpdatedDate = itemDate;
            }

            const itemCard = document.createElement('article');
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
                <div class="item-card-overlay">
                    <button class="edit-item-btn btn-primary-small" data-item-id="${item.item_id}">Edit</button>
                    <button class="delete-item-btn btn-secondary-small" data-item-id="${item.item_id}">Delete</button>
                </div>
            `;
            elements.inventoryGrid.appendChild(itemCard);
        });

        elements.totalItemsDisplay.textContent = totalItems;
        elements.totalValueDisplay.textContent = `$${totalValue.toFixed(2)}`;
        elements.lastUpdatedDisplay.textContent = lastUpdatedDate ? lastUpdatedDate.toLocaleDateString() : 'N/A';
    }

    // Add event listeners to newly rendered buttons
    document.querySelectorAll('.edit-item-btn').forEach(button => {
    button.addEventListener('click', (event) => {
        const itemId = parseInt(event.target.dataset.itemId);
        const itemToEdit = allItems.find(item => parseInt(item.item_id) === itemId);

        console.log('Clicked item ID:', itemId);
        console.log('Found item to edit:', itemToEdit);

        if (itemToEdit) {
            openAddItemModal(elements, itemToEdit, roomName, setEditingItemId);
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

/**
 * Populates and shows the edit home info modal with current home data.
 * @param {object} elements - An object containing all necessary modal DOM elements.
 * @param {object|null} currentHomeInfo - The home info object to display.
 */
export function openEditHomeInfoModal(elements, currentHomeInfo) {
    if (currentHomeInfo) {
        elements.homeIdInput.value = currentHomeInfo.home_id || '';
        elements.editHomeAddressStreetInput.value = currentHomeInfo.street_address || '';
        elements.editHomeCityInput.value = currentHomeInfo.city || '';
        elements.editHomeStateSelect.value = currentHomeInfo.state || '';
        elements.editHomeZipCodeInput.value = currentHomeInfo.zip_code || '';
        elements.editHomeSqFtInput.value = currentHomeInfo.square_footage || '';
        elements.editHomeYearBuiltInput.value = currentHomeInfo.year_built || '';
        elements.editHomeRoofTypeInput.value = currentHomeInfo.roof_type || '';
        elements.editHomeRoofAgeInput.value = currentHomeInfo.roof_age || '';
    } else {
        elements.editHomeInfoForm.reset();
    }
    elements.editHomeInfoModal.classList.remove('hidden');
}

/**
 * Closes the modal for editing home information.
 * @param {object} elements - An object containing all necessary modal DOM elements.
 */
export function closeEditHomeInfoModal(elements) {
    elements.editHomeInfoModal.classList.add('hidden');
    elements.editHomeInfoForm.reset();
}

/**
 * Displays home information in the sidebar.
 * @param {object} elements - An object containing all necessary DOM elements.
 * @param {object|null} homeInfo - The home info object to display.
 */
export function displayHomeInfo(elements, homeInfo) {
    if (homeInfo) {
        const fullAddress = [
            homeInfo.street_address,
            homeInfo.city,
            homeInfo.state,
            homeInfo.zip_code
        ].filter(Boolean).join(', ');
        elements.homeAddressDisplay.textContent = fullAddress || 'N/A';
        elements.homeSqFtDisplay.textContent = homeInfo.square_footage ? `${parseFloat(homeInfo.square_footage).toFixed(2)} sq ft` : 'N/A';
        elements.homeYearBuiltDisplay.textContent = homeInfo.year_built || 'N/A';
        elements.homeRoofTypeDisplay.textContent = homeInfo.roof_type || 'N/A';
        elements.homeRoofAgeDisplay.textContent = homeInfo.roof_age ? `${homeInfo.roof_age} years` : 'N/A';
    } else {
        elements.homeAddressDisplay.textContent = 'N/A';
        elements.homeSqFtDisplay.textContent = 'N/A';
        elements.homeYearBuiltDisplay.textContent = 'N/A';
        elements.homeRoofTypeDisplay.textContent = 'N/A';
        elements.homeRoofAgeDisplay.textContent = 'N/A';
    }
}
