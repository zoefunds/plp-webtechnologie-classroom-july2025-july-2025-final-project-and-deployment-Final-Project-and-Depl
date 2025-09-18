class ResourceManager {
    constructor() {
        this.currentUser = 'padebiyi136';
        this.currentTime = '2025-08-31 15:29:05';
        this.map = null;
        this.facilities = [];
        this.init();
    }

    async init() {
        this.initializeMap();
        await this.loadResources();
        this.setupEventListeners();
        this.initializeFilters();
        this.setupSearchAndSort();
        this.trackResourceViews();
    }

    initializeMap() {
        mapboxgl.accessToken = 'your_mapbox_token';
        this.map = new mapboxgl.Map({
            container: 'facilitiesMap',
            style: 'mapbox://styles/mapbox/light-v10',
            center: [-74.006, 40.7128], // Default to NYC
            zoom: 12
        });

        // Add map controls
        this.map.addControl(new mapboxgl.NavigationControl());
        this.map.addControl(new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true
        }));
    }

    async loadResources() {
        try {
            // Load healthcare facilities
            const facilitiesResponse = await fetch('/api/resources/facilities');
            this.facilities = await facilitiesResponse.json();
            this.renderFacilities();

            // Load emergency contacts
            const emergencyResponse = await fetch('/api/resources/emergency-contacts');
            const emergencyContacts = await emergencyResponse.json();
            this.updateEmergencyContacts(emergencyContacts);

            // Load guidelines
            const guidelinesResponse = await fetch('/api/resources/guidelines');
            const guidelines = await guidelinesResponse.json();
            this.renderGuidelines(guidelines);

            // Load downloads
            const downloadsResponse = await fetch('/api/resources/downloads');
            const downloads = await downloadsResponse.json();
            this.renderDownloads(downloads);

        } catch (error) {
            console.error('Error loading resources:', error);
            this.showErrorNotification('Failed to load resources');
        }
    }

    renderFacilities() {
        // Add markers to map
        this.facilities.forEach(facility => {
            const marker = new mapboxgl.Marker()
                .setLngLat([facility.longitude, facility.latitude])
                .setPopup(new mapboxgl.Popup().setHTML(this.createFacilityPopup(facility)))
                .addTo(this.map);

            // Add facility card to list
            const facilitiesList = document.querySelector('.facilities-list');
            facilitiesList.appendChild(this.createFacilityCard(facility));
        });
    }

    createFacilityPopup(facility) {
        return `
            <div class="facility-popup">
                <h3>${facility.name}</h3>
                <p>${facility.address}</p>
                <p><strong>Phone:</strong> ${facility.phone}</p>
                <p><strong>Services:</strong></p>
                <div class="facility-services">
                    ${facility.services.map(service => 
                        `<span class="service-tag">${service}</span>`
                    ).join('')}
                </div>
            </div>
        `;
    }

    createFacilityCard(facility) {
        const card = document.createElement('div');
        card.className = 'facility-card';
        card.innerHTML = `
            <div class="facility-info">
                <h3>${facility.name}</h3>
                <p><i class="fas fa-map-marker-alt"></i> ${facility.address}</p>
                <p><i class="fas fa-phone"></i> ${facility.phone}</p>
                <div class="facility-services">
                    ${facility.services.map(service => 
                        `<span class="service-tag">${service}</span>`
                    ).join('')}
                </div>
            </div>
            <button class="directions-btn" data-coords="${facility.longitude},${facility.latitude}">
                <i class="fas fa-directions"></i> Get Directions
            </button>
        `;
        return card;
    }

    setupEventListeners() {
        // Download buttons
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDownload(e));
        });

        // Directions buttons
        document.querySelectorAll('.directions-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.getDirections(e));
        });

        // Resource preview
        document.querySelectorAll('.resource-card').forEach(card => {
            card.addEventListener('click', (e) => this.showResourcePreview(e));
        });

        // Modal close button
        document.querySelector('.modal .close-btn').addEventListener('click', 
            () => this.closeModal());
    }

    async handleDownload(event) {
        const resourceId = event.target.dataset.resourceId;
        try {
            const response = await fetch(`/api/resources/${resourceId}/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.currentUser,
                    timestamp: this.currentTime
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = event.target.dataset.filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                this.trackDownload(resourceId);
            }
        } catch (error) {
            console.error('Error downloading resource:', error);
            this.showErrorNotification('Failed to download resource');
        }
    }

    async getDirections(event) {
        const [lng, lat] = event.target.dataset.coords.split(',');
        
        // Get user's current location
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const userLng = position.coords.longitude;
                const userLat = position.coords.latitude;

                // Add route to map
                this.drawRoute(userLng, userLat, lng, lat);
            });
        }
    }

    async drawRoute(startLng, startLat, endLng, endLat) {
        try {
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/` +
                `${startLng},${startLat};${endLng},${endLat}` +
                `?geometries=geojson&access_token=${mapboxgl.accessToken}`
            );
            
            const data = await response.json();
            
            if (this.map.getSource('route')) {
                this.map.removeLayer('route');
                this.map.removeSource('route');
            }

            this.map.addLayer({
                id: 'route',
                type: 'line',
                source: {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: data.routes[0].geometry
                    }
                },
                paint: {
                    'line-color': '#3498db',
                    'line-width': 4
                }
            });
        } catch (error) {
            console.error('Error getting directions:', error);
            this.showErrorNotification('Failed to get directions');
        }
    }

    showResourcePreview(event) {
        const resourceId = event.currentTarget.dataset.resourceId;
        const modal = document.getElementById('resourcePreviewModal');
        const modalContent = modal.querySelector('.modal-body');

        fetch(`/api/resources/${resourceId}`)
            .then(response => response.json())
            .then(resource => {
                modalContent.innerHTML = this.createResourcePreview(resource);
                modal.style.display = 'block';
            })
            .catch(error => {
                console.error('Error loading resource preview:', error);
                this.showErrorNotification('Failed to load resource preview');
            });
    }

    createResourcePreview(resource) {
        return `
            <div class="resource-preview">
                <div class="preview-header">
                    <h3>${resource.title}</h3>
                    <span class="resource-type">${resource.type}</span>
                </div>
                <div class="preview-content">
                    ${this.getPreviewContent(resource)}
                </div>
                <div class="preview-meta">
                    <span><i class="fas fa-calendar"></i> Last updated: ${resource.lastUpdated}</span>
                    <span><i class="fas fa-download"></i> ${resource.downloads} downloads</span>
                </div>
                <div class="preview-actions">
                    <button class="download-btn" data-resource-id="${resource.id}">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="share-btn">
                        <i class="fas fa-share"></i> Share
                    </button>
                </div>
            </div>
        `;
    }

    getPreviewContent(resource) {
        switch (resource.type) {
            case 'pdf':
                return `<iframe src="${resource.previewUrl}" width="100%" height="500px"></iframe>`;
            case 'video':
                return `<video src="${resource.previewUrl}" controls></video>`;
            case 'image':
                return `<img src="${resource.previewUrl}" alt="${resource.title}">`;
            default:
                return `<p>${resource.description}</p>`;
        }
    }

    closeModal() {
        document.getElementById('resourcePreviewModal').style.display = 'none';
    }

    showErrorNotification(message) {
        // Implementation of error notification system
    }

    async trackDownload(resourceId) {
        try {
            await fetch('/api/resources/track-download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    resourceId,
                    userId: this.currentUser,
                    timestamp: this.currentTime
                })
            });
        } catch (error) {
            console.error('Error tracking download:', error);
        }
    }

    async trackResourceViews() {
        // Implement intersection observer for tracking resource views
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const resourceId = entry.target.dataset.resourceId;
                    this.recordResourceView(resourceId);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('[data-resource-id]').forEach(element => {
            observer.observe(element);
        });
    }

    async recordResourceView(resourceId) {
        try {
            await fetch('/api/resources/track-view', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    resourceId,
                    userId: this.currentUser,
                    timestamp: this.currentTime
                })
            });
        } catch (error) {
            console.error('Error tracking resource view:', error);
        }
    }
}

// Initialize resource manager
const resourceManager = new ResourceManager();