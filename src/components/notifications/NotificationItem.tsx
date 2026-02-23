import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Notification } from '@/services/notificationService';

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onDelete?: (id: string) => void;
    onClose?: () => void;
}

const getNotificationIcon = (type: string, customIcon?: string) => {
    if (customIcon) return customIcon;

    switch (type) {
        case 'APPOINTMENT_CONFIRMED':
            return '✅';
        case 'APPOINTMENT_REMINDER':
            return '⏰';
        case 'APPOINTMENT_CANCELLED':
            return '❌';
        case 'APPOINTMENT_RESCHEDULED':
            return '📅';
        case 'NEW_APPOINTMENT':
            return '🔔';
        case 'REVIEW_RECEIVED':
            return '⭐';
        case 'REVIEW_RESPONSE':
            return '💬';
        case 'SYSTEM_ANNOUNCEMENT':
            return '📢';
        default:
            return '🔔';
    }
};

const getNotificationColor = (type: string) => {
    switch (type) {
        case 'APPOINTMENT_CONFIRMED':
            return 'from-green-500/10 to-emerald-500/5 border-green-500/20';
        case 'APPOINTMENT_CANCELLED':
            return 'from-red-500/10 to-rose-500/5 border-red-500/20';
        case 'NEW_APPOINTMENT':
            return 'from-blue-500/10 to-cyan-500/5 border-blue-500/20';
        case 'APPOINTMENT_REMINDER':
            return 'from-amber-500/10 to-yellow-500/5 border-amber-500/20';
        case 'REVIEW_RECEIVED':
            return 'from-purple-500/10 to-pink-500/5 border-purple-500/20';
        default:
            return 'from-gray-500/10 to-slate-500/5 border-gray-500/20';
    }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
    notification,
    onMarkAsRead,
    onDelete,
    onClose,
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (!notification.isRead) {
            onMarkAsRead(notification.id);
        }
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
            onClose?.(); // Close the panel after navigation
        }
    };

    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: true,
        locale: es,
    });

    return (
        <div
            onClick={handleClick}
            className={`
        group relative p-4 cursor-pointer transition-all duration-300
        hover:scale-[1.02] hover:shadow-lg
        bg-gradient-to-r ${getNotificationColor(notification.type)}
        border
        ${!notification.isRead ? 'shadow-md' : 'opacity-75'}
        rounded-xl mb-2
      `}
        >
            {/* Unread indicator */}
            {!notification.isRead && (
                <div className="absolute top-3 right-3">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </div>
                </div>
            )}

            <div className="flex items-start gap-3 pr-6">
                {/* Icon with gradient background */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-white to-gray-50 flex items-center justify-center text-2xl shadow-sm border border-gray-200">
                    {getNotificationIcon(notification.type, notification.icon)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 flex items-center gap-2">
                        {notification.title}
                    </h4>
                    <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                        {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-gray-500 font-medium">{timeAgo}</p>
                    </div>
                </div>

                {/* Delete button */}
                {onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(notification.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute top-3 right-3 p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600"
                        aria-label="Eliminar notificación"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Hover effect overlay */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>
    );
};
