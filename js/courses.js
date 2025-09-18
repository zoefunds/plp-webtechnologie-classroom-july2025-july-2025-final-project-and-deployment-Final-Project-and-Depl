class CourseManager {
    constructor() {
        this.currentUser = 'padebiyi136';
        this.currentTime = '2025-08-31 15:24:24';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeFilters();
        this.loadUserProgress();
        this.setupSearchAndSort();
        this.initializeCoursePreviews();
    }

    setupEventListeners() {
        // Filter event listeners
        document.querySelectorAll('.checkbox-label input, .radio-label input').forEach(input => {
            input.addEventListener('change', () => this.filterCourses());
        });

        // Search functionality
        const searchInput = document.querySelector('.search-bar input');
        searchInput.addEventListener('input', debounce(() => this.searchCourses(searchInput.value), 300));

        // Sort functionality
        const sortSelect = document.querySelector('.sort-select');
        sortSelect.addEventListener('change', () => this.sortCourses(sortSelect.value));

        // Course preview hover effects
        document.querySelectorAll('.course-card').forEach(card => {
            card.addEventListener('mouseenter', () => this.showCoursePreview(card));
            card.addEventListener('mouseleave', () => this.hideCoursePreview(card));
        });

        // Enroll button clicks
        document.querySelectorAll('.enroll-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleEnrollment(e));
        });
    }

    async loadUserProgress() {
        try {
            const response = await fetch(`/api/users/${this.currentUser}/progress`);
            const progress = await response.json();
            this.updateProgressUI(progress);
        } catch (error) {
            console.error('Error loading user progress:', error);
        }
    }

    updateProgressUI(progress) {
        // Update progress circle
        const circle = document.querySelector('.progress-circle circle:last-child');
        if (circle) {
            const percentage = progress.overallProgress;
            circle.style.strokeDashoffset = `calc(315 - (315 * ${percentage}) / 100)`;
            document.querySelector('.percentage').textContent = `${percentage}%`;
        }

        // Update course progress bars
        progress.courses.forEach(course => {
            const courseElement = document.querySelector(`[data-course-id="${course.id}"]`);
            if (courseElement) {
                const progressBar = courseElement.querySelector('.progress');
                if (progressBar) {
                    progressBar.style.width = `${course.progress}%`;
                }
            }
        });
    }

    async filterCourses() {
        const filters = this.getActiveFilters();
        try {
            const response = await fetch('/api/courses/filter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });
            const filteredCourses = await response.json();
            this.updateCourseGrid(filteredCourses);
        } catch (error) {
            console.error('Error filtering courses:', error);
        }
    }

    getActiveFilters() {
        const filters = {
            categories: [],
            level: '',
            duration: ''
        };

        // Get selected categories
        document.querySelectorAll('.category-list input:checked').forEach(input => {
            filters.categories.push(input.closest('.checkbox-label').querySelector('span').textContent);
        });

        // Get selected level
        const selectedLevel = document.querySelector('.level-list input:checked');
        if (selectedLevel) {
            filters.level = selectedLevel.closest('.radio-label').querySelector('span').textContent;
        }

        // Get selected duration
        const selectedDuration = document.querySelector('.duration-list input:checked');
        if (selectedDuration) {
            filters.duration = selectedDuration.closest('.radio-label').querySelector('span').textContent;
        }

        return filters;
    }

    async searchCourses(query) {
        try {
            const response = await fetch(`/api/courses/search?q=${encodeURIComponent(query)}`);
            const searchResults = await response.json();
            this.updateCourseGrid(searchResults);
        } catch (error) {
            console.error('Error searching courses:', error);
        }
    }

    async sortCourses(sortBy) {
        try {
            const response = await fetch(`/api/courses/sort?by=${sortBy}`);
            const sortedCourses = await response.json();
            this.updateCourseGrid(sortedCourses);
        } catch (error) {
            console.error('Error sorting courses:', error);
        }
    }

    updateCourseGrid(courses) {
        const grid = document.querySelector('.courses-grid');
        grid.innerHTML = courses.map(course => this.createCourseCard(course)).join('');
        this.initializeCoursePreviews();
    }

    createCourseCard(course) {
        return `
            <article class="course-card ${course.isPremium ? 'premium' : ''}" data-course-id="${course.id}">
                <div class="course-image">
                    <img src="${course.imageUrl}" alt="${course.title}">
                    <span class="level-badge ${course.level.toLowerCase()}">${course.level}</span>
                    ${course.isPremium ? '<span class="premium-badge"><i class="fas fa-crown"></i> Premium</span>' : ''}
                    <div class="course-preview">
                        <i class="fas fa-play-circle"></i>
                        <span>Preview Course</span>
                    </div>
                </div>
                <div class="course-content">
                    <div class="course-tags">
                        ${course.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <h3>${course.title}</h3>
                    <div class="instructor">
                        <img src="${course.instructor.avatar}" alt="${course.instructor.name}">
                        <span>${course.instructor.name}</span>
                    </div>
                    <div class="course-meta">
                        <span><i class="fas fa-book"></i> ${course.modules} Modules</span>
                        <span><i class="fas fa-clock"></i> ${course.duration}</span>
                        <span><i class="fas fa-user-graduate"></i> ${course.students} Students</span>
                    </div>
                    <div class="course-rating">
                        <div class="stars">
                            ${this.generateStars(course.rating)}
                        </div>
                        <span>${course.rating} (${course.reviews} reviews)</span>
                    </div>
                    ${course.progress ? `
                        <div class="course-progress">
                            <div class="progress-bar">
                                <div class="progress" style="width: ${course.progress}%"></div>
                            </div>
                            <span>${course.progress}% Complete</span>
                        </div>
                    ` : `
                        <button class="enroll-btn ${course.isPremium ? 'premium' : ''}">${
                            course.isPremium ? 'Upgrade to Access' : 'Enroll Now'
                        }</button>
                    `}
                </div>
            </article>
        `;
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return `
            ${Array(fullStars).fill('<i class="fas fa-star"></i>').join('')}
            ${hasHalfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
            ${Array(emptyStars).fill('<i class="far fa-star"></i>').join('')}
        `;
    }

    async handleEnrollment(event) {
        const courseId = event.target.closest('.course-card').dataset.courseId;
        const isPremium = event.target.classList.contains('premium');

        if (isPremium) {
            this.showUpgradeModal();
            return;
        }

        try {
            const response = await fetch('/api/courses/enroll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    courseId,
                    userId: this.currentUser
                })
            });

            const result = await response.json();
            if (result.success) {
                this.showEnrollmentSuccess();
                this.loadUserProgress();
            }
        } catch (error) {
            console.error('Error enrolling in course:', error);
        }
    }

    showUpgradeModal() {
        // Implementation of premium upgrade modal
    }

    showEnrollmentSuccess() {
        // Implementation of success notification
    }

    // Utility function for debouncing search
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize course manager
const courseManager = new CourseManager();