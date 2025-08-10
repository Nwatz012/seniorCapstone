// public/js/reports.js

import { showMessage } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const downloadPdfReportBtn = document.getElementById('downloadPdfReportBtn');

    if (downloadPdfReportBtn) {
        downloadPdfReportBtn.addEventListener('click', async (event) => {
            event.preventDefault();

            showMessage('Generating PDF report...', 'info');

            try {
                // The fetch request to the PHP script that streams the PDF
                const response = await fetch('php/api/generate_inventory_pdf.php', {
                    method: 'POST',
                });

                if (!response.ok) {
                    throw new Error(`Server responded with a status of ${response.status}`);
                }

                // The key change: Get the response as a file blob, not JSON
                const pdfBlob = await response.blob();
                
                // Create a temporary URL for the blob
                const url = window.URL.createObjectURL(pdfBlob);

                // Create a temporary link element to trigger the download
                const a = document.createElement('a');
                a.href = url;
                a.download = `inventory_report_${new Date().toISOString().slice(0, 10)}.pdf`; // Set a default filename
                document.body.appendChild(a);
                
                // Programmatically click the link to start the download
                a.click();
                
                // Clean up: remove the temporary link and revoke the object URL
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                showMessage('Report downloaded successfully!', 'success');

            } catch (error) {
                console.error('Error generating PDF:', error);
                showMessage('Error generating PDF report. Please try again.', 'error');
            }
        });
    }
});
