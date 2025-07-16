<?php
// php/get_items.php

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
$items = [];

try {
    // Prepare SQL to fetch items for the logged-in user
    // JOIN with categories table to get the category name
    $stmt = $pdo->prepare("SELECT i.item_id, i.item_name, i.quantity, i.room, i.replacement_cost AS value, i.photo_url, i.created_at, 
                                   i.category_id, c.name AS category_name 
                           FROM items i
                           JOIN categories c ON i.category_id = c.category_id
                           WHERE i.user_id = :user_id 
                           ORDER BY i.created_at DESC");
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    // Fetch all matching items
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Send the items back as a JSON response
    echo json_encode(['success' => true, 'items' => $items]);

} catch (PDOException $e) {
    // Log database errors
    error_log("Get Items Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to retrieve items. Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Log any other unexpected errors
    error_log("Get Items General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}
?>
