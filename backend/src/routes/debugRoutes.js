const express = require('express');
const router = express.Router();
const User = require('../models/userModel');

// GET /api/debug/users - получить всех пользователей (без паролей)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/debug/user/:id - получить конкретного пользователя
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Debug user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/debug/stats - статистика базы данных
router.get('/stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const usersWithProfiles = await User.countDocuments({ 
      $or: [
        { profileImage: { $ne: '' } },
        { bio: { $ne: '' } },
        { fullName: { $ne: '' } }
      ]
    });
    
    res.json({
      totalUsers: userCount,
      usersWithProfiles: usersWithProfiles,
      usersWithoutProfiles: userCount - usersWithProfiles
    });
  } catch (error) {
    console.error('Debug stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 