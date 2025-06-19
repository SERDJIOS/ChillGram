const Comment = require('../models/commentModel');
const Post = require('../models/postModel');
const Notification = require('../models/notificationModel');

// Создание комментария
const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    // Проверяем существование поста
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Создаем комментарий
    const comment = new Comment({
      author: userId,
      post: postId,
      text: text.trim()
    });

    await comment.save();

    // Увеличиваем счетчик комментариев поста
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    // Создаем уведомление, если комментарий оставил не автор поста
    if (post.author.toString() !== userId.toString()) {
      const notification = new Notification({
        recipient: post.author,
        sender: userId,
        type: 'comment',
        post: postId,
        comment: comment._id,
        message: 'commented on your post'
      });
      await notification.save();
    }

    // Получаем полную информацию о комментарии с автором
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username fullName profileImage');

    res.status(201).json({
      message: 'Comment created successfully',
      comment: populatedComment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Получение комментариев поста
const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const comments = await Comment.find({ post: postId })
      .populate('author', 'username fullName profileImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Comment.countDocuments({ post: postId });

    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get post comments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Обновление комментария
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Проверяем, является ли пользователь автором комментария
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { text: text.trim() },
      { new: true }
    ).populate('author', 'username fullName profileImage');

    res.json({
      message: 'Comment updated successfully',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Удаление комментария
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Проверяем, является ли пользователь автором комментария
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    // Уменьшаем счетчик комментариев поста
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

    // Удаляем связанное уведомление
    await Notification.findOneAndDelete({
      type: 'comment',
      comment: commentId
    });

    // Удаляем комментарий
    await Comment.findByIdAndDelete(commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createComment,
  getPostComments,
  updateComment,
  deleteComment
}; 