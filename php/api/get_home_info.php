<?php
// php/get_home_info.php

session_start();
header('Content-Type: application/json');

require_once '../config/property_inventory.php'; // Assuming this file establishes $pdo connection

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = $_SESSION['user_id'];
$homeInfo = null;

try {
    // Fetch home information for the logged-in user, now with detailed address fields
    $stmt = $pdo->prepare("SELECT home_id, street_address, city, state, zip_code, square_footage, year_built, roof_type, roof_age, last_updated 
                           FROM home_info 
                           WHERE user_id = :user_id LIMIT 1"); // LIMIT 1 as a user should only have one home info record
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    $homeInfo = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($homeInfo) {
        echo json_encode(['success' => true, 'home_info' => $homeInfo]);
    } else {
        // If no home info found, return success with null data
        echo json_encode(['success' => true, 'home_info' => null, 'message' => 'No home information found for this user.']);
    }

} catch (PDOException $e) {
    error_log("Get Home Info Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to retrieve home information. Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Get Home Info General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred: ' . $e->getMessage()]);
}
?>
