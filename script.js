// script.js

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("[script.js] DOM fully loaded. Starting Firebase initialization.");

    // --- Firebase Configuration ---
    // Uses the details provided by the user.
    const firebaseConfig = {
        apiKey: "AIzaSyBhHCA9CF_9D_2d-cD7B7S3YlT1NqtF6aI", // Your API Key
        authDomain: "geodetic-online-examination.firebaseapp.com",
        projectId: "geodetic-online-examination",
        storageBucket: "geodetic-online-examination.appspot.com",
        messagingSenderId: "969654297831",
        appId: "1:969654297831:web:2aad20782023935f46ae42",
        measurementId: "G-08N38SCD9S" // Optional
    };

    // --- Initialize Firebase ---
    // Declare Firebase service variables globally or accessible by other scripts
    let db, storage, auth;

    try {
        // Initialize Firebase App if not already done
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log("[script.js Init] Firebase Initialized Successfully");
        } else {
            firebase.app(); // Use existing app
            console.log("[script.js Init] Firebase already initialized.");
        }
    } catch (e) {
        console.error("[script.js Init] Firebase initialization failed:", e);
        // Display error to user non-intrusively
        const errorElement = document.getElementById('firebase-error-message'); // Assume an ID exists for this on various pages
        if (errorElement) {
            errorElement.textContent = "Error initializing the application's backend. Features might be unavailable.";
            errorElement.style.display = 'block';
            errorElement.style.color = 'red'; // Add basic styling
        }
        // Optionally disable critical parts of the UI on all pages if Firebase init fails
        // document.body.innerHTML = '<p style="color: red; padding: 20px;">Critical Error: Application backend failed. Please check console for details.</p>';
        return; // Stop script execution if Firebase fails critically
    }

    // --- Firebase Service References (using Compat syntax) ---
    // Assign the services to the globally accessible variables
    try {
        db = firebase.firestore();      // Firestore Database service
        storage = firebase.storage();     // Firebase Storage service
        auth = firebase.auth();         // Firebase Authentication service
        // const analytics = firebase.analytics(); // Optional: Analytics service
        console.log("[script.js Init] Firebase services obtained.");
    } catch (e) {
        console.error("[script.js Init] Failed to get Firebase services:", e);
        const errorElement = document.getElementById('firebase-error-message');
        if (errorElement) {
            errorElement.textContent = "Error accessing required backend services. Please refresh.";
            errorElement.style.display = 'block';
            errorElement.style.color = 'red'; // Add basic styling
        }
         // Optionally disable critical parts of the UI on all pages if services fail
         // document.body.innerHTML = '<p style="color: red; padding: 20px;">Critical Error: Required backend services failed. Please check console.</p>';
        return; // Stop if essential services fail
    }


    // --- Shared Data Structures ---
    // Defines the available topics for each subject dropdown.
    // Keys must match the 'value' attributes in HTML select options.
    // Used by both exam (for exam generation) and admin (for dropdowns).
    const subjectTopics = {
        'mathematics': [ "Algebra", "Solid Geometry", "Analytical Geometry", "Engineering Economics", "Plane and Spherical Trigonometry", "Differential and Integral Calculus", "Mechanics and Least Squares", "General/ Other Related Topics" ],
        'geodesy': [ "Geodetic Surveying", "Geodetic Astronomy", "Geodetic Triangulation", "Geodetic Leveling", "Gravity Measurement", "Least Squares", "General/ Other Related Topics" ],
        'cartography': [ "Plotting and Mapping of Isolated Surveys", "Plotting and Mapping of Mineral Surveys", "Plotting and Mapping of Cadastral Surveys", "Plotting and Mapping of Hydrographic Surveys", "Plotting and Mapping of Photogrammetric Surveys", "Map Projection", "General/ Other Related Topics" ],
        'Laws, Rules, and Regulations': [ "Public Land Laws and Natural Resources", "Laws on Property", "Land Reform Laws", "Land Registration Laws on Obligation and Contracts", "Professional & Ethical Practice", "Rules & Regulations Governing Land Surveying", "General/ Other Related Topics" ],
        'surveying': [ "Property Surveying", "Isolated, Mineral & Mining Surveys", "Cadastral Land Surveying", "Astronomy", "Route Surveys & Earthworks", "Hydrographic & Topographic Surveying", "Photogrammetry", "Engineering Surveys", "Construction Surveying", "General/ Other Related Topics" ]
    };
     // Expose subjectTopics globally so exam.js and admin.js can access it
    window.subjectTopics = subjectTopics;


    // --- Shared Global State Variables ---
    // These variables are managed by the Auth listener and potentially used by other scripts.
    let isAdminLoggedIn = false;         // Flag indicating if admin is logged in (managed by Auth listener)
    let currentFirebaseUser = null;      // Stores the currently authenticated Firebase user object
     // Expose these globally
    window.isAdminLoggedIn = isAdminLoggedIn;
    window.currentFirebaseUser = currentFirebaseUser;


    // --- Shared DOM Element References ---
    // Get references to frequently used HTML elements present on potentially multiple pages.
    const themeToggleButton = document.getElementById('theme-toggle');
    // Use class selector for year spans (present on index and admin)
    const currentYearSpans = Array.from(document.querySelectorAll('.current-year'));
     // Specific ID for exam page footer (handled separately in exam.js DOM references)
     // const currentYearSpanExam = document.getElementById('currentYearExam');

    // Index Page specific elements (remain here as script.js loads on index)
    const userNameInput = document.getElementById('userName'); // On index.html
    const adminTriggerLink = document.getElementById('admin-trigger-link'); // On index.html
    const subjectLinksContainer = document.getElementById('subject-links'); // On index.html
     // Note: Exam and Admin specific DOM refs are now in exam.js and admin.js


    // --- Shared Utility Functions ---

    /**
     * Gets URL parameters by name. Used by exam.js.
     */
    function getParameterByName(name, url = window.location.href) {
        const params = new URLSearchParams(new URL(url).search);
        return params.get(name);
    }
     // Expose globally
    window.getParameterByName = getParameterByName;


    /**
     * Updates the displayed text for feedback messages.
     * Used by both admin.js (formFeedback, configFeedback) and exam.js (examFeedback, loadingIndicator).
     */
    function showFeedbackMessage(element, message, isError = false) {
        console.log(`[script.js Utility] Feedback message: Target=${element?.id || 'unknown'}, Message='${message}', isError=${isError}`);
        if (!element) {
             console.warn(`[script.js Utility] Feedback element not found. Message: ${message}`);
             return;
        }
        element.textContent = message;
        // Basic styling, adapt with CSS classes if needed
        element.style.color = isError ? 'red' : 'green';
        element.style.display = 'block';
        element.style.marginTop = '10px'; // Add some space above

         // Automatically hide message after 5 seconds unless it's a persistent error on loading
         const isPersistentLoadingError = element.id === 'firebase-error-message' && isError;
         if (!isPersistentLoadingError) {
             setTimeout(() => {
                 // Check if the element still exists before trying to hide
                 if (element && element.textContent === message) { // Only hide if the message hasn't been replaced
                     element.style.display = 'none';
                     element.textContent = ''; // Clear content when hidden
                 }
             }, 5000); // Hide after 5 seconds
         }
    }
     // Expose globally
    window.showFeedbackMessage = showFeedbackMessage;


    /**
     * Capitalizes the first letter of each word and replaces underscores.
     * Used by both exam.js and admin.js.
     */
    function capitalizeFirstLetter(str) {
        if (!str) return '';
        const spacedStr = str.replace(/_/g, ' ');
        return spacedStr.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
     // Expose globally
    window.capitalizeFirstLetter = capitalizeFirstLetter;


     // Note: shuffleArray and formatTime are now in exam.js
     // Note: clearQuestionForm and populateTopicSelect are now in admin.js


    // --- Theme Management (Shared) ---

    /**
     * Applies the specified theme ('light' or 'dark') to the page.
     */
    function applyTheme(theme) {
        const htmlEl = document.documentElement;
        if (theme === 'dark') {
            htmlEl.classList.add('dark');
        } else {
            htmlEl.classList.remove('dark');
        }
        console.log(`[script.js Theme] Applied theme: ${theme}`);

        // Update theme toggle button icons based on the active theme
        if (themeToggleButton) {
            const sunIcon = themeToggleButton.querySelector('.icon-sun');
            const moonIcon = themeToggleButton.querySelector('.icon-moon');
            if (sunIcon && moonIcon) {
                sunIcon.style.display = theme === 'dark' ? 'inline-block' : 'none'; // Use inline-block for display
                moonIcon.style.display = theme === 'dark' ? 'none' : 'inline-block';
                 console.log(`[script.js Theme] Updated theme toggle icon visibility.`);
            } else {
                 console.warn("[script.js Theme] Theme toggle icons (.icon-sun, .icon-moon) not found.");
            }
        }
    }

    /**
     * Toggles the theme between light and dark and saves the preference to localStorage.
     * Triggered by clicking the theme toggle button.
     */
    function toggleTheme() {
        console.log("[script.js Theme] Toggling theme.");
        const htmlEl = document.documentElement;
        const isCurrentlyDark = htmlEl.classList.contains('dark');
        const newTheme = isCurrentlyDark ? 'light' : 'dark';
        applyTheme(newTheme); // Apply the new theme

        // Save the user's preference to localStorage
        try {
            localStorage.setItem('geodeticExamTheme', newTheme);
            console.log(`[script.js Theme] Saved theme preference '${newTheme}' to localStorage.`);
        } catch (e) {
            console.warn("[script.js Theme] Could not save theme preference to localStorage:", e);
        }
    }

    /**
     * Initializes the theme based on saved preference in localStorage or the user's system preference.
     * Adds the click listener to the theme toggle button.
     */
    function initTheme() {
        console.log("[script.js Theme] Initializing theme.");
        let savedTheme = 'light'; // Default theme

        try {
            // Get theme from localStorage, fallback to system preference, then default to 'light'
            savedTheme = localStorage.getItem('geodeticExamTheme') ||
                         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
             console.log(`[script.js Theme] Determined theme: ${savedTheme} (from localStorage or system preference).`);
        } catch (e) {
            console.warn("[script.js Theme] Could not read theme preference from localStorage:", e);
            // Fallback to system preference if localStorage read fails
            savedTheme = (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
             console.log(`[script.js Theme] Using system preference theme: ${savedTheme} (localStorage read failed).`);
        }

        // Apply the determined theme
        applyTheme(savedTheme);

        // Add the click listener to the theme toggle button
        if (themeToggleButton) {
             // Remove any potential inline onclick handlers first
             themeToggleButton.onclick = null;
            themeToggleButton.addEventListener('click', toggleTheme);
            console.log("[script.js Theme] Theme toggle button listener set.");
        } else {
             console.warn("[script.js Theme] Theme toggle button element not found.");
        }
    }


    // --- Firebase Auth State Listener (Shared) ---
    // This listener runs whenever the user's sign-in state changes.
    // It determines the current page and updates the UI visibility accordingly (especially for admin).
    // Relies on globally accessible 'auth', and the exposed functions from exam.js and admin.js.
    if (auth) {
        auth.onAuthStateChanged(user => {
            console.log("[script.js Auth State Changed] Firebase Auth state changed.");
            const pagePath = window.location.pathname;
            // Get the base page name (e.g., index.html, exam.html, admin.html)
            const pageName = pagePath.substring(pagePath.lastIndexOf('/') + 1) || 'index.html'; // Default to index.html if path is '/'

            if (user) { // User is signed in
                console.log("[script.js Auth State Changed] User is signed in:", user.uid);
                currentFirebaseUser = user; // Store the user object
                isAdminLoggedIn = true; // Set admin login flag
                 // Update globally accessible variables
                 window.isAdminLoggedIn = isAdminLoggedIn;
                 window.currentFirebaseUser = currentFirebaseUser;

                // Update UI based on the current page
                if (pageName === 'admin.html') {
                     console.log("[script.js Auth State Changed] On admin.html, showing admin dashboard.");
                     // Check if showAdminDashboard is available (means admin.js loaded)
                     if (typeof window.showAdminDashboard === 'function') {
                          window.showAdminDashboard(); // Call function in admin.js
                     } else {
                          console.error("[script.js Auth State Changed] admin.js not loaded or showAdminDashboard not exposed.");
                          // Fallback UI: Maybe show a message requiring admin.js
                          if (document.getElementById('admin-container')) {
                              document.getElementById('admin-container').innerHTML = '<p style="color: red; padding: 20px;">Error: Admin script failed to load. Please check console.</p>';
                          }
                     }
                }
                // Index page specific: Hide the admin trigger link if logged in (optional logic)
                // if (pageName === 'index.html' && adminTriggerLink) {
                //     adminTriggerLink.style.display = 'none';
                // }

            } else { // User is signed out
                console.log("[script.js Auth State Changed] User is signed out.");
                currentFirebaseUser = null; // Clear the user object
                isAdminLoggedIn = false; // Clear admin login flag
                 // Update globally accessible variables
                 window.isAdminLoggedIn = isAdminLoggedIn;
                 window.currentFirebaseUser = currentFirebaseUser;

                // Update UI based on the current page
                if (pageName === 'admin.html') {
                     console.log("[script.js Auth State Changed] On admin.html, showing admin login.");
                      // Check if showAdminLogin is available (means admin.js loaded)
                     if (typeof window.showAdminLogin === 'function') {
                         window.showAdminLogin(); // Call function in admin.js
                     } else {
                         console.error("[script.js Auth State Changed] admin.js not loaded or showAdminLogin not exposed.");
                         // Fallback UI
                         if (document.getElementById('admin-container')) {
                              document.getElementById('admin-container').innerHTML = '<p style="color: red; padding: 20px;">Error: Admin script failed to load. Please check console.</p>';
                         }
                     }
                    // Clear admin-specific UI elements that rely on login state (e.g., question list)
                    // This is handled inside showAdminLogin in admin.js
                }
                // Index page specific: Ensure admin trigger link is visible if logged out (optional logic)
                // if (pageName === 'index.html' && adminTriggerLink) {
                //     adminTriggerLink.style.display = 'block';
                // }
            }
             console.log("[script.js Auth State Changed] Auth state change processed.");
        });
    } else {
         console.error("[script.js Auth State Changed] Firebase Auth service not available. Auth state listener not attached.");
         // Display a critical error on the page if Auth service is missing
          const errorDisplay = document.getElementById('firebase-error-message') || document.body;
          if (errorDisplay) {
              errorDisplay.innerHTML = '<p style="color: red; padding: 20px;">Critical Error: Authentication service failed to initialize.</p>';
              if(errorDisplay !== document.body) errorDisplay.style.display = 'block';
          }
    }


    // --- App Initialization ---
    /**
     * Main initialization function called after DOM is loaded and Firebase services are available.
     * Determines the current page and calls the relevant page-specific initialization function.
     * Relies on exposed functions from exam.js (initExamPageListenersAndSetup) and admin.js (initAdminPage).
     */
    function initializeApp() {
        console.log("[script.js initializeApp] Initializing App...");

        // Set the current year in footer elements (using class selector)
        const year = new Date().getFullYear();
         if (currentYearSpans && currentYearSpans.length > 0) {
             currentYearSpans.forEach(span => { if (span) span.textContent = year; });
             console.log(`[script.js initializeApp] Set current year (${year}) for elements with class 'current-year'.`);
         } else {
              console.warn("[script.js initializeApp] No elements with class 'current-year' found.");
         }
         // Note: Exam page footer year is handled within exam.js

        // Initialize theme based on saved preference or system setting
        initTheme();


        // Determine the current page and call the appropriate initializer
        const pagePath = window.location.pathname;
        const pageName = pagePath.substring(pagePath.lastIndexOf('/') + 1) || 'index.html'; // Default to index.html

        console.log(`[script.js initializeApp] Current page detected: ${pageName}`);

        if (pageName === 'index.html' || pageName === '') { // Index page initialization
             console.log("[script.js initializeApp] Initializing Index Page specifics.");
             // Index page specific logic remains here

             // Handle user name input saving to session storage
             if (userNameInput) {
                  // Load saved name on load
                  userNameInput.value = sessionStorage.getItem('geodeticUserName') || '';
                  console.log(`[script.js initializeApp] Loaded user name '${userNameInput.value}' from session storage.`);
                  // Save name on input change
                  userNameInput.addEventListener('input', (e) => {
                      try {
                           sessionStorage.setItem('geodeticUserName', e.target.value);
                           console.log(`[script.js initializeApp] Saved user name '${e.target.value}' to session storage.`);
                      } catch (err) {
                           console.warn("[script.js initializeApp] Session storage unavailable. Cannot save user name.", err);
                           // Optionally display a message to the user
                           // showFeedbackMessage(userNameInput.parentElement, "Cannot save user name: Session storage blocked.", true);
                      }
                  });
                  console.log("[script.js initializeApp] User name input listener set.");
             } else {
                  console.warn("[script.js initializeApp] userNameInput element not found on index page.");
             }

             // Hide the admin trigger link initially, Auth listener will control visibility
             if(adminTriggerLink) {
                 adminTriggerLink.style.display = 'none';
                 console.log("[script.js initializeApp] Admin trigger link initially hidden (Auth listener will control).");
             } else {
                  console.warn("[script.js initializeApp] adminTriggerLink element not found on index page.");
             }

             // Add event listeners to subject links on the index page
             if (subjectLinksContainer) {
                  subjectLinksContainer.addEventListener('click', (e) => {
                       const targetLink = e.target.closest('a[data-subject]');
                       if (!targetLink) return; // Not a subject link click

                       const subject = targetLink.dataset.subject;
                       const userName = userNameInput?.value.trim(); // Get current user name

                       if (!userName) {
                            e.preventDefault(); // Stop navigation
                            console.warn("[script.js initializeApp] User name is empty. Preventing navigation.");
                             // Use showFeedbackMessage to prompt the user
                             const nameInputParent = userNameInput?.parentElement || document.body;
                             if (typeof showFeedbackMessage === 'function' && nameInputParent) {
                                  showFeedbackMessage(nameInputParent, "Please enter your name before starting the exam.", true);
                             }
                            // Optionally focus the name input
                            if (userNameInput) userNameInput.focus();

                       } else {
                            // Name is entered, allow navigation. Name is saved by input listener.
                            console.log(`[script.js initializeApp] Navigating to exam for subject: ${subject}`);
                            // Navigation happens naturally via the <a> tag
                       }
                  });
                  console.log("[script.js initializeApp] Subject links container listener set.");
             } else {
                  console.warn("[script.js initializeApp] subjectLinksContainer element not found on index page.");
             }


        } else if (pageName === 'exam.html') { // Exam page initialization
            console.log("[script.js initializeApp] Initializing Exam Page specifics.");
            // Call the initialization function defined and exposed in exam.js
             // This function will handle fetching data, setting up UI, and adding listeners for exam buttons
            if (typeof window.initExamPageListenersAndSetup === 'function') {
                window.initExamPageListenersAndSetup();
            } else {
                console.error("[script.js initializeApp] exam.js not loaded or initExamPageListenersAndSetup not exposed.");
                 // Display a critical error on the exam page
                 if (document.getElementById('exam-container')) {
                      document.getElementById('exam-container').innerHTML = '<p style="color: red; padding: 20px;">Error: Exam script failed to load. Please check console.</p>';
                 }
            }

        } else if (pageName === 'admin.html') { // Admin page initialization
             console.log("[script.js initializeApp] Initializing Admin Page specifics.");
             // Call the initialization function defined and exposed in admin.js
             // This function will set up admin-specific listeners.
             // The UI visibility (login vs dashboard) is controlled by the Auth state listener.
             if (typeof window.initAdminPage === 'function') {
                  window.initAdminPage();
             } else {
                 console.error("[script.js initializeApp] admin.js not loaded or initAdminPage not exposed.");
                  // Display a critical error on the admin page
                  if (document.getElementById('admin-container')) {
                       document.getElementById('admin-container').innerHTML = '<p style="color: red; padding: 20px;">Error: Admin script failed to load. Please check console.</p>';
                  }
             }

        } else {
            // Handle initialization for any other pages (e.g., about, privacy, contact)
            console.log(`[script.js initializeApp] No specific initialization needed for page: ${pageName}`);
            // Ensure theme is initialized on all pages
            // initTheme(); // Already called earlier in initializeApp
             // Set year for footer elements
             // Handled at the start of initializeApp
        }

        console.log("[script.js initializeApp] App Initialization complete.");
    }

    // --- Run Initialization ---
    // Check if essential Firebase services are available before starting the app initialization
    // This check is more robust now that services are assigned to variables after init
    if (db && storage && auth) {
        initializeApp(); // Start the main application logic
    } else {
        console.error("[script.js Init Check] Cannot initialize app - Critical Firebase services failed during initial setup.");
        // Firebase initialization error message should already be displayed by the try/catch blocks above.
        // Ensure no other app logic runs if Firebase is fundamentally broken.
    }


}); // End DOMContentLoaded for script.js