<?php
// public/settings.php

// Start session to access user ID
session_start();

// --- Database Configuration ---
// !!! IMPORTANT: Replace with your actual database credentials !!!
$host = 'localhost';
$dbname = 'property_inventory';
$username = 'root';
$password = ''; // Typically empty for local development, set a strong one for production

// --- Database Connection (PDO) ---
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // Log error and send generic error to client
    error_log("Database connection failed: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database connection error. Please try again later.']);
    exit();
}

// --- User Authentication Check ---
// In a real application, you would have a proper authentication system
// For this example, we'll assume a user_id is set in the session after login.
// If no user_id, return unauthorized.
if (!isset($_SESSION['user_id'])) {
    // For demonstration, let's set a dummy user_id if not set.
    // In production, this MUST redirect to login or deny access.
    $_SESSION['user_id'] = 1; // !!! REMOVE OR REPLACE WITH ACTUAL AUTHENTICATION !!!
    // echo json_encode(['success' => false, 'message' => 'Unauthorized access. Please log in.', 'redirect' => 'login.html']);
    // exit();
}
$user_id = $_SESSION['user_id'];

// --- Helper Function for JSON Response ---
function sendJsonResponse($success, $message, $data = []) {
    header('Content-Type: application/json');
    echo json_encode(array_merge(['success' => $success, 'message' => $message], $data));
    exit();
}

