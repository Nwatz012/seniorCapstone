<?php
// php/get_user_info.php

session_start();
header('Content-Type: application/json');

require_once '../config/property_inventory.php'; 

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = $_SESSION['user_id'];
$userInfo = null;

try {
    // Fetch first_name and last_name for the logged-in user
    $stmt = $pdo->prepare("SELECT first_name, last_name FROM users WHERE user_id = :user_id LIMIT 1");
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    $userInfo = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($userInfo) {
        echo json_encode(['success' => true, 'user_info' => $userInfo]); // Return an object with first_name and last_name
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found.']);
    }

} catch (PDOException $e) {
    error_log("Get User Info Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to retrieve user information. Database error.']);
} catch (Exception $e) {
    error_log("Get User Info General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}
?>
