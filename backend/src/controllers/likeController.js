const Like = require('../models/likeModel');
const Post = require('../models/postModel');
const Notification = require('../models/notificationModel');

// Лайк/дизлайк поста
const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    // Проверяем существование поста
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Проверяем, есть ли уже лайк от этого пользователя
    const existingLike = await Like.findOne({ user: userId, post: postId });

    if (existingLike) {
      // Убираем лайк
      await Like.findByIdAndDelete(existingLike._id);
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });

      // Удаляем уведомление о лайке
      await Notification.findOneAndDelete({
        recipient: post.author,
        sender: userId,
        type: 'like',
        post: postId
      });

      res.json({ 
        message: 'Like removed',
        isLiked: false,
        likesCount: post.likesCount - 1
      });
    } else {
      // Добавляем лайк
      const like = new Like({ user: userId, post: postId });
      await like.save();
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });

      // Создаем уведомление, если лайк поставил не автор поста
      if (post.author.toString() !== userId.toString()) {
        const notification = new Notification({
          recipient: post.author,
          sender: userId,
          type: 'like',
          post: postId,
          message: 'liked your post'
        });
        await notification.save();
      }

      res.json({ 
        message: 'Post liked',
        isLiked: true,
        likesCount: post.likesCount + 1
      });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Получение лайков поста
const getPostLikes = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const likes = await Like.find({ post: postId })
      .populate('user', 'username fullName profileImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Like.countDocuments({ post: postId });

    res.json({
      likes: likes.map(like => like.user),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get post likes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  toggleLike,
  getPostLikes
}; 