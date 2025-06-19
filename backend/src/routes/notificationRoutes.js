const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} = require('../controllers/notificationController');
const auth = require('../middlewares/auth');

const router = express.Router();

// Получение уведомлений пользователя
router.get('/', auth, getNotifications);

// Получение количества непрочитанных уведомлений
router.get('/unread-count', auth, getUnreadCount);

// Отметить уведомление как прочитанное
router.put('/:notificationId/read', auth, markAsRead);

// Отметить все уведомления как прочитанные
router.put('/read-all', auth, markAllAsRead);

// Удаление уведомления
router.delete('/:notificationId', auth, deleteNotification);

module.exports = router; 