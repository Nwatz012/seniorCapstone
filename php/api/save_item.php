<?php
// API Headers - Set response type and CORS permissions
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS requests for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database Configuration
$host = 'localhost';
$dbname = 'inventory_db';
$username = 'root';
$password = '';

// Database Connection
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Parse JSON Input from Request Body
$input = json_decode(file_get_contents('php://input'), true);

// Validate JSON Input
if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

// Validate Required Fields
if (empty($input['name']) || empty($input['category']) || empty($input['rooms']) || !isset($input['value'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

// Prepare and Sanitize Data
$name = trim($input['name']);
$category = trim($input['category']);
$rooms = json_encode($input['rooms']); // Store rooms as JSON array
$value = floatval($input['value']);
$photo_url = $input['photo_url'] ?? null;
$user_id = 1; // Default user ID for now

// Database Operations - Add or Update Item
try {
    if (isset($input['id']) && $input['id'] > 0) {
        // Update Existing Item
        $stmt = $pdo->prepare("UPDATE items SET name = ?, category = ?, rooms = ?, value = ?, photo_url = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$name, $category, $rooms, $value, $photo_url, $input['id'], $user_id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Item updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Item not found or no changes made']);
        }
    } else {
        // Insert New Item
        $stmt = $pdo->prepare("INSERT INTO items (name, category, rooms, value, photo_url, user_id) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $category, $rooms, $value, $photo_url, $user_id]);
        
        echo json_encode(['success' => true, 'message' => 'Item added successfully', 'id' => $pdo->lastInsertId()]);
    }
} catch (PDOException $e) {
    // Handle Database Errors
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>