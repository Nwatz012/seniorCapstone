<?php
// php/update_item.php

session_start(); // Start session to access user ID
header('Content-Type: application/json'); // Send JSON response

require_once '../config/property_inventory.php'; // DB connection

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = $_SESSION['user_id'];

// Get JSON payload
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validate JSON and required key
if (json_last_error() !== JSON_ERROR_NONE || !is_array($data) || empty($data['item_id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input or missing item ID.']);
    exit();
}

// Extract and sanitize values
$itemId       = (int) $data['item_id'];
$itemName     = trim($data['name'] ?? '');
$itemCategory = trim($data['category'] ?? '');
$itemQuantity = (int) ($data['quantity'] ?? 1);
$itemRoom     = trim($data['room'] ?? '');
$itemValue    = (float) ($data['value'] ?? 0.00); // replacement_cost

// Validate values
if (!$itemId || !$itemName || !$itemCategory || !$itemRoom) {
    echo json_encode(['success' => false, 'message' => 'Required fields missing or invalid.']);
    exit();
}

if ($itemQuantity <= 0 || $itemValue < 0) {
    echo json_encode(['success' => false, 'message' => 'Quantity must be positive and cost non-negative.']);
    exit();
}

try {
    // 1. Handle Category (create if not exists)
    $stmt = $pdo->prepare("SELECT category_id FROM categories WHERE name = :name");
    $stmt->execute([':name' => $itemCategory]);
    $category = $stmt->fetch();

    if ($category) {
        $categoryId = $category['category_id'];
    } else {
        $stmt = $pdo->prepare("INSERT INTO categories (name) VALUES (:name)");
        $stmt->execute([':name' => $itemCategory]);
        $categoryId = $pdo->lastInsertId();
    }

    // 2. Update item only if owned by user
    $stmt = $pdo->prepare("
        UPDATE items 
        SET item_name = :name,
            category_id = :category_id,
            quantity = :quantity,
            room = :room,
            replacement_cost = :cost
        WHERE item_id = :item_id AND user_id = :user_id
    ");

    $stmt->execute([
        ':name'        => $itemName,
        ':category_id' => $categoryId,
        ':quantity'    => $itemQuantity,
        ':room'        => $itemRoom,
        ':cost'        => $itemValue,
        ':item_id'     => $itemId,
        ':user_id'     => $userId,
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Item updated successfully!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Item not found or no changes made.']);
    }

} catch (PDOException $e) {
    error_log("Update Item DB Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error.']);
} catch (Exception $e) {
    error_log("Update Item General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Unexpected error occurred.']);
}
?>
