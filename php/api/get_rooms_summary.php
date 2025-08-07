<?php
// API Endpoint: Get Room Summary Statistics

// Start session and set JSON response header
session_start();
header('Content-Type: application/json');

// Include database configuration
require_once '../config/property_inventory.php'; 

// Authentication Check - Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = $_SESSION['user_id'];
$rooms = [];

try {
    // Database Query - Aggregate room statistics
    // Gets distinct rooms with item counts and total values per room
    $stmt = $pdo->prepare("SELECT room, 
                                  COUNT(item_id) AS item_count, 
                                  SUM(quantity * replacement_cost) AS total_value 
                           FROM items 
                           WHERE user_id = :user_id 
                           GROUP BY room 
                           ORDER BY room ASC"); // Order rooms alphabetically
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    // Fetch all room summary data
    $rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return Success Response
    echo json_encode(['success' => true, 'rooms' => $rooms]);

} catch (PDOException $e) {
    // Handle Database Errors
    error_log("Get Rooms Summary Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to retrieve room summary. Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Handle General Errors
    error_log("Get Rooms Summary General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred: ' . $e->getMessage()]);
}
?>