const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
  getMutualFollows,
  getFollowSuggestions
} = require('../controllers/followController');

// Подписаться на пользователя
router.post('/:userId/follow', auth, followUser);

// Отписаться от пользователя
router.delete('/:userId/follow', auth, unfollowUser);

// Получить статус подписки на пользователя
router.get('/:userId/status', auth, getFollowStatus);

// Получить подписчиков пользователя
router.get('/:userId/followers', auth, getFollowers);

// Получить подписки пользователя
router.get('/:userId/following', auth, getFollowing);

// Получить взаимные подписки с пользователем
router.get('/:userId/mutual', auth, getMutualFollows);

// Получить рекомендации для подписки
router.get('/suggestions', auth, getFollowSuggestions);

module.exports = router; 