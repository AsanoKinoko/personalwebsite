(function() {
    'use strict';

    const NOTIFICATION_CONTAINER_ID = 'notificationContainer';
    const DEFAULT_DURATION = 3000;

    // Get or create notification container
    function getNotificationContainer() {
        let container = document.getElementById(NOTIFICATION_CONTAINER_ID);
        
        if (!container) {
            container = document.createElement('div');
            container.id = NOTIFICATION_CONTAINER_ID;
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        return container;
    }

    // Get icon for notification type
    function getIcon(type) {
        const icons = {
            success: '<i class="bx bx-check-circle"></i>',
            info: '<i class="bx bx-info-circle"></i>',
            warning: '<i class="bx bx-error-circle"></i>',
            error: '<i class="bx bx-x-circle"></i>'
        };
        return icons[type] || icons.info;
    }

    // Show notification
    function show(message, type = 'info', duration = DEFAULT_DURATION) {
        const container = getNotificationContainer();
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <div class="notification-icon">
                ${getIcon(type)}
            </div>
            <div class="notification-content">
                <p class="notification-message">${message}</p>
            </div>
            <button class="notification-close" aria-label="Close">
                <i class="bx bx-x"></i>
            </button>
        `;

        // Add close handler
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            hide(notification);
        });

        // Add to container
        container.appendChild(notification);

        // Auto hide after duration
        if (duration > 0) {
            setTimeout(() => {
                hide(notification);
            }, duration);
        }

        return notification;
    }

    // Hide notification
    function hide(notification) {
        if (!notification || !notification.parentNode) {
            return;
        }

        notification.classList.add('hiding');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            
            // Remove container if empty
            const container = document.getElementById(NOTIFICATION_CONTAINER_ID);
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }

    // Clear all notifications
    function clear() {
        const container = document.getElementById(NOTIFICATION_CONTAINER_ID);
        if (container) {
            const notifications = container.querySelectorAll('.notification');
            notifications.forEach(notification => {
                hide(notification);
            });
        }
    }

    // Export to global scope
    window.Notification = {
        show: show,
        hide: hide,
        clear: clear
    };
})();