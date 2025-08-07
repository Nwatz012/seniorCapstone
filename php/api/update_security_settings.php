<?php
// php/api/update_security_settings.php

header('Content-Type: application/json');  // Tell client to expect JSON response
session_start();                           // Start session to access logged-in user info

// Include database connection file (defines $pdo)
require_once '../config/property_inventory.php'; 

// Check if user is logged in, otherwise deny access
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = $_SESSION['user_id'];  // Current logged-in user ID
$errors = [];                    // Collect validation errors
$message = '';                   // Success message container

// Only allow POST requests to update settings
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit();
}

try {
    // Ensure $pdo (PDO database connection) is available and valid
    if (!isset($pdo) || !$pdo instanceof PDO) {
        throw new Exception('Database connection (PDO object) not available from property_inventory.php');
    }

    // Get and sanitize inputs from POST
    $currentPassword = trim($_POST['current_password'] ?? '');
    $newPassword = trim($_POST['new_password'] ?? '');
    $confirmPassword = trim($_POST['confirm_password'] ?? '');
    $twoFactorAuth = isset($_POST['two_factor_auth']) ? (int)$_POST['two_factor_auth'] : 0;          // Expect 0 or 1
    $loginNotifications = isset($_POST['login_notifications']) ? (int)$_POST['login_notifications'] : 0; // Expect 0 or 1

    // Fetch current user's data to verify current password and existing settings
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE user_id = :user_id");
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // If user not found in DB, return error
    if (!$user) {
        $errors['general'] = 'User not found.';
        echo json_encode(['success' => false, 'message' => 'User not found.', 'errors' => $errors]);
        exit();
    }

    // Flag to know if we need to update the password hash in DB
    $updatePassword = false;
    $newPasswordHash = $user['password_hash'];  // Default to existing hash if no change

    // Password change validation logic:
    // If user wants to change password (new or confirm provided)
    if (!empty($newPassword) || !empty($confirmPassword)) {
        $updatePassword = true;

        // 1. Current password is required and must be correct
        if (empty($currentPassword)) {
            $errors['current_password'] = 'Current password is required to change password.';
        } elseif (!password_verify($currentPassword, $user['password_hash'])) {
            $errors['current_password'] = 'Incorrect current password.';
        }

        // 2. Validate new password complexity
        if (empty($newPassword)) {
            $errors['new_password'] = 'New password cannot be empty.';
        } elseif (strlen($newPassword) < 8) {
            $errors['new_password'] = 'Password must be at least 8 characters long.';
        } elseif (!preg_match('/[A-Z]/', $newPassword)) {
            $errors['new_password'] = 'Password must contain at least one uppercase letter.';
        } elseif (!preg_match('/[a-z]/', $newPassword)) {
            $errors['new_password'] = 'Password must contain at least one lowercase letter.';
        } elseif (!preg_match('/[0-9]/', $newPassword)) {
            $errors['new_password'] = 'Password must contain at least one number.';
        } elseif (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $newPassword)) {
            $errors['new_password'] = 'Password must contain at least one special character.';
        }

        // 3. Confirm new password matches
        if ($newPassword !== $confirmPassword) {
            $errors['confirm_password'] = 'New password and confirm password do not match.';
        }

        // If no errors so far, hash the new password for DB update
        if (empty($errors)) {
            $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
            $message = 'Password updated successfully. ';
        }
    }
    // Handle case where current password provided but new/confirm are missing
    elseif (!empty($currentPassword) && empty($newPassword) && empty($confirmPassword)) {
        $errors['new_password'] = 'New password is required if current password is provided.';
        $errors['confirm_password'] = 'Confirm new password is required.';
    }

    // Build the SQL update query dynamically depending on whether password changed
    $sql = "UPDATE users SET two_factor_auth = :two_factor_auth, login_notifications = :login_notifications";
    if ($updatePassword && empty($errors)) {
        $sql .= ", password_hash = :password_hash";
    }
    $sql .= " WHERE user_id = :user_id";

    $stmt = $pdo->prepare($sql);

    // Bind parameters
    $stmt->bindParam(':two_factor_auth', $twoFactorAuth, PDO::PARAM_INT);
    $stmt->bindParam(':login_notifications', $loginNotifications, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);

    if ($updatePassword && empty($errors)) {
        $stmt->bindParam(':password_hash', $newPasswordHash, PDO::PARAM_STR);
    }

    // If validation passed, execute the update
    if (empty($errors)) {
        $stmt->execute();
        $message .= 'Other settings updated successfully.';
        echo json_encode(['success' => true, 'message' => trim($message)]);
    } else {
        // Validation failed, send error details
        echo json_encode(['success' => false, 'message' => 'Failed to update security settings.', 'errors' => $errors]);
    }

} catch (PDOException $e) {
    // Log DB errors privately, send generic error message to client
    error_log("Database error in update_security_settings.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error: Could not update settings.']);
} catch (Exception $e) {
    // Log unexpected errors and send message
    error_log("Application error in update_security_settings.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

?>
