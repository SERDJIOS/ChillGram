const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  image: {
    type: String,
    required: false // Теперь не обязательно, так как будет images
  },
  images: {
    type: [String], // Массив строк для множественных изображений
    default: []
  },
  caption: {
    type: String,
    default: ''
  },
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Индекс для быстрого поиска постов по автору
postSchema.index({ author: 1, createdAt: -1 });

// Индекс для быстрого поиска постов по дате создания
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema); 