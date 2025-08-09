// Time Slot Calendar Component
class TimeSlotCalendar {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            isAdmin: options.isAdmin || false,
            onTimeSlotSelect: options.onTimeSlotSelect || null,
            onDateClick: options.onDateClick || null,
            ...options
        };
        
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedTimeSlot = null;
        
        // Time slots configuration
        this.timeSlots = [
            { id: 'morning', label: '9:00 AM - 1:00 PM', value: '9:00-13:00' },
            { id: 'afternoon', label: '1:00 PM - 5:00 PM', value: '13:00-17:00' }
        ];
        
        this.init();
    }
    
    init() {
        this.container.innerHTML = '';
        this.container.className = 'timeslot-calendar';
        this.createCalendarStructure();
        this.render();
        
        // Listen for availability changes
        if (window.TimeSlotManager) {
            window.TimeSlotManager.addChangeListener(() => {
                this.render();
            });
        }
    }
    
    createCalendarStructure() {
        this.container.innerHTML = `
            <div class="calendar-header">
                <button class="calendar-nav-btn" id="prev-month-${this.container.id}">&lt;</button>
                <h3 class="calendar-title" id="calendar-title-${this.container.id}"></h3>
                <button class="calendar-nav-btn" id="next-month-${this.container.id}">&gt;</button>
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
            <div class="calendar-grid" id="calendar-grid-${this.container.id}"></div>
            <div class="timeslot-selection" id="timeslot-selection-${this.container.id}" style="display: none;">
                <h4>Select Time Slot for <span id="selected-date-display-${this.container.id}"></span></h4>
                <div class="timeslot-buttons" id="timeslot-buttons-${this.container.id}"></div>
                <button class="btn btn-secondary" id="cancel-selection-${this.container.id}">Cancel</button>
            </div>
            <div class="calendar-legend">
                <div class="legend-item">
                    <div class="legend-color available"></div>
                    <span>Available</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color partial"></div>
                    <span>Partially Booked</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color booked"></div>
                    <span>Fully Booked</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color unavailable"></div>
                    <span>Unavailable</span>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById(`prev-month-${this.container.id}`).addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });
        
        document.getElementById(`next-month-${this.container.id}`).addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });
        
        document.getElementById(`cancel-selection-${this.container.id}`).addEventListener('click', () => {
            this.hideTimeSlotSelection();
        });
    }
    
    render() {
        this.renderTitle();
        this.renderGrid();
    }
    
    renderTitle() {
        const title = document.getElementById(`calendar-title-${this.container.id}`);
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        title.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }
    
    renderGrid() {
        const grid = document.getElementById(`calendar-grid-${this.container.id}`);
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
            const dateString = this.formatDate(date);
            
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = day;
            dayCell.dataset.date = dateString;
            
            // Determine day status
            const dayOfWeek = date.getDay();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPast = date < today;
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // Debug logging for first few days
            if (day <= 5) {
                console.log(`Rendering day ${day} (${dateString}): isPast=${isPast}, isWeekend=${isWeekend}, dayOfWeek=${dayOfWeek}`);
            }

            if (isPast) {
                dayCell.classList.add('past');
            } else if (isWeekend) {
                dayCell.classList.add('unavailable');
                if (this.options.isAdmin) {
                    dayCell.classList.add('admin-clickable');
                    dayCell.addEventListener('click', () => this.handleAdminDateClick(dateString));
                }
            } else {
                // Weekday - check availability
                const availability = this.getDateAvailability(dateString);
                dayCell.classList.add(availability.status);

                // Debug logging
                if (dateString === '2025-08-11' || dateString === '2025-08-12') {
                    console.log(`Date ${dateString}: status=${availability.status}, availableSlots=${availability.availableSlots}`);
                }

                if (availability.status !== 'unavailable') {
                    dayCell.classList.add('clickable');
                    dayCell.addEventListener('click', () => this.handleDateClick(dateString));
                }
                
                if (this.options.isAdmin) {
                    dayCell.classList.add('admin-clickable');
                    dayCell.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.handleAdminDateClick(dateString);
                    });
                }
                
                // Add availability indicators
                if (availability.availableSlots < 2) {
                    const indicator = document.createElement('div');
                    indicator.className = 'slot-indicator';
                    indicator.textContent = `${availability.availableSlots}/2`;
                    dayCell.appendChild(indicator);
                }
            }
            
            grid.appendChild(dayCell);
        }
    }
    
    getDateAvailability(dateString) {
        if (!window.TimeSlotManager) {
            return { status: 'available', availableSlots: 2 };
        }
        
        const dayData = window.TimeSlotManager.getDayData(dateString);
        if (!dayData.isAvailable) {
            return { status: 'unavailable', availableSlots: 0 };
        }
        
        const availableSlots = this.timeSlots.filter(slot => 
            !dayData.bookedSlots.includes(slot.id)
        ).length;
        
        if (availableSlots === 0) {
            return { status: 'booked', availableSlots: 0 };
        } else if (availableSlots === 1) {
            return { status: 'partial', availableSlots: 1 };
        } else {
            return { status: 'available', availableSlots: 2 };
        }
    }
    
    handleDateClick(dateString) {
        if (this.options.isAdmin) return;

        // Clear previous selection
        this.container.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });

        // Add selected class to clicked date
        const clickedDay = this.container.querySelector(`[data-date="${dateString}"]`);
        if (clickedDay) {
            clickedDay.classList.add('selected');
        }

        this.selectedDate = dateString;
        this.showTimeSlotSelection(dateString);
    }
    
    handleAdminDateClick(dateString) {
        if (this.options.onDateClick) {
            this.options.onDateClick(dateString);
        }
    }
    
    showTimeSlotSelection(dateString) {
        const selectionDiv = document.getElementById(`timeslot-selection-${this.container.id}`);
        const dateDisplay = document.getElementById(`selected-date-display-${this.container.id}`);
        const buttonsContainer = document.getElementById(`timeslot-buttons-${this.container.id}`);
        
        const date = new Date(dateString + 'T00:00:00');
        dateDisplay.textContent = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        buttonsContainer.innerHTML = '';
        
        const dayData = window.TimeSlotManager ? window.TimeSlotManager.getDayData(dateString) : { bookedSlots: [] };
        
        this.timeSlots.forEach(slot => {
            const button = document.createElement('button');
            button.className = 'btn timeslot-btn';
            button.textContent = slot.label;
            
            if (dayData.bookedSlots.includes(slot.id)) {
                button.classList.add('btn-disabled');
                button.disabled = true;
                button.textContent += ' (Booked)';
            } else {
                button.classList.add('btn-primary');
                button.addEventListener('click', () => {
                    this.selectTimeSlot(dateString, slot);
                });
            }
            
            buttonsContainer.appendChild(button);
        });
        
        selectionDiv.style.display = 'block';
    }
    
    hideTimeSlotSelection() {
        document.getElementById(`timeslot-selection-${this.container.id}`).style.display = 'none';

        // Clear visual selection
        this.container.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });

        this.selectedDate = null;
        this.selectedTimeSlot = null;
    }
    
    selectTimeSlot(dateString, timeSlot) {
        this.selectedTimeSlot = timeSlot;
        
        if (this.options.onTimeSlotSelect) {
            this.options.onTimeSlotSelect(dateString, timeSlot);
        }
        
        this.hideTimeSlotSelection();
    }
    
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    // Public methods
    refresh() {
        this.render();
    }
    
    getSelectedDateTime() {
        return {
            date: this.selectedDate,
            timeSlot: this.selectedTimeSlot
        };
    }
}

// Time Slot Manager - handles data persistence
class TimeSlotManager {
    constructor() {
        this.changeListeners = [];
        this.init();
    }

    init() {
        // Initialize default data if not exists
        if (!localStorage.getItem('timeSlotData')) {
            console.log('TimeSlotManager: Initializing default data...');
            this.resetToDefaults();
        } else {
            console.log('TimeSlotManager: Using existing data');
            const data = JSON.parse(localStorage.getItem('timeSlotData') || '{}');
            console.log('TimeSlotManager: Current data keys:', Object.keys(data).length);
        }
    }

    resetToDefaults() {
        // Generate Monday-Friday availability for next 90 days
        const data = {};
        const today = new Date();

        for (let i = 1; i <= 90; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dayOfWeek = date.getDay();

            // Monday (1) through Friday (5)
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                const dateString = date.toISOString().split('T')[0];
                data[dateString] = {
                    isAvailable: true,
                    bookedSlots: [] // empty = both slots available
                };

                // Debug log for first few dates
                if (i <= 5) {
                    console.log(`Creating available date: ${dateString} (day ${dayOfWeek})`);
                }
            }
        }

        localStorage.setItem('timeSlotData', JSON.stringify(data));
        console.log('TimeSlotManager: Created default data for', Object.keys(data).length, 'weekdays');
        this.notifyListeners();
    }

    getDayData(dateString) {
        const data = JSON.parse(localStorage.getItem('timeSlotData') || '{}');
        const result = data[dateString] || { isAvailable: false, bookedSlots: [] };

        // Debug logging for specific dates
        if (dateString === '2025-08-11' || dateString === '2025-08-12') {
            console.log(`TimeSlotManager.getDayData(${dateString}):`, result);
        }

        return result;
    }

    setDayAvailability(dateString, isAvailable) {
        const data = JSON.parse(localStorage.getItem('timeSlotData') || '{}');
        if (!data[dateString]) {
            data[dateString] = { isAvailable: false, bookedSlots: [] };
        }
        data[dateString].isAvailable = isAvailable;
        localStorage.setItem('timeSlotData', JSON.stringify(data));
        this.notifyListeners();
    }

    bookTimeSlot(dateString, slotId) {
        const data = JSON.parse(localStorage.getItem('timeSlotData') || '{}');
        if (!data[dateString]) {
            data[dateString] = { isAvailable: true, bookedSlots: [] };
        }
        if (!data[dateString].bookedSlots.includes(slotId)) {
            data[dateString].bookedSlots.push(slotId);
        }
        localStorage.setItem('timeSlotData', JSON.stringify(data));
        this.notifyListeners();
    }

    unbookTimeSlot(dateString, slotId) {
        const data = JSON.parse(localStorage.getItem('timeSlotData') || '{}');
        if (data[dateString] && data[dateString].bookedSlots) {
            data[dateString].bookedSlots = data[dateString].bookedSlots.filter(id => id !== slotId);
        }
        localStorage.setItem('timeSlotData', JSON.stringify(data));
        this.notifyListeners();
    }

    addChangeListener(callback) {
        this.changeListeners.push(callback);
    }

    notifyListeners() {
        this.changeListeners.forEach(callback => callback());
    }

    // Admin methods
    getAllData() {
        return JSON.parse(localStorage.getItem('timeSlotData') || '{}');
    }

    clearAllData() {
        localStorage.setItem('timeSlotData', JSON.stringify({}));
        this.notifyListeners();
    }
}

// Make classes available globally
window.TimeSlotCalendar = TimeSlotCalendar;
window.TimeSlotManager = new TimeSlotManager();

// Immediate debug logging
console.log('=== TIMESLOT CALENDAR LOADED ===');
console.log('TimeSlotCalendar available:', !!window.TimeSlotCalendar);
console.log('TimeSlotManager available:', !!window.TimeSlotManager);

// Check if TimeSlotManager has data
setTimeout(() => {
    if (window.TimeSlotManager) {
        const data = window.TimeSlotManager.getAllData();
        console.log('TimeSlotManager initialized with', Object.keys(data).length, 'dates');

        // Show first few available dates
        const availableDates = Object.keys(data).filter(date => data[date].isAvailable).slice(0, 5);
        console.log('First 5 available dates:', availableDates);
    }
}, 500);
