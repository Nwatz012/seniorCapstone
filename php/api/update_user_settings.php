<?php
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../config/property_inventory.php'; 

$response = [
    'success' => false,
    'message' => 'An unknown error occurred.'
];

// Check login session
if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'User not logged in.';
    echo json_encode($response);
    exit;
}

$userId = $_SESSION['user_id'];

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $firstName = $_POST['first_name'] ?? '';
    $lastName = $_POST['last_name'] ?? '';
    $email = $_POST['email'] ?? '';
    $phone = $_POST['phone'] ?? null;
    $timezone = $_POST['timezone'] ?? 'America/New_York';

    // Basic validation
    if (empty($firstName) || empty($lastName) || empty($email)) {
        $response['message'] = 'First name, last name, and email are required.';
        echo json_encode($response);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response['message'] = 'Invalid email format.';
        echo json_encode($response);
        exit;
    }

    try {
        // Use existing $pdo from config
        $stmt = $pdo->prepare("
            UPDATE Users 
            SET first_name = ?, last_name = ?, email = ?, phone_number = ?, timezone = ? 
            WHERE user_id = ?
        ");
        
        $success = $stmt->execute([
            $firstName, $lastName, $email, $phone, $timezone, $userId
        ]);

        if ($success) {
            $response['success'] = true;
            $response['message'] = 'Profile updated successfully!';
        } else {
            $response['message'] = 'Failed to update profile.';
            error_log("Update failed: " . implode(" ", $stmt->errorInfo()));
        }

    } catch (PDOException $e) {
        $response['message'] = 'Database error.';
        error_log("PDO Exception: " . $e->getMessage());
    }
} else {
    $response['message'] = 'Invalid request method.';
}

echo json_encode($response);
