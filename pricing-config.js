// Centralized Pricing Configuration
// Edit prices here to update them across the entire website

window.PricingConfig = {
    // Main Service Prices
    services: {
        'premium-exterior': 50,
        'interior-detail': 150,
        'sedan-full': 200,
        'mid-size-suv-full': 225,
        'truck-full': 250,
        'suv-full': 275,
        'custom': 200, // Default estimate for custom packages
        'quote': 0     // Custom quotes have no preset price
    },

    // Add-on Service Prices
    addons: {
        'ceramic-coat': 25,
        'clay-bar': 50,
        'headlight-restoration': 50,
        'carpet-shampoo': 50,
        'seat-shampoo': 50,
        'pet-hair-removal': 50,
        'stain-removal': 50
    },

    // Service Display Names (for admin panel and formatting)
    serviceNames: {
        'premium-exterior': 'Premium Exterior',
        'interior-detail': 'Interior Detail',
        'sedan-full': 'Sedan Full Detail',
        'mid-size-suv-full': 'Mid-Size SUV Full',
        'truck-full': 'Truck Full Detail',
        'suv-full': 'SUV Full Detail',
        'custom': 'Custom Package',
        'quote': 'Custom Quote'
    },

    // Add-on Display Names
    addonNames: {
        'ceramic-coat': 'Ceramic Coat Sealant',
        'clay-bar': 'Clay Bar',
        'headlight-restoration': 'Headlight Restoration',
        'carpet-shampoo': 'Full Carpet Shampoo',
        'seat-shampoo': 'Full Seat Shampoo',
        'pet-hair-removal': 'Excessive Pet Hair Removal',
        'stain-removal': 'Excessive Stain Removal'
    },

    // Helper functions
    getServicePrice: function(serviceKey) {
        return this.services[serviceKey] || 0;
    },

    getAddonPrice: function(addonKey) {
        return this.addons[addonKey] || 0;
    },

    getServiceName: function(serviceKey) {
        return this.serviceNames[serviceKey] || serviceKey;
    },

    getAddonName: function(addonKey) {
        return this.addonNames[addonKey] || addonKey;
    },

    // Format price for display
    formatPrice: function(price) {
        return `$${price}`;
    },

    // Get all service keys
    getServiceKeys: function() {
        return Object.keys(this.services);
    },

    // Get all addon keys
    getAddonKeys: function() {
        return Object.keys(this.addons);
    }
};
