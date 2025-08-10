<?php
// php/delete_item_photo.php
// API endpoint to delete item photos (removes both database record and file)

session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../config/property_inventory.php'; 

// Configuration - move to config file in production
define('UPLOAD_BASE_PATH', '/home/u203657356/domains/propertyinventory.blog/public_html/uploads');
define('WEB_PATH_PREFIX', '/');

// Ensure only DELETE/POST method is accepted
if (!in_array($_SERVER['REQUEST_METHOD'], ['DELETE', 'POST'])) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit();
}

// Authentication check
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required.']);
    exit();
}

// Parse and validate JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON format.']);
    exit();
}

// Validate photo ID
if (!isset($data['photo_id']) || !is_numeric($data['photo_id']) || $data['photo_id'] <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Valid photo ID required.']);
    exit();
}

$photoId = (int) $data['photo_id'];
$userId = (int) $_SESSION['user_id'];

/**
 * Safely resolve file path and validate it's within allowed directory
 */
function resolvePhotoPath($dbFilePath) {
    // Remove web path prefix to get relative path
    $relativePath = str_replace(WEB_PATH_PREFIX, '', $dbFilePath);
    
    // Build full file system path
    $fullPath = UPLOAD_BASE_PATH . DIRECTORY_SEPARATOR . ltrim($relativePath, '/\\');
    $fullPath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $fullPath);
    
    // Security: Ensure resolved path is within upload directory
    $realUploadPath = realpath(UPLOAD_BASE_PATH);
    $realFilePath = realpath(dirname($fullPath));
    
    if (!$realUploadPath || !$realFilePath || strpos($realFilePath, $realUploadPath) !== 0) {
        throw new Exception('Invalid file path detected');
    }
    
    return $fullPath;
}

/**
 * Safely delete file with error handling
 */
function deletePhotoFile($filePath) {
    if (!file_exists($filePath)) {
        return ['success' => true, 'message' => 'File already removed'];
    }
    
    if (!is_writable(dirname($filePath))) {
        throw new Exception('No write permission for file deletion');
    }
    
    if (!unlink($filePath)) {
        throw new Exception('Failed to delete physical file');
    }
    
    return ['success' => true, 'message' => 'File deleted successfully'];
}

try {
    // Verify photo ownership and get file path
    $stmt = $pdo->prepare("SELECT file_path, item_id FROM photos WHERE photo_id = :photo_id AND user_id = :user_id");
    $stmt->execute([':photo_id' => $photoId, ':user_id' => $userId]);
    $photo = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$photo) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Photo not found or access denied.']);
        exit();
    }

    // Begin atomic operation
    $pdo->beginTransaction();

    // Delete database record first
    $stmt = $pdo->prepare("DELETE FROM photos WHERE photo_id = :photo_id AND user_id = :user_id");
    $stmt->execute([':photo_id' => $photoId, ':user_id' => $userId]);

    if ($stmt->rowCount() === 0) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete photo record.']);
        exit();
    }

    // Attempt to delete physical file
    try {
        $filePath = resolvePhotoPath($photo['file_path']);
        $fileResult = deletePhotoFile($filePath);
        
        $pdo->commit();
        echo json_encode([
            'success' => true, 
            'message' => 'Photo deleted successfully.',
            'deleted_id' => $photoId
        ]);
        
    } catch (Exception $fileError) {
        // File deletion failed, but DB record is removed
        // In some cases this might be acceptable (file was already missing)
        error_log("Photo file deletion failed for photo_id {$photoId}: " . $fileError->getMessage());
        
        $pdo->commit(); // Keep DB deletion
        echo json_encode([
            'success' => true, 
            'message' => 'Photo record deleted. File may have been previously removed.',
            'deleted_id' => $photoId,
            'warning' => 'File cleanup incomplete'
        ]);
    }

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Database error in delete_item_photo.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error occurred.']);
    
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Unexpected error in delete_item_photo.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}