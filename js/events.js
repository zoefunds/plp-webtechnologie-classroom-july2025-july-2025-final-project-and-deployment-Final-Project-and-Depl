class EventManager {
    constructor() {
        this.currentUser = 'padebiyi136'; // Using the provided user login
        this.events = [];
        this.userRegistrations = [];
        this.init();
    }

    async init() {
        await this.fetchEvents();
        await this.fetchUserRegistrations();
        this.renderEvents();
        this.initializeCalendar();
        this.setupEventListeners();
    }

    async fetchEvents() {
        try {
            const response = await fetch('/api/events');
            this.events = await response.json();
        } catch (error) {
            console.error('Error fetching events:', error);
            this.events = [];
        }
    }

    async fetchUserRegistrations() {
        try {
            const response = await fetch(`/api/users/${this.currentUser}/events`);
            this.userRegistrations = await response.json();
        } catch (error) {
            console.error('Error fetching user registrations:', error);
            this.userRegistrations = [];
        }
    }

    renderEvents() {
        const eventsContainer = document.getElementById('upcomingEvents');
        eventsContainer.innerHTML = this.events.map(event => this.createEventCard(event)).join('');
    }

    createEventCard(event) {
        const isRegistered = this.userRegistrations.some(reg => reg.eventId === event.id);
        return `
            <div class="event-card" data-event-id="${event.id}">
                <img src="${event.imageUrl}" alt="${event.title}" class="event-image">
                <div class="event-details">
                    <div class="event-datetime">${this.formatDateTime(event.datetime)}</div>
                    <h3 class="event-title">${event.title}</h3>
                    <div class="event-speaker">
                        <img src="${event.speaker.avatarUrl}" alt="${event.speaker.name}" class="speaker-avatar">
                        <span>${event.speaker.name}</span>
                    </div>
                    <p>${event.description}</p>
                    <div class="event-actions">
                        ${isRegistered ? 
                            '<button class="registered-btn" disabled>Registered</button>' :
                            `<button class="register-btn" onclick="eventManager.registerForEvent(${event.id})">Register Now</button>`
                        }
                        <button class="add-calendar-btn" onclick="eventManager.addToCalendar(${event.id})">
                            Add to Calendar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    formatDateTime(datetime) {
        return new Date(datetime).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async registerForEvent(eventId) {
        try {
            const response = await fetch('/api/events/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    eventId,
                    userId: this.currentUser
                })
            });

            if (response.ok) {
                await this.fetchUserRegistrations();
                this.renderEvents();
                this.showNotification('Successfully registered for the event!');
            }
        } catch (error) {
            console.error('Error registering for event:', error);
            this.showNotification('Failed to register for the event', 'error');
        }
    }

    showNotification(message, type = 'success') {
        // Implementation of notification system
    }

    initializeCalendar() {
        // Calendar initialization code
    }
}

// Initialize event manager
const eventManager = new EventManager();