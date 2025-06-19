const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  // Пользователь который подписывается (субъект подписки)
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Пользователь на которого подписываются (объект подписки)
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Дата создания подписки
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Составной индекс для быстрого поиска и предотвращения дублирования
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Индексы для быстрого поиска подписчиков и подписок
followSchema.index({ follower: 1 });
followSchema.index({ following: 1 });

// Валидация: пользователь не может подписаться сам на себя
followSchema.pre('save', function(next) {
  if (this.follower.toString() === this.following.toString()) {
    const error = new Error('User cannot follow themselves');
    return next(error);
  }
  next();
});

// Виртуальное поле для получения информации о подписке
followSchema.virtual('isActive').get(function() {
  return true; // Если запись существует, подписка активна
});

// Методы для работы с подписками
followSchema.statics.isFollowing = async function(followerId, followingId) {
  const follow = await this.findOne({
    follower: followerId,
    following: followingId
  });
  return !!follow;
};

followSchema.statics.getFollowersCount = async function(userId) {
  return await this.countDocuments({ following: userId });
};

followSchema.statics.getFollowingCount = async function(userId) {
  return await this.countDocuments({ follower: userId });
};

followSchema.statics.getFollowers = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return await this.find({ following: userId })
    .populate('follower', 'username fullName profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

followSchema.statics.getFollowing = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return await this.find({ follower: userId })
    .populate('following', 'username fullName profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Метод для получения взаимных подписок
followSchema.statics.getMutualFollows = async function(userId, targetUserId) {
  const userFollowing = await this.find({ follower: userId })
    .populate('following', '_id');
  
  const targetFollowing = await this.find({ follower: targetUserId })
    .populate('following', '_id');
  
  const userFollowingIds = userFollowing.map(f => f.following._id.toString());
  const targetFollowingIds = targetFollowing.map(f => f.following._id.toString());
  
  const mutualIds = userFollowingIds.filter(id => targetFollowingIds.includes(id));
  
  return await this.find({ 
    follower: userId,
    following: { $in: mutualIds }
  }).populate('following', 'username fullName profileImage');
};

const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow; 