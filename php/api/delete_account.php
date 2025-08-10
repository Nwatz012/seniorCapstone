<?php
// php/api/delete_account.php

session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../config/property_inventory.php';  // Database connection

// Ensure the user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = (int) $_SESSION['user_id'];

// Ensure it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit();
}

try {
    // Begin transaction (safe deletion)
    $pdo->beginTransaction();

    // Delete user (with ON DELETE CASCADE, related records are removed automatically)
    $stmt = $pdo->prepare("DELETE FROM users WHERE user_id = :user_id");
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();

    // Commit changes
    $pdo->commit();

    // Log user out and clear session
    session_unset();
    session_destroy();

    echo json_encode(['success' => true, 'message' => 'Your account has been permanently deleted.']);

} catch (PDOException $e) {
    $pdo->rollBack(); // Revert changes if something fails
    error_log("Account Deletion PDO Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to delete account. Please try again later.']);
} catch (Exception $e) {
    error_log("Account Deletion General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}
