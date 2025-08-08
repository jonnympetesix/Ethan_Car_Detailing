// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.bookings = [];
        this.filteredBookings = [];
        this.currentBooking = null;
        this.unsubscribe = null;
        this.adminBookingCalendar = null;
        this.currentView = 'table'; // 'table' or 'calendar'

        // Admin password (in production, use proper authentication)
        this.adminPassword = 'Hansen2025';

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.initializeCalendarView();
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

        // View toggle buttons
        document.getElementById('calendar-view-btn').addEventListener('click', () => {
            this.switchToCalendarView();
        });

        document.getElementById('table-view-btn').addEventListener('click', () => {
            this.switchToTableView();
        });

        // Calendar management controls
        document.getElementById('booking-capacity').addEventListener('change', (e) => {
            this.updateBookingCapacity(parseInt(e.target.value));
        });

        document.getElementById('bulk-add-weekdays').addEventListener('click', () => {
            this.bulkAddWeekdays();
        });

        document.getElementById('reset-monday-friday').addEventListener('click', () => {
            console.log('=== RESET BUTTON CLICKED ===');
            alert('Reset button clicked! Check console for details.');
            this.resetToMondayFriday();
        });

        document.getElementById('clear-all-dates').addEventListener('click', () => {
            this.clearAllDates();
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
                this.syncBookedDates();
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
        // Use centralized pricing configuration
        const servicePrices = window.PricingConfig ? window.PricingConfig.services : {
            'premium-exterior': 50,
            'interior-detail': 150,
            'sedan-full': 200,
            'mid-size-suv-full': 225,
            'truck-full': 250,
            'suv-full': 275,
            'custom': 200, // Default estimate
            'quote': 0
        };

        // Use centralized addon pricing configuration
        const addonPrices = window.PricingConfig ? window.PricingConfig.addons : {
            'ceramic-coat': 25,
            'clay-bar': 50,
            'headlight-restoration': 50,
            'carpet-shampoo': 50,
            'seat-shampoo': 50,
            'pet-hair-removal': 50,
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
                const searchableText = `${booking.name} ${booking.email} ${booking.phone} ${booking.address || ''}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) return false;
            }

            return true;
        });

        this.renderBookingsTable();

        // Update calendar view if active
        if (this.currentView === 'calendar' && this.adminBookingCalendar) {
            this.adminBookingCalendar.render();
        }
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
                    <td>
                        <div style="font-size: 12px; color: #718096;">${booking.address || 'null'}</div>
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
        // Use centralized service names if available
        if (window.PricingConfig && window.PricingConfig.getServiceName) {
            return window.PricingConfig.getServiceName(service);
        }

        // Fallback service names
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

    syncBookedDates() {
        // Extract booked dates from appointments and sync with DateAvailabilityConfig
        const bookedDateMap = new Map();

        this.bookings.forEach(booking => {
            if (booking.serviceDate && (booking.status === 'new' || booking.status === 'confirmed' || booking.status === 'in-progress')) {
                if (!bookedDateMap.has(booking.serviceDate)) {
                    bookedDateMap.set(booking.serviceDate, []);
                }

                // Add booking details to the date
                bookedDateMap.get(booking.serviceDate).push({
                    id: booking.id,
                    name: booking.name,
                    email: booking.email,
                    phone: booking.phone,
                    service: booking.service,
                    status: booking.status,
                    timestamp: booking.timestamp
                });
            }
        });

        // Convert map to array format expected by DateAvailabilityConfig
        const bookedDatesArray = Array.from(bookedDateMap.entries()).map(([date, bookings]) => ({
            date: date,
            bookings: bookings
        })).sort((a, b) => a.date.localeCompare(b.date));

        // Update the DateAvailabilityConfig
        if (window.DateAvailabilityConfig) {
            window.DateAvailabilityConfig.setBookedDates(bookedDatesArray);
        }
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
                    <p><strong>Address:</strong> ${booking.address || 'null'}</p>
                    <p><strong>Service Date:</strong> ${booking.serviceDate || 'Not specified'}</p>
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

    // Calendar View Methods
    initializeCalendarView() {
        // Wait for dependencies to be available
        const initCalendar = () => {
            if (!window.CalendarComponent || !window.DateAvailabilityConfig) {
                setTimeout(initCalendar, 100);
                return;
            }

            this.adminBookingCalendar = new CalendarComponent('admin-booking-calendar', {
                selectable: false,
                multiSelect: false,
                showUnavailable: true,
                adminMode: true,
                onDateClick: (dateString) => {
                    this.showBookingDetailsForDate(dateString);
                },
                onAdminDateClick: (dateString) => {
                    this.showDateManagementMenu(dateString);
                }
            });

            // Override the calendar's render method to add booking indicators
            const originalRender = this.adminBookingCalendar.render.bind(this.adminBookingCalendar);
            this.adminBookingCalendar.render = () => {
                originalRender();
                this.addBookingIndicators();
                this.updateCalendarStats();
                this.forceAdminStyling(); // Force styling for admin dates
            };

            // Initial stats update
            this.updateCalendarStats();

            // Set initial booking capacity value
            const currentCapacity = window.DateAvailabilityConfig.getBookingCapacity();
            document.getElementById('booking-capacity').value = currentCapacity;

            // Add backup click handler to calendar container
            const calendarContainer = document.getElementById('admin-booking-calendar');
            if (calendarContainer) {
                calendarContainer.addEventListener('click', (e) => {
                    const dayCell = e.target.closest('.calendar-day');
                    if (dayCell && dayCell.dataset.date && dayCell.classList.contains('admin-clickable')) {
                        console.log('Backup click handler triggered for:', dayCell.dataset.date);
                        this.showDateManagementMenu(dayCell.dataset.date);
                    }
                });
            }
        };

        initCalendar();
    }

    addBookingIndicators() {
        if (!this.adminBookingCalendar || !this.adminBookingCalendar.container) return;

        // Get all calendar day elements
        const dayElements = this.adminBookingCalendar.container.querySelectorAll('.calendar-day');

        dayElements.forEach(dayElement => {
            const dateString = dayElement.dataset.date;
            if (!dateString) return;

            // Find bookings for this date
            const bookingsForDate = this.bookings.filter(booking =>
                booking.serviceDate === dateString &&
                (booking.status === 'confirmed' || booking.status === 'new' || booking.status === 'in-progress')
            );

            if (bookingsForDate.length > 0) {
                dayElement.classList.add('has-booking');

                // Remove existing indicator
                const existingIndicator = dayElement.querySelector('.booking-indicator');
                if (existingIndicator) {
                    existingIndicator.remove();
                }

                // Create booking indicator
                const indicator = document.createElement('div');
                indicator.className = 'booking-indicator';
                indicator.title = `${bookingsForDate.length} booking(s)`;

                // Create tooltip
                const tooltip = document.createElement('div');
                tooltip.className = 'booking-tooltip';
                tooltip.innerHTML = bookingsForDate.map(booking =>
                    `${booking.name} - ${this.formatServiceName(booking.service)}`
                ).join('<br>');

                indicator.appendChild(tooltip);
                dayElement.appendChild(indicator);

                // Add click handler to show booking details
                indicator.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showBookingDetailsForDate(dateString);
                });
            }
        });
    }

    showBookingDetailsForDate(dateString) {
        const bookingsForDate = this.bookings.filter(booking =>
            booking.serviceDate === dateString
        );

        if (bookingsForDate.length === 0) {
            alert('No bookings found for this date.');
            return;
        }

        if (bookingsForDate.length === 1) {
            // Show single booking details
            this.viewBooking(bookingsForDate[0].id);
        } else {
            // Show list of bookings for this date
            const bookingList = bookingsForDate.map(booking =>
                `• ${booking.name} - ${this.formatServiceName(booking.service)} (${booking.status || 'new'})`
            ).join('\n');

            const choice = confirm(`Multiple bookings on ${dateString}:\n\n${bookingList}\n\nClick OK to view the first booking, or Cancel to close.`);
            if (choice) {
                this.viewBooking(bookingsForDate[0].id);
            }
        }
    }

    forceAdminStyling() {
        // Force styling on unavailable dates to make them obviously clickable
        console.log('Forcing admin styling...');

        // Ensure DateAvailabilityConfig is loaded
        if (!window.DateAvailabilityConfig) {
            console.warn('DateAvailabilityConfig not loaded yet, retrying in 100ms...');
            setTimeout(() => this.forceAdminStyling(), 100);
            return;
        }

        const unavailableDates = document.querySelectorAll('#admin-booking-calendar .calendar-day.unavailable.admin-clickable');
        console.log('Forcing styling on', unavailableDates.length, 'unavailable dates');

        unavailableDates.forEach(dateElement => {
            const dateString = dateElement.dataset.date;
            const isBooked = window.DateAvailabilityConfig.isDateBooked(dateString);
            const isWeekend = window.DateAvailabilityConfig.isWeekend(dateString);

            console.log(`Date ${dateString}: isBooked = ${isBooked}, isWeekend = ${isWeekend}`);

            if (isBooked) {
                // Add 'booked' class for CSS styling
                dateElement.classList.add('booked');
                console.log(`Added 'booked' class to ${dateString} (booked)`);
            } else {
                // Remove 'booked' class for CSS styling
                dateElement.classList.remove('booked');
                console.log(`Removed 'booked' class from ${dateString} (unavailable but not booked)`);
            }

            dateElement.style.fontWeight = '900';
            dateElement.style.pointerEvents = 'auto';
            dateElement.style.cursor = 'pointer';
            dateElement.style.opacity = '1';

            // Add hover effect
            dateElement.addEventListener('mouseenter', () => {
                dateElement.style.border = '4px solid #2563eb';
                dateElement.style.background = '#dbeafe';
                dateElement.style.color = '#1e40af';
                dateElement.style.transform = 'scale(1.2)';
                dateElement.style.boxShadow = '0 0 0 3px #93c5fd, 0 8px 16px rgba(37, 99, 235, 0.5)';
                dateElement.style.zIndex = '100';
            });

            dateElement.addEventListener('mouseleave', () => {
                const currentIsBooked = window.DateAvailabilityConfig ? window.DateAvailabilityConfig.isDateBooked(dateString) : false;

                if (currentIsBooked) {
                    // Add 'booked' class for CSS styling
                    dateElement.classList.add('booked');
                } else {
                    // Remove 'booked' class for CSS styling
                    dateElement.classList.remove('booked');
                }

                // Reset hover transforms
                dateElement.style.transform = 'scale(1)';
                dateElement.style.zIndex = '1';
            });
        });
    }

    switchToCalendarView() {
        this.currentView = 'calendar';
        document.getElementById('calendar-view-btn').classList.add('active');
        document.getElementById('table-view-btn').classList.remove('active');
        document.getElementById('calendar-view-container').style.display = 'block';
        document.querySelector('.bookings-section').style.display = 'none';

        // Refresh calendar with current bookings
        if (this.adminBookingCalendar) {
            this.adminBookingCalendar.render();
        }
    }

    switchToTableView() {
        this.currentView = 'table';
        document.getElementById('table-view-btn').classList.add('active');
        document.getElementById('calendar-view-btn').classList.remove('active');
        document.getElementById('calendar-view-container').style.display = 'none';
        document.querySelector('.bookings-section').style.display = 'block';
    }

    // Date Management Methods
    showDateManagementMenu(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const bookingStatus = window.DateAvailabilityConfig.getDateBookingStatus(dateString);
        const bookingsForDate = window.DateAvailabilityConfig.getBookingDetailsForDate(dateString);
        const isWeekend = window.DateAvailabilityConfig.isWeekend(dateString);

        let statusText = '';
        const hasBookings = window.DateAvailabilityConfig.isDateBooked(dateString);

        if (bookingStatus === 'unavailable') {
            statusText = isWeekend ? 'Unavailable (Weekend)' : 'Unavailable';
        } else if (hasBookings) {
            statusText = `Booked (${bookingsForDate.length} booking${bookingsForDate.length > 1 ? 's' : ''})`;
        } else {
            statusText = 'Available';
        }

        const weekendNote = isWeekend ? '\n(Note: This is a weekend date - weekends are unavailable by default)' : '';

        const choice = prompt(
            `Date: ${formattedDate}${weekendNote}\n` +
            `Current Status: ${statusText}\n\n` +
            `Choose an action:\n` +
            `1. Make Available${isWeekend ? ' (Override weekend default)' : ''}\n` +
            `2. Make Unavailable\n` +
            `3. Add Manual Booking\n` +
            `4. View/Edit Bookings\n` +
            `5. Cancel\n\n` +
            `Enter your choice (1-5):`
        );

        switch (choice) {
            case '1':
                this.makeeDateAvailable(dateString);
                break;
            case '2':
                this.makeDateUnavailable(dateString);
                break;
            case '3':
                this.addManualBooking(dateString);
                break;
            case '4':
                this.manageBookingsForDate(dateString);
                break;
            case '5':
            default:
                // Cancel - do nothing
                break;
        }
    }

    makeeDateAvailable(dateString) {
        const availableDates = window.DateAvailabilityConfig.getAvailableDates();
        if (!availableDates.includes(dateString)) {
            availableDates.push(dateString);
            availableDates.sort();
            window.DateAvailabilityConfig.setAvailableDates(availableDates);
        }
        this.refreshCalendarAndStats();
        alert('Date marked as available.');
    }

    makeDateUnavailable(dateString) {
        // Remove from available dates
        const availableDates = window.DateAvailabilityConfig.getAvailableDates();
        const index = availableDates.indexOf(dateString);
        if (index > -1) {
            availableDates.splice(index, 1);
            window.DateAvailabilityConfig.setAvailableDates(availableDates);
        }

        // Also remove any manual bookings for this date
        const bookedDates = window.DateAvailabilityConfig.getBookedDates();
        const dateIndex = bookedDates.findIndex(entry => entry.date === dateString);
        if (dateIndex > -1) {
            bookedDates.splice(dateIndex, 1);
            window.DateAvailabilityConfig.setBookedDates(bookedDates);
        }

        this.refreshCalendarAndStats();
        alert('Date marked as unavailable.');
    }

    addManualBooking(dateString) {
        const bookingsForDate = window.DateAvailabilityConfig.getBookingDetailsForDate(dateString);
        const capacity = window.DateAvailabilityConfig.getBookingCapacity();

        if (bookingsForDate.length >= capacity) {
            alert('This date is already at full capacity.');
            return;
        }

        // Make sure date is available first
        this.makeeDateAvailable(dateString);

        const customerName = prompt('Enter customer name:');
        if (!customerName) return;

        const customerEmail = prompt('Enter customer email (optional):') || '';
        const customerPhone = prompt('Enter customer phone (optional):') || '';
        const service = prompt('Enter service type:') || 'Manual Booking';

        const bookingId = 'manual_' + Date.now();
        const bookingDetails = {
            id: bookingId,
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            service: service,
            status: 'confirmed',
            isManual: true,
            createdAt: new Date().toISOString()
        };

        window.DateAvailabilityConfig.addBookedDate(dateString, bookingDetails);
        this.refreshCalendarAndStats();
        alert('Manual booking added successfully.');
    }

    manageBookingsForDate(dateString) {
        const bookingsForDate = window.DateAvailabilityConfig.getBookingDetailsForDate(dateString);

        if (bookingsForDate.length === 0) {
            alert('No bookings found for this date.');
            return;
        }

        let bookingsList = `Bookings for ${dateString}:\n\n`;
        bookingsForDate.forEach((booking, index) => {
            bookingsList += `${index + 1}. ${booking.name}\n`;
            bookingsList += `   Service: ${booking.service}\n`;
            if (booking.email) bookingsList += `   Email: ${booking.email}\n`;
            if (booking.phone) bookingsList += `   Phone: ${booking.phone}\n`;
            bookingsList += `   Status: ${booking.status || 'new'}\n`;
            if (booking.isManual) bookingsList += `   (Manual Booking)\n`;
            bookingsList += '\n';
        });

        const choice = prompt(
            bookingsList +
            `Choose an action:\n` +
            `1. Remove a booking\n` +
            `2. View details\n` +
            `3. Cancel\n\n` +
            `Enter your choice (1-3):`
        );

        switch (choice) {
            case '1':
                this.removeBookingFromDate(dateString, bookingsForDate);
                break;
            case '2':
                this.showBookingDetailsForDate(dateString);
                break;
            case '3':
            default:
                break;
        }
    }

    removeBookingFromDate(dateString, bookingsForDate) {
        if (bookingsForDate.length === 1) {
            const confirm = window.confirm(`Remove booking for ${bookingsForDate[0].name}?`);
            if (confirm) {
                this.removeBooking(dateString, bookingsForDate[0].id);
            }
        } else {
            let bookingsList = 'Select booking to remove:\n\n';
            bookingsForDate.forEach((booking, index) => {
                bookingsList += `${index + 1}. ${booking.name} - ${booking.service}\n`;
            });

            const choice = prompt(bookingsList + '\nEnter booking number to remove:');
            const bookingIndex = parseInt(choice) - 1;

            if (bookingIndex >= 0 && bookingIndex < bookingsForDate.length) {
                const booking = bookingsForDate[bookingIndex];
                const confirm = window.confirm(`Remove booking for ${booking.name}?`);
                if (confirm) {
                    this.removeBooking(dateString, booking.id);
                }
            }
        }
    }

    removeBooking(dateString, bookingId) {
        const bookedDates = window.DateAvailabilityConfig.getBookedDates();
        const dateEntry = bookedDates.find(entry => entry.date === dateString);

        if (dateEntry) {
            dateEntry.bookings = dateEntry.bookings.filter(booking => booking.id !== bookingId);

            // If no bookings left, remove the date entry
            if (dateEntry.bookings.length === 0) {
                const dateIndex = bookedDates.indexOf(dateEntry);
                bookedDates.splice(dateIndex, 1);
            }

            window.DateAvailabilityConfig.setBookedDates(bookedDates);
            this.refreshCalendarAndStats();
            alert('Booking removed successfully.');
        }
    }

    refreshCalendarAndStats() {
        if (this.adminBookingCalendar) {
            this.adminBookingCalendar.render();
        }
        this.updateCalendarStats();
    }

    updateCalendarStats() {
        const availableDates = window.DateAvailabilityConfig.getAvailableDates();
        const bookedDates = window.DateAvailabilityConfig.getBookedDates();

        let totalBookings = 0;
        let bookedDatesCount = 0;

        bookedDates.forEach(dateEntry => {
            totalBookings += dateEntry.bookings.length;
            // New logic: Any date with bookings is considered "booked"
            if (dateEntry.bookings.length > 0) {
                bookedDatesCount++;
            }
        });

        document.getElementById('available-count').textContent = availableDates.length;
        document.getElementById('booked-count').textContent = bookedDatesCount;
        document.getElementById('total-bookings-count').textContent = totalBookings;
    }

    updateBookingCapacity(capacity) {
        window.DateAvailabilityConfig.setBookingCapacity(capacity);
        this.refreshCalendarAndStats();
        alert(`Booking capacity updated to ${capacity} bookings per day.`);
    }

    bulkAddWeekdays() {
        const availableDates = window.DateAvailabilityConfig.getAvailableDates();
        const today = new Date();
        let addedCount = 0;

        for (let i = 1; i <= 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            // Only add weekdays (Monday = 1, Friday = 5)
            const dayOfWeek = date.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                const dateString = window.DateAvailabilityConfig.formatDate(date);
                if (!availableDates.includes(dateString)) {
                    availableDates.push(dateString);
                    addedCount++;
                }
            }
        }

        availableDates.sort();
        window.DateAvailabilityConfig.setAvailableDates(availableDates);
        this.refreshCalendarAndStats();
        alert(`Added ${addedCount} weekdays to available dates.`);
    }

    resetToMondayFriday() {
        console.log('=== resetToMondayFriday method called ===');
        console.log('DateAvailabilityConfig available:', !!window.DateAvailabilityConfig);

        if (confirm('This will reset all available dates to Monday-Friday for the next 90 days. Any custom date selections will be lost. Continue?')) {
            console.log('User confirmed reset. Starting Monday-Friday reset...');

            if (!window.DateAvailabilityConfig) {
                console.error('DateAvailabilityConfig not available!');
                alert('Error: DateAvailabilityConfig not loaded. Please refresh the page.');
                return;
            }

            const newDates = window.DateAvailabilityConfig.resetToMondayFriday();
            console.log('Reset completed. New dates count:', newDates ? newDates.length : 'undefined');

            // Force a complete calendar refresh for both calendars
            console.log('Forcing calendar refresh...');
            if (this.adminCalendar) {
                console.log('Refreshing admin calendar (Calendar tab)...');
                this.adminCalendar.setSelectedDates(newDates);
                this.adminCalendar.render();
                this.updateSelectedCount();
            }

            if (this.adminBookingCalendar) {
                console.log('Refreshing admin booking calendar (Table tab)...');
                this.adminBookingCalendar.render();
            }

            // Also refresh stats and other components
            this.refreshCalendarAndStats();

            // Force a page reload to ensure everything updates
            setTimeout(() => {
                alert(`Available dates reset to Monday-Friday. ${newDates.length} dates are now available. Page will refresh to show changes.`);
                window.location.reload();
            }, 500);
        }
    }

    clearAllDates() {
        const confirm = window.confirm(
            'This will remove ALL available dates and bookings. Are you sure?\n\n' +
            'This action cannot be undone.'
        );

        if (confirm) {
            window.DateAvailabilityConfig.setAvailableDates([]);
            window.DateAvailabilityConfig.setBookedDates([]);
            this.refreshCalendarAndStats();
            alert('All dates cleared.');
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

// Settings Modal Management
class SettingsManager {
    constructor() {
        this.adminCalendar = null;
        this.initializeEventListeners();
        this.loadSettings();
    }

    initializeEventListeners() {
        // Settings button
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        // Settings modal close buttons
        document.getElementById('settings-modal-close').addEventListener('click', () => {
            this.hideSettingsModal();
        });

        document.getElementById('cancel-settings').addEventListener('click', () => {
            this.hideSettingsModal();
        });

        // Save settings
        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Bulk actions
        document.getElementById('bulk-add-weekdays').addEventListener('click', () => {
            this.addNextWeekdays();
        });

        document.getElementById('clear-all-dates').addEventListener('click', () => {
            this.clearAllDates();
        });

        // Close modal when clicking outside
        document.getElementById('settings-modal').addEventListener('click', (e) => {
            if (e.target.id === 'settings-modal') {
                this.hideSettingsModal();
            }
        });
    }

    showSettingsModal() {
        document.getElementById('settings-modal').style.display = 'flex';

        // Initialize calendar if not already done
        if (!this.adminCalendar) {
            this.initializeAdminCalendar();
        }

        this.updateSelectedCount();
    }

    hideSettingsModal() {
        document.getElementById('settings-modal').style.display = 'none';
    }

    initializeAdminCalendar() {
        this.adminCalendar = new CalendarComponent('admin-calendar', {
            selectable: true,
            multiSelect: true,
            onDateSelect: (dateString) => {
                window.DateAvailabilityConfig.addAvailableDate(dateString);
                this.updateSelectedCount();
            },
            onDateDeselect: (dateString) => {
                window.DateAvailabilityConfig.removeAvailableDate(dateString);
                this.updateSelectedCount();
            }
        });

        // Set initial selection
        const availableDates = window.DateAvailabilityConfig.getAvailableDates();
        this.adminCalendar.setSelectedDates(availableDates);
    }

    updateSelectedCount() {
        const count = window.DateAvailabilityConfig.getAvailableDates().length;
        document.getElementById('selected-count').textContent = count;
    }

    addNextWeekdays() {
        const dates = [];
        const today = new Date();

        for (let i = 1; i <= 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            // Only weekdays
            const dayOfWeek = date.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                dates.push(window.DateAvailabilityConfig.formatDate(date));
            }
        }

        // Add all dates
        const currentDates = window.DateAvailabilityConfig.getAvailableDates();
        const allDates = [...new Set([...currentDates, ...dates])].sort();
        window.DateAvailabilityConfig.setAvailableDates(allDates);

        // Update calendar display
        if (this.adminCalendar) {
            this.adminCalendar.setSelectedDates(allDates);
        }

        this.updateSelectedCount();
    }

    clearAllDates() {
        if (confirm('Are you sure you want to clear all available dates? This will make all dates unavailable for booking.')) {
            window.DateAvailabilityConfig.setAvailableDates([]);

            if (this.adminCalendar) {
                this.adminCalendar.clearSelection();
            }

            this.updateSelectedCount();
        }
    }

    saveSettings() {
        const availableCount = window.DateAvailabilityConfig.getAvailableDates().length;

        if (availableCount === 0) {
            alert('Please select at least one date for service availability.');
            return;
        }

        // Settings are automatically saved when dates are selected/deselected
        alert(`Settings saved! ${availableCount} dates are now available for booking.`);
        this.hideSettingsModal();
    }

    loadSettings() {
        // This method can be used to load any additional settings in the future
    }
}

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});
