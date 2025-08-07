<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

header('Content-Type: application/json');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Include Composer's autoloader for PHPMailer
require __DIR__ . '/../../vendor/autoload.php';


// Include the database connection file
require_once '../config/property_inventory.php'; 

// Get the raw POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Get the email and trim any whitespace
$email = trim($data['email'] ?? '');

// Server-side validation
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Please provide a valid email address.']);
    exit();
}

try {
    // Check if the email exists
    $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = :email");
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Fail silently
        echo json_encode(['success' => true, 'message' => 'If an account with that email exists, a password reset link has been sent.']);
        exit();
    }

    $userId = $user['user_id'];
    
    // Generate a secure, unique token
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));

    // Store the token
    $stmt = $pdo->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (:user_id, :token, :expires)");
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':token', $token, PDO::PARAM_STR);
    $stmt->bindParam(':expires', $expires, PDO::PARAM_STR);
    $stmt->execute();

    // --- PHPMailer Configuration ---
    $mail = new PHPMailer(true);

    // Server settings
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com'; 
    $mail->SMTPAuth   = true;
    $mail->Username   = ''; // Your SMTP username (your full email address) ** COME BACK ONCE YOU CREATE THE ONLINE WEB HOST AND MAILER**
    $mail->Password   = ''; // Your Gmail App Password
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = 465;

    // Recipients
    $mail->setFrom('no-reply@yourdomain.com', 'Home Inventory App');
    $mail->addAddress($email);

    // Content
    $resetLink = "http://localhost/property_inventory/reset_password.html?token=" . $token; 
    $mail->isHTML(true);
    $mail->Subject = "Password Reset Request";
    $mail->Body    = "Hello,<br><br>A password reset was requested for your account. Please click the following link to reset your password:<br><br><a href='{$resetLink}'>Reset Password</a><br><br>This link will expire in one hour. If you did not request this, please ignore this email.<br><br>Thank you,<br>Home Inventory Team";
    $mail->AltBody = "Hello,\n\nA password reset was requested for your account. Please visit the following link to reset your password:\n\n" . $resetLink . "\n\nThis link will expire in one hour. If you did not request this, please ignore this email.\n\nThank you,\nHome Inventory Team";

    $mail->send();

    echo json_encode(['success' => true, 'message' => 'If an account with that email exists, a password reset link has been sent.']);

} catch (Exception $e) {
    error_log("Password Reset Request Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An error occurred. Please try again later.']);
}
