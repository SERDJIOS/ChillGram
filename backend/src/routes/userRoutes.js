const express = require('express');
const {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  searchUsers,
  getFollowers,
  getFollowing
} = require('../controllers/userController');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

// Поиск пользователей
router.get('/search', auth, searchUsers);

// Получение профиля пользователя
router.get('/:userId', auth, getUserProfile);

// Обновление профиля
router.put('/profile', auth, updateProfile);

// Загрузка аватара
router.post('/avatar', auth, upload.single('avatar'), uploadAvatar);

// Получение подписчиков пользователя
router.get('/:userId/followers', auth, getFollowers);

// Получение подписок пользователя
router.get('/:userId/following', auth, getFollowing);

module.exports = router; 