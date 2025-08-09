// Date Availability Configuration
// Bridges Firebase appointments with calendar display
class DateAvailabilityConfig {
    constructor() {
        this.appointments = [];
        this.changeListeners = [];
        this.init();
    }

    init() {
        // Wait for both Firebase and TimeSlotManager to be ready
        const checkDependencies = () => {
            if (window.db && window.TimeSlotManager) {
                this.setupFirebaseListener();
            } else {
                setTimeout(checkDependencies, 100);
            }
        };
        checkDependencies();
    }

    setupFirebaseListener() {
        // Listen to appointments collection
        window.db.collection('appointments')
            .onSnapshot((snapshot) => {
                this.appointments = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    this.appointments.push({
                        id: doc.id,
                        ...data
                    });
                });
                
                // Sync with TimeSlotManager
                this.syncWithTimeSlotManager();
                
                // Notify listeners
                this.notifyListeners();
            });
    }

    syncWithTimeSlotManager() {
        if (!window.TimeSlotManager) return;

        // Get current TimeSlot data
        const timeSlotData = window.TimeSlotManager.getAllData();

        // Clear existing bookings from TimeSlotManager
        Object.keys(timeSlotData).forEach(dateString => {
            if (timeSlotData[dateString]) {
                timeSlotData[dateString].bookedSlots = [];
            }
        });

        // Add bookings from Firebase appointments
        this.appointments.forEach(appointment => {
            if (appointment.serviceDate && appointment.serviceTime &&
                appointment.status !== 'cancelled' && appointment.status !== 'completed') {

                const dateString = appointment.serviceDate;
                // Map service times to slot IDs
                let timeSlotId;
                if (appointment.serviceTime.includes('9:00') || appointment.serviceTime.includes('9-1')) {
                    timeSlotId = 'morning';
                } else if (appointment.serviceTime.includes('1:00') || appointment.serviceTime.includes('1-5')) {
                    timeSlotId = 'afternoon';
                } else {
                    // Fallback for legacy appointments
                    timeSlotId = appointment.serviceTime.includes('8:00') ? 'morning' : 'afternoon';
                }

                // Ensure date exists in timeSlotData
                if (!timeSlotData[dateString]) {
                    // Check if it's a weekday (Monday=1 through Friday=5)
                    const date = new Date(dateString + 'T00:00:00');
                    const dayOfWeek = date.getDay();
                    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

                    timeSlotData[dateString] = {
                        isAvailable: isWeekday,
                        bookedSlots: []
                    };
                }

                // Add booking to time slot
                if (!timeSlotData[dateString].bookedSlots.includes(timeSlotId)) {
                    timeSlotData[dateString].bookedSlots.push(timeSlotId);
                }
            }
        });

        // Update TimeSlotManager
        localStorage.setItem('timeSlotData', JSON.stringify(timeSlotData));
        window.TimeSlotManager.notifyListeners();
    }

    formatDate(date) {
        // Handle both Date objects and date strings
        if (typeof date === 'string') {
            return date; // Already formatted
        }
        if (date && typeof date.toISOString === 'function') {
            return date.toISOString().split('T')[0];
        }
        // Fallback for invalid dates
        console.error('Invalid date passed to formatDate:', date);
        return new Date().toISOString().split('T')[0];
    }

    getDateBookingStatus(date) {
        const dateString = this.formatDate(date);

        // Handle both Date objects and date strings
        let dayOfWeek;
        if (typeof date === 'string') {
            const dateObj = new Date(date + 'T00:00:00');
            dayOfWeek = dateObj.getDay();
        } else if (date && typeof date.getDay === 'function') {
            dayOfWeek = date.getDay();
        } else {
            console.error('Invalid date passed to getDateBookingStatus:', date);
            return 'unavailable';
        }

        // Weekend check (Saturday=6, Sunday=0) - Make unavailable
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return 'unavailable';
        }

        // Only Monday=1 through Friday=5 should be available
        if (dayOfWeek < 1 || dayOfWeek > 5) {
            return 'unavailable';
        }

        // Check TimeSlotManager for availability
        if (window.TimeSlotManager) {
            const dayData = window.TimeSlotManager.getDayData(dateString);
            if (!dayData.isAvailable) {
                return 'unavailable';
            }
            
            const bookedSlots = dayData.bookedSlots.length;
            if (bookedSlots === 0) {
                return 'available';
            } else if (bookedSlots === 1) {
                return 'partial';
            } else {
                return 'booked';
            }
        }

        return 'available';
    }

    isDateBooked(date) {
        const dateString = this.formatDate(date);
        
        // Check if there are any active appointments for this date
        const hasActiveAppointments = this.appointments.some(appointment => 
            appointment.serviceDate === dateString && 
            appointment.status !== 'cancelled' && 
            appointment.status !== 'completed'
        );

        // Also check TimeSlotManager
        if (window.TimeSlotManager) {
            const dayData = window.TimeSlotManager.getDayData(dateString);
            return hasActiveAppointments || dayData.bookedSlots.length >= 2;
        }

        return hasActiveAppointments;
    }

    getAppointmentsForDate(date) {
        const dateString = this.formatDate(date);
        return this.appointments.filter(appointment => 
            appointment.serviceDate === dateString &&
            appointment.status !== 'cancelled' &&
            appointment.status !== 'completed'
        );
    }

    addChangeListener(callback) {
        this.changeListeners.push(callback);
    }

    notifyListeners() {
        this.changeListeners.forEach(callback => callback());
    }

    // Admin methods
    getAllAppointments() {
        return this.appointments;
    }

    getAppointmentsByStatus(status) {
        return this.appointments.filter(appointment =>
            (appointment.status || 'new') === status
        );
    }

    // Compatibility methods for old calendar system
    getAvailableDates() {
        // Generate Monday-Friday dates for next 90 days
        const dates = [];
        const today = new Date();

        for (let i = 1; i <= 90; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            // Include Monday through Friday as available days
            const dayOfWeek = date.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                dates.push(this.formatDate(date));
            }
        }

        return dates;
    }

    getBookedDates() {
        // Return dates that have appointments
        return this.appointments
            .filter(appointment =>
                appointment.serviceDate &&
                appointment.status !== 'cancelled' &&
                appointment.status !== 'completed'
            )
            .map(appointment => appointment.serviceDate);
    }

    isDateAvailable(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        const dayOfWeek = date.getDay();

        // Only Monday-Friday are available
        if (dayOfWeek < 1 || dayOfWeek > 5) {
            return false;
        }

        // Check if date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
            return false;
        }

        // Check TimeSlotManager for availability
        if (window.TimeSlotManager) {
            const dayData = window.TimeSlotManager.getDayData(dateString);
            if (!dayData.isAvailable) {
                return false;
            }

            // Date is available if there are less than 2 booked slots
            return dayData.bookedSlots.length < 2;
        }

        // Fallback: check appointments directly
        const bookingsForDate = this.appointments.filter(appointment =>
            appointment.serviceDate === dateString &&
            appointment.status !== 'cancelled' &&
            appointment.status !== 'completed'
        );

        return bookingsForDate.length < 2;
    }

    parseDate(dateString) {
        return new Date(dateString + 'T00:00:00');
    }

    addBookedDate(dateString) {
        // This method is called when a new booking is made
        // The Firebase listener will automatically update the appointments array
        console.log('Booking added for date:', dateString);
    }

    // Admin-specific methods for compatibility
    isWeekend(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    }

    getBookingDetailsForDate(dateString) {
        return this.appointments.filter(appointment =>
            appointment.serviceDate === dateString &&
            appointment.status !== 'cancelled' &&
            appointment.status !== 'completed'
        );
    }

    getBookingCapacity() {
        // Return 2 for the new dual time slot system
        return 2;
    }

    setAvailableDates(dates) {
        // For admin compatibility - this affects TimeSlotManager
        if (!window.TimeSlotManager) return;

        const timeSlotData = window.TimeSlotManager.getAllData();

        // Clear all existing availability
        Object.keys(timeSlotData).forEach(dateString => {
            timeSlotData[dateString].isAvailable = false;
        });

        // Set specified dates as available
        dates.forEach(dateString => {
            if (!timeSlotData[dateString]) {
                timeSlotData[dateString] = { isAvailable: true, bookedSlots: [] };
            } else {
                timeSlotData[dateString].isAvailable = true;
            }
        });

        // Update storage
        localStorage.setItem('timeSlotData', JSON.stringify(timeSlotData));
        window.TimeSlotManager.notifyListeners();
        this.notifyListeners();
    }

    addAvailableDate(dateString) {
        if (!window.TimeSlotManager) return;

        const timeSlotData = window.TimeSlotManager.getAllData();
        if (!timeSlotData[dateString]) {
            timeSlotData[dateString] = { isAvailable: true, bookedSlots: [] };
        } else {
            timeSlotData[dateString].isAvailable = true;
        }

        localStorage.setItem('timeSlotData', JSON.stringify(timeSlotData));
        window.TimeSlotManager.notifyListeners();
        this.notifyListeners();
    }

    removeAvailableDate(dateString) {
        if (!window.TimeSlotManager) return;

        const timeSlotData = window.TimeSlotManager.getAllData();
        if (timeSlotData[dateString]) {
            timeSlotData[dateString].isAvailable = false;
        }

        localStorage.setItem('timeSlotData', JSON.stringify(timeSlotData));
        window.TimeSlotManager.notifyListeners();
        this.notifyListeners();
    }

    resetToMondayFriday() {
        // Generate Monday-Friday dates for next 90 days
        const dates = this.getAvailableDates();
        this.setAvailableDates(dates);
        return dates;
    }

    // Additional admin methods for compatibility
    setBookedDates(bookedDatesArray) {
        // This method is for compatibility with old admin system
        // In the new system, bookings are managed through Firebase
        console.log('setBookedDates called with:', bookedDatesArray);
        // The Firebase listener will handle actual booking updates
    }

    setBookingCapacity(capacity) {
        // Store booking capacity (though we're using 2 slots system now)
        localStorage.setItem('bookingCapacity', capacity.toString());
        console.log('Booking capacity set to:', capacity);
    }

    addBookedDate(dateString, bookingDetails) {
        // For manual bookings from admin
        // This would need to create a Firebase appointment
        console.log('Manual booking requested for:', dateString, bookingDetails);
        // In a full implementation, this would create a Firebase document
    }

    isDateBooked(dateString) {
        // Check if date has any active appointments
        return this.appointments.some(appointment =>
            appointment.serviceDate === dateString &&
            appointment.status !== 'cancelled' &&
            appointment.status !== 'completed'
        );
    }
}

// Initialize globally
window.DateAvailabilityConfig = new DateAvailabilityConfig();
