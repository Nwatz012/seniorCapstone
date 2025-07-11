
        // DOM Elements
        const itemNameInput = document.getElementById('item-name');
        const itemCategorySelect = document.getElementById('item-category');
        const itemCategoryOtherInput = document.getElementById('item-category-other');
        const otherCategoryInputDiv = document.getElementById('other-category-input');
        const itemQuantityInput = document.getElementById('item-quantity');
        const itemRoomSelect = document.getElementById('item-room');
        const itemRoomOtherInput = document.getElementById('item-room-other');
        const otherRoomInputDiv = document.getElementById('other-room-input');
        const itemReplacementCostInput = document.getElementById('item-replacement-cost');
        const addItemButton = document.getElementById('add-item');
        const noItemsMessage = document.getElementById('no-items-message');
        const messageBox = document.getElementById('message-box');
        const roomOrganizedInventory = document.getElementById('room-organized-inventory');
        const totalItemsCountDisplay = document.getElementById('total-items-count');
        const totalReplacementCostDisplay = document.getElementById('total-replacement-cost');
        const inventorySummary = document.getElementById('inventory-summary');

        // Application State
        let items = [];
        let editingIndex = -1;

        // Utility Functions
        function showMessage(message, type = 'success') {
            const bgColor = type === 'success' ? 'bg-green-100' : 'bg-red-100';
            const textColor = type === 'success' ? 'text-green-700' : 'text-red-700';
            const borderColor = type === 'success' ? 'border-green-400' : 'border-red-400';
            
            messageBox.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg border ${bgColor} ${textColor} ${borderColor} transition-all duration-300`;
            messageBox.textContent = message;
            messageBox.classList.remove('hidden');
            
            setTimeout(() => {
                messageBox.classList.add('hidden');
            }, 3000);
        }

        function formatRoomName(room) {
            return room.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        }

        function validateInputs() {
            const itemName = itemNameInput.value.trim();
            let category = itemCategorySelect.value;
            const quantity = parseInt(itemQuantityInput.value);
            let room = itemRoomSelect.value;
            const replacementCost = parseFloat(itemReplacementCostInput.value);

            if (category === 'other') {
                category = itemCategoryOtherInput.value.trim();
                if (!category) {
                    showMessage('Please enter a category or select one from the list.', 'error');
                    return null;
                }
            }

            if (room === 'other') {
                room = itemRoomOtherInput.value.trim();
                if (!room) {
                    showMessage('Please enter a room or select one from the list.', 'error');
                    return null;
                }
            }

            if (!itemName || !category || isNaN(quantity) || quantity < 1 || !room || isNaN(replacementCost) || replacementCost < 0) {
                showMessage('Please enter valid information for all fields.', 'error');
                return null;
            }

            return { itemName, category, quantity, room, replacementCost };
        }

        function clearInputs() {
            itemNameInput.value = '';
            itemCategorySelect.value = '';
            itemCategoryOtherInput.value = '';
            otherCategoryInputDiv.classList.add('hidden');
            itemQuantityInput.value = '1';
            itemRoomSelect.value = '';
            itemRoomOtherInput.value = '';
            otherRoomInputDiv.classList.add('hidden');
            itemReplacementCostInput.value = '0';
        }

        function saveToStorage() {
            try {
                const itemsData = JSON.stringify(items);
                // Note: In Claude.ai artifacts, we can't use localStorage, so we'll store in memory
                // In a real environment, you would use: localStorage.setItem('inventoryItems', itemsData);
                console.log('Items saved:', itemsData);
            } catch (error) {
                console.error('Error saving items:', error);
            }
        }

        function loadFromStorage() {
            try {
                // Note: In Claude.ai artifacts, we can't use localStorage
                // In a real environment, you would use: 
                // const storedItems = localStorage.getItem('inventoryItems');
                // if (storedItems) items = JSON.parse(storedItems);
                console.log('Items loaded from storage');
            } catch (error) {
                console.error('Error loading items:', error);
            }
        }

        // Main Functions
        function addItem() {
            const validation = validateInputs();
            if (!validation) return;

            const { itemName, category, quantity, room, replacementCost } = validation;

            const newItem = {
                name: itemName,
                category: category.toLowerCase(),
                quantity: quantity,
                room: room.toLowerCase(),
                replacementCost: replacementCost
            };

            if (editingIndex >= 0) {
                items[editingIndex] = newItem;
                editingIndex = -1;
                addItemButton.textContent = 'Add Item';
                showMessage(`Item "${itemName}" updated successfully!`);
            } else {
                items.push(newItem);
                showMessage(`Item "${itemName}" added successfully!`);
            }

            saveToStorage();
            displayItems();
            clearInputs();
        }

        function displayItems() {
            const roomGroups = {};
            let totalItems = 0;
            let totalCost = 0;

            // Group items by room
            items.forEach(item => {
                if (!roomGroups[item.room]) {
                    roomGroups[item.room] = [];
                }
                roomGroups[item.room].push(item);
                totalItems += item.quantity;
                totalCost += item.replacementCost;
            });

            roomOrganizedInventory.innerHTML = '';

            if (items.length === 0) {
                noItemsMessage.classList.remove('hidden');
                inventorySummary.classList.add('hidden');
            } else {
                noItemsMessage.classList.add('hidden');
                inventorySummary.classList.remove('hidden');

                // Create room sections
                Object.entries(roomGroups).forEach(([room, roomItems]) => {
                    const roomSection = document.createElement('div');
                    roomSection.className = 'border border-gray-200 rounded-lg p-4 bg-gray-50';

                    const roomTitle = document.createElement('h3');
                    roomTitle.className = 'text-lg font-semibold text-gray-800 mb-3 cursor-pointer flex items-center justify-between hover:text-primary transition-colors';
                    roomTitle.innerHTML = `
                        <span>${formatRoomName(room)}</span>
                        <span class="text-sm bg-primary text-white px-2 py-1 rounded-full">${roomItems.length}</span>
                    `;
                    
                    const itemList = document.createElement('div');
                    itemList.className = 'space-y-2';

                    roomItems.forEach((item, index) => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center hover:shadow-md transition-shadow';
                        
                        itemDiv.innerHTML = `
                            <div class="flex-1">
                                <h4 class="font-semibold text-gray-800">${item.name}</h4>
                                <p class="text-sm text-gray-600">Category: ${item.category} | Quantity: ${item.quantity} | Value: $${item.replacementCost.toFixed(2)}</p>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="editItem(${items.indexOf(item)})" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors">Edit</button>
                                <button onclick="deleteItem(${items.indexOf(item)})" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors">Delete</button>
                            </div>
                        `;

                        itemList.appendChild(itemDiv);
                    });

                    roomTitle.addEventListener('click', () => {
                        itemList.classList.toggle('hidden');
                    });

                    roomSection.appendChild(roomTitle);
                    roomSection.appendChild(itemList);
                    roomOrganizedInventory.appendChild(roomSection);
                });

                // Update summary
                totalItemsCountDisplay.textContent = totalItems;
                totalReplacementCostDisplay.textContent = `$${totalCost.toFixed(2)}`;
            }
        }

        function editItem(index) {
            const item = items[index];
            editingIndex = index;
            
            itemNameInput.value = item.name;
            itemQuantityInput.value = item.quantity;
            itemReplacementCostInput.value = item.replacementCost;
            
            // Handle category
            const categoryOptions = Array.from(itemCategorySelect.options).map(opt => opt.value);
            if (categoryOptions.includes(item.category)) {
                itemCategorySelect.value = item.category;
                otherCategoryInputDiv.classList.add('hidden');
            } else {
                itemCategorySelect.value = 'other';
                itemCategoryOtherInput.value = item.category;
                otherCategoryInputDiv.classList.remove('hidden');
            }
            
            // Handle room
            const roomOptions = Array.from(itemRoomSelect.options).map(opt => opt.value);
            if (roomOptions.includes(item.room)) {
                itemRoomSelect.value = item.room;
                otherRoomInputDiv.classList.add('hidden');
            } else {
                itemRoomSelect.value = 'other';
                itemRoomOtherInput.value = item.room;
                otherRoomInputDiv.classList.remove('hidden');
            }
            
            addItemButton.textContent = 'Save Changes';
            showMessage('Item loaded for editing', 'success');
        }

        function deleteItem(index) {
            const deletedItemName = items[index].name;
            items.splice(index, 1);
            saveToStorage();
            displayItems();
            showMessage(`Item "${deletedItemName}" deleted successfully!`);
        }

        // Event Listeners
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

        addItemButton.addEventListener('click', addItem);

        // Make functions globally accessible
        window.editItem = editItem;
        window.deleteItem = deleteItem;

        // Initialize
        loadFromStorage();
        displayItems();
   