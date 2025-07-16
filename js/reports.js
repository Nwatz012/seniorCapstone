// public/js/reports.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements specific to reports page
    const downloadPdfReportBtn = document.getElementById('downloadPdfReportBtn');

    // Make sure showMessage is available (it should be if dashboard.js or utils.js is loaded first)
    if (typeof showMessage === 'undefined') {
        console.error("showMessage function not found. Please ensure utils.js or dashboard.js is loaded before reports.js.");
        // Define a fallback for showMessage if it's crucial and not guaranteed by other scripts
        window.showMessage = function(message, type = 'info') {
            console.log(`Message (${type}): ${message}`);
            alert(message); // Fallback to alert if message box not present
        };
    }

    // PDF Download Button Listener
    if (downloadPdfReportBtn) {
        downloadPdfReportBtn.addEventListener('click', () => {
            // Show a temporary message to the user
            showMessage('Generating PDF report...', 'info');

            // Open the PDF generation script in a new tab/window
            // The server will respond with the PDF file for download or display
            window.open('php/api/generate_inventory_pdf.php', '_blank');

            // Provide feedback after a short delay
            setTimeout(() => {
                showMessage('PDF generation complete. Check your downloads or new tab.', 'success');
            }, 2000);
        });
    }

    // You can add more reports-page specific JS here later if needed
});