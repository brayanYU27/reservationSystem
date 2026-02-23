import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateNotificationData {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    icon?: string;
    data?: any;
    expiresAt?: Date;
}

export class NotificationService {
    /**
     * Create a new in-app notification
     */
    static async create(data: CreateNotificationData) {
        try {
            const notification = await prisma.notification.create({
                data: {
                    userId: data.userId,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    actionUrl: data.actionUrl,
                    icon: data.icon,
                    data: data.data,
                    expiresAt: data.expiresAt,
                },
            });

            console.log('Notification created:', notification.id);
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Get notifications for a user
     */
    static async getForUser(
        userId: string,
        options: {
            unreadOnly?: boolean;
            limit?: number;
            skip?: number;
        } = {}
    ) {
        const { unreadOnly = false, limit = 20, skip = 0 } = options;

        const where: any = {
            userId,
        };

        if (unreadOnly) {
            where.isRead = false;
        }

        // Don't show expired notifications
        where.OR = [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
        ];

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip,
        });

        return notifications;
    }

    /**
     * Get unread count for a user
     */
    static async getUnreadCount(userId: string): Promise<number> {
        const count = await prisma.notification.count({
            where: {
                userId,
                isRead: false,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
        });

        return count;
    }

    /**
     * Mark notification as read
     */
    static async markAsRead(notificationId: string): Promise<void> {
        await prisma.notification.update({
            where: { id: notificationId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }

    /**
     * Mark all notifications as read for a user
     */
    static async markAllAsRead(userId: string): Promise<void> {
        await prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }

    /**
     * Delete a notification
     */
    static async delete(notificationId: string): Promise<void> {
        await prisma.notification.delete({
            where: { id: notificationId },
        });
    }

    /**
     * Delete old notifications (cleanup job)
     * Deletes read notifications older than 30 days
     */
    static async deleteOldNotifications(): Promise<number> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await prisma.notification.deleteMany({
            where: {
                isRead: true,
                createdAt: { lt: thirtyDaysAgo },
            },
        });

        console.log(`Deleted ${result.count} old notifications`);
        return result.count;
    }

    // ============================================
    // HELPER METHODS FOR COMMON NOTIFICATIONS
    // ============================================

    /**
     * Notify customer about appointment confirmation
     */
    static async notifyAppointmentConfirmed(data: {
        userId: string;
        businessName: string;
        serviceName: string;
        date: string;
        time: string;
        appointmentId: string;
    }) {
        return this.create({
            userId: data.userId,
            type: 'APPOINTMENT_CONFIRMED',
            title: '¡Cita Confirmada!',
            message: `Tu cita en ${data.businessName} para ${data.serviceName} ha sido confirmada el ${data.date} a las ${data.time}`,
            actionUrl: '/dashboard',
            icon: '✅',
            data: { appointmentId: data.appointmentId },
        });
    }

    /**
     * Notify customer about appointment cancellation
     */
    static async notifyAppointmentCancelled(data: {
        userId: string;
        businessName: string;
        serviceName: string;
        date: string;
        cancelledBy: 'customer' | 'business';
    }) {
        const message =
            data.cancelledBy === 'customer'
                ? `Has cancelado tu cita en ${data.businessName}`
                : `Tu cita en ${data.businessName} para ${data.serviceName} el ${data.date} ha sido cancelada`;

        return this.create({
            userId: data.userId,
            type: 'APPOINTMENT_CANCELLED',
            title: 'Cita Cancelada',
            message,
            actionUrl: '/dashboard',
            icon: '❌',
        });
    }

    /**
     * Notify business owner about new appointment
     */
    static async notifyNewAppointment(data: {
        userId: string; // business owner userId
        customerName: string;
        serviceName: string;
        date: string;
        time: string;
        appointmentId: string;
    }) {
        return this.create({
            userId: data.userId,
            type: 'NEW_APPOINTMENT',
            title: 'Nueva Reserva',
            message: `${data.customerName} reservó ${data.serviceName} para el ${data.date} a las ${data.time}`,
            actionUrl: '/admin/citas',
            icon: '🔔',
            data: { appointmentId: data.appointmentId },
        });
    }

    /**
     * Notify about appointment reminder (24h before)
     */
    static async notifyAppointmentReminder(data: {
        userId: string;
        businessName: string;
        serviceName: string;
        date: string;
        time: string;
        appointmentId: string;
    }) {
        return this.create({
            userId: data.userId,
            type: 'APPOINTMENT_REMINDER',
            title: 'Recordatorio de Cita',
            message: `Tu cita en ${data.businessName} es mañana a las ${data.time}`,
            actionUrl: '/dashboard',
            icon: '⏰',
            data: { appointmentId: data.appointmentId },
        });
    }
}
