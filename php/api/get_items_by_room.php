<?php
// php/get_items_by_room.php

session_start();
header('Content-Type: application/json');

require_once '../config/property_inventory.php'; 

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

// Get the room name from the request (GET or POST)
$roomName = $_GET['room'] ?? ($_POST['room'] ?? '');

if (empty($roomName)) {
    echo json_encode(['success' => false, 'message' => 'Room name is required.']);
    exit();
}

$userId = $_SESSION['user_id'];
$items = [];

try {
    // Fetch items for the specified room and logged-in user
    // Joining with categories to get category_name for display
    $stmt = $pdo->prepare("SELECT i.item_id, i.item_name, i.quantity, i.room, i.replacement_cost AS value, i.photo_url, i.created_at, 
                                   i.category_id, c.name AS category_name 
                           FROM items i
                           JOIN categories c ON i.category_id = c.category_id
                           WHERE i.user_id = :user_id AND i.room = :room_name
                           ORDER BY i.item_name ASC"); // Order items alphabetically
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':room_name', $roomName, PDO::PARAM_STR);
    $stmt->execute();
    
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'items' => $items, 'room_name' => $roomName]);

} catch (PDOException $e) {
    error_log("Get Items By Room Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to retrieve items for room. Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Get Items By Room General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred: ' . $e->getMessage()]);
}
?>
