<?php
// Save this as php/database_test.php
// Access via http://localhost/property_inventory/php/database_test.php

require_once '../config/property_inventory.php'; 

echo "<h2>Database Connection Test</h2>";

try {
    echo "✅ Database connection successful!<br>";
    
    // Test if users table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Users table exists!<br>";
        
        // Show table structure
        $stmt = $pdo->query("DESCRIBE users");
        echo "<h3>Users table structure:</h3>";
        while ($row = $stmt->fetch()) {
            echo "- " . $row['Field'] . " (" . $row['Type'] . ")<br>";
        }
        
        // Count existing users
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
        $count = $stmt->fetch()['count'];
        echo "<br>📊 Current users in database: " . $count . "<br>";
        
    } else {
        echo "❌ Users table does NOT exist!<br>";
        echo "You need to create the users table using the SQL I provided.<br>";
    }
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "<br>";
}
?>