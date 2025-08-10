<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Note: This version explicitly includes all core PHPMailer files.
// Ensure the PHPMailer 'src' directory is located at public_html/php/api/PHPMailer/src/
// The path below is relative from send_contact.php to the files.
require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';


// Grab form data
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$subject = trim($_POST['subject'] ?? 'Support Request');
$message = trim($_POST['message'] ?? '');

if (!$name || !$email || !$message) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Please fill in all required fields.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email address.']);
    exit;
}

$mail = new PHPMailer(true);

try {
    // SMTP settings
    $mail->isSMTP();
    $mail->Host = 'smtp.hostinger.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'support@propertyinventory.blog';
    $mail->Password   = getenv('MAIL_PASSWORD'); // Your Gmail App Password
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL for port 465
    $mail->Port = 465;

    // Recipients
    $mail->setFrom('support@propertyinventory.blog', 'Property Inventory Support');
    $mail->addAddress('support@propertyinventory.blog'); // Send to yourself
    $mail->addReplyTo($email, $name); // Reply goes to sender

    // Content
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = nl2br(htmlspecialchars($message));
    $mail->AltBody = strip_tags($message);

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'Message sent successfully.']);
} catch (Exception $e) {
    error_log('Mail error: ' . $mail->ErrorInfo);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Unable to send message right now.']);
}
