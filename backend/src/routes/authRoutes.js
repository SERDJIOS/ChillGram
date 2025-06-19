const express = require('express');
const { register, login, forgotPassword, resetPassword, getCurrentUser } = require('../controllers/authController');
const auth = require('../middlewares/auth');

const router = express.Router();

// Регистрация пользователя
router.post('/register', register);

// Авторизация пользователя
router.post('/login', login);

// Запрос на сброс пароля
router.post('/forgot-password', forgotPassword);

// Сброс пароля
router.post('/reset-password', resetPassword);

// Получение текущего пользователя
router.get('/me', auth, getCurrentUser);

// Проверка валидности токена
router.get('/verify-token', auth, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email
    }
  });
});

module.exports = router; 