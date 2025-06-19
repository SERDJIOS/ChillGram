const Post = require('../models/postModel');
const User = require('../models/userModel');
const Like = require('../models/likeModel');
const Comment = require('../models/commentModel');
const Follow = require('../models/followModel');
const cloudinary = require('../config/cloudinary');

// Создание нового поста
const createPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const userId = req.user.id;

    // Проверяем, есть ли изображения
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    // Загружаем изображения в Cloudinary
    const imageUploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'posts',
            transformation: [
              { width: 1080, height: 1080, crop: 'limit' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        ).end(file.buffer);
      });
    });

    const imageUrls = await Promise.all(imageUploadPromises);

    // Создаем новый пост
    const newPost = new Post({
      author: userId,
      images: imageUrls, // Массив URL изображений
      image: imageUrls[0], // Первое изображение для совместимости со старым кодом
      caption: caption || ''
    });

    await newPost.save();

    // Увеличиваем счетчик постов у пользователя
    await User.findByIdAndUpdate(userId, { $inc: { postsCount: 1 } });

    // Получаем пост с информацией об авторе
    const populatedPost = await Post.findById(newPost._id)
      .populate('author', 'username profileImage');

    res.status(201).json({
      message: 'Post created successfully',
      post: populatedPost
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Получение ленты постов от подписок
const getFeedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const currentUserId = req.user.id;

    // Getting feed posts for user

    // Получаем список пользователей на которых подписан текущий пользователь
    const following = await Follow.find({ follower: currentUserId }).select('following');
    const followingIds = following.map(f => f.following);
    
    // Добавляем собственные посты в ленту
    followingIds.push(currentUserId);

    // Following users count

    // Получаем посты от подписок
    const posts = await Post.find({ author: { $in: followingIds } })
      .populate('author', 'username profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Для каждого поста получаем информацию о лайках и комментариях
    const postsWithDetails = await Promise.all(posts.map(async (post) => {
      // Проверяем, лайкнул ли текущий пользователь этот пост
      const isLiked = await Like.findOne({ user: currentUserId, post: post._id });
      
      // Получаем последние комментарии
      const comments = await Comment.find({ post: post._id })
        .populate('author', 'username profileImage')
        .sort({ createdAt: -1 })
        .limit(3);

      const postObj = post.toObject();
      
      // Обеспечиваем совместимость: если нет images, но есть image - создаем массив
      if (!postObj.images || postObj.images.length === 0) {
        if (postObj.image) {
          postObj.images = [postObj.image];
        }
      }

      return {
        ...postObj,
        isLiked: !!isLiked,
        comments: comments.reverse() // Показываем в хронологическом порядке
      };
    }));

    const totalPosts = await Post.countDocuments({ author: { $in: followingIds } });
    const totalPages = Math.ceil(totalPosts / limit);

    // Feed stats calculated

    res.json({
      posts: postsWithDetails,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching feed posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Получение всех постов (для исследования/поиска)
const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const currentUserId = req.user?.id;

    const posts = await Post.find()
      .populate('author', 'username profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Для каждого поста получаем информацию о лайках и комментариях
    const postsWithDetails = await Promise.all(posts.map(async (post) => {
      // Проверяем, лайкнул ли текущий пользователь этот пост
      const isLiked = currentUserId ? await Like.findOne({ user: currentUserId, post: post._id }) : false;
      
      // Получаем последние комментарии
      const comments = await Comment.find({ post: post._id })
        .populate('author', 'username profileImage')
        .sort({ createdAt: -1 })
        .limit(3);

      const postObj = post.toObject();
      
      // Обеспечиваем совместимость: если нет images, но есть image - создаем массив
      if (!postObj.images || postObj.images.length === 0) {
        if (postObj.image) {
          postObj.images = [postObj.image];
        }
      }

      return {
        ...postObj,
        isLiked: !!isLiked,
        comments: comments.reverse() // Показываем в хронологическом порядке
      };
    }));

    const totalPosts = await Post.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      posts: postsWithDetails,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Получение постов конкретного пользователя
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const currentUserId = req.user?.id;

    const posts = await Post.find({ author: userId })
      .populate('author', 'username profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Для каждого поста получаем информацию о лайках и комментариях
    const postsWithDetails = await Promise.all(posts.map(async (post) => {
      // Проверяем, лайкнул ли текущий пользователь этот пост
      const isLiked = currentUserId ? await Like.findOne({ user: currentUserId, post: post._id }) : false;
      
      // Получаем последние комментарии
      const comments = await Comment.find({ post: post._id })
        .populate('author', 'username profileImage')
        .sort({ createdAt: -1 })
        .limit(3);

      const postObj = post.toObject();
      
      // Обеспечиваем совместимость: если нет images, но есть image - создаем массив
      if (!postObj.images || postObj.images.length === 0) {
        if (postObj.image) {
          postObj.images = [postObj.image];
        }
      }

      return {
        ...postObj,
        isLiked: !!isLiked,
        comments: comments.reverse() // Показываем в хронологическом порядке
      };
    }));

    const totalPosts = await Post.countDocuments({ author: userId });
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      posts: postsWithDetails,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Получение конкретного поста по ID
const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    const currentUserId = req.user?.id;

    const post = await Post.findById(postId)
      .populate('author', 'username profileImage');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Проверяем, лайкнул ли текущий пользователь этот пост
    const isLiked = currentUserId ? await Like.findOne({ user: currentUserId, post: postId }) : false;
    
    // Получаем все комментарии
    const comments = await Comment.find({ post: postId })
      .populate('author', 'username profileImage')
      .sort({ createdAt: 1 });

    const postObj = post.toObject();
    
    // Обеспечиваем совместимость: если нет images, но есть image - создаем массив
    if (!postObj.images || postObj.images.length === 0) {
      if (postObj.image) {
        postObj.images = [postObj.image];
      }
    }

    const postWithDetails = {
      ...postObj,
      isLiked: !!isLiked,
      comments
    };

    res.json({ post: postWithDetails });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Обновление поста
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { caption } = req.body;
    const userId = req.user.id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Проверяем, является ли пользователь автором поста
    if (post.author.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    // Обновляем только caption
    post.caption = caption || post.caption;

    // Если есть новое изображение
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'posts',
            transformation: [
              { width: 1080, height: 1080, crop: 'limit' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });
      
      post.image = result.secure_url;
      post.images = [result.secure_url]; // Обновляем массив тоже
    }

    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('author', 'username profileImage');

    res.json({
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Удаление поста
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Проверяем, является ли пользователь автором поста
    if (post.author.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Удаляем связанные лайки и комментарии
    await Like.deleteMany({ post: postId });
    await Comment.deleteMany({ post: postId });

    // Удаляем пост
    await Post.findByIdAndDelete(postId);

    // Уменьшаем счетчик постов у пользователя
    await User.findByIdAndUpdate(userId, { $inc: { postsCount: -1 } });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getUserPosts,
  getPostById,
  updatePost,
  deletePost,
  getFeedPosts
}; 