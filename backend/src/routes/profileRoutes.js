const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
  getMyProfile,
  getUserProfile,
  updateProfile,
  searchUsers,
  upload
} = require('../controllers/profileController');

// Profile routes loaded

// Получить собственный профиль
router.get('/', auth, getMyProfile);

// Поиск пользователей (должен быть ДО маршрута с параметром)
router.get('/search/users', auth, searchUsers);

// Получить профиль пользователя по ID
router.get('/:userId', auth, getUserProfile);

// Обновить профиль
router.put('/', auth, upload.single('profileImage'), updateProfile);

module.exports = router; 