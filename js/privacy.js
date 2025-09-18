document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.legal-header nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    target.setAttribute('tabindex', '-1');
                    target.focus();
                }
            }
        });
    });
});