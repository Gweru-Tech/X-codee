// X-Coder Platform Frontend JavaScript

// Global Variables
let currentUser = null;
let notifications = [];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check authentication status
    checkAuthStatus();
    
    // Initialize tooltips
    initializeTooltips();
    
    // Initialize modals
    initializeModals();
    
    // Initialize file uploads
    initializeFileUploads();
    
    // Initialize charts
    initializeCharts();
    
    // Initialize real-time updates
    initializeRealTimeUpdates();
}

// Authentication Functions
async function checkAuthStatus() {
    try {
        const response = await fetch('/auth/status');
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data.user;
            updateUIForAuthenticatedUser();
        } else {
            updateUIForUnauthenticatedUser();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        updateUIForUnauthenticatedUser();
    }
}

function updateUIForAuthenticatedUser() {
    // Show user-specific elements
    const userElements = document.querySelectorAll('[data-user-only]');
    userElements.forEach(el => el.style.display = 'block');
    
    // Hide guest elements
    const guestElements = document.querySelectorAll('[data-guest-only]');
    guestElements.forEach(el => el.style.display = 'none');
    
    // Update user info display
    const userNameElements = document.querySelectorAll('[data-user-name]');
    userNameElements.forEach(el => {
        el.textContent = currentUser.username;
    });
}

function updateUIForUnauthenticatedUser() {
    // Hide user-specific elements
    const userElements = document.querySelectorAll('[data-user-only]');
    userElements.forEach(el => el.style.display = 'none');
    
    // Show guest elements
    const guestElements = document.querySelectorAll('[data-guest-only]');
    guestElements.forEach(el => el.style.display = 'block');
}

