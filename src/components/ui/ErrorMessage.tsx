import React from 'react';

interface ErrorMessageProps {
    title?: string;
    message: string;
    variant?: 'error' | 'warning' | 'info';
    onRetry?: () => void;
    className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
    title,
    message,
    variant = 'error',
    onRetry,
    className = '',
}) => {
    const variantStyles = {
        error: {
            container: 'bg-red-50 border-red-200',
            icon: '❌',
            iconBg: 'bg-red-100',
            title: 'text-red-900',
            message: 'text-red-700',
            button: 'bg-red-600 hover:bg-red-700',
        },
        warning: {
            container: 'bg-yellow-50 border-yellow-200',
            icon: '⚠️',
            iconBg: 'bg-yellow-100',
            title: 'text-yellow-900',
            message: 'text-yellow-700',
            button: 'bg-yellow-600 hover:bg-yellow-700',
        },
        info: {
            container: 'bg-blue-50 border-blue-200',
            icon: 'ℹ️',
            iconBg: 'bg-blue-100',
            title: 'text-blue-900',
            message: 'text-blue-700',
            button: 'bg-blue-600 hover:bg-blue-700',
        },
    };

    const style = variantStyles[variant];

    return (
        <div className={`rounded-lg border p-4 ${style.container} ${className}`}>
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center`}>
                    <span className="text-xl">{style.icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {title && (
                        <h3 className={`font-semibold text-sm mb-1 ${style.title}`}>
                            {title}
                        </h3>
                    )}
                    <p className={`text-sm leading-relaxed ${style.message}`}>
                        {message}
                    </p>

                    {/* Retry button */}
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className={`mt-3 px-4 py-2 ${style.button} text-white text-sm font-semibold rounded-lg transition-colors`}
                        >
                            Reintentar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
