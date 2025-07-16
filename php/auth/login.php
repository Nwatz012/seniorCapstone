<?php
// php/login.php

// Start a session to manage user login state
session_start();

// Include the database connection file
require_once '../config/property_inventory.php'; 

// Set content type to JSON for responses
header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Only POST requests are allowed.']);
    exit();
}

// Get the raw POST data (JSON payload from fetch API)
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Check if data is valid
if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input.']);
    exit();
}

// Extract data from the decoded JSON
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

// --- Server-side Validation ---
if (empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
    exit();
}

try {
    // Prepare SQL to fetch user by email, including first_name and last_name
    $stmt = $pdo->prepare("SELECT user_id, email, password_hash, first_name, last_name FROM users WHERE email = :email");
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Check if user exists and verify password
    if ($user && password_verify($password, $user['password_hash'])) {
        // Password is correct, set session variables
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_fullName'] = $user['first_name'] . ' ' . $user['last_name']; // Combine here

        echo json_encode([
            'success' => true,
            'message' => 'Login successful!',
            'redirect' => 'dashboard.html',
            'user' => [
                'id' => $user['user_id'],
                'email' => $user['email'],
                'fullName' => $user['first_name'] . ' ' . $user['last_name'] // Combine for response
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
    }

} catch (PDOException $e) {
    // Catch database errors
    error_log("Login Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Login failed. Database error.']);
} catch (Exception $e) {
    // Catch any other unexpected errors
    error_log("Login General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred during login.']);
}
?>