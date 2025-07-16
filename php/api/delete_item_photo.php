<?php
// php/delete_item_photo.php

// Start a session to access user_id
session_start();

// Set content type to JSON
header('Content-Type: application/json');

// Include the database connection file
require_once '../config/property_inventory.php'; 

// Define the base upload directory (relative to the web root, not this script's location)
// This should match how you store file_path in the database (e.g., 'uploads/item_photos/...')
$baseUploadDir = '../'; // Assuming your 'uploads' folder is directly in the parent directory of 'php'

// Check if a user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = $_SESSION['user_id'];
$photoId = $_POST['photo_id'] ?? null; // Get photo_id from POST request

// Validate photo_id
if (!isset($photoId) || !is_numeric($photoId)) {
    echo json_encode(['success' => false, 'message' => 'Invalid photo ID provided.']);
    exit();
}

try {
    // 1. Fetch photo details (especially file_path and item_id) and verify ownership
    $stmt = $pdo->prepare("SELECT file_path, item_id FROM photos WHERE photo_id = :photo_id AND user_id = :user_id");
    $stmt->bindParam(':photo_id', $photoId, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $photo = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$photo) {
        echo json_encode(['success' => false, 'message' => 'Photo not found or does not belong to the current user.']);
        exit();
    }

    $filePathToDelete = $baseUploadDir . $photo['file_path']; // Construct full server path

    // 2. Delete the photo record from the database
    $pdo->beginTransaction(); // Start transaction for atomicity

    $stmt = $pdo->prepare("DELETE FROM photos WHERE photo_id = :photo_id AND user_id = :user_id");
    $stmt->bindParam(':photo_id', $photoId, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        // 3. If database record deleted, attempt to delete the physical file
        if (file_exists($filePathToDelete)) {
            if (unlink($filePathToDelete)) {
                $pdo->commit(); // Commit transaction if both successful
                echo json_encode(['success' => true, 'message' => 'Photo deleted successfully.']);
            } else {
                // If file deletion fails, rollback DB changes and report error
                $pdo->rollBack();
                error_log("Delete Photo File Error: Failed to delete physical file: " . $filePathToDelete);
                echo json_encode(['success' => false, 'message' => 'Photo record deleted, but failed to delete the physical file on server.']);
            }
        } else {
            // If file doesn't exist on server but record was deleted from DB, still commit
            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Photo record deleted successfully, file not found on server (might have been deleted already).']);
        }
    } else {
        // This case should ideally be caught by the initial $photo check, but good for robustness
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to delete photo record from database.']);
    }

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack(); // Rollback if any PDO error occurs during transaction
    }
    error_log("Delete Photo Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to delete photo. Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Delete Photo General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred during photo deletion.']);
}
?>