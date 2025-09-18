// Contact Form Validation and Submission Handling
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.contact-form');
    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // Basic validation
            const name = form.name.value.trim();
            const email = form.email.value.trim();
            const topic = form.topic.value;
            const message = form.message.value.trim();

            if(!name || !email || !topic || !message) {
                alert('Please fill in all required fields.');
                return;
            }
            // Email format check
            if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }

            // Simulate submission (replace with real AJAX if needed)
            form.querySelector('.contact-btn').disabled = true;
            form.querySelector('.contact-btn').innerText = 'Sending...';
            setTimeout(() => {
                alert('Thank you for contacting us! We will respond as soon as possible.');
                form.reset();
                form.querySelector('.contact-btn').disabled = false;
                form.querySelector('.contact-btn').innerText = 'Send Message';
            }, 1500);
        });
    }
});