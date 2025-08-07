// public/js/reports.js

import { showMessage } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements specific to reports page
    const downloadPdfReportBtn = document.getElementById('downloadPdfReportBtn');

    // PDF Download Button Listener
    if (downloadPdfReportBtn) {
        downloadPdfReportBtn.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent the default link behavior if it's an <a> tag

            showMessage('Generating PDF report...', 'info');

            try {
                // Step 1: Request the server to generate the PDF and save it.
                // The server will return a JSON object with the file path.
                const response = await fetch('php/api/generate_inventory_pdf.php', {
                    method: 'POST', // Use POST to request the file generation
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ action: 'generate' }), // Send a small payload
                });

                if (!response.ok) {
                    throw new Error('Server response was not successful.');
                }

                const result = await response.json();

                if (result.success && result.filePath) {
                    // Step 2: Use the returned file path to trigger the download.
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = result.filePath;
                    a.download = 'home-inventory-report.pdf'; // Suggested filename
                    document.body.appendChild(a);
                    a.click();
                    
                    document.body.removeChild(a);

                    showMessage('PDF generation complete. Your download should begin shortly.', 'success');
                } else {
                    showMessage(result.message || 'Error generating PDF. Please try again.', 'error');
                }

            } catch (error) {
                console.error('Error generating PDF:', error);
                showMessage('Error generating PDF report. Please try again.', 'error');
            }
        });
    }

    // You can add more reports-page specific JS here later if needed
});
