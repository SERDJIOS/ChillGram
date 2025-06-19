const express = require('express');
const router = express.Router();
const {
  createComment,
  getPostComments,
  updateComment,
  deleteComment
} = require('../controllers/commentController');
const auth = require('../middlewares/auth');

// Создание комментария
router.post('/:postId', auth, createComment);

// Получение комментариев поста
router.get('/:postId', getPostComments);

// Обновление комментария
router.put('/:commentId', auth, updateComment);

// Удаление комментария
router.delete('/:commentId', auth, deleteComment);

module.exports = router; 