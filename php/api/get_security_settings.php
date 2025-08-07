<?php
// API Endpoint: Get User Security Settings

// Set JSON response header and start session
header('Content-Type: application/json');
session_start();

// Include database configuration
require_once '../config/property_inventory.php'; 

// Authentication Check - Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = $_SESSION['user_id'];

try {
    // Database Connection Validation
    if (!isset($pdo) || !$pdo instanceof PDO) {
        throw new Exception('Database connection (PDO object) not available from property_inventory.php');
    }

    // Database Query - Fetch user profile and security settings
    $stmt = $pdo->prepare("SELECT first_name, last_name, email, two_factor_auth, login_notifications FROM users WHERE user_id = :user_id");
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();

    $userSettings = $stmt->fetch(PDO::FETCH_ASSOC);

    // Format and Return Results
    if ($userSettings) {
        echo json_encode([
            'success' => true,
            'user' => [
                'first_name' => $userSettings['first_name'],
                'last_name' => $userSettings['last_name'],
                'email' => $userSettings['email']
            ],
            'settings' => [
                'two_factor_auth' => (int)$userSettings['two_factor_auth'], // Convert boolean to integer
                'login_notifications' => (int)$userSettings['login_notifications']
            ],
            'message' => 'Security settings loaded successfully.'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'User settings not found.']);
    }

} catch (PDOException $e) {
    // Handle Database Errors
    error_log("Database error in get_security_settings.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error: Could not retrieve settings.']);
} catch (Exception $e) {
    // Handle Application Errors
    error_log("Application error in get_security_settings.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>