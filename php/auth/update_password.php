<?php
/**
 * update_password.php
 * This script handles the final step of the password reset process.
 * It receives a password reset token and a new password, validates them,
 * updates the user's password in the database, and then invalidates the token.
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

// Include the database connection file. The path is relative from php/auth to php/config.
require_once '../config/property_inventory.php';

// Get the raw POST data from the request body.
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Extract and sanitize the token and new password.
$token = trim($data['token'] ?? '');
$newPassword = $data['new_password'] ?? '';

// Basic server-side validation.
if (empty($token) || empty($newPassword)) {
    echo json_encode(['success' => false, 'message' => 'Token and new password are required.']);
    exit();
}

try {
    // 1. Find the user_id and token details from the password_resets table.
    // Ensure the token has not expired.
    $stmt = $pdo->prepare("SELECT user_id, expires_at FROM password_resets WHERE token = :token");
    $stmt->bindParam(':token', $token, PDO::PARAM_STR);
    $stmt->execute();
    $resetRequest = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$resetRequest || strtotime($resetRequest['expires_at']) < time()) {
        // If the token is not found or has expired, respond with an error.
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token.']);
        exit();
    }

    $userId = $resetRequest['user_id'];

    // 2. Hash the new password before updating the database.
    // ALWAYS use password_hash() for secure password storage.
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    // 3. Update the user's password in the users table.
    $stmt = $pdo->prepare("UPDATE users SET password = :password WHERE user_id = :user_id");
    $stmt->bindParam(':password', $hashedPassword, PDO::PARAM_STR);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();

    // 4. Invalidate the password reset token by deleting it.
    // This prevents the same token from being used again.
    $stmt = $pdo->prepare("DELETE FROM password_resets WHERE token = :token");
    $stmt->bindParam(':token', $token, PDO::PARAM_STR);
    $stmt->execute();

    // 5. Send a success response.
    echo json_encode(['success' => true, 'message' => 'Password has been successfully reset.']);

} catch (PDOException $e) {
    // Catch any database errors.
    error_log("Database Error in update_password.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'A database error occurred. Please try again.']);
} catch (Exception $e) {
    // Catch any other unexpected errors.
    error_log("General Error in update_password.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred. Please try again.']);
}
