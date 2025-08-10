<?php 
// API Endpoint: Get User Information

// Start session and set JSON response header
session_start();
header('Content-Type: application/json');

// Include database configuration
require_once __DIR__ . '/../config/property_inventory.php'; 

// Authentication Check - Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

// Get user ID from session
$userId = $_SESSION['user_id'];
$userInfo = null;

try {
    // Database Query - Fetch user's first and last name
    $stmt = $pdo->prepare("SELECT first_name, last_name FROM users WHERE user_id = :user_id LIMIT 1");
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    $userInfo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Return Results
    if ($userInfo) {
        echo json_encode(['success' => true, 'user_info' => $userInfo]);
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found.']);
    }

} catch (PDOException $e) {
    // Handle Database Errors
    error_log("Get User Info Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to retrieve user information. Database error.']);
} catch (Exception $e) {
    // Handle General Errors
    error_log("Get User Info General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}
?>