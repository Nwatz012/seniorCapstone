<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

// Corrected paths for PHPMailer
require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Include database connection
require_once __DIR__ . '/../config/property_inventory.php';

// Get JSON POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);
$email = trim($data['email'] ?? '');

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Please provide a valid email address.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = :email");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Fail silently to avoid revealing if email exists
        echo json_encode(['success' => true, 'message' => 'If an account with that email exists, a password reset link has been sent.']);
        exit;
    }

    $userId = $user['user_id'];
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));

    $stmt = $pdo->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (:user_id, :token, :expires)");
    $stmt->execute(['user_id' => $userId, 'token' => $token, 'expires' => $expires]);

    $mail = new PHPMailer(true);

    // SMTP settings - replace with your actual SMTP details
    $mail->isSMTP();
    $mail->Host       = 'smtp.hostinger.com';  // Your SMTP server
    $mail->SMTPAuth   = true;
    $mail->Username   = 'support@propertyinventory.blog';  // Your SMTP email
     $mail->Password   = getenv('MAIL_PASSWORD'); // htaccess
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = 465;

    $mail->setFrom('support@propertyinventory.blog', 'Home Inventory App');
    $mail->addAddress($email);

    $resetLink = "https://propertyinventory.blog/reset_password.html?token={$token}";

    $mail->isHTML(true);
    $mail->Subject = 'Password Reset Request';
    $mail->Body    = "
        <p>Hello,</p>
        <p>Please click the link below to reset your password:</p>
        <p><a href='{$resetLink}'>Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Thank you,<br>Home Inventory Team</p>
    ";
    $mail->AltBody = "Hello,\nPlease visit the following link to reset your password:\n{$resetLink}\nThis link expires in 1 hour.\nIf you did not request this, please ignore this email.\nThank you,\nHome Inventory Team";

    $mail->send();

    echo json_encode(['success' => true, 'message' => 'If an account with that email exists, a password reset link has been sent.']);

} catch (Exception $e) {
    error_log('Password reset email error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An error occurred while sending the password reset email.']);
}
