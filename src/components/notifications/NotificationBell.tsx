import React, { useEffect, useState, useRef } from 'react';
import { NotificationService } from '@/services/notificationService';
import { NotificationPanel } from './NotificationPanel';

export const NotificationBell: React.FC = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const prevCountRef = useRef(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        const startPolling = () => {
            fetchUnreadCount();
            interval = setInterval(fetchUnreadCount, 60000);
        };

        const stopPolling = () => {
            if (interval) clearInterval(interval);
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopPolling();
            } else {
                startPolling();
            }
        };

        if (!document.hidden) {
            startPolling();
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopPolling();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        // Trigger animation when count increases
        if (unreadCount > prevCountRef.current) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 600);
        }
        prevCountRef.current = unreadCount;
    }, [unreadCount]);

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const count = await NotificationService.getUnreadCount();
                setUnreadCount(count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative">
            <button
                onClick={handleToggle}
                className={`
          relative p-2.5 text-white hover:bg-white/10 rounded-xl transition-all duration-300
          ${isOpen ? 'bg-white/10 scale-95' : 'hover:scale-105'}
          ${isAnimating ? 'animate-bounce' : ''}
        `}
                aria-label="Notificaciones"
            >
                {/* Bell Icon with gradient on hover */}
                <div className="relative">
                    <svg
                        className="w-6 h-6 transition-transform duration-300 hover:rotate-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                    </svg>

                    {/* Notification dot when there are unread */}
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                    )}
                </div>

                {/* Badge with premium design */}
                {unreadCount > 0 && (
                    <span
                        className={`
              absolute -top-1 -right-1 inline-flex items-center justify-center 
              px-2 py-0.5 text-xs font-bold leading-none text-white 
              bg-gradient-to-r from-red-500 to-pink-500 
              rounded-full min-w-[20px] shadow-lg
              transform transition-all duration-300
              ${isAnimating ? 'scale-125' : 'scale-100'}
            `}
                    >
                        <span className="relative z-10">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                        {/* Shine effect */}
                        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-white/0 via-white/40 to-white/0 animate-shimmer"></span>
                    </span>
                )}
            </button>

            <NotificationPanel
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onNotificationCountChange={setUnreadCount}
            />

            {/* Add shimmer animation */}
            <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
        </div>
    );
};
