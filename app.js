// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initMobileMenu();
    initScrollEffects();
    initFormValidation();
    initSmoothScrolling();
    initAnimations();
    initPricingLinks();
    initPriceCalculator();
});

// Mobile Menu Functionality
function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    hamburger.addEventListener('click', function() {
        const isActive = hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // Update ARIA attributes for accessibility
        hamburger.setAttribute('aria-expanded', isActive);
    });

    // Close menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideNav = navMenu.contains(event.target);
        const isClickOnHamburger = hamburger.contains(event.target);
        
        if (!isClickInsideNav && !isClickOnHamburger && navMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    });

    // Handle escape key to close menu
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && navMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.focus();
        }
    });
}

// Scroll Effects
function initScrollEffects() {
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.service-card, .testimonial-card, .about-feature, .stat');
    animateElements.forEach(el => {
        observer.observe(el);
    });
}

// Smooth Scrolling
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Form Validation and Submission
function initFormValidation() {
    const form = document.getElementById('contact-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const serviceSelect = document.getElementById('service');
    const messageTextarea = document.getElementById('message');

    // Real-time validation
    nameInput.addEventListener('blur', function() {
        validateName(this);
    });

    emailInput.addEventListener('blur', function() {
        validateEmail(this);
    });

    phoneInput.addEventListener('blur', function() {
        validatePhone(this);
    });

    serviceSelect.addEventListener('change', function() {
        validateService(this);
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const isValid = validateForm();
        
        if (isValid) {
            submitForm();
        }
    });

    function validateName(input) {
        const value = input.value.trim();
        if (value.length < 2) {
            showError(input, 'Name must be at least 2 characters long');
            return false;
        }
        showSuccess(input);
        return true;
    }

    function validateEmail(input) {
        const value = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(value)) {
            showError(input, 'Please enter a valid email address');
            return false;
        }
        showSuccess(input);
        return true;
    }

    function validatePhone(input) {
        const value = input.value.trim();
        if (value && value.length < 10) {
            showError(input, 'Please enter a valid phone number');
            return false;
        }
        showSuccess(input);
        return true;
    }

    function validateService(input) {
        if (!input.value) {
            showError(input, 'Please select a service');
            return false;
        }
        showSuccess(input);
        return true;
    }

    function validateForm() {
        const nameValid = validateName(nameInput);
        const emailValid = validateEmail(emailInput);
        const phoneValid = validatePhone(phoneInput);
        const serviceValid = validateService(serviceSelect);
        
        return nameValid && emailValid && phoneValid && serviceValid;
    }

    function showError(input, message) {
        const formGroup = input.parentElement;
        const existingError = formGroup.querySelector('.error-message');
        
        if (existingError) {
            existingError.remove();
        }
        
        input.style.borderColor = '#ef4444';
        input.setAttribute('aria-invalid', 'true');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.setAttribute('role', 'alert');
        errorElement.style.color = '#ef4444';
        errorElement.style.fontSize = '0.875rem';
        errorElement.style.marginTop = '0.25rem';
        errorElement.textContent = message;
        
        formGroup.appendChild(errorElement);
    }

    function showSuccess(input) {
        const formGroup = input.parentElement;
        const existingError = formGroup.querySelector('.error-message');
        
        if (existingError) {
            existingError.remove();
        }
        
        input.style.borderColor = '#10b981';
        input.setAttribute('aria-invalid', 'false');
    }

    function submitForm() {
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        // Show loading state
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;
        submitButton.setAttribute('aria-busy', 'true');
        
        // Simulate form submission (replace with actual form handling)
        setTimeout(() => {
            // Show success message
            showSuccessMessage();
            
            // Reset form
            form.reset();
            
            // Reset button
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            submitButton.setAttribute('aria-busy', 'false');
            
            // Reset input styles
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.style.borderColor = '';
                input.removeAttribute('aria-invalid');
            });
        }, 2000);
    }

    function showSuccessMessage() {
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.setAttribute('role', 'alert');
        successMessage.setAttribute('aria-live', 'polite');
        successMessage.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        successMessage.textContent = 'Thank you! We\'ll get back to you soon.';
        
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
            successMessage.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(successMessage);
            }, 300);
        }, 3000);
    }
}

