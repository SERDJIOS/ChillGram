const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  getChats,
  markAsRead,
  deleteMessage,
  getUnreadMessagesCount,
  searchUsers,
  sharePost
} = require('../controllers/messageController');
const auth = require('../middlewares/auth');

// Отправка сообщения
router.post('/send', auth, sendMessage);

// Получение сообщений с конкретным пользователем
router.get('/chat/:userId', auth, getMessages);

// Получение списка всех чатов
router.get('/chats', auth, getChats);

// Получение количества непрочитанных сообщений
router.get('/unread-count', auth, getUnreadMessagesCount);

// Отметка сообщений как прочитанных
router.put('/read/:userId', auth, markAsRead);

// Удаление сообщения
router.delete('/:messageId', auth, deleteMessage);

// Поиск пользователей для начала чата
router.get('/search/users', auth, searchUsers);

// Отправка поста пользователю
router.post('/share-post', auth, sharePost);

module.exports = router; 