const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  image: {
    type: String // URL или base64 строка изображения
  },
  isRead: {
    type: Boolean,
    default: false
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'shared_post'],
    default: 'text'
  },
  sharedPost: {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    image: String,
    caption: String,
    author: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      username: String,
      fullName: String,
      profileImage: String
    }
  }
}, {
  timestamps: true
});

// Индекс для быстрого поиска сообщений между пользователями
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

// Индекс для поиска непрочитанных сообщений
messageSchema.index({ receiver: 1, isRead: 1 });

// Виртуальное поле для создания уникального ID чата между двумя пользователями
messageSchema.virtual('chatId').get(function() {
  const ids = [this.sender.toString(), this.receiver.toString()].sort();
  return ids.join('_');
});

module.exports = mongoose.model('Message', messageSchema); 