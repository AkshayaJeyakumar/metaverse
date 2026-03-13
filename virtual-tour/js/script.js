/**
 * script.js - Virtual Tourist Explorer
 * Handles interactions for the landing and explore pages.
 * This file is optional - most functionality works without JS.
 * You can add smooth scroll, animations, or other enhancements here.
 */

// Add smooth scroll behavior for anchor links (if any)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Optional: Add a subtle fade-in effect for feature cards on landing page
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.feature-card, .tourist-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.animation = `fadeInUp 0.5s ease ${index * 0.1}s forwards`;
    });
});
