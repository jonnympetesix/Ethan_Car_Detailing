// Date Availability Configuration - Manages specific dates instead of days of week
window.DateAvailabilityConfig = {
    // Storage keys
    AVAILABLE_DATES_KEY: 'availableDates',
    BOOKED_DATES_KEY: 'bookedDates',
    BOOKING_CAPACITY_KEY: 'bookingCapacity',

    // Default booking capacity per day
    DEFAULT_CAPACITY: 1,

    // Get available dates (array of date strings in YYYY-MM-DD format)
    getAvailableDates() {
        const stored = localStorage.getItem(this.AVAILABLE_DATES_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Error parsing stored available dates:', e);
            }
        }
        return this.generateDefaultAvailableDates();
    },

    // Generate default available dates (next 90 days, weekdays only)
    // Weekends (Saturdays and Sundays) are excluded from available dates by default
    // but will appear as grey/unavailable dates that admins can edit
    generateDefaultAvailableDates() {
        const dates = [];
        const today = new Date();

        for (let i = 1; i <= 90; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            // Only include weekdays by default (Saturdays and Sundays excluded)
            const dayOfWeek = date.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                dates.push(this.formatDate(date));
            }
            // Weekends (dayOfWeek === 0 for Sunday, dayOfWeek === 6 for Saturday)
            // are intentionally excluded so they appear as unavailable/grey
        }

        // No sample bookings - dates should only appear booked when there are real appointments

        return dates;
    },

    // Clear any existing sample data (call this once to clean up)
    clearSampleData() {
        const bookedDates = this.getBookedDates();
        const cleanedBookedDates = bookedDates.filter(entry => {
            // Remove sample bookings
            entry.bookings = entry.bookings.filter(booking =>
                !booking.id.startsWith('sample')
            );
            // Keep the entry only if it still has bookings
            return entry.bookings.length > 0;
        });
        this.setBookedDates(cleanedBookedDates);
    },



    // Set available dates
    setAvailableDates(dates) {
        localStorage.setItem(this.AVAILABLE_DATES_KEY, JSON.stringify(dates));
        this.notifyChange();
    },

    // Add a date to available dates
    addAvailableDate(dateString) {
        const dates = this.getAvailableDates();
        if (!dates.includes(dateString)) {
            dates.push(dateString);
            dates.sort();
            this.setAvailableDates(dates);
        }
    },

    // Remove a date from available dates
    removeAvailableDate(dateString) {
        const dates = this.getAvailableDates();
        const index = dates.indexOf(dateString);
        if (index > -1) {
            dates.splice(index, 1);
            this.setAvailableDates(dates);
        }
    },

    // Get booked dates (now returns objects with booking details)
    getBookedDates() {
        const stored = localStorage.getItem(this.BOOKED_DATES_KEY);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                // Handle legacy format (array of strings) and convert to new format
                if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
                    return data.map(dateString => ({ date: dateString, bookings: [] }));
                }
                return data || [];
            } catch (e) {
                console.error('Error parsing stored booked dates:', e);
            }
        }
        return [];
    },

    // Set booked dates with booking details
    setBookedDates(dateBookings) {
        localStorage.setItem(this.BOOKED_DATES_KEY, JSON.stringify(dateBookings));
        this.notifyChange();
    },

    // Add a booked date with booking details
    addBookedDate(dateString, bookingDetails = null) {
        const dateBookings = this.getBookedDates();
        let dateEntry = dateBookings.find(entry => entry.date === dateString);

        if (!dateEntry) {
            dateEntry = { date: dateString, bookings: [] };
            dateBookings.push(dateEntry);
        }

        if (bookingDetails && !dateEntry.bookings.find(b => b.id === bookingDetails.id)) {
            dateEntry.bookings.push(bookingDetails);
        }

        dateBookings.sort((a, b) => a.date.localeCompare(b.date));
        this.setBookedDates(dateBookings);
    },

    // Get booking details for a specific date
    getBookingDetailsForDate(dateString) {
        const dateBookings = this.getBookedDates();
        const dateEntry = dateBookings.find(entry => entry.date === dateString);
        return dateEntry ? dateEntry.bookings : [];
    },

    // Get booking capacity per day
    getBookingCapacity() {
        const stored = localStorage.getItem(this.BOOKING_CAPACITY_KEY);
        return stored ? parseInt(stored) : this.DEFAULT_CAPACITY;
    },

    // Set booking capacity per day
    setBookingCapacity(capacity) {
        localStorage.setItem(this.BOOKING_CAPACITY_KEY, capacity.toString());
        this.notifyChange();
    },

    // Check if a date is available for booking (has space for more bookings)
    isDateAvailable(date) {
        const dateString = typeof date === 'string' ? date : this.formatDate(date);
        const availableDates = this.getAvailableDates();

        if (!availableDates.includes(dateString)) {
            return false;
        }

        const bookingsForDate = this.getBookingDetailsForDate(dateString);
        const capacity = this.getBookingCapacity();

        return bookingsForDate.length < capacity;
    },

    // Check if a date is in the available dates list (regardless of booking status)
    isDateInAvailableList(date) {
        const dateString = typeof date === 'string' ? date : this.formatDate(date);
        return this.getAvailableDates().includes(dateString);
    },

    // Check if a date is booked (has any bookings)
    isDateBooked(date) {
        const dateString = typeof date === 'string' ? date : this.formatDate(date);
        const dateBookings = this.getBookedDates();
        return dateBookings.some(entry => entry.date === dateString && entry.bookings.length > 0);
    },

    // Check if a date is fully booked (at capacity)
    isDateFullyBooked(date) {
        const dateString = typeof date === 'string' ? date : this.formatDate(date);
        const bookingsForDate = this.getBookingDetailsForDate(dateString);
        const capacity = this.getBookingCapacity();

        return bookingsForDate.length >= capacity;
    },

    // Check if a date is partially booked (has bookings but not at capacity)
    isDatePartiallyBooked(date) {
        const dateString = typeof date === 'string' ? date : this.formatDate(date);
        const bookingsForDate = this.getBookingDetailsForDate(dateString);
        const capacity = this.getBookingCapacity();

        return bookingsForDate.length > 0 && bookingsForDate.length < capacity;
    },

    // Get booking status for a date
    getDateBookingStatus(date) {
        const dateString = typeof date === 'string' ? date : this.formatDate(date);
        const availableDates = this.getAvailableDates();

        if (!availableDates.includes(dateString)) {
            return 'unavailable';
        }

        const bookingsForDate = this.getBookingDetailsForDate(dateString);
        const capacity = this.getBookingCapacity();

        if (bookingsForDate.length === 0) {
            return 'available';
        } else if (bookingsForDate.length < capacity) {
            return 'partial';
        } else {
            return 'full';
        }
    },

    // Format date to YYYY-MM-DD string
    formatDate(date) {
        return date.toISOString().split('T')[0];
    },

    // Parse date string to Date object
    parseDate(dateString) {
        return new Date(dateString + 'T00:00:00');
    },

    // Check if a date is a weekend (Saturday or Sunday)
    isWeekend(date) {
        const dateObj = typeof date === 'string' ? this.parseDate(date) : date;
        const dayOfWeek = dateObj.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
    },

    // Get dates that are available for booking (available and not fully booked)
    getBookableDates() {
        const available = this.getAvailableDates();
        return available.filter(date => !this.isDateFullyBooked(date));
    },

    // Notify change listeners
    changeListeners: [],

    addChangeListener(callback) {
        this.changeListeners.push(callback);
    },

    removeChangeListener(callback) {
        const index = this.changeListeners.indexOf(callback);
        if (index > -1) {
            this.changeListeners.splice(index, 1);
        }
    },

    notifyChange() {
        this.changeListeners.forEach(callback => {
            try {
                callback();
            } catch (e) {
                console.error('Error in date availability change listener:', e);
            }
        });
    },

    // Reset available dates to Monday-Friday (clears existing localStorage)
    resetToMondayFriday() {
        localStorage.removeItem(this.AVAILABLE_DATES_KEY);
        const newDates = this.generateDefaultAvailableDates();
        this.setAvailableDates(newDates);
        console.log('Available dates reset to Monday-Friday:', newDates.length, 'dates');
        return newDates;
    },

    // Initialize and clean up any sample data
    init() {
        this.clearSampleData();
    }
};

// Auto-initialize when the script loads
window.DateAvailabilityConfig.init();
