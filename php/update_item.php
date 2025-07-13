<?php
// php/update_item.php

// Start a session to access user_id
session_start();

// Set content type to JSON for responses
header('Content-Type: application/json');

// Include the database connection file
require_once 'property_inventory.php'; 

// Check if a user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

// Get the raw POST data (assuming JSON payload from fetch API)
$input = file_get_contents('php://input');
$data = json_decode($input, true); // Decode JSON into an associative array

// Check if data is valid and item_id is provided
if (json_last_error() !== JSON_ERROR_NONE || !is_array($data) || !isset($data['item_id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input or missing item ID.']);
    exit();
}

// Extract data
$itemId = $data['item_id'];
$itemName = $data['name'] ?? '';
$itemCategory = $data['category'] ?? '';
$itemQuantity = $data['quantity'] ?? 1;
$itemRoom = $data['room'] ?? '';
$itemValue = $data['value'] ?? 0.00; // This is replacement_cost from JS

// Basic server-side validation
if (empty($itemName) || empty($itemCategory) || empty($itemRoom) || !is_numeric($itemId)) {
    echo json_encode(['success' => false, 'message' => 'Required fields missing or invalid item ID.']);
    exit();
}
if (!is_numeric($itemQuantity) || $itemQuantity <= 0) {
    echo json_encode(['success' => false, 'message' => 'Quantity must be a positive number.']);
    exit();
}
if (!is_numeric($itemValue) || $itemValue < 0) {
    echo json_encode(['success' => false, 'message' => 'Replacement cost must be a non-negative number.']);
    exit();
}

$userId = $_SESSION['user_id'];

try {
    // --- Handle Category (similar to add_item.php) ---
    $stmt = $pdo->prepare("SELECT category_id FROM categories WHERE name = :category_name");
    $stmt->bindParam(':category_name', $itemCategory, PDO::PARAM_STR);
    $stmt->execute();
    $category = $stmt->fetch(PDO::FETCH_ASSOC);

    $categoryId = null;
    if ($category) {
        $categoryId = $category['category_id'];
    } else {
        // If category doesn't exist, insert it
        $stmt = $pdo->prepare("INSERT INTO categories (name) VALUES (:category_name)");
        $stmt->bindParam(':category_name', $itemCategory, PDO::PARAM_STR);
        $stmt->execute();
        $categoryId = $pdo->lastInsertId();
    }

    // Prepare the SQL UPDATE statement
    // Ensure column names match your 'items' table
    $stmt = $pdo->prepare(
        "UPDATE items 
         SET item_name = :item_name, 
             category_id = :category_id, 
             quantity = :quantity, 
             room = :room, 
             replacement_cost = :replacement_cost 
         WHERE item_id = :item_id AND user_id = :user_id" // Crucial: ensure user owns the item
    );

    // Bind parameters
    $stmt->bindParam(':item_name', $itemName, PDO::PARAM_STR);
    $stmt->bindParam(':category_id', $categoryId, PDO::PARAM_INT);
    $stmt->bindParam(':quantity', $itemQuantity, PDO::PARAM_INT);
    $stmt->bindParam(':room', $itemRoom, PDO::PARAM_STR);
    $stmt->bindParam(':replacement_cost', $itemValue, PDO::PARAM_STR); // Use PARAM_STR for DECIMAL
    $stmt->bindParam(':item_id', $itemId, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);

    // Execute the statement
    $stmt->execute();

    

    // Check if any rows were affected (i.e., if the item was found and updated)
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Item updated successfully!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Item not found or no changes made.']);
    }

} catch (PDOException $e) {
    error_log("Update Item Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to update item. Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Update Item General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred: ' . $e->getMessage()]);
}
?>
