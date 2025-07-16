<?php
// php/property_inventory.php

$host = 'localhost';
$dbname = 'property_inventory';
$username = 'root';
$password = ''; // Usually empty for XAMPP

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    // Remove the echo statement - it breaks JSON responses
    // echo "Connected successfully";
} catch(PDOException $e) {
    // Log the error instead of echoing it
    error_log("Database Connection Error: " . $e->getMessage());
    // For development, show the error so we can debug
    die("Database connection failed: " . $e->getMessage());
}
?>