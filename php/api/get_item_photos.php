<?php
// php/api/get_item_photos.php
// API endpoint to retrieve photos for a specific inventory item

session_start();
header('Content-Type: application/json');

// Database connection - path relative from php/api/ to property_inventory/config/
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
    // Verify item ownership before fetching photos
    $ownershipStmt = $pdo->prepare("SELECT 1 FROM items WHERE item_id = :item_id AND user_id = :user_id");
    $ownershipStmt->execute([':item_id' => $itemId, ':user_id' => $userId]);
    
    if (!$ownershipStmt->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Item not found or access denied.']);
        exit();
    }

    // Fetch item photos
    $photoStmt = $pdo->prepare(
        "SELECT photo_id, file_path, uploaded_at 
         FROM photos 
         WHERE item_id = :item_id AND user_id = :user_id 
         ORDER BY uploaded_at DESC"
    );
    $photoStmt->execute([':item_id' => $itemId, ':user_id' => $userId]);
    $photos = $photoStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'photos' => $photos, 'count' => count($photos)]);

} catch (PDOException $e) {
    error_log("Database error in get_item_photos.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error occurred.']);
} catch (Exception $e) {
    error_log("Unexpected error in get_item_photos.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}