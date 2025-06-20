const express = require('express');
const multer = require('multer');
const {
  createPost,
  getAllPosts,
  getUserPosts,
  getPostById,
  updatePost,
  deletePost,
  getFeedPosts,
  clearAllPosts
} = require('../controllers/postController');
const auth = require('../middlewares/auth');

const router = express.Router();

// Настройка multer для загрузки изображений и видео
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB для видео
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

// Создание поста (поддержка множественных изображений)
router.post('/', auth, upload.array('images', 10), createPost);

// Получение ленты постов от подписок (требует авторизации)
router.get('/feed', auth, getFeedPosts);

// Получение всех постов (для исследования)
router.get('/', getAllPosts);

// Получение постов пользователя
router.get('/user/:userId', getUserPosts);

// Получение конкретного поста
router.get('/:postId', getPostById);

// Обновление поста
router.put('/:postId', auth, upload.array('images', 10), updatePost);

// Удаление поста
router.delete('/:postId', auth, deletePost);

// Очистка всех постов (только для разработки)
router.delete('/admin/clear-all', auth, clearAllPosts);

module.exports = router; 