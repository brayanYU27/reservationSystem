import React from 'react';

interface SkeletonLoaderProps {
    variant?: 'text' | 'card' | 'avatar' | 'business-card' | 'list' | 'stats';
    count?: number;
    className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    variant = 'text',
    count = 1,
    className = '',
}) => {
    const renderSkeleton = () => {
        switch (variant) {
            case 'text':
                return (
                    <div className={`space-y-2 ${className}`}>
                        {Array.from({ length: count }).map((_, i) => (
                            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                        ))}
                    </div>
                );

            case 'avatar':
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                        </div>
                    </div>
                );

            case 'card':
                return (
                    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
                        <div className="space-y-3">
                            <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
                            <div className="flex gap-2 mt-4">
                                <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
                                <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
                            </div>
                        </div>
                    </div>
                );

            case 'business-card':
                return (
                    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
                        {/* Cover image skeleton */}
                        <div className="h-32 bg-gray-200 animate-pulse" />

                        {/* Content */}
                        <div className="p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                                </div>
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                            <div className="flex gap-2">
                                <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
                                <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
                            </div>
                        </div>
                    </div>
                );

            case 'list':
                return (
                    <div className="space-y-3">
                        {Array.from({ length: count }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                                </div>
                                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                );

            case 'stats':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Array.from({ length: count || 3 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                                    <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
                                    <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                );

            default:
                return null;
        }
    };

    return <>{renderSkeleton()}</>;
};
