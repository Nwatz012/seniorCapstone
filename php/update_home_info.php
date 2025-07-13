<?php
// php/update_home_info.php

session_start();
header('Content-Type: application/json');

require_once 'property_inventory.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = $_SESSION['user_id'];

// Get the raw POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input.']);
    exit();
}

// Extract data from the decoded JSON
$homeId = $data['home_id'] ?? null; // Will be null for new entry
$address = $data['address'] ?? '';
$squareFootage = $data['square_footage'] ?? null;
$yearBuilt = $data['year_built'] ?? null;
$roofType = $data['roof_type'] ?? '';
$roofAge = $data['roof_age'] ?? null;

try {
    if ($homeId) {
        // Attempt to update existing home info
        $stmt = $pdo->prepare(
            "UPDATE home_info 
             SET address = :address, 
                 square_footage = :square_footage, 
                 year_built = :year_built, 
                 roof_type = :roof_type, 
                 roof_age = :roof_age 
             WHERE home_id = :home_id AND user_id = :user_id"
        );
        $stmt->bindParam(':home_id', $homeId, PDO::PARAM_INT);
    } else {
        // Insert new home info if no existing home_id is provided
        $stmt = $pdo->prepare(
            "INSERT INTO home_info (user_id, address, square_footage, year_built, roof_type, roof_age) 
             VALUES (:user_id, :address, :square_footage, :year_built, :roof_type, :roof_age)"
        );
    }

    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':address', $address, PDO::PARAM_STR);
    $stmt->bindParam(':square_footage', $squareFootage, PDO::PARAM_STR); // Use PARAM_STR for DECIMAL/NULL
    $stmt->bindParam(':year_built', $yearBuilt, PDO::PARAM_INT); // Use PARAM_INT for INT/NULL
    $stmt->bindParam(':roof_type', $roofType, PDO::PARAM_STR);
    $stmt->bindParam(':roof_age', $roofAge, PDO::PARAM_INT); // Use PARAM_INT for INT/NULL

    $stmt->execute();

    if ($homeId || $pdo->lastInsertId()) {
        echo json_encode(['success' => true, 'message' => 'Home information saved successfully!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to save home information.']);
    }

} catch (PDOException $e) {
    error_log("Update Home Info Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to save home information. Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Update Home Info General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred: ' . $e->getMessage()]);
}
?>
