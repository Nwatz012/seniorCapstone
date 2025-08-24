<?php
// php/api/update_preferences.php

header('Content-Type: application/json'); // Crucial: Tell JavaScript we're sending JSON
require_once __DIR__ . '/../config/property_inventory.php'; // Adjust path to your database config

$response = [
    'success' => false,
    'message' => 'An unknown error occurred.'
];

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $userId = $_POST['user_id'] ?? null;

    if ($userId === null) {
        $response['message'] = 'User ID is missing.';
        echo json_encode($response);
        exit;
    }

    // Collect data from the form
    $currency = trim($_POST['currency'] ?? '');
    $dateFormat = trim($_POST['date_format'] ?? '');
    // Checkbox values come as '1' or '0' from JavaScript FormData
    $emailNotifications = isset($_POST['email_notifications']) ? (int)$_POST['email_notifications'] : 0;
    $autoSaveItems = isset($_POST['auto_save_items']) ? (int)$_POST['auto_save_items'] : 0;

    $errors = [];

    // Basic validation for dropdowns (ensure they are allowed values)
    $allowedCurrencies = ['USD', 'EUR', 'GBP', 'CAD'];
    $allowedDateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

    if (!in_array($currency, $allowedCurrencies)) {
        $errors['currency'] = 'Invalid currency selected.';
    }
    if (!in_array($dateFormat, $allowedDateFormats)) {
        $errors['date_format'] = 'Invalid date format selected.';
    }

    if (!empty($errors)) {
        $response['message'] = 'Validation failed for preferences.';
        $response['errors'] = $errors;
        echo json_encode($response);
        exit;
    }

    try {
        $pdo = OpenCon(); // Get the PDO connection from property_inventory.php

        // Check if the connection was successful
        if ($pdo === null) {
            $response['message'] = 'Database connection failed.';
            echo json_encode($response);
            exit();
        }

        // Prepare the SQL statement to update the 'users' table
        $stmt = $pdo->prepare("UPDATE users SET 
            currency = ?, 
            date_format = ?, 
            email_notifications = ?, 
            auto_save_items = ? 
            WHERE user_id = ?");
        
        // Execute the statement
        $success = $stmt->execute([
            $currency, 
            $dateFormat, 
            $emailNotifications, 
            $autoSaveItems, 
            $userId
        ]);

        if ($success) {
            $rowsAffected = $stmt->rowCount();
            if ($rowsAffected > 0) {
                $response['success'] = true;
                $response['message'] = 'Preferences updated successfully!';
            } else {
                $response['success'] = true; // Still a success, just no changes made
                $response['message'] = 'Preferences are already up to date or no changes were made.';
            }
        } else {
            $response['message'] = 'Failed to update preferences in the database.';
            error_log("Database update failed for preferences: " . implode(" ", $stmt->errorInfo()));
        }
    } catch (PDOException $e) {
        $response['message'] = 'Database error: ' . $e->getMessage();
        error_log("PDO Exception in update_preferences.php: " . $e->getMessage());
    } finally {
        if (isset($pdo) && $pdo !== null) {
            CloseCon($pdo); // Close the database connection
        }
    }

} else {
    $response['message'] = 'Invalid request method.';
}

echo json_encode($response);
?>