// --- Handle GET Request (Fetch Data) ---
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_data') {
    $userData = [];
    $homeData = [];

    // Fetch User Data from 'users' table
    try {
        $stmt = $pdo->prepare("SELECT email, first_name, last_name, phone, timezone, currency, date_format, two_factor_auth, login_notifications, email_notifications, auto_save_items, created_at, last_login FROM users WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $userData = $stmt->fetch();

        if (!$userData) {
            sendJsonResponse(false, 'User data not found.');
        }

        // Format dates for display
        $userData['member_since'] = $userData['created_at'] ? date('F Y', strtotime($userData['created_at'])) : 'N/A';
        $userData['last_login'] = $userData['last_login'] ? date('M j, Y \a\t g:i A', strtotime($userData['last_login'])) : 'N/A';
        unset($userData['created_at']); // Remove raw field
        // Note: two_factor_auth, login_notifications, email_notifications, auto_save_items might be stored as TINYINT (0 or 1) in DB, JS needs boolean or 0/1.

    } catch (PDOException $e) {
        error_log("Error fetching user data: " . $e->getMessage());
        sendJsonResponse(false, 'Error fetching user data.');
    }

    // Fetch Home Info Data from 'home_info' table
    try {
        $stmt = $pdo->prepare("SELECT address, city, state, zip_code, square_footage, year_built, roof_type, roof_age FROM home_info WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $homeData = $stmt->fetch();
        if (!$homeData) {
            // If no home info exists, return empty or default values
            $homeData = [
                'address' => '', 'city' => '', 'state' => '', 'zip_code' => '',
                'square_footage' => '', 'year_built' => '', 'roof_type' => '', 'roof_age' => ''
            ];
        }
    } catch (PDOException $e) {
        error_log("Error fetching home data: " . $e->getMessage());
        sendJsonResponse(false, 'Error fetching home data.');
    }

    sendJsonResponse(true, 'Settings data fetched successfully.', [
        'user_data' => $userData,
        'home_data' => $homeData
    ]);
}

// --- Handle POST Request (Update Data) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_data') {
    $form_id = $_POST['form_id'] ?? '';
    $errors = [];
    $message = '';

    switch ($form_id) {
        case 'profileSettingsForm':
            $first_name = trim($_POST['first_name'] ?? '');
            $last_name = trim($_POST['last_name'] ?? '');
            $email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
            $phone = trim($_POST['phone'] ?? '');
            $timezone = trim($_POST['timezone'] ?? '');

            if (empty($first_name)) $errors['first_name'] = 'First name is required.';
            if (empty($last_name)) $errors['last_name'] = 'Last name is required.';
            if (empty($email)) $errors['email'] = 'Valid email is required.';
            if (!empty($email) && !$email) $errors['email'] = 'Invalid email format.';

            // Check if email already exists for another user
            if (empty($errors['email'])) {
                $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ? AND user_id != ?");
                $stmt->execute([$email, $user_id]);
                if ($stmt->fetch()) {
                    $errors['email'] = 'This email is already taken.';
                }
            }

            if (empty($errors)) {
                try {
                    $stmt = $pdo->prepare("UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, timezone = ? WHERE user_id = ?");
                    $stmt->execute([$first_name, $last_name, $email, $phone, $timezone, $user_id]);
                    sendJsonResponse(true, 'Profile updated successfully.');
                } catch (PDOException $e) {
                    error_log("Error updating profile: " . $e->getMessage());
                    sendJsonResponse(false, 'Failed to update profile. Database error.');
                }
            } else {
                sendJsonResponse(false, 'Validation failed.', ['errors' => $errors]);
            }
            break;

        case 'homeSettingsForm':
            $address = trim($_POST['street_address'] ?? '');
            $city = trim($_POST['city'] ?? '');
            $state = trim($_POST['state'] ?? '');
            $zip_code = trim($_POST['zip_code'] ?? '');
            $square_footage = filter_var($_POST['square_footage'] ?? '', FILTER_VALIDATE_INT);
            $year_built = filter_var($_POST['year_built'] ?? '', FILTER_VALIDATE_INT);
            $roof_type = trim($_POST['roof_type'] ?? '');
            $roof_age = filter_var($_POST['roof_age'] ?? '', FILTER_VALIDATE_INT);

            // No 'required' fields by default, but can add validation if needed
            if (!empty($_POST['square_footage']) && $square_footage === false) $errors['square_footage'] = 'Square footage must be a number.';
            if (!empty($_POST['year_built']) && ($year_built === false || $year_built < 1800 || $year_built > 2100)) $errors['year_built'] = 'Year built must be a valid year (1800-2100).';
            if (!empty($_POST['roof_age']) && $roof_age === false) $errors['roof_age'] = 'Roof age must be a number.';

            if (empty($errors)) {
                try {
                    // Check if home_info record exists for the user
                    $stmt = $pdo->prepare("SELECT home_id FROM home_info WHERE user_id = ?");
                    $stmt->execute([$user_id]);
                    $existingHome = $stmt->fetch();

                    if ($existingHome) {
                        // Update existing record
                        $stmt = $pdo->prepare("UPDATE home_info SET address = ?, city = ?, state = ?, zip_code = ?, square_footage = ?, year_built = ?, roof_type = ?, roof_age = ? WHERE user_id = ?");
                        $stmt->execute([$address, $city, $state, $zip_code, $square_footage, $year_built, $roof_type, $roof_age, $user_id]);
                    } else {
                        // Insert new record
                        $stmt = $pdo->prepare("INSERT INTO home_info (user_id, address, city, state, zip_code, square_footage, year_built, roof_type, roof_age) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                        $stmt->execute([$user_id, $address, $city, $state, $zip_code, $square_footage, $year_built, $roof_type, $roof_age]);
                    }
                    sendJsonResponse(true, 'Home details updated successfully.');
                } catch (PDOException $e) {
                    error_log("Error updating home details: " . $e->getMessage());
                    sendJsonResponse(false, 'Failed to update home details. Database error.');
                }
            } else {
                sendJsonResponse(false, 'Validation failed.', ['errors' => $errors]);
            }
            break;

        case 'securitySettingsForm':
            $current_password = $_POST['current_password'] ?? '';
            $new_password = $_POST['new_password'] ?? '';
            $confirm_password = $_POST['confirm_password'] ?? '';
            $two_factor_auth = isset($_POST['two_factor_auth']) ? 1 : 0; // Checkbox value
            $login_notifications = isset($_POST['login_notifications']) ? 1 : 0; // Checkbox value

            // Only proceed with password change if new password fields are provided
            if (!empty($new_password) || !empty($confirm_password)) {
                // Fetch actual hashed password from DB
                $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE user_id = ?");
                $stmt->execute([$user_id]);
                $user = $stmt->fetch();

                if (!$user || !password_verify($current_password, $user['password_hash'])) {
                    $errors['current_password'] = 'Current password is incorrect.';
                }

                if (strlen($new_password) < 8 || !preg_match('/[A-Z]/', $new_password) || !preg_match('/[a-z]/', $new_password) || !preg_match('/\d/', $new_password)) {
                    $errors['new_password'] = 'Password must be at least 8 characters with uppercase, lowercase, and number.';
                }
                if ($new_password !== $confirm_password) {
                    $errors['confirm_password'] = 'New passwords do not match.';
                }
            }

            if (empty($errors)) {
                try {
                    $sql_parts = [];
                    $params = [];

                    if (!empty($new_password) && empty($errors['new_password']) && empty($errors['confirm_password'])) {
                        $new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);
                        $sql_parts[] = 'password_hash = ?';
                        $params[] = $new_password_hash;
                    }

                    $sql_parts[] = 'two_factor_auth = ?';
                    $params[] = $two_factor_auth;
                    $sql_parts[] = 'login_notifications = ?';
                    $params[] = $login_notifications;

                    if (!empty($sql_parts)) {
                        $sql = "UPDATE users SET " . implode(', ', $sql_parts) . " WHERE user_id = ?";
                        $params[] = $user_id;
                        $stmt = $pdo->prepare($sql);
                        $stmt->execute($params);
                        sendJsonResponse(true, 'Security settings updated successfully.');
                    } else {
                        sendJsonResponse(true, 'No changes to security settings detected.');
                    }

                } catch (PDOException $e) {
                    error_log("Error updating security: " . $e->getMessage());
                    sendJsonResponse(false, 'Failed to update security settings. Database error.');
                }
            } else {
                sendJsonResponse(false, 'Validation failed.', ['errors' => $errors]);
            }
            break;

        case 'preferencesSettingsForm':
            $currency = trim($_POST['currency'] ?? '');
            $date_format = trim($_POST['date_format'] ?? '');
            $email_notifications = isset($_POST['email_notifications']) ? 1 : 0; // Checkbox value
            $auto_save_items = isset($_POST['auto_save_items']) ? 1 : 0; // Checkbox value

            // Simple validation for dropdowns
            $allowed_currencies = ['USD', 'EUR', 'GBP', 'CAD'];
            $allowed_date_formats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

            if (!in_array($currency, $allowed_currencies)) $errors['currency'] = 'Invalid currency selected.';
            if (!in_array($date_format, $allowed_date_formats)) $errors['date_format'] = 'Invalid date format selected.';

            if (empty($errors)) {
                try {
                    $stmt = $pdo->prepare("UPDATE users SET currency = ?, date_format = ?, email_notifications = ?, auto_save_items = ? WHERE user_id = ?");
                    $stmt->execute([$currency, $date_format, $email_notifications, $auto_save_items, $user_id]);
                    sendJsonResponse(true, 'Preferences updated successfully.');
                } catch (PDOException $e) {
                    error_log("Error updating preferences: " . $e->getMessage());
                    sendJsonResponse(false, 'Failed to update preferences. Database error.');
                }
            } else {
                sendJsonResponse(false, 'Validation failed.', ['errors' => $errors]);
            }
            break;

        default:
            sendJsonResponse(false, 'Invalid form submission.');
            break;
    }
}

// If no specific action is requested, send a default response or redirect
// This prevents direct access to the PHP script from showing raw JSON or errors
sendJsonResponse(false, 'No valid action specified.');

?>