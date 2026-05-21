const listeners = new Set();

export const NOTIFICATION_ACTIONS = {
    ACCOUNT_UPDATE: 'account-update',
    PIN_CREATE: 'pin-create',
    MAP_RATING: 'map-rating',
    SERVICE_RATING: 'service-rating',
};

const ACTION_MESSAGES = {
    [NOTIFICATION_ACTIONS.ACCOUNT_UPDATE]: {
        success: 'Account updated successfully',
        error: 'Unable to update account',
    },
    [NOTIFICATION_ACTIONS.PIN_CREATE]: {
        success: 'Pin created successfully',
        error: 'Unable to create pin',
    },
    [NOTIFICATION_ACTIONS.MAP_RATING]: {
        success: 'Map rating submitted',
        error: 'Unable to submit map rating',
    },
    [NOTIFICATION_ACTIONS.SERVICE_RATING]: {
        success: 'Service rating submitted',
        error: 'Unable to submit service rating',
    },
};

export function subscribeToNotifications(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function notify({ message, type = 'info', duration = 5000 }) {
    const notification = {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        message,
        type,
        duration,
    };

    listeners.forEach((listener) => listener(notification));
}

export function notifyAction(action, status, options = {}) {
    const message = options.message ?? ACTION_MESSAGES[action]?.[status];
    if (!message) return;

    notify({
        message,
        type: status === 'success' ? 'success' : 'error',
        duration: options.duration,
    });
}