// API Functions
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(endpoint, finalOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Notification System
function showNotification(message, type = 'info', duration = 5000) {
    const notification = {
        id: Date.now(),
        message,
        type,
        duration
    };
    
    notifications.push(notification);
    renderNotification(notification);
    
    if (duration > 0) {
        setTimeout(() => {
            removeNotification(notification.id);
        }, duration);
    }
}

function renderNotification(notification) {
    const container = document.getElementById('notification-container') || createNotificationContainer();
    
    const notificationEl = document.createElement('div');
    notificationEl.className = `notification notification-${notification.type} animate-fade-in`;
    notificationEl.setAttribute('data-notification-id', notification.id);
    
    const typeIcon = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    }[notification.type];
    
    notificationEl.innerHTML = `
        <div class="notification-content">
            <i class="fas ${typeIcon} notification-icon"></i>
            <span class="notification-message">${notification.message}</span>
            <button class="notification-close" onclick="removeNotification(${notification.id})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(notificationEl);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
}

function removeNotification(id) {
    const notificationEl = document.querySelector(`[data-notification-id="${id}"]`);
    if (notificationEl) {
        notificationEl.classList.add('animate-fade-out');
        setTimeout(() => {
            notificationEl.remove();
        }, 300);
    }
    
    notifications = notifications.filter(n => n.id !== id);
}

// Modal Functions
function initializeModals() {
    // Add click handlers for modal triggers
    document.addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-modal-trigger')) {
            const modalId = e.target.getAttribute('data-modal-trigger');
            openModal(modalId);
        }
        
        if (e.target.hasAttribute('data-modal-close')) {
            closeModal(e.target.closest('.modal'));
        }
    });
    
    // Close modal on background click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal(e.target.querySelector('.modal'));
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                closeModal(openModal);
            }
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus first input in modal
        const firstInput = modal.querySelector('input, textarea, select, button');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Tooltip Functions
function initializeTooltips() {
    document.addEventListener('mouseenter', function(e) {
        if (e.target.hasAttribute('data-tooltip')) {
            showTooltip(e.target);
        }
    }, true);
    
    document.addEventListener('mouseleave', function(e) {
        if (e.target.hasAttribute('data-tooltip')) {
            hideTooltip(e.target);
        }
    }, true);
}

function showTooltip(element) {
    const text = element.getAttribute('data-tooltip');
    const position = element.getAttribute('data-tooltip-position') || 'top';
    
    const tooltip = document.createElement('div');
    tooltip.className = `tooltip tooltip-${position}`;
    tooltip.textContent = text;
    
    document.body.appendChild(tooltip);
    
    // Position tooltip
    const rect = element.getBoundingClientRect();
    
    switch (position) {
        case 'top':
            tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
            break;
        case 'bottom':
            tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
            tooltip.style.top = rect.bottom + 8 + 'px';
            break;
        case 'left':
            tooltip.style.left = rect.left - tooltip.offsetWidth - 8 + 'px';
            tooltip.style.top = rect.top + rect.height / 2 - tooltip.offsetHeight / 2 + 'px';
            break;
        case 'right':
            tooltip.style.left = rect.right + 8 + 'px';
            tooltip.style.top = rect.top + rect.height / 2 - tooltip.offsetHeight / 2 + 'px';
            break;
    }
    
    element.setAttribute('data-tooltip-active', 'true');
}

function hideTooltip(element) {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
    element.removeAttribute('data-tooltip-active');
}

// File Upload Functions
function initializeFileUploads() {
    const uploadAreas = document.querySelectorAll('.file-upload-area');
    
    uploadAreas.forEach(area => {
        // Click to upload
        area.addEventListener('click', function() {
            const input = this.querySelector('input[type="file"]');
            if (input) input.click();
        });
        
        // Drag and drop
        area.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        area.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });
        
        area.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            handleFileUpload(files, this);
        });
        
        // File input change
        const input = area.querySelector('input[type="file"]');
        if (input) {
            input.addEventListener('change', function(e) {
                handleFileUpload(e.target.files, area);
            });
        }
    });
}

async function handleFileUpload(files, uploadArea) {
    if (files.length === 0) return;
    
    // Show loading state
    uploadArea.classList.add('uploading');
    
    try {
        const formData = new FormData();
        
        if (files.length === 1) {
            formData.append('file', files[0]);
            const response = await apiCall('/upload/single', {
                method: 'POST',
                body: formData
            });
            onFileUploadSuccess(response, uploadArea);
        } else {
            for (let file of files) {
                formData.append('files', file);
            }
            const response = await apiCall('/upload/multiple', {
                method: 'POST',
                body: formData
            });
            onFileUploadSuccess(response, uploadArea);
        }
    } catch (error) {
        showNotification('File upload failed: ' + error.message, 'error');
    } finally {
        uploadArea.classList.remove('uploading');
    }
}

function onFileUploadSuccess(response, uploadArea) {
    showNotification('File uploaded successfully', 'success');
    
    // Update UI with uploaded file info
    const fileInfo = response.file || response.files;
    const fileInfoEl = uploadArea.querySelector('.file-info') || createFileInfoElement(uploadArea);
    fileInfoEl.innerHTML = formatFileInfo(fileInfo);
    fileInfoEl.style.display = 'block';
}

function createFileInfoElement(uploadArea) {
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';
    uploadArea.appendChild(fileInfo);
    return fileInfo;
}

function formatFileInfo(fileInfo) {
    if (Array.isArray(fileInfo)) {
        return fileInfo.map(file => `
            <div class="file-item">
                <i class="fas fa-file"></i>
                <span>${file.name}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
            </div>
        `).join('');
    } else {
        return `
            <div class="file-item">
                <i class="fas fa-file"></i>
                <span>${fileInfo.name}</span>
                <span class="file-size">${formatFileSize(fileInfo.size)}</span>
            </div>
        `;
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Chart Functions
function initializeCharts() {
    // Initialize any charts on the page
    const chartElements = document.querySelectorAll('[data-chart]');
    
    chartElements.forEach(element => {
        const chartType = element.getAttribute('data-chart');
        const chartData = JSON.parse(element.getAttribute('data-chart-data') || '{}');
        
        createChart(element, chartType, chartData);
    });
}

function createChart(element, type, data) {
    // This is a placeholder for chart creation
    // In a real implementation, you'd use a charting library like Chart.js
    console.log('Creating chart:', type, data);
}

// Real-time Updates
function initializeRealTimeUpdates() {
    // Initialize WebSocket or polling for real-time updates
    if (currentUser) {
        // Start polling for notifications
        setInterval(checkForUpdates, 30000); // Check every 30 seconds
    }
}

async function checkForUpdates() {
    try {
        const response = await apiCall('/api/updates');
        if (response.notifications) {
            response.notifications.forEach(notification => {
                showNotification(notification.message, notification.type);
            });
        }
    } catch (error) {
        console.error('Update check failed:', error);
    }
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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(new Date(date));
}

function copyToClipboard(text, buttonElement) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = '<i class="fas fa-check"></i> Copied!';
        buttonElement.classList.add('success');
        
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.classList.remove('success');
        }, 2000);
    }).catch(error => {
        console.error('Copy to clipboard failed:', error);
        showNotification('Failed to copy to clipboard', 'error');
    });
}

// Form Validation
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });
    
    return isValid;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

// Search Functions
function initializeSearch() {
    const searchInputs = document.querySelectorAll('[data-search]');
    
    searchInputs.forEach(input => {
        input.addEventListener('input', debounce(function(e) {
            performSearch(e.target.value, e.target.getAttribute('data-search-target'));
        }, 300));
    });
}

async function performSearch(query, targetId) {
    if (query.length < 2) {
        clearSearchResults(targetId);
        return;
    }
    
    try {
        const response = await apiCall(`/api/search?q=${encodeURIComponent(query)}`);
        displaySearchResults(response.results, targetId);
    } catch (error) {
        console.error('Search failed:', error);
    }
}

function displaySearchResults(results, targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    
    if (results.length === 0) {
        target.innerHTML = '<div class="search-no-results">No results found</div>';
        return;
    }
    
    const html = results.map(result => `
        <div class="search-result">
            <h4>${result.title}</h4>
            <p>${result.description}</p>
            <a href="${result.url}">View Details</a>
        </div>
    `).join('');
    
    target.innerHTML = html;
}

function clearSearchResults(targetId) {
    const target = document.getElementById(targetId);
    if (target) {
        target.innerHTML = '';
    }
}

// Export functions for use in other files
window.XCoder = {
    apiCall,
    showNotification,
    openModal,
    closeModal,
    copyToClipboard,
    validateForm,
    validateEmail,
    validatePassword,
    formatDate,
    formatCurrency,
    formatFileSize
};