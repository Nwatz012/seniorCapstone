<?php
// API Endpoint: Get All User Items with Category Details

// Start session and set JSON response header
session_start();
header('Content-Type: application/json');

// Include database configuration
require_once __DIR__ . '/../config/property_inventory.php';  

// Authentication Check - Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = $_SESSION['user_id'];
$items = [];

try {
    // Database Query - Fetch items with category information
    // JOIN items table with categories table to get category names
    $stmt = $pdo->prepare("SELECT i.item_id, i.item_name, i.quantity, i.room, i.replacement_cost AS value, i.photo_url, i.created_at, 
                                   i.category_id, c.name AS category_name 
                           FROM items i
                           JOIN categories c ON i.category_id = c.category_id
                           WHERE i.user_id = :user_id 
                           ORDER BY i.created_at DESC"); // Most recent items first
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    // Fetch all items for the user
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return Success Response with items array
    echo json_encode(['success' => true, 'items' => $items]);

} catch (PDOException $e) {
    // Handle Database Errors
    error_log("Get Items Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to retrieve items. Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Handle General Errors
    error_log("Get Items General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}
?>