<?php
// API Endpoint: Get Items Filtered by Specific Room

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

// Parameter Validation - Get room name from GET or POST request
$roomName = $_GET['room'] ?? ($_POST['room'] ?? '');

if (empty($roomName)) {
    echo json_encode(['success' => false, 'message' => 'Room name is required.']);
    exit();
}

$userId = $_SESSION['user_id'];
$items = [];

try {
    // Database Query - Fetch items filtered by room and user
    // JOIN with categories table to include category names
    $stmt = $pdo->prepare("SELECT i.item_id, i.item_name, i.quantity, i.room, i.replacement_cost AS value, i.photo_url, i.created_at, 
                                   i.category_id, c.name AS category_name 
                           FROM items i
                           JOIN categories c ON i.category_id = c.category_id
                           WHERE i.user_id = :user_id AND i.room = :room_name
                           ORDER BY i.item_name ASC"); // Order items alphabetically within room
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':room_name', $roomName, PDO::PARAM_STR);
    $stmt->execute();
    
    // Fetch all items for the specified room
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return Success Response with items and room confirmation
    echo json_encode(['success' => true, 'items' => $items, 'room_name' => $roomName]);

} catch (PDOException $e) {
    // Handle Database Errors
    error_log("Get Items By Room Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to retrieve items for room. Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Handle General Errors
    error_log("Get Items By Room General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred: ' . $e->getMessage()]);
}
?>