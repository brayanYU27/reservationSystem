import { apiClient } from '@/lib/api-client';

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    icon?: string;
    data?: any;
    isRead: boolean;
    readAt?: string;
    createdAt: string;
    expiresAt?: string;
}

export interface NotificationResponse {
    success: boolean;
    data: Notification[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
    };
}

export interface UnreadCountResponse {
    success: boolean;
    count: number;
}

export const NotificationService = {
    async getNotifications(params?: {
        unreadOnly?: boolean;
        limit?: number;
        page?: number;
    }): Promise<Notification[]> {
        const queryParams = new URLSearchParams();
        if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.page) queryParams.append('page', params.page.toString());

        const queryString = queryParams.toString();
        const response = await apiClient.get<Notification[]>(
            `/notifications${queryString ? `?${queryString}` : ''}`
        );

        if (!response.success) {
            console.error('Error fetching notifications:', response.error);
            return [];
        }

        return response.data || [];
    },

    async getUnreadCount(): Promise<number> {
        const response = await apiClient.get<{ count: number }>('/notifications/unread-count');

        if (!response.success) {
            console.error('Error fetching unread count:', response.error);
            return 0;
        }

        return response.data?.count || 0;
    },

    async markAsRead(notificationId: string): Promise<void> {
        await apiClient.patch<void>(`/notifications/${notificationId}/read`, {});
    },

    async markAllAsRead(): Promise<void> {
        await apiClient.patch<void>('/notifications/mark-all-read', {});
    },

    async deleteNotification(notificationId: string): Promise<void> {
        await apiClient.delete<void>(`/notifications/${notificationId}`);
    }
};
