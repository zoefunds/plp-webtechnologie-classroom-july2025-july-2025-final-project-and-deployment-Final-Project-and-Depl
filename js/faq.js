// FAQ Expand/Collapse (if you want collapsible answers)
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.faq-question').forEach(q => {
        q.style.cursor = 'pointer';
        q.addEventListener('click', function() {
            const answer = this.parentElement.querySelector('.faq-answer');
            if(answer) {
                answer.style.display = (answer.style.display === 'none' || !answer.style.display) ? 'block' : 'none';
            }
        });
        // Initially hide answers except the first
        const answer = q.parentElement.querySelector('.faq-answer');
        if(answer && !q.parentElement.classList.contains('faq-item-first')) {
            answer.style.display = 'none';
        }
    });
});