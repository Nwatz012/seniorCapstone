<?php
// php/get_item_details.php
// API endpoint to retrieve detailed information for a specific inventory item

session_start();
header('Content-Type: application/json');

// Database connection - path relative from php/ to property_inventory/config/
require_once __DIR__ . '/../config/property_inventory.php';  

// Authentication check
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required.']);
    exit();
}

// Input validation
$userId = (int) $_SESSION['user_id'];
$itemId = filter_input(INPUT_GET, 'item_id', FILTER_VALIDATE_INT);

if (!$itemId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Valid item ID required.']);
    exit();
}

try {
    // Fetch item details with category information
    $stmt = $pdo->prepare(
        "SELECT i.item_id, i.item_name, i.quantity, i.room, 
                i.replacement_cost AS value, i.category_id, c.name AS category_name, 
                i.created_at, i.updated_at 
         FROM items i
         JOIN categories c ON i.category_id = c.category_id
         WHERE i.item_id = :item_id AND i.user_id = :user_id"
    );
    $stmt->execute([':item_id' => $itemId, ':user_id' => $userId]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($item) {
        // Format timestamps for better client consumption
        $item['created_at'] = date('Y-m-d H:i:s', strtotime($item['created_at']));
        $item['updated_at'] = date('Y-m-d H:i:s', strtotime($item['updated_at']));
        
        echo json_encode(['success' => true, 'item' => $item]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Item not found or access denied.']);
    }

} catch (PDOException $e) {
    error_log("Database error in get_item_details.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error occurred.']);
} catch (Exception $e) {
    error_log("Unexpected error in get_item_details.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}