<?php
// php/register.php

session_start();
header('Content-Type: application/json');

// Include the database connection file
require_once '../config/property_inventory.php'; 

// Get the raw POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Check if data is valid
if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input.']);
    exit();
}

// Extract data, including new first_name and last_name
$firstName = $data['firstName'] ?? '';
$lastName = $data['lastName'] ?? '';
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

// Basic server-side validation
if (empty($firstName) || empty($lastName) || empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
    exit();
}

// Password policy check (must be at least 8 characters with numbers and letters)
$errors = [];
if (strlen($password) < 8) {
    $errors[] = 'Password must be at least 8 characters long.';
}
if (!preg_match('/[A-Z]/', $password)) {
    $errors[] = 'Password must contain at least one uppercase letter.';
}
if (!preg_match('/[a-z]/', $password)) {
    $errors[] = 'Password must contain at least one lowercase letter.';
}
if (!preg_match('/[0-9]/', $password)) {
    $errors[] = 'Password must contain at least one number.';
}
if (!preg_match('/[!@#$%^&*(),.?":{}|<>]|[-]/', $password)) {
    $errors[] = 'Password must contain at least one special character.';
}

if (!empty($errors)) {
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit();
}

// Hash the password
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

try {
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = :email");
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
    $stmt->execute();
    if ($stmt->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'message' => 'Email already registered.']);
        exit();
    }

    // Insert new user into the database, including first and last names
    $stmt = $pdo->prepare(
        "INSERT INTO users (first_name, last_name, email, password_hash) 
         VALUES (:first_name, :last_name, :email, :password_hash)"
    );

    $stmt->bindParam(':first_name', $firstName, PDO::PARAM_STR);
    $stmt->bindParam(':last_name', $lastName, PDO::PARAM_STR);
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
    $stmt->bindParam(':password_hash', $passwordHash, PDO::PARAM_STR);

    $stmt->execute();

    // Registration successful, optionally log them in immediately or redirect
    // For now, just send a success message.
    echo json_encode(['success' => true, 'message' => 'Registration successful! You can now log in.']);

} catch (PDOException $e) {
    error_log("Registration Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Registration failed. Database error.']);
} catch (Exception $e) {
    error_log("Registration General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred during registration.']);
}
?>
