// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initMobileMenu();
    initScrollEffects();
    initFormValidation();
    initSmoothScrolling();
    initAnimations();
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
