const mongoose = require('mongoose');
require('dotenv').config();

// Импорт моделей для создания коллекций
const User = require('../models/userModel');
const Post = require('../models/postModel');
const Like = require('../models/likeModel');
const Comment = require('../models/commentModel');
const Follow = require('../models/followModel');
const Notification = require('../models/notificationModel');

const runMigration = async () => {
  try {
    console.log('🚀 Starting initial database setup...');

    // Подключение к MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Создание индексов для пользователей
    console.log('📝 Creating user indexes...');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ username: 'text', fullName: 'text' });
    console.log('✅ User indexes created');

    // Создание индексов для постов
    console.log('📝 Creating post indexes...');
    await Post.collection.createIndex({ author: 1, createdAt: -1 });
    await Post.collection.createIndex({ createdAt: -1 });
    await Post.collection.createIndex({ tags: 1 });
    console.log('✅ Post indexes created');

    // Создание индексов для лайков
    console.log('📝 Creating like indexes...');
    await Like.collection.createIndex({ user: 1, post: 1 }, { unique: true });
    await Like.collection.createIndex({ post: 1 });
    await Like.collection.createIndex({ user: 1 });
    console.log('✅ Like indexes created');

    // Создание индексов для комментариев
    console.log('📝 Creating comment indexes...');
    await Comment.collection.createIndex({ post: 1, createdAt: -1 });
    await Comment.collection.createIndex({ author: 1 });
    console.log('✅ Comment indexes created');

    // Создание индексов для подписок
    console.log('📝 Creating follow indexes...');
    await Follow.collection.createIndex({ follower: 1, following: 1 }, { unique: true });
    await Follow.collection.createIndex({ follower: 1 });
    await Follow.collection.createIndex({ following: 1 });
    console.log('✅ Follow indexes created');

    // Создание индексов для уведомлений
    console.log('📝 Creating notification indexes...');
    await Notification.collection.createIndex({ recipient: 1, createdAt: -1 });
    await Notification.collection.createIndex({ recipient: 1, isRead: 1 });
    await Notification.collection.createIndex({ sender: 1 });
    console.log('✅ Notification indexes created');

    console.log('🎉 Initial database setup completed successfully!');
    
    // Показываем статистику коллекций
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📊 Created collections:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Запуск миграции если файл вызван напрямую
if (require.main === module) {
  runMigration();
}

module.exports = runMigration; 