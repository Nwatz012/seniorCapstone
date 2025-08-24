import { showMessage } from './utils.js';

// Wait for the entire HTML document to be fully loaded and parsed before running the script.
document.addEventListener('DOMContentLoaded', () => {
    // Select the contact form element from the DOM.
    const contactForm = document.getElementById('contactForm');
    // Select the container where we will display feedback messages to the user.
    const feedbackMessageContainer = document.getElementById('form-feedback-message');

    // Add an event listener to the form to handle the 'submit' event.
    // The 'async' keyword allows us to use 'await' inside this function.
    contactForm.addEventListener('submit', async function(event) {
        // Prevent the default form submission behavior, which would cause a page reload.
        event.preventDefault();

        // Create a FormData object from the form.
        // This makes it easy to collect all form inputs (name, email, message)
        // and prepare them for an AJAX request.
        const formData = new FormData(event.target);

        // Display a "sending" message to the user while the request is in progress.
        showMessage('Sending message...', 'info', feedbackMessageContainer);

        try {
            // Use the Fetch API to send a POST request to the form's action URL.
            // The 'body' is the FormData object, which automatically sets the
            // correct 'Content-Type' header for form submissions.
            const response = await fetch(contactForm.action, { 
                method: 'POST', 
                body: formData 
            });
            
            // Wait for the response and parse it as JSON.
            const result = await response.json();

            // Check the 'success' property of the JSON response from the server.
            if (result.success) {
                // If successful, display a success message and clear the form inputs.
                showMessage('Success! Your message has been sent.', 'success', feedbackMessageContainer);
                contactForm.reset();
            } else {
                // If not successful, display the error message from the server,
                // or a generic error if none is provided.
                showMessage(result.error || 'Error, please try again.', 'error', feedbackMessageContainer);
            }
        } catch (error) {
            // This 'catch' block handles network errors or issues with the fetch operation itself.
            showMessage('An unexpected error occurred. Please try again later.', 'error', feedbackMessageContainer);
            console.error('Error:', error);
        }
    });
});