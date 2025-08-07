/**
 * @fileoverview Functions for making API calls to the server.
 * These functions are responsible for data fetching, adding, updating, and deleting.
 */

import { showMessage, showConfirmationModal } from './utils.js';

/**
 * Handles adding or updating an item by sending a request to the server.
 * @param {object} elements - An object containing all necessary modal DOM elements.
 * @param {string|null} editingItemId - The ID of the item being edited, or null for a new item.
 * @returns {Promise<boolean>} A promise that resolves to true if the operation was successful.
 */
export async function handleModalAddItem(elements, editingItemId) {
    const itemName = elements.modalItemNameInput.value.trim();
    let itemCategory = elements.modalItemCategorySelect.value;
    if (itemCategory === 'other') {
        itemCategory = elements.modalItemCategoryOtherInput.value.trim();
    }
    const itemQuantity = parseInt(elements.modalItemQuantityInput.value);
    let itemRoom = elements.modalItemRoomSelect.value;
    if (itemRoom === 'other') {
        itemRoom = elements.modalItemRoomOtherInput.value.trim();
    }
    const itemReplacementCost = parseFloat(elements.modalItemReplacementCostInput.value);

    // Basic client-side validation
    if (!itemName || !itemCategory || !itemRoom || isNaN(itemQuantity) || isNaN(itemReplacementCost)) {
        showMessage('Please fill in all required item details.', 'error');
        return false;
    }
    if (itemQuantity <= 0) {
        showMessage('Quantity must be at least 1.', 'error');
        return false;
    }
    if (itemReplacementCost < 0) {
        showMessage('Replacement cost cannot be negative.', 'error');
        return false;
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
            return true;
        } else {
            showMessage(result.message || 'An error occurred while saving item.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error saving item:', error);
        showMessage('Network error or server unreachable during item save.', 'error');
        return false;
    }
}

/**
 * Sends a request to delete an item.
 * @param {number} itemId - The ID of the item to delete.
 * @returns {Promise<boolean>} A promise that resolves to true if the deletion was successful.
 */
export async function handleDeleteItem(itemId) {
    const confirmed = await showConfirmationModal('Are you sure you want to delete this item?', 'Confirm Deletion');

    if (!confirmed) {
        return false;
    }

    try {
        const response = await fetch('php/api/delete_item.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ item_id: itemId }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showMessage(result.message, 'success');
            return true;
        } else {
            showMessage(result.message || 'An error occurred while deleting item.', 'error');
            console.error('Deletion failed. Server message:', result.message);
            return false;
        }
    } catch (error) {
        console.error('Network error or server unreachable during item deletion:', error);
        showMessage('Network error. Could not delete item.', 'error');
        return false;
    }
}

/**
 * Fetches all items from the server.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of all items.
 */
export async function fetchAllItems() {
    try {
        const response = await fetch('php/api/get_items.php');
        const result = await response.json();
        if (response.ok && result.success) {
            return result.items;
        } else {
            showMessage(result.message || 'Failed to load all items.', 'error');
            console.error('fetchAllItems: Failed to load items:', result.message);
            return [];
        }
    } catch (error) {
        console.error('Network error fetching all items:', error);
        showMessage('Network error. Could not load all inventory.', 'error');
        return [];
    }
}

/**
 * Fetches a summary of all rooms and their item counts.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of room summary objects.
 */
export async function fetchRoomsSummary() {
    try {
        const response = await fetch('php/api/get_rooms_summary.php');
        const result = await response.json();
        if (response.ok && result.success) {
            return result.rooms;
        } else {
            showMessage(result.message || 'Failed to load room summaries.', 'error');
            return [];
        }
    } catch (error) {
        console.error('Network error fetching room summaries:', error);
        showMessage('Network error. Could not load room summaries.', 'error');
        return [];
    }
}

/**
 * Fetches home information from the server.
 * @returns {Promise<object|null>} A promise that resolves with the home info object or null.
 */
export async function fetchHomeInfo() {
    try {
        const response = await fetch('php/api/get_home_info.php');
        const result = await response.json();
        if (response.ok && result.success) {
            return result.home_info;
        } else {
            showMessage(result.message || 'Failed to load home information.', 'error');
            return null;
        }
    } catch (error) {
        console.error('Network error fetching home info:', error);
        showMessage('Network error. Could not load home information.', 'error');
        return null;
    }
}

/**
 * Handles saving or updating home information.
 * @param {object} homeData - An object containing the home data to save.
 * @returns {Promise<boolean>} A promise that resolves to true if the save was successful.
 */
export async function handleSaveHomeInfo(homeData) {
    try {
        const response = await fetch('php/api/update_home_info.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(homeData),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showMessage(result.message, 'success');
            return true;
        } else {
            showMessage(result.message || 'Failed to save home information.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error saving home info:', error);
        showMessage('Network error or server unreachable during home info save.', 'error');
        return false;
    }
}

/**
 * Fetches the logged-in user's name from the server.
 * @returns {Promise<string>} A promise that resolves with the user's name or 'Guest'.
 */
export async function fetchUserName() {
    try {
        const response = await fetch('php/api/get_user_info.php');
        const result = await response.json();
        if (response.ok && result.success && result.user_info) {
            const firstName = result.user_info.first_name || '';
            const lastName = result.user_info.last_name || '';
            if (firstName || lastName) {
                return `${firstName} ${lastName}`.trim();
            } else {
                return result.user_info.email || 'Guest';
            }
        } else {
            console.error('Failed to fetch user info:', result.message || 'Unknown error');
            return 'Guest';
        }
    } catch (error) {
        console.error('Network error fetching user info:', error);
        return 'Guest';
    }
}

/**
 * Logs out the user by making an API call.
 * @returns {Promise<boolean>} A promise that resolves to true if logout was successful.
 */
export async function logoutUser() {
    const confirmed = await showConfirmationModal('Are you sure you want to log out?', 'Confirm Logout');

    if (!confirmed) {
        return false;
    }

    try {
        const response = await fetch('php/auth/logout.php', { method: 'POST' });
        const result = await response.json();
        if (result.success) {
            return true;
        } else {
            showMessage(result.message || 'Logout failed.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Logout error:', error);
        showMessage('Network error during logout.', 'error');
        return false;
    }
}
