        <?php
        // php/logout.php
        session_start();
        session_unset();   // Unset all session variables
        session_destroy(); // Destroy the session
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'message' => 'Logged out successfully.']);
        exit();
        ?>
        