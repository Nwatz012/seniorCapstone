<?php
// php/get_item_details.php

// Start a session to access user_id
session_start();

// Set content type to JSON
header('Content-Type: application/json');

// Include the database connection file
require_once '../config/property_inventory.php'; 

// Check if a user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = $_SESSION['user_id'];
$itemId = $_GET['item_id'] ?? null; // Get item_id from GET request

// Validate item_id
if (!isset($itemId) || !is_numeric($itemId)) {
    echo json_encode(['success' => false, 'message' => 'Invalid item ID provided.']);
    exit();
}

$item = null;

try {
    // Prepare SQL to fetch a single item's details for the logged-in user
    // Include created_at and updated_at for display on item details page
    $stmt = $pdo->prepare("SELECT i.item_id, i.item_name, i.quantity, i.room, i.replacement_cost AS value, 
                                 i.category_id, c.name AS category_name, 
                                 i.created_at, i.updated_at 
                           FROM items i
                           JOIN categories c ON i.category_id = c.category_id
                           WHERE i.item_id = :item_id AND i.user_id = :user_id");
    $stmt->bindParam(':item_id', $itemId, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    // Fetch the single matching item
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($item) {
        echo json_encode(['success' => true, 'item' => $item]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Item not found or does not belong to the current user.']);
    }

} catch (PDOException $e) {
    // Log database errors
    error_log("Get Item Details Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to retrieve item details. Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Log any other unexpected errors
    error_log("Get Item Details General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}
?>