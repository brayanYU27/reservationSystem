import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from '../controllers/notification.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/notifications - Get user's notifications
router.get('/', getNotifications);

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', getUnreadCount);

// PATCH /api/notifications/:id/read - Mark as read
router.patch('/:id/read', markAsRead);

// PATCH /api/notifications/mark-all-read - Mark all as read
router.patch('/mark-all-read', markAllAsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', deleteNotification);

export default router;
