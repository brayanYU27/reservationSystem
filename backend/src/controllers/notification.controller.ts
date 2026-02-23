import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';

// GET /api/notifications
export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).userId;
        const { unreadOnly, limit, page = 1 } = req.query;

        const skip = (Number(page) - 1) * Number(limit || 20);

        const notifications = await NotificationService.getForUser(userId, {
            unreadOnly: unreadOnly === 'true',
            limit: Number(limit) || 20,
            skip,
        });

        const total = await NotificationService.getUnreadCount(userId);

        return res.json({
            success: true,
            data: notifications,
            pagination: {
                page: Number(page),
                limit: Number(limit) || 20,
                total,
            },
        });
    } catch (error) {
        return next(error);
    }
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).userId;
        const count = await NotificationService.getUnreadCount(userId);

        return res.json({
            success: true,
            count,
        });
    } catch (error) {
        return next(error);
    }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await NotificationService.markAsRead(String(id));

        return res.json({
            success: true,
            message: 'Notification marked as read',
        });
    } catch (error) {
        return next(error);
    }
};

// PATCH /api/notifications/mark-all-read
export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).userId;
        await NotificationService.markAllAsRead(userId);

        return res.json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error) {
        return next(error);
    }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await NotificationService.delete(String(id));

        return res.json({
            success: true,
            message: 'Notification deleted',
        });
    } catch (error) {
        return next(error);
    }
};
