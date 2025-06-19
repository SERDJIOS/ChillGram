const User = require('../models/userModel');
const Post = require('../models/postModel');
const Follow = require('../models/followModel');
const cloudinary = require('../config/cloudinary');

// Получение профиля пользователя
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Получаем статистику пользователя
    const postsCount = await Post.countDocuments({ author: userId });
    const followersCount = await Follow.countDocuments({ following: userId });
    const followingCount = await Follow.countDocuments({ follower: userId });

    // Проверяем, подписан ли текущий пользователь на этого пользователя
    let isFollowing = false;
    if (req.user && req.user._id.toString() !== userId) {
      const followRelation = await Follow.findOne({
        follower: req.user._id,
        following: userId
      });
      isFollowing = !!followRelation;
    }

    res.json({
      user: {
        ...user.toObject(),
        postsCount,
        followersCount,
        followingCount,
        isFollowing
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Обновление профиля пользователя
const updateProfile = async (req, res) => {
  try {
    const { fullName, bio, username } = req.body;
    const userId = req.user._id;

    // Проверяем, не занят ли username другим пользователем
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (username) updateData.username = username;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Загрузка аватара пользователя
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const userId = req.user._id;

    // Удаляем старый аватар из Cloudinary, если он есть
    const user = await User.findById(userId);
    if (user.profileImage) {
      // Извлекаем public_id из URL
      const publicId = user.profileImage.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`avatars/${publicId}`);
    }

    // Загружаем новое изображение в Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'avatars',
          transformation: [
            { width: 400, height: 400, crop: 'fill' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Обновляем профиль пользователя
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: result.secure_url },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Avatar uploaded successfully',
      user: updatedUser,
      imageUrl: result.secure_url
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Server error during avatar upload' });
  }
};

// Поиск пользователей
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } }
      ]
    })
    .select('-password')
    .limit(20);

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Получение подписчиков пользователя
const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const followers = await Follow.find({ following: userId })
      .populate('follower', 'username fullName profileImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Follow.countDocuments({ following: userId });

    res.json({
      followers: followers.map(f => f.follower),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Получение подписок пользователя
const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const following = await Follow.find({ follower: userId })
      .populate('following', 'username fullName profileImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Follow.countDocuments({ follower: userId });

    res.json({
      following: following.map(f => f.following),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  searchUsers,
  getFollowers,
  getFollowing
}; 