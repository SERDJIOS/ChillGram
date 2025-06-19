const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendResetPasswordEmail } = require('../config/emailConfig');

// Генерация JWT токена
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Регистрация пользователя
const register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Проверка обязательных полей
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Проверка длины пароля
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Проверка существования пользователя
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
    }

    // Создание нового пользователя
    const user = new User({
      username,
      email,
      password,
      fullName
    });

    await user.save();

    // Генерация токена
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// Авторизация пользователя
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Login attempt

    // Проверка обязательных полей
    if (!username || !password) {
      // Missing fields
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    // Поиск пользователя по email или username
    // Searching for user
    
    const user = await User.findOne({
      $or: [{ email: username }, { username: username }]
    });
    
    // User found check
    // Found user details logged
    
    // Check total users count
    const totalUsers = await User.countDocuments();
    // Total users in database
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Проверка пароля
    // Checking password for user
    const isPasswordValid = await user.comparePassword(password);
    // Password validation check
    
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Генерация токена
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Запрос на сброс пароля
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Поиск пользователя по email или username
    const user = await User.findOne({
      $or: [{ email: email }, { username: email }]
    });

    if (!user) {
      // Из соображений безопасности не раскрываем, существует ли пользователь
      return res.json({ 
        message: 'If an account with that email exists, we have sent a password reset link.' 
      });
    }

    // Генерация токена сброса пароля
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Сохранение токена и времени истечения (1 час)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 час
    await user.save();

    // Отправка email
    try {
      const emailSent = await sendResetPasswordEmail(user.email, resetToken, user.fullName);
      
      if (emailSent) {
        res.json({ 
          message: 'Password reset email sent successfully. Please check your inbox.' 
        });
      } else {
        // Даже если email не отправился, возвращаем успех для безопасности
        res.json({ 
          message: 'If an account with that email exists, we have sent a password reset link.' 
        });
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Возвращаем успех даже при ошибке email для безопасности
      res.json({ 
        message: 'If an account with that email exists, we have sent a password reset link.' 
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// Сброс пароля
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Поиск пользователя с действующим токеном
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Обновление пароля
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// Получение текущего пользователя
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getCurrentUser
}; 