<?php
// php/api/upload_item_photo.php

session_start();
header('Content-Type: application/json');

require_once '../config/property_inventory.php';

//-------------------------------------------
// Configuration 
//-------------------------------------------

$uploadDir = 'C:/xampp/htdocs/property_inventory/uploads/item_photos/';
$projectWebRootPrefix = '/property_inventory/';
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
$allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
$maxFileSize = 5 * 1024 * 1024; // 5MB

//-------------------------------------------
// Validation Session and Input 
//-------------------------------------------

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = $_SESSION['user_id'];
$itemId = $_POST['item_id'] ?? null;

if (!is_numeric($itemId)) {
    echo json_encode(['success' => false, 'message' => 'Invalid item ID provided.']);
    exit();
}

//-------------------------------------------
// Verify Item Ownership
//-------------------------------------------

try {
    $stmt = $pdo->prepare("SELECT item_id FROM items WHERE item_id = :item_id AND user_id = :user_id");
    $stmt->execute([':item_id' => $itemId, ':user_id' => $userId]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Item not found or does not belong to user.']);
        exit();
    }
} catch (PDOException $e) {
    error_log("DB Error - Item Verification: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error verifying item ownership.']);
    exit();
}

//-------------------------------------------
// Validate File Upload 
//-------------------------------------------

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'Upload failed.']);
    exit();
}

$file = $_FILES['image'];
$fileName = $file['name'];
$tmpName = $file['tmp_name'];
$fileSize = $file['size'];
$fileType = $file['type'];
$fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

// File type check
if (!in_array($fileExt, $allowedExtensions) || !in_array($fileType, $allowedMimeTypes)) {
    echo json_encode(['success' => false, 'message' => 'Invalid file type.']);
    exit();
}

// File size check
if ($fileSize > $maxFileSize) {
    echo json_encode(['success' => false, 'message' => 'File too large. Max 5MB.']);
    exit();
}

//-------------------------------------------
// Handle File Storage
//-------------------------------------------

$fullUploadPath = rtrim($uploadDir, '/\\') . DIRECTORY_SEPARATOR;

if (!is_dir($fullUploadPath)) {
    if (!mkdir($fullUploadPath, 0755, true)) {
        error_log("Failed to create upload directory: $fullUploadPath");
        echo json_encode(['success' => false, 'message' => 'Upload directory error.']);
        exit();
    }
}

$newFileName = uniqid('item_photo_', true) . '.' . $fileExt;
$destination = $fullUploadPath . $newFileName;

//-------------------------------------------
// Move Files and Update Database
//-------------------------------------------

try {
    if (!move_uploaded_file($tmpName, $destination)) {
        error_log("Failed to move uploaded file: $destination");
        echo json_encode(['success' => false, 'message' => 'Upload failed.']);
        exit();
    }

    $webPath = rtrim($projectWebRootPrefix, '/') . '/uploads/item_photos/' . $newFileName;

    $stmt = $pdo->prepare("INSERT INTO photos (item_id, user_id, file_path, uploaded_at) 
                           VALUES (:item_id, :user_id, :file_path, NOW())");
    $stmt->execute([
        ':item_id'   => $itemId,
        ':user_id'   => $userId,
        ':file_path' => $webPath
    ]);

    echo json_encode(['success' => true, 'message' => 'Image uploaded successfully!', 'file_path' => $webPath]);

} catch (PDOException $e) {
    if (file_exists($destination)) {
        unlink($destination); // Clean up file if DB insert fails
    }
    error_log("DB Error - Upload Photo: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error.']);
} catch (Exception $e) {
    error_log("General Error - Upload Photo: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Unexpected error occurred.']);
}
