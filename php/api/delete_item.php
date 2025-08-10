<?php
// php/delete_item.php
// API endpoint to delete inventory items (DELETE operation)

session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../config/property_inventory.php'; 

// Ensure only DELETE method is accepted
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit();
}

// Authentication check
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required.']);
    exit();
}

// Parse and validate JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON format.']);
    exit();
}

// Validate required fields
if (!isset($data['item_id']) || !is_numeric($data['item_id']) || $data['item_id'] <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Valid item ID required.']);
    exit();
}

$itemId = (int) $data['item_id'];
$userId = (int) $_SESSION['user_id'];

try {
    // Critical: Only delete items owned by the authenticated user
    $stmt = $pdo->prepare("DELETE FROM items WHERE item_id = :item_id AND user_id = :user_id");
    $stmt->execute([':item_id' => $itemId, ':user_id' => $userId]);

    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true, 
            'message' => 'Item deleted successfully.',
            'deleted_id' => $itemId
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false, 
            'message' => 'Item not found or access denied.'
        ]);
    }

} catch (PDOException $e) {
    error_log("Database error in delete_item.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error occurred.']);
} catch (Exception $e) {
    error_log("Unexpected error in delete_item.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}