import './ToastViewport.css';
import { useEffect, useState } from 'react';
import { Icon } from '../Icon/Icon';
import { Text } from '../../typography';
import { subscribeToNotifications } from '../../../services/notificationCenter';

export function ToastViewport() {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        return subscribeToNotifications((notification) => {
            setNotifications((current) => [...current, notification]);

            window.setTimeout(() => {
                dismiss(notification.id);
            }, notification.duration);
        });
    }, []);

    function dismiss(id) {
        setNotifications((current) => current.filter((item) => item.id !== id));
    }

    return (
        <div className="toast-viewport" aria-live="polite" aria-atomic="true">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`app-toast app-toast-${notification.type}`}
                    role={notification.type === 'error' ? 'alert' : 'status'}
                >
                    <Text className="app-toast-message">{notification.message}</Text>
                    <button
                        type="button"
                        className="app-toast-close"
                        aria-label="Dismiss notification"
                        onClick={() => dismiss(notification.id)}
                    >
                        <Icon name="close" size="small" />
                    </button>
                </div>
            ))}
        </div>
    );
}
