<?php
// php/config/property_inventory.php

// Purpose: This file establishes a secure, reusable database connection using PDO.
// NICHOLE REMEMBER: Do NOT include session_start() or user authentication here — handle that in API or UI controllers.

// -------------------------
// Database Configuration
// -------------------------
$dbHost = 'localhost';               // Hostname (localhost for XAMPP)
$dbUser = 'u203657356_rporepe';                    // Default user in XAMPP
$dbPass = 'REDACTED';                        // Default password (blank in XAMPP)
$dbName = 'u203657356_rporepe';      // Your database name

// -------------------------
// Establish PDO Connection
// -------------------------
$pdo = null;

try {
    $pdo = new PDO(
        "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4",
        $dbUser,
        $dbPass
    );

    // Enable exceptions for error handling
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Fetch results as associative arrays by default
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    // Log error to server logs for developer visibility
    error_log("Database connection failed: " . $e->getMessage());

    // Respond with JSON (for API context)
    http_response_code(500); // Server error
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed.'
    ]));
}


