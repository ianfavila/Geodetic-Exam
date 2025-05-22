// admin-auth.js
// Authentication functionality for the Geodetic Engineering Reviewer Admin Panel

// --- Authentication Functions ---
async function loginToAdmin(event) {
    event.preventDefault();
    const emailInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const email = emailInput.value;
    const password = passwordInput.value;
    const loginButton = document.querySelector('#login-form .login-button');
    const loginError = document.getElementById('login-error');
    
    if (!loginButton || !loginError) { 
        console.error("Login UI elements missing"); 
        return; 
    }

    loginButton.disabled = true;
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    loginError.style.display = 'none';
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('Login successful:', userCredential.user.uid);
        // UI update is handled by onAuthStateChanged listener
    } catch (error) {
        console.error("Login failed:", error);
        loginError.textContent = `Login Failed: ${error.message}`;
        loginError.style.display = 'block';
        loginButton.disabled = false;
        loginButton.innerHTML = 'Login';
    }
}

function logoutFromAdmin() {
    auth.signOut().catch((error) => {
        console.error("Logout failed:", error);
        alert("Logout failed: " + error.message);
    });
}

// --- Auth State Change Listener ---
auth.onAuthStateChanged((user) => {
    const loginContainer = document.getElementById('login-container');
    const adminHeader = document.getElementById('admin-header');
    const adminDashboard = document.getElementById('admin-dashboard');
    const adminUsername = document.getElementById('admin-username');
    const questionTbody = document.getElementById('question-tbody');

    // Ensure elements exist before trying to modify them
    if (!loginContainer || !adminHeader || !adminDashboard || !adminUsername) {
        console.error("Core UI elements missing! Cannot update UI on auth state change.");
        return;
    }

    if (user) {
        console.log("onAuthStateChanged: User signed in", user.uid);
        adminUsername.textContent = user.email || 'Admin';
        adminHeader.style.display = 'block';
        adminDashboard.style.display = 'block';
        loginContainer.style.display = 'none';
        
        // Initialize content for each tab
        loadQuestionsFromFirebase();
        loadFeedbackFromFirebase();
        loadNewsFromFirebase();
        loadProtestsFromFirebase();
    } else {
        console.log("onAuthStateChanged: User signed out");
        adminHeader.style.display = 'none';
        adminDashboard.style.display = 'none';
        loginContainer.style.display = 'block';
        
        if (questionTbody) {
            questionTbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Please login to load questions.</td></tr>';
        }
        
        // Clear login form
        const userField = document.getElementById('username');
        const passField = document.getElementById('password');
        const loginErr = document.getElementById('login-error');
        if (userField) userField.value = '';
        if (passField) passField.value = '';
        if (loginErr) loginErr.style.display = 'none';
        
        // Reset login button
        const loginButton = document.querySelector('#login-form .login-button');
        if(loginButton) {
            loginButton.disabled = false;
            loginButton.innerHTML = 'Login';
        }
    }
});

// --- UI Helper Functions ---
function switchTab(tabId) {
    console.log(`Switching to tab: ${tabId}`);
    try {
        document.querySelectorAll('.tab-nav .tab-item').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab`);
        });
    } catch (e) { 
        console.error("Error switching tabs:", e); 
    }
}

// --- Utility Functions ---
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown date';
    
    let date;
    if (timestamp.toDate) {
        // Firebase Timestamp object
        date = timestamp.toDate();
    } else if (timestamp.seconds) {
        // Firebase Timestamp in seconds
        date = new Date(timestamp.seconds * 1000);
    } else {
        // JavaScript Date or timestamp in milliseconds
        date = new Date(timestamp);
    }
    
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// --- Auth Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    try { 
        const loginForm = document.getElementById('login-form');
        if (loginForm) { 
            loginForm.addEventListener('submit', loginToAdmin); 
            console.log("Login form listener attached."); 
        } else { 
            console.error("Login form element NOT FOUND!"); 
        }
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) { 
            logoutBtn.addEventListener('click', logoutFromAdmin); 
            console.log("Logout button listener attached."); 
        } else { 
            console.error("Logout button element NOT FOUND!"); 
        }

        // --- Tab Listeners ---
        document.querySelectorAll('.tab-nav .tab-item').forEach(tab => { 
            tab.addEventListener('click', () => switchTab(tab.getAttribute('data-tab'))); 
        });
        console.log("Tab listeners attached.");
    } catch (e) { 
        console.error("Error attaching auth listeners:", e); 
    }
});