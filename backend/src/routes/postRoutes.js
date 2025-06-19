const express = require('express');
const multer = require('multer');
const {
  createPost,
  getAllPosts,
  getUserPosts,
  getPostById,
  updatePost,
  deletePost,
  getFeedPosts
} = require('../controllers/postController');
const auth = require('../middlewares/auth');

const router = express.Router();

// Настройка multer для загрузки изображений
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
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

module.exports = router; 