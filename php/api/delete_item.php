<?php
// php/delete_item.php

// Start a session to access user_id
session_start();

// Set content type to JSON for responses
header('Content-Type: application/json');

// Include the database connection file
require_once '../config/property_inventory.php'; 

// Check if a user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

// Get the raw POST data (assuming JSON payload from fetch API)
$input = file_get_contents('php://input');
$data = json_decode($input, true); // Decode JSON into an associative array

// Check if data is valid and item_id is provided
if (json_last_error() !== JSON_ERROR_NONE || !is_array($data) || !isset($data['item_id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input or missing item ID.']);
    exit();
}

$itemId = $data['item_id'];
$userId = $_SESSION['user_id'];

try {
    // Prepare the SQL DELETE statement
    // Crucial: Delete only if the item belongs to the logged-in user
    $stmt = $pdo->prepare("DELETE FROM items WHERE item_id = :item_id AND user_id = :user_id");
    $stmt->bindParam(':item_id', $itemId, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);

    // Execute the statement
    $stmt->execute();

    // Check if any rows were affected (i.e., if the item was found and deleted)
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Item deleted successfully!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Item not found or you do not have permission to delete it.']);
    }

} catch (PDOException $e) {
    error_log("Delete Item Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to delete item. Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Delete Item General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred: ' . $e->getMessage()]);
}
?>
