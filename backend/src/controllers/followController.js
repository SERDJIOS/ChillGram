const Follow = require('../models/followModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');

// Подписаться на пользователя
const followUser = async (req, res) => {
  try {
    const followerId = req.user._id;
    const { userId: followingId } = req.params;

    // Follow request

    // Проверяем что пользователь не пытается подписаться сам на себя
    if (followerId.toString() === followingId) {
      return res.status(400).json({ 
        error: 'You cannot follow yourself' 
      });
    }

    // Проверяем существует ли пользователь на которого хотят подписаться
    const userToFollow = await User.findById(followingId);
    if (!userToFollow) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Проверяем не подписан ли уже пользователь
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: followingId
    });

    if (existingFollow) {
      return res.status(400).json({ 
        error: 'You are already following this user' 
      });
    }

    // Создаем подписку
    const follow = new Follow({
      follower: followerId,
      following: followingId
    });

    await follow.save();

    // Обновляем счетчики у пользователей
    await Promise.all([
      User.findByIdAndUpdate(followerId, { 
        $inc: { followingCount: 1 } 
      }),
      User.findByIdAndUpdate(followingId, { 
        $inc: { followersCount: 1 } 
      })
    ]);

    // Создаем уведомление для пользователя на которого подписались
    try {
      const followerUser = await User.findById(followerId).select('username profileImage');
      
      await Notification.create({
        recipient: followingId,
        sender: followerId,
        type: 'follow',
        message: `${followerUser.username} started following you`,
        data: {
          userId: followerId,
          username: followerUser.username,
          profileImage: followerUser.profileImage
        }
      });

      // Follow notification created
    } catch (notificationError) {
      console.error('❌ Error creating follow notification:', notificationError);
      // Не прерываем выполнение если уведомление не создалось
    }

    // Получаем обновленную информацию о подписке
    const populatedFollow = await Follow.findById(follow._id)
      .populate('follower', 'username fullName profileImage')
      .populate('following', 'username fullName profileImage');

    res.status(201).json({
      message: 'Successfully followed user',
      follow: populatedFollow,
      isFollowing: true
    });

  } catch (error) {
    console.error('❌ Follow user error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'You are already following this user' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to follow user' 
    });
  }
};

// Отписаться от пользователя
const unfollowUser = async (req, res) => {
  try {
    const followerId = req.user._id;
    const { userId: followingId } = req.params;

    // Unfollow request

    // Ищем и удаляем подписку
    const follow = await Follow.findOneAndDelete({
      follower: followerId,
      following: followingId
    });

    if (!follow) {
      return res.status(404).json({ 
        error: 'You are not following this user' 
      });
    }

    // Обновляем счетчики у пользователей
    await Promise.all([
      User.findByIdAndUpdate(followerId, { 
        $inc: { followingCount: -1 } 
      }),
      User.findByIdAndUpdate(followingId, { 
        $inc: { followersCount: -1 } 
      })
    ]);

    // Удаляем уведомление о подписке (если оно есть)
    try {
      await Notification.findOneAndDelete({
        recipient: followingId,
        sender: followerId,
        type: 'follow'
      });

      // Follow notification removed
    } catch (notificationError) {
      console.error('❌ Error removing follow notification:', notificationError);
      // Не прерываем выполнение если уведомление не удалилось
    }

    res.json({
      message: 'Successfully unfollowed user',
      isFollowing: false
    });

  } catch (error) {
    console.error('❌ Unfollow user error:', error);
    res.status(500).json({ 
      error: 'Failed to unfollow user' 
    });
  }
};

// Получить подписчиков пользователя
const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Get followers request

    // Проверяем существует ли пользователь
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Получаем подписчиков с пагинацией
    const followers = await Follow.getFollowers(userId, page, limit);
    const totalFollowers = await Follow.getFollowersCount(userId);
    const totalPages = Math.ceil(totalFollowers / limit);

    // Проверяем подписан ли текущий пользователь на каждого из подписчиков
    const currentUserId = req.user?._id;
    const followersWithStatus = await Promise.all(
      followers.map(async (follow) => {
        const isFollowing = currentUserId ? 
          await Follow.isFollowing(currentUserId, follow.follower._id) : false;
        
        return {
          _id: follow._id,
          user: follow.follower,
          followedAt: follow.createdAt,
          isFollowing
        };
      })
    );

    res.json({
      followers: followersWithStatus,
      pagination: {
        currentPage: page,
        totalPages,
        totalFollowers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Get followers error:', error);
    res.status(500).json({ 
      error: 'Failed to get followers' 
    });
  }
};

// Получить подписки пользователя
const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Get following request

    // Проверяем существует ли пользователь
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Получаем подписки с пагинацией
    const following = await Follow.getFollowing(userId, page, limit);
    const totalFollowing = await Follow.getFollowingCount(userId);
    const totalPages = Math.ceil(totalFollowing / limit);

    // Проверяем подписан ли текущий пользователь на каждого из подписок
    const currentUserId = req.user?._id;
    const followingWithStatus = await Promise.all(
      following.map(async (follow) => {
        const isFollowing = currentUserId ? 
          await Follow.isFollowing(currentUserId, follow.following._id) : false;
        
        return {
          _id: follow._id,
          user: follow.following,
          followedAt: follow.createdAt,
          isFollowing
        };
      })
    );

    res.json({
      following: followingWithStatus,
      pagination: {
        currentPage: page,
        totalPages,
        totalFollowing,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Get following error:', error);
    res.status(500).json({ 
      error: 'Failed to get following' 
    });
  }
};

// Проверить статус подписки
const getFollowStatus = async (req, res) => {
  try {
    const followerId = req.user._id;
    const { userId: followingId } = req.params;

    // Get follow status request

    const isFollowing = await Follow.isFollowing(followerId, followingId);
    const isFollowedBy = await Follow.isFollowing(followingId, followerId);

    res.json({
      isFollowing,
      isFollowedBy,
      isMutual: isFollowing && isFollowedBy
    });

  } catch (error) {
    console.error('❌ Get follow status error:', error);
    res.status(500).json({ 
      error: 'Failed to get follow status' 
    });
  }
};

// Получить взаимные подписки
const getMutualFollows = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId: targetUserId } = req.params;

    // Get mutual follows request

    const mutualFollows = await Follow.getMutualFollows(currentUserId, targetUserId);

    res.json({
      mutualFollows: mutualFollows.map(follow => ({
        _id: follow._id,
        user: follow.following,
        followedAt: follow.createdAt
      })),
      count: mutualFollows.length
    });

  } catch (error) {
    console.error('❌ Get mutual follows error:', error);
    res.status(500).json({ 
      error: 'Failed to get mutual follows' 
    });
  }
};

// Получить рекомендации для подписки
const getFollowSuggestions = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    // Get follow suggestions request

    // Получаем пользователей на которых уже подписан текущий пользователь
    const currentFollowing = await Follow.find({ follower: currentUserId })
      .select('following');
    const followingIds = currentFollowing.map(f => f.following);
    followingIds.push(currentUserId); // Исключаем самого себя

    // Находим популярных пользователей которых еще не подписан
    const suggestions = await User.find({
      _id: { $nin: followingIds }
    })
    .select('username fullName profileImage followersCount')
    .sort({ followersCount: -1 })
    .limit(limit);

    res.json({
      suggestions
    });

  } catch (error) {
    console.error('❌ Get follow suggestions error:', error);
    res.status(500).json({ 
      error: 'Failed to get follow suggestions' 
    });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
  getMutualFollows,
  getFollowSuggestions
}; 