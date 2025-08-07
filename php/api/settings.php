<?php
// php/api/user_profile.php

header('Content-Type: application/json');
session_start();

// Database configuration
$dbHost = 'localhost';
$dbUser = 'root';
$dbPass = '';
$dbName = 'property_inventory';

try {
    $conn = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    error_log("DB Connect Error: " . $e->getMessage());
    exit;
}

// Check session user ID
$userId = $_SESSION['user_id'] ?? null;
if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Authentication required. Please log in.']);
    exit;
}
$userId = (int) $userId;

// Handle GET: Fetch user profile
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'fetchUserData') {
    try {
        $stmt = $conn->prepare("
            SELECT first_name, last_name, email, phone_number, timezone, member_since, last_login
            FROM users
            WHERE user_id = :userId
        ");
        $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $userData = $stmt->fetch();

        if ($userData) {
            echo json_encode(['success' => true, 'data' => $userData]);
        } else {
            echo json_encode(['success' => false, 'message' => 'User not found.']);
        }
    } catch (PDOException $e) {
        error_log("Fetch User Error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error fetching user data.']);
    }

    // Stop further processing
    exit;
}

// Handle POST: Update user profile
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Validate JSON
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
        echo json_encode(['success' => false, 'message' => 'Invalid input.']);
        exit;
    }

    // Validate required fields
    if (empty($data['first_name']) || empty($data['last_name']) || empty($data['email'])) {
        echo json_encode(['success' => false, 'message' => 'First name, last name, and email are required.']);
        exit;
    }

    // Optional fields
    $phone     = $data['phone'] ?? null;
    $timezone  = $data['timezone'] ?? 'America/New_York';

    try {
        $stmt = $conn->prepare("
            UPDATE users
            SET first_name = :first_name,
                last_name = :last_name,
                email = :email,
                phone_number = :phone_number,
                timezone = :timezone
            WHERE user_id = :userId
        ");

        $stmt->bindParam(':first_name', $data['first_name']);
        $stmt->bindParam(':last_name', $data['last_name']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':phone_number', $phone);
        $stmt->bindParam(':timezone', $timezone);
        $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);

        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Profile updated successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'No changes made.']);
        }
    } catch (PDOException $e) {
        error_log("Update User Error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Profile update failed.']);
    }

    exit;
}

//  Invalid request method
echo json_encode(['success' => false, 'message' => 'Unsupported request method.']);
$conn = null;
?>
