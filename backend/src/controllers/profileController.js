const User = require('../models/userModel');
const Follow = require('../models/followModel');
const multer = require('multer');

// Настройка multer для загрузки изображений в память
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB максимум
  },
  fileFilter: (req, file, cb) => {
    // Проверяем, что файл является изображением
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Получить собственный профиль
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        bio: user.bio || '',
        website: user.website || '',
        profileImage: user.profileImage || '',
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        postsCount: user.postsCount || 0,
        isPrivate: user.isPrivate || false,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Get my profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Получить профиль пользователя по ID
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?._id;

    // Get user profile request

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Проверяем, является ли это собственным профилем
    const isOwnProfile = currentUserId && currentUserId.toString() === userId;

    let followStatus = null;
    if (currentUserId && !isOwnProfile) {
      // Получаем статус подписки
      const isFollowing = await Follow.isFollowing(currentUserId, userId);
      const isFollowedBy = await Follow.isFollowing(userId, currentUserId);
      
      followStatus = {
        isFollowing,
        isFollowedBy,
        isMutual: isFollowing && isFollowedBy
      };
    }

    const profileData = {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      bio: user.bio || '',
      website: user.website || '',
      profileImage: user.profileImage || '',
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      postsCount: user.postsCount || 0,
      isPrivate: user.isPrivate || false,
      createdAt: user.createdAt,
      isOwnProfile
    };

    // Добавляем статус подписки если это не собственный профиль
    if (followStatus) {
      profileData.followStatus = followStatus;
    }

    res.json({ user: profileData });
  } catch (error) {
    console.error('❌ Get user profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Обновить профиль
const updateProfile = async (req, res) => {
  try {
    // Profile update request received
    // Body and file data logged
    
    const { username, fullName, bio, website } = req.body;
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Проверяем уникальность username, если он изменяется
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      user.username = username;
    }

    // Обновляем поля, если они предоставлены
    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (website !== undefined) user.website = website;

    // Обработка загруженного изображения
    if (req.file) {
      // Processing uploaded image
      const imageBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      user.profileImage = imageBase64;
      // Image saved to user profile
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        bio: user.bio,
        website: user.website,
        profileImage: user.profileImage,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        postsCount: user.postsCount,
        isPrivate: user.isPrivate
      }
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Поиск пользователей
const searchUsers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const currentUserId = req.user?._id;

    if (!q || q.trim().length < 2) {
      return res.json({ users: [] });
    }

    // Search users request

    // Поиск по username и fullName
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: currentUserId } // Исключаем текущего пользователя
    })
    .select('username fullName profileImage followersCount')
    .limit(parseInt(limit))
    .sort({ followersCount: -1 }); // Сортируем по популярности

    // Добавляем информацию о подписке для каждого пользователя
    const usersWithFollowStatus = await Promise.all(
      users.map(async (user) => {
        let followStatus = null;
        if (currentUserId) {
          const isFollowing = await Follow.isFollowing(currentUserId, user._id);
          const isFollowedBy = await Follow.isFollowing(user._id, currentUserId);
          
          followStatus = {
            isFollowing,
            isFollowedBy,
            isMutual: isFollowing && isFollowedBy
          };
        }

        return {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          profileImage: user.profileImage,
          followersCount: user.followersCount,
          followStatus
        };
      })
    );

    res.json({ users: usersWithFollowStatus });
  } catch (error) {
    console.error('❌ Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getMyProfile,
  getUserProfile,
  updateProfile,
  searchUsers,
  upload
}; 