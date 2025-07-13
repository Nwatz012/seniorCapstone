<?php
// php/add_item.php

// Start a session (if not already started)
session_start();

// Include the database connection file
// Corrected path: property_inventory.php is in the same directory as add_item.php
require_once 'property_inventory.php'; 

// Set content type to JSON for responses
header('Content-Type: application/json');

// Get the raw POST data (assuming JSON payload from fetch API)
$input = file_get_contents('php://input');
$data = json_decode($input, true); // Decode JSON into an associative array

// Check if data is valid
if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input.']);
    exit();
}

// Check if a user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in. Please log in to add items.']);
    exit();
}

// Extract data from the decoded JSON, providing default/empty values if not set
// Ensure these keys match what your JavaScript (dashboard.js) is sending
$itemName = $data['name'] ?? '';
$itemCategory = $data['category'] ?? ''; // This will be the category name string
$itemQuantity = $data['quantity'] ?? 1; // Default to 1 if not provided
$itemRoom = $data['room'] ?? '';
$itemValue = $data['value'] ?? 0.00; // This is the replacement_cost from JS

// Basic server-side validation (more robust validation would be needed for production)
if (empty($itemName) || empty($itemCategory) || empty($itemRoom)) {
    echo json_encode(['success' => false, 'message' => 'Item name, category, and room are required.']);
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

$userId = $_SESSION['user_id']; // Get user ID from session

try {
    // --- Handle Category ---
    // First, try to find the category_id based on the category name
    $stmt = $pdo->prepare("SELECT category_id FROM categories WHERE name = :category_name");
    $stmt->bindParam(':category_name', $itemCategory, PDO::PARAM_STR);
    $stmt->execute();
    $category = $stmt->fetch(PDO::FETCH_ASSOC);

    $categoryId = null;
    if ($category) {
        $categoryId = $category['category_id'];
    } else {
        // If category doesn't exist, insert it and get its new ID
        // This assumes you want to automatically add new categories if they don't exist.
        // If not, you'd return an error here.
        $stmt = $pdo->prepare("INSERT INTO categories (name) VALUES (:category_name)");
        $stmt->bindParam(':category_name', $itemCategory, PDO::PARAM_STR);
        $stmt->execute();
        $categoryId = $pdo->lastInsertId(); // Get the ID of the newly inserted category
    }

    // Prepare the SQL INSERT statement for the items table
    // Ensure column names here match your actual 'items' table columns exactly.
    // Based on your schema, they are: item_id, user_id, category_id, item_name, value, photo_url, created_at
    // We are mapping JS 'value' to DB 'replacement_cost'
    $stmt = $pdo->prepare(
        "INSERT INTO items (user_id, category_id, item_name, quantity, room, replacement_cost, photo_url, created_at) 
         VALUES (:user_id, :category_id, :item_name, :quantity, :room, :replacement_cost, :photo_url, NOW())"
    );

    // Bind parameters
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':category_id', $categoryId, PDO::PARAM_INT);
    $stmt->bindParam(':item_name', $itemName, PDO::PARAM_STR);
    $stmt->bindParam(':quantity', $itemQuantity, PDO::PARAM_INT); // Bind as INT
    $stmt->bindParam(':room', $itemRoom, PDO::PARAM_STR);
    $stmt->bindParam(':replacement_cost', $itemValue, PDO::PARAM_STR); // Use PARAM_STR for DECIMAL
    
    // For now, photo_url is empty. You'll implement file upload later.
    $photoUrl = null; 
    $stmt->bindParam(':photo_url', $photoUrl, PDO::PARAM_STR); 

    // Execute the statement
    $stmt->execute();

    // Send a success response
    echo json_encode(['success' => true, 'message' => 'Item added successfully!']);

} catch (PDOException $e) {
    // Catch any database errors
    error_log("Database error in add_item.php: " . $e->getMessage()); // Log error for debugging
    echo json_encode(['success' => false, 'message' => 'Failed to add item. Database error: ' . $e->getMessage()]); // Include message for debugging
} catch (Exception $e) {
    // Catch any other unexpected errors
    error_log("General error in add_item.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred: ' . $e->getMessage()]); // Include message for debugging
}
?>
