<?php
// public/test_db.php
// Go to http://localhost/property_inventory/public/test_db.php in browser

error_reporting(E_ALL); // Make sure all errors are reported
ini_set('display_errors', 1); // Display errors for this test

$dbHost = 'localhost';
$dbUser = 'u203657356_rporepe';
$dbPass = 'H6DVyb$h'; // Or your password
$dbName = 'u203657356_rporepe';

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<h1>Database Connection SUCCESS!</h1>";
    // Test a query
    $stmt = $pdo->query("SELECT 1");
    $result = $stmt->fetchColumn();
    echo "<p>Test query (SELECT 1) returned: " . $result . "</p>";
} catch (PDOException $e) {
    echo "<h1 style='color:red;'>Database Connection FAILED!</h1>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?>