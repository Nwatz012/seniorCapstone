<?php
// php/api/generate_inventory_pdf.php

session_start(); // Start session to access user_id

// Set error reporting for debugging (REMOVE OR SET TO 0 IN PRODUCTION)
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../../vendor/autoload.php';

use Dompdf\Dompdf;
use Dompdf\Options;

require_once '../config/property_inventory.php';

// --- Security Check: Ensure user is logged in ---
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo "Unauthorized access. Please log in.";
    exit();
}

$userId = $_SESSION['user_id'];

// Function to format room names for display (e.g., "living_room" to "Living Room")
function formatRoomName($name) {
    return ucwords(str_replace('_', ' ', $name));
}

try {
    // 1. Fetch Data for the Report

    // Fetch Home Information
    $homeInfo = null;
    $stmt = $pdo->prepare("SELECT street_address, city, state, zip_code, square_footage, year_built FROM home_info WHERE user_id = :user_id LIMIT 1");
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $homeInfo = $stmt->fetch(PDO::FETCH_ASSOC);

    // Fetch Items for the Report
    $stmt = $pdo->prepare("
        SELECT
            i.item_name,
            i.quantity,
            i.replacement_cost,
            r.room_name,
            c.name AS category_name
        FROM
            items i
        JOIN
            rooms r ON i.room = r.room_name
        JOIN
            categories c ON i.category_id = c.category_id
        WHERE
            i.user_id = :user_id
        ORDER BY
            r.room_name, i.item_name
    ");
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Generate HTML Content for the PDF
    $html = '
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
            .home-details {
                font-size: 11px;
                margin-bottom: 15px;
                padding: 10px;
                border: 1px solid #ddd;
                background-color: #f9f9f9;
                line-height: 1.4;
            }
            .footer { text-align: center; font-size: 10px; margin-top: 30px; color: #777; }
        </style>
    </head>
    <body>
        <div class="header-info">
            Generated on: ' . date('Y-m-d H:i:s') . '<br>
            User: ' . htmlspecialchars($_SESSION['user_fullName'] ?? 'N/A') . '
        </div>';

    // Add Home Details if available
    if ($homeInfo) {
        $html .= '<div class="home-details">';
        $html .= '<strong>Home Details:</strong><br>';
        $html .= htmlspecialchars($homeInfo['street_address'] ?? '') . ', ';
        $html .= htmlspecialchars($homeInfo['city'] ?? '') . ', ';
        $html .= htmlspecialchars($homeInfo['state'] ?? '') . ' ';
        $html .= htmlspecialchars($homeInfo['zip_code'] ?? '') . '<br>';
        $html .= 'Square Footage: ' . htmlspecialchars($homeInfo['square_footage'] ?? 'N/A') . ' sq ft<br>';
        $html .= 'Year Built: ' . htmlspecialchars($homeInfo['year_built'] ?? 'N/A') . '<br>';
        $html .= '</div>';
    } else {
        $html .= '<p style="font-size: 11px; text-align: center; color: #777;">No home details found. Please add them in your profile settings.</p>';
    }

    $html .= '<h1>Comprehensive Home Inventory Report</h1>';

    $currentRoom = '';
    $roomTotalValue = 0;
    $grandTotalValue = 0;

    if (count($items) > 0) {
        foreach ($items as $item) {
            // Check for room change to create new section
            if ($item['room_name'] !== $currentRoom) {
                // Close previous room's table and add total if not the very first room
                if ($currentRoom !== '') {
                    $html .= '<tr><td colspan="3" class="total">Room Total Value:</td><td class="total">$' . number_format($roomTotalValue, 2) . '</td></tr>';
                    $html .= '</tbody></table>'; // Close previous table
                }
                $currentRoom = $item['room_name'];
                // Format the room name for display
                $displayRoomName = formatRoomName($currentRoom);
                $roomTotalValue = 0; // Reset room total
                $html .= '<h2>Room: ' . htmlspecialchars($displayRoomName) . '</h2>';
                $html .= '<table><thead><tr><th>Item Name</th><th>Category</th><th>Quantity</th><th>Value</th></tr></thead><tbody>'; // New table for new room
            }

            // Add item row
            $itemValue = (float)$item['replacement_cost'] * (int)$item['quantity'];
            $roomTotalValue += $itemValue;
            $grandTotalValue += $itemValue;

            $html .= '<tr>';
            $html .= '<td>' . htmlspecialchars($item['item_name']) . '</td>';
            $html .= '<td>' . htmlspecialchars($item['category_name']) . '</td>';
            $html .= '<td>' . htmlspecialchars($item['quantity']) . '</td>';
            $html .= '<td>$' . number_format($item['replacement_cost'], 2) . '</td>';
            $html .= '</tr>';
        }
        // Close the last room's table and add its total
        $html .= '<tr><td colspan="3" class="total">Room Total Value:</td><td class="total">$' . number_format($roomTotalValue, 2) . '</td></tr>';
        $html .= '</tbody></table>'; // Close the very last table
    } else {
        $html .= '<p style="text-align: center; padding: 20px;">No items found in your inventory.</p>';
    }

    $html .= '
        <h2 style="text-align: right; margin-top: 30px;">Grand Total Inventory Value: <span style="color: #689f38;">$' . number_format($grandTotalValue, 2) . '</span></h2>
        <div class="footer">
            <p>&copy; ' . date('Y') . ' Home Inventory App. All rights reserved.</p>
        </div>
    </body>
    </html>';

    // 3. Configure and Instantiate Dompdf
    $options = new Options();
    $options->set('isHtml5ParserEnabled', true);
    $options->set('isRemoteEnabled', true);
    $dompdf = new Dompdf($options);
    $dompdf->loadHtml($html);

    // (Optional) Set paper size and orientation
    $dompdf->setPaper('A4', 'portrait');

    // 4. Render the HTML as PDF
    $dompdf->render();

    // 5. Output the Generated PDF to Browser
    $dompdf->stream('inventory_report.pdf', ["Attachment" => true]);

} catch (PDOException $e) {
    error_log("PDF Generation Database Error: " . $e->getMessage());
    http_response_code(500);
    echo "Error generating report: Database issue. Details: " . $e->getMessage();
    exit();
} catch (Exception $e) {
    error_log("PDF Generation General Error: " . $e->getMessage());
    http_response_code(500);
    echo "Error generating report: An unexpected error occurred: " . $e->getMessage();
    exit();
}