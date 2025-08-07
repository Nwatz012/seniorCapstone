<?php
// php/add_item.php

session_start();
header('Content-Type: application/json');

require_once '../config/property_inventory.php';

// Check authentication
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = (int) $_SESSION['user_id']; // Always cast for safety

// Retrieve and decode JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input.']);
    exit();
}

// Sanitize and assign input data
$itemName = trim($data['name'] ?? '');
$itemCategory = trim($data['category'] ?? '');
$itemQuantity = (int) ($data['quantity'] ?? 1);
$itemRoom = trim($data['room'] ?? '');
$itemValue = (float) ($data['value'] ?? 0.00);

// Basic validation
if ($itemName === '' || $itemCategory === '' || $itemRoom === '') {
    echo json_encode(['success' => false, 'message' => 'Item name, category, and room are required.']);
    exit();
}
if ($itemQuantity <= 0) {
    echo json_encode(['success' => false, 'message' => 'Quantity must be a positive number.']);
    exit();
}
if ($itemValue < 0) {
    echo json_encode(['success' => false, 'message' => 'Replacement cost must be non-negative.']);
    exit();
}

try {
    // Ensure category exists or create it
    $stmt = $pdo->prepare("SELECT category_id FROM categories WHERE name = :category_name");
    $stmt->bindParam(':category_name', $itemCategory, PDO::PARAM_STR);
    $stmt->execute();
    $category = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($category) {
        $categoryId = $category['category_id'];
    } else {
        $stmt = $pdo->prepare("INSERT INTO categories (name) VALUES (:category_name)");
        $stmt->bindParam(':category_name', $itemCategory, PDO::PARAM_STR);
        $stmt->execute();
        $categoryId = $pdo->lastInsertId();
    }

    // Ensure room exists for this user
    $stmt = $pdo->prepare("SELECT room_name FROM rooms WHERE room_name = :room_name AND user_id = :user_id");
    $stmt->bindParam(':room_name', $itemRoom, PDO::PARAM_STR);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();

    if (!$stmt->fetch()) {
        $stmt = $pdo->prepare("INSERT INTO rooms (user_id, room_name) VALUES (:user_id, :room_name)");
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':room_name', $itemRoom, PDO::PARAM_STR);
        $stmt->execute();
    }

    // Insert the item
    $stmt = $pdo->prepare(
        "INSERT INTO items (
            user_id, category_id, item_name, quantity, room, replacement_cost, photo_url, created_at
        ) VALUES (
            :user_id, :category_id, :item_name, :quantity, :room, :replacement_cost, :photo_url, NOW()
        )"
    );

    $photoUrl = null; // Placeholder for future image upload integration

    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':category_id', $categoryId, PDO::PARAM_INT);
    $stmt->bindParam(':item_name', $itemName, PDO::PARAM_STR);
    $stmt->bindParam(':quantity', $itemQuantity, PDO::PARAM_INT);
    $stmt->bindParam(':room', $itemRoom, PDO::PARAM_STR);
    $stmt->bindParam(':replacement_cost', $itemValue, PDO::PARAM_STR);
    $stmt->bindParam(':photo_url', $photoUrl, PDO::PARAM_STR);

    $stmt->execute();

    echo json_encode(['success' => true, 'message' => 'Item added successfully!']);

} catch (PDOException $e) {
    error_log("Database error in add_item.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to add item. Database error occurred.']);
} catch (Exception $e) {
    error_log("General error in add_item.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Unexpected error occurred.']);
}