// Animations
function initAnimations() {
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .service-card,
        .testimonial-card,
        .about-feature,
        .stat {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease;
        }
        
        .service-card.animate-in,
        .testimonial-card.animate-in,
        .about-feature.animate-in,
        .stat.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
            .service-card,
            .testimonial-card,
            .about-feature,
            .stat {
                opacity: 1;
                transform: none;
                transition: none;
            }
            
            .service-card.animate-in,
            .testimonial-card.animate-in,
            .about-feature.animate-in,
            .stat.animate-in {
                animation: none;
            }
        }
    `;
    document.head.appendChild(style);
}

// Utility Functions
function debounce(func, wait) {
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

// Performance optimization for scroll events
const debouncedScrollHandler = debounce(function() {
    // Any additional scroll handling can go here
}, 10);

window.addEventListener('scroll', debouncedScrollHandler);

// Preload critical resources
function preloadResources() {
    const criticalImages = [
        // Add any critical images here when you have them
    ];
    
    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
}

// Initialize preloading
preloadResources();

// Pricing Links Functionality
function initPricingLinks() {
    const pricingLinks = document.querySelectorAll('.pricing-link');

    // Define which services are main services vs add-ons
    const mainServices = ['premium-exterior', 'interior-detail', 'sedan-full', 'mid-size-suv-full', 'truck-full', 'suv-full'];
    const addonServices = ['ceramic-coat', 'clay-bar', 'headlight-restoration', 'carpet-shampoo', 'seat-shampoo', 'pet-hair-removal', 'stain-removal'];

    pricingLinks.forEach(link => {
        link.addEventListener('click', function() {
            const serviceValue = this.getAttribute('data-service');

            // Scroll to contact form
            const contactSection = document.getElementById('contact');
            const offsetTop = contactSection.offsetTop - 70; // Account for fixed navbar

            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });

            // Pre-select the service after a short delay to ensure the scroll completes
            setTimeout(() => {
                if (mainServices.includes(serviceValue)) {
                    // Handle main service selection
                    const serviceSelect = document.getElementById('service');
                    if (serviceSelect && serviceValue) {
                        serviceSelect.value = serviceValue;

                        // Trigger change event to run validation and update price calculator
                        const changeEvent = new Event('change', { bubbles: true });
                        serviceSelect.dispatchEvent(changeEvent);

                        // Add visual feedback
                        serviceSelect.style.borderColor = '#10b981';
                        serviceSelect.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';

                        // Remove visual feedback after 2 seconds
                        setTimeout(() => {
                            serviceSelect.style.borderColor = '';
                            serviceSelect.style.boxShadow = '';
                        }, 2000);
                    }
                } else if (addonServices.includes(serviceValue)) {
                    // Handle add-on service selection using the exposed function
                    if (typeof window.selectAddon === 'function') {
                        window.selectAddon(serviceValue);

                        // Add visual feedback to the container
                        const addonsContainer = document.getElementById('addons-multiselect');
                        if (addonsContainer) {
                            addonsContainer.style.borderColor = '#10b981';
                            addonsContainer.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';

                            // Remove visual feedback after 2 seconds
                            setTimeout(() => {
                                addonsContainer.style.borderColor = '';
                                addonsContainer.style.boxShadow = '';
                            }, 2000);
                        }
                    }
                }
            }, 800);
        });
    });
}

// Price Calculator Functionality
function initPriceCalculator() {
    const serviceSelect = document.getElementById('service');
    const addonsContainer = document.getElementById('addons-multiselect');
    const addonsHiddenInput = document.getElementById('addons');
    const mainServicePriceLine = document.querySelector('.main-service-price');
    const addonsPriceLine = document.querySelector('.addons-price');
    const totalPriceLine = document.querySelector('.total-price');

    // Service prices mapping
    const servicePrices = {
        'premium-exterior': 150,
        'interior-detail': 150,
        'sedan-full': 200,
        'mid-size-suv-full': 225,
        'truck-full': 250,
        'suv-full': 275
    };

    // Track selected add-ons
    let selectedAddons = new Set();

    // Initialize custom multi-select behavior
    const multiselectOptions = addonsContainer.querySelectorAll('.multiselect-option');

    multiselectOptions.forEach(option => {
        option.addEventListener('click', function() {
            const value = this.getAttribute('data-value');

            if (this.classList.contains('selected')) {
                // Deselect
                this.classList.remove('selected');
                selectedAddons.delete(value);
            } else {
                // Select
                this.classList.add('selected');
                selectedAddons.add(value);
            }

            // Update hidden input for form submission
            addonsHiddenInput.value = Array.from(selectedAddons).join(',');

            // Update price calculator
            updatePriceCalculator();
        });
    });

    function updatePriceCalculator() {
        let mainServicePrice = 0;
        let addonsPrice = 0;

        // Calculate main service price
        const selectedService = serviceSelect.value;
        if (selectedService && servicePrices[selectedService]) {
            mainServicePrice = servicePrices[selectedService];
            mainServicePriceLine.style.display = 'flex';
            mainServicePriceLine.querySelector('.price-value').textContent = `$${mainServicePrice}`;
        } else {
            mainServicePriceLine.style.display = 'none';
        }

        // Calculate add-ons price
        if (selectedAddons.size > 0) {
            addonsPrice = Array.from(selectedAddons).reduce((total, addonValue) => {
                const option = addonsContainer.querySelector(`[data-value="${addonValue}"]`);
                const price = parseInt(option?.getAttribute('data-price') || 0);
                return total + price;
            }, 0);
            addonsPriceLine.style.display = 'flex';
            addonsPriceLine.querySelector('.price-value').textContent = `$${addonsPrice}`;
        } else {
            addonsPriceLine.style.display = 'none';
        }

        // Calculate and display total
        const total = mainServicePrice + addonsPrice;
        if (total > 0) {
            totalPriceLine.querySelector('.price-value').textContent = `$${total}`;
            totalPriceLine.style.display = 'flex';
        } else {
            totalPriceLine.style.display = 'none';
        }
    }

    // Add event listener for main service
    serviceSelect.addEventListener('change', updatePriceCalculator);

    // Initial calculation
    updatePriceCalculator();

    // Expose function for external use (pricing links)
    window.selectAddon = function(addonValue) {
        const option = addonsContainer.querySelector(`[data-value="${addonValue}"]`);
        if (option && !option.classList.contains('selected')) {
            option.click(); // This will trigger the selection and price update
        }
    };
}
