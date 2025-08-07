<?php
// php/api/generate_inventory_pdf.php
// Generates PDF inventory report for authenticated users

session_start();

// Production-safe error handling
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once '../../vendor/autoload.php';
require_once '../config/property_inventory.php';

use Dompdf\Dompdf;
use Dompdf\Options;

// Authentication check
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Unauthorized access. Please log in.']));
}

$userId = (int) $_SESSION['user_id'];
$userFullName = $_SESSION['user_fullName'] ?? 'N/A';

// Set response header to JSON
header('Content-Type: application/json');

/**
 * Format room names for display (e.g., "living_room" to "Living Room")
 */
function formatRoomName($name) {
    return ucwords(str_replace('_', ' ', $name));
}

/**
 * Generate PDF header with user and date info
 */
function generatePdfHeader($userFullName, $homeInfo) {
    ob_start(); // Start output buffering to capture the HTML
?>
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Inventory Report</title>
        <style>
            body { font-family: sans-serif; margin: 20px; line-height: 1.6; }
            h1 { color: #689f38; text-align: center; margin-bottom: 20px; }
            h2 { color: #558b2f; margin-top: 25px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .total { text-align: right; padding-right: 10px; font-weight: bold; }
            .header-info { text-align: right; font-size: 11px; margin-bottom: 10px; }
            .home-details { font-size: 11px; margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; line-height: 1.4; }
            .footer { text-align: center; font-size: 10px; margin-top: 30px; color: #777; }
            .no-items { text-align: center; padding: 20px; color: #666; }
        </style>
    </head>
    <body>
        <div class="header-info">
            Generated on: <?= date('Y-m-d H:i:s') ?><br>
            User: <?= htmlspecialchars($userFullName ?? 'N/A') ?>
        </div>
        <h1>Home Inventory Report</h1>
<?php
    if ($homeInfo) {
?>
        <div class="home-details">
            <strong>Home Details:</strong><br>
            <?= htmlspecialchars($homeInfo['street_address'] ?? '') ?>,
            <?= htmlspecialchars($homeInfo['city'] ?? '') ?>,
            <?= htmlspecialchars($homeInfo['state'] ?? '') ?>
            <?= htmlspecialchars($homeInfo['zip_code'] ?? '') ?><br>
            Square Footage: <?= htmlspecialchars($homeInfo['square_footage'] ?? 'N/A') ?> sq ft<br>
            Year Built: <?= htmlspecialchars($homeInfo['year_built'] ?? 'N/A') ?><br>
        </div>
<?php
    } else {
?>
        <p style="font-size: 11px; text-align: center; color: #777;">No home details found. Please add them in your profile settings.</p>
<?php
    }
    return ob_get_clean(); // Return the captured output
}

/**
 * Generate inventory items section grouped by room
 */
function generateInventorySection($items) {
    ob_start();
    if (empty($items)) {
?>
        <p class="no-items">No items found in your inventory.</p>
<?php
    } else {
        $currentRoom = '';
        $roomTotalValue = 0;
        $grandTotalValue = 0;

        foreach ($items as $item) {
            if ($item['room_name'] !== $currentRoom) {
                if ($currentRoom !== '') {
?>
                    <tr><td colspan="3" class="total">Room Total:</td><td class="total">$<?= number_format($roomTotalValue, 2) ?></td></tr>
                    </tbody></table>
<?php
                }
                $currentRoom = $item['room_name'];
                $displayRoomName = formatRoomName($currentRoom);
                $roomTotalValue = 0;
?>
                <h2>Room: <?= htmlspecialchars($displayRoomName) ?></h2>
                <table><thead><tr><th>Item Name</th><th>Category</th><th>Quantity</th><th>Value</th></tr></thead><tbody>
<?php
            }

            $itemValue = (float)$item['replacement_cost'] * (int)$item['quantity'];
            $roomTotalValue += $itemValue;
            $grandTotalValue += $itemValue;
?>
            <tr>
                <td><?= htmlspecialchars($item['item_name']) ?></td>
                <td><?= htmlspecialchars($item['category_name']) ?></td>
                <td><?= htmlspecialchars($item['quantity']) ?></td>
                <td>$<?= number_format($item['replacement_cost'], 2) ?></td>
            </tr>
<?php
        }
        if ($currentRoom !== '') {
?>
            <tr><td colspan="3" class="total">Room Total:</td><td class="total">$<?= number_format($roomTotalValue, 2) ?></td></tr>
            </tbody></table>
<?php
        }
?>
        <h2 style="text-align: right; margin-top: 30px;">Total Inventory Value: <span style="color: #689f38;">$<?= number_format($grandTotalValue, 2) ?></span></h2>
<?php
    }
    return ob_get_clean();
}

try {
    $stmt = $pdo->prepare("SELECT street_address, city, state, zip_code, square_footage, year_built FROM home_info WHERE user_id = :user_id LIMIT 1");
    $stmt->execute([':user_id' => $userId]);
    $homeInfo = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("
        SELECT i.item_name, i.quantity, i.replacement_cost, r.room_name, c.name AS category_name
        FROM items i
        JOIN rooms r ON i.room = r.room_name
        JOIN categories c ON i.category_id = c.category_id
        WHERE i.user_id = :user_id
        ORDER BY r.room_name, i.item_name
    ");
    $stmt->execute([':user_id' => $userId]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $html = generatePdfHeader($userFullName, $homeInfo);
    $html .= generateInventorySection($items);
    $html .= '
        <div class="footer">
            <p>&copy; ' . date('Y') . ' Home Inventory App. All rights reserved.</p>
        </div>
    </body>
    </html>';

    $options = new Options();
    $options->set('isHtml5ParserEnabled', true);
    $options->set('isRemoteEnabled', false);
    
    $dompdf = new Dompdf($options);
    $dompdf->loadHtml($html);
    $dompdf->setPaper('A4', 'portrait');
    $dompdf->render();

    $pdfOutput = $dompdf->output();

    $tempDir = __DIR__ . '/temp_reports/';
    if (!is_dir($tempDir)) {
        if (!mkdir($tempDir, 0777, true)) {
            echo json_encode(['success' => false, 'message' => 'Error: Could not create temporary directory for reports.']);
            exit;
        }
    }
    
    $filename = 'inventory_report_' . date('Y-m-d_H-i-s') . '_' . uniqid() . '.pdf';
    $filePath = $tempDir . $filename;
    
    if (file_put_contents($filePath, $pdfOutput) === false) {
        echo json_encode(['success' => false, 'message' => 'Error: Could not save the PDF file to the server.']);
        exit;
    }

    $fileUrl = 'php/api/temp_reports/' . $filename;
    echo json_encode(['success' => true, 'filePath' => $fileUrl]);

} catch (PDOException $e) {
    error_log("PDF Generation Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error generating report. Please try again later.']);
} catch (Exception $e) {
    error_log("PDF Generation Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error generating report. Please try again later.']);
}
?>
