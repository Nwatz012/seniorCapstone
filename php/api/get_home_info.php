<?php
// php/get_home_info.php
// API endpoint to retrieve home information for the authenticated user

session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../config/property_inventory.php'; 

// Authentication check
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required.']);
    exit();
}

$userId = (int) $_SESSION['user_id'];

try {
    // Each user should have only one home info record
    $stmt = $pdo->prepare(
        "SELECT home_id, street_address, city, state, zip_code, 
                square_footage, year_built, roof_type, roof_age, last_updated 
         FROM home_info 
         WHERE user_id = :user_id 
         LIMIT 1"
    );
    $stmt->execute([':user_id' => $userId]);
    $homeInfo = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($homeInfo) {
        // Format timestamp for consistency
        if ($homeInfo['last_updated']) {
            $homeInfo['last_updated'] = date('Y-m-d H:i:s', strtotime($homeInfo['last_updated']));
        }
        echo json_encode(['success' => true, 'home_info' => $homeInfo]);
    } else {
        // Return success with null when no home info exists (valid state)
        echo json_encode([
            'success' => true, 
            'home_info' => null, 
            'message' => 'No home information found.'
        ]);
    }

} catch (PDOException $e) {
    error_log("Database error in get_home_info.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error occurred.']);
} catch (Exception $e) {
    error_log("Unexpected error in get_home_info.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}