<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration
$host = 'localhost';
$dbname = 'inventory_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

// Validate required fields
if (empty($input['name']) || empty($input['category']) || empty($input['rooms']) || !isset($input['value'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

// Prepare data
$name = trim($input['name']);
$category = trim($input['category']);
$rooms = json_encode($input['rooms']); // Store as JSON array
$value = floatval($input['value']);
$photo_url = $input['photo_url'] ?? null;
$user_id = 1; // Default user ID for now

try {
    if (isset($input['id']) && $input['id'] > 0) {
        // Update existing item
        $stmt = $pdo->prepare("UPDATE items SET name = ?, category = ?, rooms = ?, value = ?, photo_url = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$name, $category, $rooms, $value, $photo_url, $input['id'], $user_id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Item updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Item not found or no changes made']);
        }
    } else {
        // Insert new item
        $stmt = $pdo->prepare("INSERT INTO items (name, category, rooms, value, photo_url, user_id) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $category, $rooms, $value, $photo_url, $user_id]);
        
        echo json_encode(['success' => true, 'message' => 'Item added successfully', 'id' => $pdo->lastInsertId()]);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>