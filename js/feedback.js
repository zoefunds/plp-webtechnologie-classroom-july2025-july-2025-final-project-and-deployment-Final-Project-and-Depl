// Feedback Form Validation and Submission Handling
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.feedback-form');
    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // Validate required fields
            const experience = form.experience.value;
            if(!experience) {
                alert('Please rate your experience.');
                return;
            }
            // Optionally check for comments or features
            // Simulate submission
            form.querySelector('.feedback-btn').disabled = true;
            form.querySelector('.feedback-btn').innerText = 'Submitting...';
            setTimeout(() => {
                alert('Thank you for your feedback!');
                form.reset();
                form.querySelector('.feedback-btn').disabled = false;
                form.querySelector('.feedback-btn').innerText = 'Submit Feedback';
            }, 1200);
        });
    }
});