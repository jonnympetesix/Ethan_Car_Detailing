// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.bookings = [];
        this.filteredBookings = [];
        this.currentBooking = null;
        this.unsubscribe = null;
        
        // Admin password (in production, use proper authentication)
        this.adminPassword = 'Hansen2025';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refreshData();
        });

        // Filters
        document.getElementById('status-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('date-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('search-input').addEventListener('input', () => {
            this.applyFilters();
        });

        // Modal controls
        document.getElementById('modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancel-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('save-booking').addEventListener('click', () => {
            this.saveBookingChanges();
        });
    }

    checkAuthStatus() {
        const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
        if (isAuthenticated) {
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    handleLogin() {
        const password = document.getElementById('admin-password').value;
        const errorDiv = document.getElementById('login-error');

        if (password === this.adminPassword) {
            localStorage.setItem('admin_authenticated', 'true');
            this.showDashboard();
            errorDiv.style.display = 'none';
        } else {
            errorDiv.textContent = 'Invalid password. Please try again.';
            errorDiv.style.display = 'block';
            document.getElementById('admin-password').value = '';
        }
    }

    handleLogout() {
        localStorage.removeItem('admin_authenticated');
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.showLogin();
    }

    showLogin() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-dashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        this.setupRealtimeListener();
    }

    setupRealtimeListener() {
        const statusElement = document.getElementById('connection-status');
        const textElement = document.getElementById('connection-text');
        
        statusElement.className = 'status-dot';
        textElement.textContent = 'Connecting...';

        // Set up real-time listener for appointments collection
        this.unsubscribe = window.db.collection('appointments')
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                statusElement.className = 'status-dot connected';
                textElement.textContent = 'Connected - Real-time updates active';
                
                this.bookings = [];
                snapshot.forEach((doc) => {
                    this.bookings.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                this.updateStatistics();
                this.applyFilters();
                this.updateLastUpdated();
            }, (error) => {
                console.error('Error listening to bookings:', error);
                statusElement.className = 'status-dot';
                textElement.textContent = 'Connection error';
            });
    }

    updateStatistics() {
        const total = this.bookings.length;
        const pending = this.bookings.filter(b => b.status === 'new').length;
        const confirmed = this.bookings.filter(b => b.status === 'confirmed').length;

        // Calculate outstanding revenue (exclude completed and cancelled orders)
        let outstandingRevenue = 0;
        this.bookings.forEach(booking => {
            // Only count revenue for orders that are not completed or cancelled
            if (booking.status !== 'cancelled' && booking.status !== 'completed') {
                outstandingRevenue += this.calculateBookingValue(booking);
            }
        });

        document.getElementById('total-bookings').textContent = total;
        document.getElementById('pending-bookings').textContent = pending;
        document.getElementById('confirmed-bookings').textContent = confirmed;
        document.getElementById('outstanding-revenue').textContent = `$${outstandingRevenue.toLocaleString()}`;
    }

    calculateBookingValue(booking) {
        const servicePrices = {
            'premium-exterior': 150,
            'interior-detail': 150,
            'sedan-full': 200,
            'mid-size-suv-full': 225,
            'truck-full': 250,
            'suv-full': 275,
            'custom': 200, // Default estimate
            'quote': 0
        };

        const addonPrices = {
            'ceramic-coat': 25,
            'clay-bar': 50,
            'headlight-restoration': 75,
            'engine-bay': 75,
            'pet-hair': 50,
            'stain-removal': 50
        };

        let total = servicePrices[booking.service] || 0;
        
        if (booking.addons) {
            const addons = booking.addons.split(',');
            addons.forEach(addon => {
                total += addonPrices[addon.trim()] || 0;
            });
        }

        return total;
    }

    applyFilters() {
        const statusFilter = document.getElementById('status-filter').value;
        const dateFilter = document.getElementById('date-filter').value;
        const searchTerm = document.getElementById('search-input').value.toLowerCase();

        this.filteredBookings = this.bookings.filter(booking => {
            // Status filter
            if (statusFilter !== 'all' && booking.status !== statusFilter) {
                return false;
            }

            // Date filter
            if (dateFilter !== 'all') {
                const bookingDate = booking.timestamp?.toDate() || new Date();
                const now = new Date();
                
                switch (dateFilter) {
                    case 'today':
                        if (bookingDate.toDateString() !== now.toDateString()) return false;
                        break;
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        if (bookingDate < weekAgo) return false;
                        break;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        if (bookingDate < monthAgo) return false;
                        break;
                }
            }

            // Search filter
            if (searchTerm) {
                const searchableText = `${booking.name} ${booking.email} ${booking.phone}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) return false;
            }

            return true;
        });

        this.renderBookingsTable();
    }

    renderBookingsTable() {
        const tbody = document.getElementById('bookings-tbody');
        
        if (this.filteredBookings.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="loading-cell">
                        No bookings found matching your criteria.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredBookings.map(booking => {
            const date = booking.timestamp?.toDate() || new Date();
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            return `
                <tr>
                    <td>${formattedDate}</td>
                    <td>
                        <strong>${booking.name}</strong>
                    </td>
                    <td>
                        <div>${booking.email}</div>
                        <div style="color: #718096; font-size: 12px;">${booking.phone || 'No phone'}</div>
                    </td>
                    <td>${this.formatServiceName(booking.service)}</td>
                    <td>${this.formatAddons(booking.addons)}</td>
                    <td>
                        <span class="status-badge status-${booking.status || 'new'}">
                            ${booking.status || 'new'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-small btn-primary" onclick="adminPanel.viewBooking('${booking.id}')">
                            View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    formatServiceName(service) {
        const serviceNames = {
            'premium-exterior': 'Premium Exterior',
            'interior-detail': 'Interior Detail',
            'sedan-full': 'Sedan Full Detail',
            'mid-size-suv-full': 'Mid-Size SUV Full',
            'truck-full': 'Truck Full Detail',
            'suv-full': 'SUV Full Detail',
            'custom': 'Custom Package',
            'quote': 'Custom Quote'
        };
        return serviceNames[service] || service;
    }

    formatAddons(addons) {
        if (!addons) return 'None';
        return addons.split(',').map(addon => addon.trim()).join(', ');
    }

    updateLastUpdated() {
        const now = new Date();
        document.getElementById('last-updated').textContent = 
            `Last updated: ${now.toLocaleTimeString()}`;
    }

    refreshData() {
        // The real-time listener will automatically refresh data
        this.updateLastUpdated();
        
        // Show visual feedback
        const refreshBtn = document.getElementById('refresh-btn');
        const originalText = refreshBtn.textContent;
        refreshBtn.textContent = 'Refreshing...';
        refreshBtn.disabled = true;
        
        setTimeout(() => {
            refreshBtn.textContent = originalText;
            refreshBtn.disabled = false;
        }, 1000);
    }

    viewBooking(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking) return;

        this.currentBooking = booking;
        this.showBookingModal(booking);
    }

    showBookingModal(booking) {
        const modal = document.getElementById('booking-modal');
        const modalBody = document.getElementById('modal-body');
        
        const date = booking.timestamp?.toDate() || new Date();
        const estimatedValue = this.calculateBookingValue(booking);
        
        modalBody.innerHTML = `
            <div class="booking-details">
                <div class="detail-section">
                    <h4>Customer Information</h4>
                    <p><strong>Name:</strong> ${booking.name}</p>
                    <p><strong>Email:</strong> ${booking.email}</p>
                    <p><strong>Phone:</strong> ${booking.phone || 'Not provided'}</p>
                    <p><strong>Submitted:</strong> ${date.toLocaleString()}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Service Details</h4>
                    <p><strong>Main Service:</strong> ${this.formatServiceName(booking.service)}</p>
                    <p><strong>Add-ons:</strong> ${this.formatAddons(booking.addons)}</p>
                    <p><strong>Estimated Value:</strong> $${estimatedValue}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Message</h4>
                    <p>${booking.message || 'No message provided'}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Status</h4>
                    <select id="booking-status" class="form-control">
                        <option value="new" ${booking.status === 'new' ? 'selected' : ''}>New</option>
                        <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="in-progress" ${booking.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
    }

    closeModal() {
        document.getElementById('booking-modal').style.display = 'none';
        this.currentBooking = null;
    }

    async saveBookingChanges() {
        if (!this.currentBooking) return;

        const newStatus = document.getElementById('booking-status').value;
        
        try {
            await window.db.collection('appointments').doc(this.currentBooking.id).update({
                status: newStatus,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.closeModal();
            // Real-time listener will automatically update the display
        } catch (error) {
            console.error('Error updating booking:', error);
            alert('Error updating booking. Please try again.');
        }
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

// Add modal styles
const modalStyles = `
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
}

.modal-header {
    padding: 24px 24px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    margin: 0;
    color: #2d3748;
}

.modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #718096;
}

.modal-body {
    padding: 24px;
}

.modal-footer {
    padding: 0 24px 24px;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.detail-section {
    margin-bottom: 24px;
}

.detail-section h4 {
    color: #2d3748;
    margin-bottom: 12px;
    font-size: 16px;
}

.detail-section p {
    margin-bottom: 8px;
    color: #4a5568;
}

.form-control {
    width: 100%;
    padding: 12px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
}
`;

// Inject modal styles
const styleSheet = document.createElement('style');
styleSheet.textContent = modalStyles;
document.head.appendChild(styleSheet);
