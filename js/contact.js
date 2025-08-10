import { showMessage } from './utils.js';

document.getElementById('contactForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const form = event.target;
    const feedbackMessageContainer = document.getElementById('form-feedback-message');
    const formData = new FormData(form);

    showMessage('Sending message...', 'info', feedbackMessageContainer);

    try {
        const response = await fetch(form.action, { method: 'POST', body: formData });
        const result = await response.json();

        if (result.success) {
            showMessage('Success! Your message has been sent.', 'success', feedbackMessageContainer);
            form.reset();
        } else {
            showMessage(result.error || 'Error, please try again.', 'error', feedbackMessageContainer);
        }
    } catch (error) {
        showMessage('An unexpected error occurred. Please try again later.', 'error', feedbackMessageContainer);
        console.error('Error:', error);
    }
});
