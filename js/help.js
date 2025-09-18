// Help Center: Scroll to CTA, highlight support button
document.addEventListener('DOMContentLoaded', () => {
    const ctaBtn = document.querySelector('.cta-btn');
    if(ctaBtn) {
        ctaBtn.addEventListener('click', (e) => {
            // Optional: scroll into view or highlight
            ctaBtn.classList.add('active');
            setTimeout(() => ctaBtn.classList.remove('active'), 600);
        });
    }
    // Optional: Animate icons on hover
    document.querySelectorAll('.help-topic i').forEach(icon => {
        icon.addEventListener('mouseenter', () => icon.style.transform = 'scale(1.2)');
        icon.addEventListener('mouseleave', () => icon.style.transform = '');
    });
});