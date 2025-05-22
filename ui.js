/**
 * Geodetic Engineering Reviewer - UI Utilities
 * 
 * This file contains shared UI functionality used across the application
 */

// UI Constants
const UI = {
    // Colors
    colors: {
        primary: '#2c3e50',
        secondary: '#3498db',
        accent: '#e74c3c',
        success: '#2ecc71',
        warning: '#f39c12',
        danger: '#e74c3c',
        light: '#ecf0f1',
        dark: '#34495e'
    },
    
    // Animation durations
    animation: {
        short: 300,
        medium: 500,
        long: 800
    }
};

/**
 * Show a notification
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, warning, info)
 * @param {number} duration - How long to show the notification in ms
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Check if notification container exists, create if not
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.backgroundColor = 'white';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
    notification.style.padding = '15px 20px';
    notification.style.marginBottom = '10px';
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    notification.style.transition = `all ${UI.animation.short}ms ease-out`;
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.minWidth = '300px';
    
    // Set border color based on type
    let color;
    let icon;
    
    switch (type) {
        case 'success':
            color = UI.colors.success;
            icon = 'check-circle';
            break;
        case 'error':
            color = UI.colors.danger;
            icon = 'times-circle';
            break;
        case 'warning':
            color = UI.colors.warning;
            icon = 'exclamation-triangle';
            break;
        default:
            color = UI.colors.secondary;
            icon = 'info-circle';
    }
    
    notification.style.borderLeft = `4px solid ${color}`;
    
    // Add icon
    notification.innerHTML = `
        <div style="color: ${color}; margin-right: 15px;">
            <i class="fas fa-${icon}" style="font-size: 20px;"></i>
        </div>
        <div style="flex-grow: 1;">
            ${message}
        </div>
        <div class="close-notification" style="cursor: pointer; margin-left: 10px;">
            <i class="fas fa-times" style="color: #aaa;"></i>
        </div>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Add close button event
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', () => {
        closeNotification(notification);
    });
    
    // Auto close after duration
    setTimeout(() => {
        closeNotification(notification);
    }, duration);
}

/**
 * Close a notification with animation
 * @param {HTMLElement} notification - The notification element to close
 */
function closeNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    
    setTimeout(() => {
        notification.remove();
    }, UI.animation.short);
}

/**
 * Show a confirmation dialog
 * @param {string} message - The confirmation message
 * @param {Function} onConfirm - Function to call when confirmed
 * @param {Function} onCancel - Function to call when canceled
 * @param {Object} options - Additional options
 */
function showConfirmDialog(message, onConfirm, onCancel = null, options = {}) {
    const {
        title = 'Confirm',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        confirmButtonClass = 'confirm',
        cancelButtonClass = 'cancel'
    } = options;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '10000';
    overlay.style.opacity = '0';
    overlay.style.transition = `opacity ${UI.animation.short}ms`;
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.style.backgroundColor = 'white';
    dialog.style.borderRadius = '10px';
    dialog.style.padding = '0';
    dialog.style.width = '90%';
    dialog.style.maxWidth = '400px';
    dialog.style.transform = 'translateY(-20px)';
    dialog.style.transition = `transform ${UI.animation.short}ms`;
    dialog.style.overflow = 'hidden';
    
    // Create dialog header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.padding = '15px 20px';
    header.style.borderBottom = '1px solid #eee';
    
    const titleEl = document.createElement('h3');
    titleEl.style.margin = '0';
    titleEl.style.fontSize = '1.3rem';
    titleEl.style.color = UI.colors.primary;
    titleEl.textContent = title;
    
    const closeBtn = document.createElement('button');
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '1.5rem';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = '#aaa';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        if (onCancel) onCancel();
        closeDialog();
    });
    
    header.appendChild(titleEl);
    header.appendChild(closeBtn);
    
    // Create dialog body
    const body = document.createElement('div');
    body.style.padding = '20px';
    body.textContent = message;
    
    // Create dialog footer
    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.justifyContent = 'flex-end';
    footer.style.gap = '10px';
    footer.style.padding = '15px 20px';
    footer.style.borderTop = '1px solid #eee';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = cancelText;
    cancelBtn.style.padding = '8px 15px';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '5px';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.className = `dialog-button ${cancelButtonClass}`;
    
    if (cancelButtonClass === 'cancel') {
        cancelBtn.style.backgroundColor = '#eee';
        cancelBtn.style.color = UI.colors.dark;
    }
    
    cancelBtn.addEventListener('click', () => {
        if (onCancel) onCancel();
        closeDialog();
    });
    
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = confirmText;
    confirmBtn.style.padding = '8px 15px';
    confirmBtn.style.border = 'none';
    confirmBtn.style.borderRadius = '5px';
    confirmBtn.style.cursor = 'pointer';
    confirmBtn.className = `dialog-button ${confirmButtonClass}`;
    
    if (confirmButtonClass === 'confirm') {
        confirmBtn.style.backgroundColor = UI.colors.accent;
        confirmBtn.style.color = 'white';
    }
    
    confirmBtn.addEventListener('click', () => {
        onConfirm();
        closeDialog();
    });
    
    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);
    
    // Add all parts to dialog
    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    
    // Add dialog to overlay
    overlay.appendChild(dialog);
    
    // Add overlay to body
    document.body.appendChild(overlay);
    
    // Animate in
    setTimeout(() => {
        overlay.style.opacity = '1';
        dialog.style.transform = 'translateY(0)';
    }, 10);
    
    // Close dialog function
    function closeDialog() {
        overlay.style.opacity = '0';
        dialog.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            overlay.remove();
        }, UI.animation.short);
    }
}

/**
 * Format time in HH:MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date
 * @param {Date|string} date - Date object or date string
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
function formatDate(date, includeTime = false) {
    const d = new Date(date);
    
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    
    let formatted = `${year}-${month}-${day}`;
    
    if (includeTime) {
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        formatted += ` ${hours}:${minutes}`;
    }
    
    return formatted;
}

/**
 * Toggle element visibility
 * @param {HTMLElement|string} element - Element or element ID
 * @param {boolean} show - Whether to show or hide
 */
function toggleElement(element, show) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    
    if (!el) return;
    
    if (show) {
        el.style.display = '';
    } else {
        el.style.display = 'none';
    }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Get random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Fisher-Yates shuffle for arrays
 * @param {Array} array - Array to shuffle
 * @returns {Array} New shuffled array
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        UI,
        showNotification,
        showConfirmDialog,
        formatTime,
        formatDate,
        toggleElement,
        isValidEmail,
        getRandomInt,
        shuffleArray
    };
}