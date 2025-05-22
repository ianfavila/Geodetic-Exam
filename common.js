/**
 * common.js
 * Contains shared utility functions used across multiple pages,
 * like theme management and setting the current year in the footer.
 * This script does NOT initialize Firebase.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const themeToggleButton = document.getElementById('theme-toggle');
    // Find all elements meant to display the current year (using a common class is better)
    // For now, using the IDs provided in the original script. Add more IDs if needed.
    const currentYearSpans = [
        document.getElementById('currentYear'),      // Used on index.html footer
        document.getElementById('currentYearExam'),  // Potentially used on exam.html footer
        document.getElementById('currentYearAdmin'), // Potentially used on admin.html footer
        // Add IDs from about.html footer if different
        document.querySelector('footer #currentYear') // More generic selector for footers
    ].filter(span => span !== null); // Filter out nulls if elements don't exist on the page

    // --- Theme Management ---
    /**
     * Applies the specified theme ('light' or 'dark') by adding/removing a class from the <html> element.
     * @param {string} theme - The theme to apply ('light' or 'dark').
     */
    function applyTheme(theme) {
        if (theme === 'dark') {
            // Add class to <html> for Tailwind dark mode support
             document.documentElement.classList.add('dark');
        } else {
             document.documentElement.classList.remove('dark');
        }
         // Update toggle button icon visibility (Best handled by Tailwind dark: prefixes in HTML/CSS)
         // This JS logic is a fallback if Tailwind prefixes aren't used for icons
         if (themeToggleButton) {
             const sunIcon = themeToggleButton.querySelector('.icon-sun');
             const moonIcon = themeToggleButton.querySelector('.icon-moon');
             if (sunIcon && moonIcon) {
                 // Assuming default state (light mode) shows moon, hides sun
                 if (theme === 'dark') {
                     // Dark mode: hide moon, show sun
                     moonIcon.style.display = 'none';
                     sunIcon.style.display = 'inline'; // Or 'block' depending on CSS
                 } else {
                     // Light mode: show moon, hide sun
                     moonIcon.style.display = 'inline'; // Or 'block'
                     sunIcon.style.display = 'none';
                 }
             }
         }
    }

    /**
     * Toggles the theme between light and dark and saves the preference to localStorage.
     */
    function toggleTheme() {
        // Check class on <html> element
        const isDarkMode = document.documentElement.classList.contains('dark');
        const newTheme = isDarkMode ? 'light' : 'dark';
        applyTheme(newTheme); // Apply the new theme visually
        try {
            // Save the user's preference
            localStorage.setItem('geodeticExamTheme', newTheme);
            console.log("Theme saved:", newTheme);
        } catch (e) {
            console.warn("Could not save theme preference to localStorage:", e);
        }
    }

    /**
     * Initializes the theme based on localStorage preference or system settings,
     * then applies it and adds the event listener to the theme toggle button.
     */
    function initTheme() {
        let preferredTheme = 'light'; // Default theme
        try {
            // 1. Check localStorage for saved preference
            const savedTheme = localStorage.getItem('geodeticExamTheme');
            if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
                preferredTheme = savedTheme;
                console.log("Theme loaded from localStorage:", preferredTheme);
            } else {
                // 2. If no saved theme, check system preference
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    preferredTheme = 'dark';
                    console.log("Theme preference from system: dark");
                } else {
                    console.log("Theme preference from system: light (or not supported)");
                }
                // Optionally save the detected system preference to localStorage for next time
                // localStorage.setItem('geodeticExamTheme', preferredTheme);
            }
        } catch (e) {
             console.warn("Could not read theme preference from localStorage/system:", e);
             preferredTheme = 'light'; // Fallback safely to light theme
        }

        console.log("Initializing theme as:", preferredTheme);
        applyTheme(preferredTheme); // Apply the determined theme

        // Add listener to the toggle button *after* the initial theme is set
        if (themeToggleButton) {
            themeToggleButton.addEventListener('click', toggleTheme);
        } else {
            // console.warn("Theme toggle button (#theme-toggle) not found on this page.");
        }
    }

    /**
     * Sets the current year in all designated span elements found on the page.
     */
    function setFooterYear() {
        const year = new Date().getFullYear();
        if (currentYearSpans.length > 0) {
            // Update all found year spans
            currentYearSpans.forEach(span => {
                // Check if span is not null again just in case filter missed something
                if(span) span.textContent = year;
            });
        } else {
            // This is not an error, just info if no year elements are on a page
            // console.log("No elements found to display the current year.");
        }
    }

    // --- Run Initialization Functions ---
    setFooterYear(); // Set the year in the footer
    initTheme();     // Set the initial theme and add toggle listener

}); // End DOMContentLoaded
