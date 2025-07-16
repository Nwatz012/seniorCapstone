<?php
// php/get_item_photos.php

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

$photos = [];

try {
    // First, verify that the item belongs to the current user for security
    $stmt = $pdo->prepare("SELECT item_id FROM items WHERE item_id = :item_id AND user_id = :user_id");
    $stmt->bindParam(':item_id', $itemId, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $itemExists = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$itemExists) {
        echo json_encode(['success' => false, 'message' => 'Item not found or does not belong to the current user.']);
        exit();
    }

    // Prepare SQL to fetch all photos for the verified item
    // Assuming a 'photos' table with photo_id, item_id, user_id, file_path, uploaded_at
    $stmt = $pdo->prepare("SELECT photo_id, file_path, uploaded_at 
                           FROM photos 
                           WHERE item_id = :item_id AND user_id = :user_id 
                           ORDER BY uploaded_at DESC");
    $stmt->bindParam(':item_id', $itemId, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT); // Ensure photo also belongs to user
    $stmt->execute();
    
    // Fetch all matching photos
    $photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Send the photos back as a JSON response
    echo json_encode(['success' => true, 'photos' => $photos]);

} catch (PDOException $e) {
    // Log database errors
    error_log("Get Item Photos Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to retrieve item photos. Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Log any other unexpected errors
    error_log("Get Item Photos General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}
?>