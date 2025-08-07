<?php
// php/update_home_info.php

session_start();
header('Content-Type: application/json');

require_once '../config/property_inventory.php';

// ✅ Check login
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = $_SESSION['user_id'];

// ✅ Get and decode JSON payload
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// ✅ Validate JSON structure
if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input.']);
    exit();
}

// ✅ Extract values
$homeId         = $data['home_id'] ?? null;
$street_address = trim($data['street_address'] ?? '');
$city           = trim($data['city'] ?? '');
$state          = trim($data['state'] ?? '');
$zip_code       = trim($data['zip_code'] ?? '');
$squareFootage  = $data['square_footage'] ?? null;
$yearBuilt      = $data['year_built'] ?? null;
$roofType       = trim($data['roof_type'] ?? '');
$roofAge        = $data['roof_age'] ?? null;

// ✅ Required fields validation
if (!$street_address || !$city || !$state || !$zip_code) {
    echo json_encode(['success' => false, 'message' => 'Street address, city, state, and zip code are required.']);
    exit();
}

// ✅ ZIP code validation
if (!preg_match('/^\d{5}$/', $zip_code)) {
    echo json_encode(['success' => false, 'message' => 'ZIP code must be a valid 5-digit number.']);
    exit();
}

try {
    if ($homeId) {
        // 🔁 UPDATE existing home_info
        $stmt = $pdo->prepare("
            UPDATE home_info 
            SET street_address = :street_address,
                city = :city,
                state = :state,
                zip_code = :zip_code,
                square_footage = :square_footage,
                year_built = :year_built,
                roof_type = :roof_type,
                roof_age = :roof_age
            WHERE home_id = :home_id AND user_id = :user_id
        ");
        $stmt->bindParam(':home_id', $homeId, PDO::PARAM_INT);
    } else {
        // ➕ INSERT new home_info
        $stmt = $pdo->prepare("
            INSERT INTO home_info (
                user_id, street_address, city, state, zip_code,
                square_footage, year_built, roof_type, roof_age
            ) VALUES (
                :user_id, :street_address, :city, :state, :zip_code,
                :square_footage, :year_built, :roof_type, :roof_age
            )
        ");
    }

    // 🔒 Bind parameters
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':street_address', $street_address, PDO::PARAM_STR);
    $stmt->bindParam(':city', $city, PDO::PARAM_STR);
    $stmt->bindParam(':state', $state, PDO::PARAM_STR);
    $stmt->bindParam(':zip_code', $zip_code, PDO::PARAM_STR); // STR allows leading zeros
    $stmt->bindParam(':square_footage', $squareFootage, PDO::PARAM_STR);
    $stmt->bindParam(':year_built', $yearBuilt, PDO::PARAM_INT);
    $stmt->bindParam(':roof_type', $roofType, PDO::PARAM_STR);
    $stmt->bindParam(':roof_age', $roofAge, PDO::PARAM_INT);

    $stmt->execute();

    // ✅ Confirm success
    if ($homeId || $pdo->lastInsertId()) {
        echo json_encode(['success' => true, 'message' => 'Home information saved successfully!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to save home information.']);
    }

} catch (PDOException $e) {
    error_log("Update Home Info Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error occurred.']);
} catch (Exception $e) {
    error_log("Update Home Info General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Unexpected error occurred.']);
}
?>
