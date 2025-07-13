<?php
// php/get_rooms_summary.php

session_start();
header('Content-Type: application/json');

require_once 'property_inventory.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = $_SESSION['user_id'];
$rooms = [];

try {
    // Fetch distinct rooms with item count and total value for the logged-in user
    $stmt = $pdo->prepare("SELECT room, 
                                  COUNT(item_id) AS item_count, 
                                  SUM(quantity * replacement_cost) AS total_value 
                           FROM items 
                           WHERE user_id = :user_id 
                           GROUP BY room 
                           ORDER BY room ASC"); // Order rooms alphabetically
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    $rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'rooms' => $rooms]);

} catch (PDOException $e) {
    error_log("Get Rooms Summary Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to retrieve room summary. Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Get Rooms Summary General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred: ' . $e->getMessage()]);
}
?>
