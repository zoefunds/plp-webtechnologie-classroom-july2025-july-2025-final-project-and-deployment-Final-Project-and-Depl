class HealthLearnApp {
    constructor() {
        this.currentUser = 'padebiyi136';
        this.currentTime = '2025-08-31 15:40:02';
        this.init();
    }

    init() {
        this.setupTimeUpdate();
        this.setupNavigation();
        this.setupHeroAnimation();
        this.initializeSliders();
        this.setupEventListeners();
    }

    setupTimeUpdate() {
        const timeElement = document.getElementById('utcTime');
        
        // Update time every second
        setInterval(() => {
            const now = new Date();
            const utcString = now.toISOString().replace('T', ' ').slice(0, 19);
            timeElement.textContent = utcString;
        }, 1000);
    }

    setupNavigation() {
        // Mobile menu toggle
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        
        const nav = document.querySelector('.main-nav .container');
        nav.insertBefore(menuToggle, nav.firstChild);

        menuToggle.addEventListener('click', () => {
            document.querySelector('.nav-links').classList.toggle('active');
        });

        // Dropdown hover effects
        document.querySelectorAll('.nav-item.dropdown').forEach(item => {
            item.addEventListener('mouseenter', () => {
                const dropdown = item.querySelector('.dropdown-menu');
                dropdown.style.display = 'block';
                setTimeout(() => dropdown.style.opacity = '1', 0);
            });

            item.addEventListener('mouseleave', () => {
                const dropdown = item.querySelector('.dropdown-menu');
                dropdown.style.opacity = '0';
                setTimeout(() => dropdown.style.display = 'none', 300);
            });
        });
    }

    setupHeroAnimation() {
        const heroContent = document.querySelector('.hero-content');
        
        // Add initial animation classes
        heroContent.querySelectorAll('*').forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
        });

        // Animate elements sequentially
        setTimeout(() => {
            heroContent.querySelectorAll('*').forEach((element, index) => {
                setTimeout(() => {
                    element.style.transition = 'all 0.5s ease';
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }, 300);
    }

    initializeSliders() {
        // Testimonials slider
        const slider = document.querySelector('.testimonial-slider');
        if (slider) {
            let currentSlide = 0;
            const slides = slider.querySelectorAll('.testimonial-card');
            const totalSlides = slides.length;

            setInterval(() => {
                slides[currentSlide].style.opacity = '0';
                currentSlide = (currentSlide + 1) % totalSlides;
                slides[currentSlide].style.opacity = '1';
            }, 5000);
        }

        // Course preview slider
        this.initializeCoursePreview();
    }

    initializeCoursePreview() {
        document.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showCoursePreview(e.target.closest('.course-card'));
            });
        });
    }

    showCoursePreview(courseCard) {
        const modal = document.createElement('div');
        modal.className = 'course-preview-modal';
        
        const courseData = {
            title: courseCard.querySelector('h3').textContent,
            description: courseCard.querySelector('p').textContent,
            instructor: courseCard.querySelector('.instructor span').textContent,
            image: courseCard.querySelector('.course-image img').src
        };

        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal">&times;</button>
                <div class="preview-header">
                    <img src="${courseData.image}" alt="${courseData.title}">
                </div>
                <div class="preview-body">
                    <h3>${courseData.title}</h3>
                    <p>${courseData.description}</p>
                    <div class="instructor-info">
                        <span>Instructor: ${courseData.instructor}</span>
                    </div>
                    <button class="enroll-btn">Enroll Now</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });
    }

    setupEventListeners() {
        // Handle course enrollment
        document.querySelectorAll('.enroll-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.currentUser) {
                    window.location.href = '/login.html';
                    return;
                }
                this.handleEnrollment(e.target.closest('.course-card'));
            });
        });

        // Handle live event joining
        document.querySelectorAll('.join-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleLiveEventJoin(e.target.closest('.event-card'));
            });
        });

        // Newsletter subscription
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSubscription(e.target);
            });
        }
    }

    async handleEnrollment(courseCard) {
        try {
            const courseId = courseCard.dataset.courseId;
            const response = await fetch('/api/courses/enroll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    courseId,
                    userId: this.currentUser,
                    enrollmentDate: this.currentTime
                })
            });

            if (response.ok) {
                this.showNotification('Successfully enrolled in course!', 'success');
                window.location.href = `/courses/${courseId}/start`;
            } else {
                throw new Error('Enrollment failed');
            }
        } catch (error) {
            this.showNotification('Failed to enroll in course. Please try again.', 'error');
        }
    }

    handleLiveEventJoin(eventCard) {
        const eventId = eventCard.dataset.eventId;
        window.location.href = `/events/${eventId}/live`;
    }

    async handleNewsletterSubscription(form) {
        const email = form.querySelector('input[type="email"]').value;
        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                this.showNotification('Successfully subscribed to newsletter!', 'success');
                form.reset();
            } else {
                throw new Error('Subscription failed');
            }
        } catch (error) {
            this.showNotification('Failed to subscribe. Please try again.', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the application
const app = new HealthLearnApp();