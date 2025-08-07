/**
 * @fileoverview Main script for the Inventory page.
 * Handles page initialization, user events, and orchestrates calls to UI and API modules.
 */

import {
    clearAddItemModalForm,
    openAddItemModal,
    closeAddItemModal,
    renderRoomsList,
    renderItemsGrid,
    displayHomeInfo,
    openEditHomeInfoModal,
    closeEditHomeInfoModal,
    getDisplayRoomName,
    handleCategorySelectChange,
    handleRoomSelectChange
} from './ui.js';

import {
    handleModalAddItem,
    handleDeleteItem,
    fetchAllItems,
    fetchRoomsSummary,
    fetchHomeInfo,
    handleSaveHomeInfo,
    fetchUserName,
    logoutUser
} from './api.js';

import { showMessage, showConfirmationModal } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const elements = {
        messageBox: document.getElementById('message-box'),
        roomList: document.getElementById('room-list'),
        currentRoomTitle: document.getElementById('current-room-title'),
        inventoryGrid: document.getElementById('inventory-grid'),
        emptyState: document.getElementById('empty-state'),
        emptyStateTitle: document.getElementById('empty-state-title'),
        emptyStateText: document.getElementById('empty-state-text'),
        roomSummary: document.getElementById('room-summary'),
        totalItemsDisplay: document.getElementById('total-items'),
        totalValueDisplay: document.getElementById('total-value'),
        lastUpdatedDisplay: document.getElementById('last-updated'),
        searchInput: document.getElementById('item-search'),
        addItemToRoomBtn: document.getElementById('add-item-to-room-btn'),
        addFirstItemBtn: document.getElementById('add-first-item-btn'),
        logoutButton: document.querySelector('.header-logout-btn'),
        currentUserDisplayName: document.getElementById('current-user-name'),
        homeAddressDisplay: document.getElementById('home-address'),
        homeSqFtDisplay: document.getElementById('home-sq-ft'),
        homeYearBuiltDisplay: document.getElementById('home-year-built'),
        homeRoofTypeDisplay: document.getElementById('home-roof-type'),
        homeRoofAgeDisplay: document.getElementById('home-roof-age'),
        editHomeInfoBtn: document.getElementById('edit-home-info-btn'),
        addItemModal: document.getElementById('addItemModal'),
        modalTitle: document.getElementById('modal-title'),
        modalAddItemForm: document.getElementById('modalAddItemForm'),
        modalItemNameInput: document.getElementById('modal-item-name'),
        modalItemCategorySelect: document.getElementById('modal-item-category'),
        modalItemCategoryOtherInput: document.getElementById('modal-item-category-other'),
        modalOtherCategoryInputDiv: document.getElementById('modal-other-category-input'),
        modalItemQuantityInput: document.getElementById('modal-item-quantity'),
        modalItemRoomSelect: document.getElementById('modal-item-room'),
        modalItemRoomOtherInput: document.getElementById('modal-item-room-other'),
        modalOtherRoomInputDiv: document.getElementById('modal-other-room-input'),
        modalItemReplacementCostInput: document.getElementById('modal-item-replacement-cost'),
        modalAddItemBtn: document.getElementById('modal-add-item-btn'),
        cancelAddItemModalBtn: document.getElementById('cancelAddItemModal'),
        editHomeInfoModal: document.getElementById('editHomeInfoModal'),
        editHomeInfoForm: document.getElementById('editHomeInfoForm'),
        homeIdInput: document.getElementById('home-id-input'),
        editHomeAddressStreetInput: document.getElementById('edit-home-address-street'),
        editHomeCityInput: document.getElementById('edit-home-city'),
        editHomeStateSelect: document.getElementById('edit-home-state'),
        editHomeZipCodeInput: document.getElementById('edit-home-zipcode'),
        editHomeSqFtInput: document.getElementById('edit-home-sq-ft'),
        editHomeYearBuiltInput: document.getElementById('edit-home-year-built'),
        editHomeRoofTypeInput: document.getElementById('edit-home-roof-type'),
        editHomeRoofAgeInput: document.getElementById('edit-home-roof-age'),
        saveHomeInfoBtn: document.getElementById('save-home-info-btn'),
        cancelEditHomeInfoModalBtn: document.getElementById('cancelEditHomeInfoModal'),
    };
    
    // --- State variables ---
    let currentRoom = '';
    let allItems = [];
    let editingItemId = null;
    let currentHomeInfo = null;

    // Helper function to set the state variables
    const setEditingItemId = (id) => { editingItemId = id; };
    const setCurrentRoom = (room) => { currentRoom = room; };
    const setAllItems = (items) => { allItems = items; };
    const setCurrentHomeInfo = (info) => { currentHomeInfo = info; };

    /**
     * Updates and re-renders the entire page's content.
     * This is the main function called after any data change.
     */
    async function refreshUI() {
        const rooms = await fetchRoomsSummary();
        setAllItems(await fetchAllItems());

        if (currentRoom === '') {
            currentRoom = rooms.length > 0 ? rooms[0].room : 'All Items';
        }

        renderRoomsList(elements, rooms, currentRoom, allItems);
        // Correctly pass setEditingItemId to renderItemsGrid
        renderItemsGrid(elements, filterItemsByRoom(currentRoom), currentRoom, handleDeleteItem, allItems, (item) => {
            openAddItemModal(elements, item, currentRoom, setEditingItemId);
        }, setEditingItemId);
        const homeInfo = await fetchHomeInfo();
        setCurrentHomeInfo(homeInfo);
        displayHomeInfo(elements, homeInfo);
    }

    /**
     * Filters the global item list by the current room.
     * @param {string} roomName - The room to filter by.
     * @returns {Array<object>} The filtered array of items.
     */
    function filterItemsByRoom(roomName) {
        if (roomName === 'All Items') {
            return allItems;
        } else {
            return allItems.filter(item => item.room === roomName);
        }
    }

    // --- Event Listeners ---
    elements.roomList.addEventListener('click', (event) => {
        const roomLink = event.target.closest('.room-link');
        if (roomLink) {
            event.preventDefault();
            const selectedRoom = roomLink.dataset.roomName;
            if (selectedRoom !== currentRoom) {
                setCurrentRoom(selectedRoom);
                refreshUI();
            }
        }
    });

    elements.addItemToRoomBtn.addEventListener('click', () => {
        openAddItemModal(elements, item, currentRoom, setEditingItemId);
    });

    elements.addFirstItemBtn.addEventListener('click', () => {
        openAddItemModal(elements, item, currentRoom, setEditingItemId);
    });
    
    elements.cancelAddItemModalBtn.addEventListener('click', () => {
        closeAddItemModal(elements, setEditingItemId);
    });
    
    elements.modalAddItemForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const success = await handleModalAddItem(elements, editingItemId);
        if (success) {
            closeAddItemModal(elements, setEditingItemId);
            refreshUI(); // Refresh the whole page content after a successful save
        }
    });
    
    // Event listeners for "other" input fields
    elements.modalItemCategorySelect.addEventListener('change', () => handleCategorySelectChange(elements));
    elements.modalItemRoomSelect.addEventListener('change', () => handleRoomSelectChange(elements));


    elements.editHomeInfoBtn.addEventListener('click', async () => {
        const homeInfo = await fetchHomeInfo();
        setCurrentHomeInfo(homeInfo);
        openEditHomeInfoModal(elements, homeInfo);
    });
    
    elements.cancelEditHomeInfoModalBtn.addEventListener('click', () => {
        closeEditHomeInfoModal(elements);
    });
    
    elements.editHomeInfoForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const homeData = {
            home_id: elements.homeIdInput.value || null,
            street_address: elements.editHomeAddressStreetInput.value.trim(),
            city: elements.editHomeCityInput.value.trim(),
            state: elements.editHomeStateSelect.value,
            zip_code: parseInt(elements.editHomeZipCodeInput.value) || null,
            square_footage: parseFloat(elements.editHomeSqFtInput.value) || null,
            year_built: parseInt(elements.editHomeYearBuiltInput.value) || null,
            roof_type: elements.editHomeRoofTypeInput.value.trim(),
            roof_age: parseInt(elements.editHomeRoofAgeInput.value) || null,
        };

        const success = await handleSaveHomeInfo(homeData);
        if (success) {
            closeEditHomeInfoModal(elements);
            refreshUI(); // Refresh the page to show the new home info
        }
    });
    
    // Logout logic
    elements.logoutButton.addEventListener('click', async () => {
        const confirmed = await showConfirmationModal('Are you sure you want to log out?', 'Confirm Logout');
        if (confirmed) {
            const success = await logoutUser();
            if (success) {
                window.location.href = 'login_register.html';
            }
        }
    });

    elements.searchInput.addEventListener('input', () => {
        const searchTerm = elements.searchInput.value.toLowerCase();
        const filteredItems = allItems.filter(item => {
            const matchesRoom = currentRoom === 'All Items' || item.room.toLowerCase() === currentRoom.toLowerCase();
            const matchesSearch = item.item_name.toLowerCase().includes(searchTerm) ||
                                  item.category_name.toLowerCase().includes(searchTerm) ||
                                  getDisplayRoomName(item.room).toLowerCase().includes(searchTerm);
            return matchesRoom && matchesSearch;
        });
        // Pass setEditingItemId to renderItemsGrid
        renderItemsGrid(elements, filteredItems, currentRoom, handleDeleteItem, allItems, (item) => {
            openAddItemModal(elements, item, currentRoom, setEditingItemId);
        }, setEditingItemId);
    });

    // Initial load
    refreshUI();
    fetchUserName().then(name => {
        elements.currentUserDisplayName.textContent = name;
    });
});
