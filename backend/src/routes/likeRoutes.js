const express = require('express');
const router = express.Router();
const { toggleLike, getPostLikes } = require('../controllers/likeController');
const auth = require('../middlewares/auth');

// Лайк/дизлайк поста
router.post('/:postId', auth, toggleLike);

// Получение лайков поста
router.get('/:postId', getPostLikes);

module.exports = router; 