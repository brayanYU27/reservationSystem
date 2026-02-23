import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NotificationService, Notification } from '@/services/notificationService';
import { NotificationItem } from './NotificationItem';

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onNotificationCountChange?: (count: number) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
    isOpen,
    onClose,
    onNotificationCountChange,
}) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await NotificationService.getNotifications({ limit: 10 });
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await NotificationService.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            const count = await NotificationService.getUnreadCount();
            onNotificationCountChange?.(count);
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await NotificationService.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            onNotificationCountChange?.(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop - solid without blur */}
            <div
                className="fixed inset-0 z-40 bg-black/40"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel - solid white background */}
            <div className="absolute right-0 mt-3 w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col overflow-hidden animate-in slide-in-from-top-2 duration-300">
                {/* Header with gradient */}
                <div className="relative p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Notificaciones</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {notifications.filter(n => !n.isRead).length} sin leer
                            </p>
                        </div>
                        {notifications.some((n) => !n.isRead) && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                Marcar todas
                            </button>
                        )}
                    </div>
                </div>

                {/* Notifications List with custom scrollbar */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="relative inline-flex">
                                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                            </div>
                            <p className="mt-4 text-sm text-gray-500 font-medium">Cargando...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                                <svg
                                    className="w-10 h-10 text-gray-300"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                </svg>
                            </div>
                            <p className="font-semibold text-gray-900 mb-1">No tienes notificaciones</p>
                            <p className="text-sm text-gray-500">
                                Te avisaremos cuando haya algo nuevo
                            </p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={handleMarkAsRead}
                                onClose={onClose}
                            />
                        ))
                    )}
                </div>

                {/* Footer with gradient */}
                {notifications.length > 0 && (
                    <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                        <Link
                            to="/notifications"
                            onClick={onClose}
                            className="block text-center text-sm font-semibold text-blue-600 hover:text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-50 transition-all duration-200 group"
                        >
                            Ver todas las notificaciones
                            <span className="inline-block ml-1 group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
};
