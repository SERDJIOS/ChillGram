const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  sendMessage,
  getMessages,
  getChats,
  markAsRead,
  deleteMessage,
  getUnreadMessagesCount,
  searchUsers,
  sharePost,
  sendMediaMessage
} = require('../controllers/messageController');
const auth = require('../middlewares/auth');

// Настройка multer для загрузки медиа-файлов
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB для видео
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      // Разрешаем аудио файлы
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed for voice messages'), false);
      }
    } else if (file.fieldname === 'video') {
      // Разрешаем видео файлы
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed for video messages'), false);
      }
    } else {
      cb(new Error('Unknown file field'), false);
    }
  }
});

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

// Отправка медиа-сообщения (голосовое или видео)
router.post('/send-media', auth, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), sendMediaMessage);

module.exports = router; 