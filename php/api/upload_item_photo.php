<?php
// php/upload_item_photo.php

// Start a session to access user_id
session_start();

// Set content type to JSON
header('Content-Type: application/json');

// Include the database connection file
require_once '../config/property_inventory.php'; 

// Define upload directory (relative to this script's location, adjust if necessary)
// Assuming this script is in 'php/' and images go to 'uploads/item_photos/' in the web root
$uploadDir = '../uploads/item_photos/'; 

// Create the directory if it doesn't exist
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) { // 0755 permissions, recursive
        echo json_encode(['success' => false, 'message' => 'Failed to create upload directory. Check permissions.']);
        exit();
    }
}

// Check if a user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = $_SESSION['user_id'];
$itemId = $_POST['item_id'] ?? null; // Get item_id from POST request

// Validate item_id
if (!isset($itemId) || !is_numeric($itemId)) {
    echo json_encode(['success' => false, 'message' => 'Invalid item ID provided.']);
    exit();
}

// Verify that the item belongs to the current user for security
try {
    $stmt = $pdo->prepare("SELECT item_id FROM items WHERE item_id = :item_id AND user_id = :user_id");
    $stmt->bindParam(':item_id', $itemId, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $itemExists = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$itemExists) {
        echo json_encode(['success' => false, 'message' => 'Item not found or does not belong to the current user.']);
        exit();
    }
} catch (PDOException $e) {
    error_log("Upload Photo Item Verification Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error during item verification.']);
    exit();
}


// Check if file was uploaded without errors
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'No file uploaded or upload error occurred.']);
    exit();
}

$file = $_FILES['image'];
$fileName = $file['name'];
$fileTmpName = $file['tmp_name'];
$fileSize = $file['size'];
$fileError = $file['error'];
$fileType = $file['type'];

// Get file extension
$fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

// Allowed file extensions and MIME types
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
$allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

// Validate file extension and MIME type
if (!in_array($fileExt, $allowedExtensions) || !in_array($fileType, $allowedMimeTypes)) {
    echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPG, JPEG, PNG, GIF are allowed.']);
    exit();
}

// Validate file size (e.g., max 5MB)
$maxFileSize = 5 * 1024 * 1024; // 5MB
if ($fileSize > $maxFileSize) {
    echo json_encode(['success' => false, 'message' => 'File size exceeds the maximum limit (5MB).']);
    exit();
}

// Generate a unique file name to prevent overwriting
$newFileName = uniqid('item_photo_', true) . '.' . $fileExt;
$destination = $uploadDir . $newFileName;

try {
    // Move the uploaded file to the destination directory
    if (move_uploaded_file($fileTmpName, $destination)) {
        // File successfully moved, now save path to database
        $filePathForDb = 'uploads/item_photos/' . $newFileName; // Path to store in DB

        $stmt = $pdo->prepare("INSERT INTO photos (item_id, user_id, file_path, uploaded_at) VALUES (:item_id, :user_id, :file_path, NOW())");
        $stmt->bindParam(':item_id', $itemId, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':file_path', $filePathForDb, PDO::PARAM_STR);
        $stmt->execute();

        echo json_encode(['success' => true, 'message' => 'Image uploaded successfully!', 'file_path' => $filePathForDb]);

    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file. Check directory permissions.']);
    }
} catch (PDOException $e) {
    // If database insert fails, attempt to delete the uploaded file to prevent orphans
    if (file_exists($destination)) {
        unlink($destination); // Delete the file
    }
    error_log("Upload Photo Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to save photo record to database. ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Upload Photo General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred during upload.']);
}
?>