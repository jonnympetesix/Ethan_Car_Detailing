// Visual Calendar Component
class CalendarComponent {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            selectable: options.selectable || false,
            multiSelect: options.multiSelect || false,
            showUnavailable: options.showUnavailable !== false,
            onDateSelect: options.onDateSelect || null,
            onDateDeselect: options.onDateDeselect || null,
            onBookingClick: options.onBookingClick || null,
            minDate: options.minDate || new Date(),
            maxMonthsAhead: options.maxMonthsAhead || 6,
            ...options
        };
        
        this.currentDate = new Date();
        this.selectedDates = new Set();
        
        this.init();
    }
    
    init() {
        this.container.innerHTML = '';
        this.container.className = 'calendar-component';

        // Add customer-calendar class if this is for customer use
        if (this.container.id === 'customer-calendar') {
            this.container.classList.add('customer-calendar');
        } else if (this.container.id === 'admin-calendar') {
            this.container.classList.add('admin-calendar');
        }

        this.createCalendarStructure();
        this.render();

        // Listen for availability changes
        window.DateAvailabilityConfig.addChangeListener(() => {
            this.render();
        });
    }
    
    createCalendarStructure() {
        this.container.innerHTML = `
            <div class="calendar-header">
                <button class="calendar-nav-btn" id="prev-month">&lt;</button>
                <h3 class="calendar-title" id="calendar-title"></h3>
                <button class="calendar-nav-btn" id="next-month">&gt;</button>
            </div>
            <div class="calendar-weekdays">
                <div class="calendar-weekday">Sun</div>
                <div class="calendar-weekday">Mon</div>
                <div class="calendar-weekday">Tue</div>
                <div class="calendar-weekday">Wed</div>
                <div class="calendar-weekday">Thu</div>
                <div class="calendar-weekday">Fri</div>
                <div class="calendar-weekday">Sat</div>
            </div>
            <div class="calendar-grid" id="calendar-grid"></div>
            <div class="calendar-legend">
                <div class="legend-item">
                    <div class="legend-color available"></div>
                    <span>Available</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color booked"></div>
                    <span>Booked</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color unavailable"></div>
                    <span>Unavailable</span>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });
        
        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });
    }
    
    render() {
        this.renderTitle();
        this.renderGrid();
    }
    
    renderTitle() {
        const title = document.getElementById('calendar-title');
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        title.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }
    
    renderGrid() {
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            grid.appendChild(emptyCell);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = window.DateAvailabilityConfig.formatDate(date);
            
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = day;
            dayCell.dataset.date = dateString;
            
            // Determine day status
            const bookingStatus = window.DateAvailabilityConfig.getDateBookingStatus(date);
            const hasBookings = window.DateAvailabilityConfig.isDateBooked(date);
            const isPast = date < this.options.minDate;
            const isSelected = this.selectedDates.has(dateString);

            // Debug logging for specific dates


            // Add appropriate classes based on priority
            if (isPast) {
                dayCell.classList.add('past');
            } else {
                // New logic: If date has any bookings, show as booked (red)
                if (hasBookings) {
                    dayCell.classList.add('booked');
                } else {
                    switch (bookingStatus) {
                        case 'available':
                            dayCell.classList.add('available');
                            break;
                        case 'unavailable':
                        default:
                            dayCell.classList.add('unavailable');
                            break;
                    }

                }
            }

            if (isSelected) {
                dayCell.classList.add('selected');
            }

            // Add click handler if selectable and can accept bookings
            // New logic: Only allow booking if date has no bookings and is available
            const canAcceptBookings = !hasBookings && bookingStatus === 'available';
            if (this.options.selectable && !isPast && canAcceptBookings) {
                dayCell.classList.add('selectable');
                dayCell.addEventListener('click', () => {
                    this.handleDateClick(dateString, dayCell);
                });
            }

            // Add admin click handler for availability management (all dates except past)
            if (this.options.adminMode && !isPast) {
                dayCell.classList.add('admin-clickable');
                dayCell.addEventListener('click', (e) => {
                    // Prevent the regular date click if this is admin mode
                    e.stopPropagation();
                    e.preventDefault();
                    this.handleAdminDateClick(dateString, dayCell);
                });

                // Also add a visual indicator that it's clickable
                dayCell.title = `Admin: Click to manage ${dateString}`;
            }
            
            grid.appendChild(dayCell);
        }
    }
    
    handleDateClick(dateString, dayCell) {
        if (this.selectedDates.has(dateString)) {
            // Deselect
            this.selectedDates.delete(dateString);
            dayCell.classList.remove('selected');
            
            if (this.options.onDateDeselect) {
                this.options.onDateDeselect(dateString);
            }
        } else {
            // Select
            if (!this.options.multiSelect) {
                // Clear previous selections
                this.selectedDates.clear();
                this.container.querySelectorAll('.calendar-day.selected').forEach(cell => {
                    cell.classList.remove('selected');
                });
            }
            
            this.selectedDates.add(dateString);
            dayCell.classList.add('selected');
            
            if (this.options.onDateSelect) {
                this.options.onDateSelect(dateString);
            }
        }
    }
    
    // Public methods
    getSelectedDates() {
        return Array.from(this.selectedDates);
    }
    
    setSelectedDates(dates) {
        this.selectedDates = new Set(dates);
        this.render();
    }
    
    clearSelection() {
        this.selectedDates.clear();
        this.render();
    }
    
    goToDate(date) {
        this.currentDate = new Date(date);
        this.render();
    }

    handleAdminDateClick(dateString, dayCell) {
        console.log('handleAdminDateClick called for:', dateString);
        if (this.options.onAdminDateClick) {
            console.log('Calling onAdminDateClick callback');
            this.options.onAdminDateClick(dateString, dayCell);
        } else {
            console.log('No onAdminDateClick callback found');
        }
    }
}

// Make CalendarComponent available globally
window.CalendarComponent = CalendarComponent;
