const Message = require('../models/messageModel');
const User = require('../models/userModel');
const cloudinary = require('../config/cloudinary');

// Отправка сообщения
const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, image, messageType = 'text' } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required' });
    }

    if (!text && !image) {
      return res.status(400).json({ error: 'Either text or image is required' });
    }

    // Проверяем существование получателя
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Определяем тип сообщения
    let finalMessageType = messageType;
    if (image && !text) {
      finalMessageType = 'image';
    } else if (image && text) {
      finalMessageType = 'image'; // Сообщение с изображением и текстом
    }

    // Создаем сообщение
    const messageData = {
      sender: senderId,
      receiver: receiverId,
      messageType: finalMessageType
    };

    if (text && text.trim()) {
      messageData.text = text.trim();
    }

    if (image) {
      messageData.image = image;
    }

    const message = new Message(messageData);
    await message.save();

    // Получаем полную информацию о сообщении с данными отправителя
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username fullName profileImage')
      .populate('receiver', 'username fullName profileImage');

    // Отправляем сообщение через Socket.io
    if (req.io) {
      // Отправляем получателю
      req.io.to(`user_${receiverId}`).emit('receiveMessage', populatedMessage);
      
      // Отправляем отправителю для подтверждения
      req.io.to(`user_${senderId}`).emit('messageSent', populatedMessage);
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Получение сообщений между двумя пользователями
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .populate('sender', 'username fullName profileImage')
    .populate('receiver', 'username fullName profileImage')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Message.countDocuments({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    });

    res.json({
      messages: messages.reverse(), // Возвращаем в хронологическом порядке
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Получение списка чатов пользователя
const getChats = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Получаем последние сообщения для каждого чата
    const chats = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserId },
            { receiver: currentUserId }
          ]
        }
      },
      {
        $addFields: {
          otherUser: {
            $cond: {
              if: { $eq: ['$sender', currentUserId] },
              then: '$receiver',
              else: '$sender'
            }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$otherUser',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ['$receiver', currentUserId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                then: 1,
                else: 0
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          _id: 1,
          otherUser: {
            _id: '$userInfo._id',
            username: '$userInfo.username',
            fullName: '$userInfo.fullName',
            profileImage: '$userInfo.profileImage'
          },
          lastMessage: {
            _id: '$lastMessage._id',
            text: '$lastMessage.text',
            image: '$lastMessage.image',
            createdAt: '$lastMessage.createdAt',
            sender: '$lastMessage.sender',
            receiver: '$lastMessage.receiver'
          },
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json({ chats });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Отметка сообщений как прочитанных
const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false
      },
      {
        isRead: true
      }
    );

    // Уведомляем отправителя о прочтении через Socket.io
    if (req.io) {
      req.io.to(`user_${userId}`).emit('messagesRead', {
        readBy: currentUserId,
        chatWith: userId
      });
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Удаление сообщения
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Проверяем, является ли пользователь отправителем
    if (message.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await Message.findByIdAndDelete(messageId);

    // Уведомляем получателя об удалении через Socket.io
    if (req.io) {
      req.io.to(`user_${message.receiver}`).emit('messageDeleted', {
        messageId,
        deletedBy: currentUserId
      });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Получение общего количества непрочитанных сообщений
const getUnreadMessagesCount = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const unreadCount = await Message.countDocuments({
      receiver: currentUserId,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread messages count error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Поиск пользователей для начала чата
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user._id;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } }
      ]
    })
    .select('username fullName profileImage')
    .limit(20);

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Отправка поста пользователю
const sharePost = async (req, res) => {
  try {
    const { recipientId, postId, message: customMessage } = req.body;
    const senderId = req.user._id;

    if (!recipientId || !postId) {
      return res.status(400).json({ error: 'Recipient ID and Post ID are required' });
    }

    // Проверяем существование получателя
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Проверяем существование поста
    const Post = require('../models/postModel');
    const post = await Post.findById(postId).populate('author', 'username fullName profileImage');
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Создаем сообщение с типом "shared_post"
    const messageData = {
      sender: senderId,
      receiver: recipientId,
      messageType: 'shared_post',
      text: customMessage || `Shared a post`,
      sharedPost: {
        postId: post._id,
        image: post.image,
        caption: post.caption,
        author: {
          _id: post.author._id,
          username: post.author.username,
          fullName: post.author.fullName,
          profileImage: post.author.profileImage
        }
      }
    };

    const message = new Message(messageData);
    await message.save();

    // Получаем полную информацию о сообщении с данными отправителя
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username fullName profileImage')
      .populate('receiver', 'username fullName profileImage');

    // Отправляем сообщение через Socket.io
    if (req.io) {
      // Отправляем получателю
      req.io.to(`user_${recipientId}`).emit('receiveMessage', populatedMessage);
      
      // Отправляем отправителю для подтверждения
      req.io.to(`user_${senderId}`).emit('messageSent', populatedMessage);
    }

    res.status(201).json({
      message: 'Post shared successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Отправка медиа-сообщения (голосовое или видео)
const sendMediaMessage = async (req, res) => {
  try {
    const { receiverId, messageType } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required' });
    }

    if (!req.files || (!req.files.audio && !req.files.video)) {
      return res.status(400).json({ error: 'Media file is required' });
    }

    // Проверяем существование получателя
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    let mediaUrl = null;
    let finalMessageType = messageType;

    try {
      if (req.files.audio) {
        // Загружаем голосовое сообщение в Cloudinary
        const audioFile = req.files.audio[0];
        
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'video', // Cloudinary использует 'video' для аудио файлов
              format: 'mp3',
              transformation: [
                { quality: 'auto' },
                { fetch_format: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(audioFile.buffer);
        });

        mediaUrl = uploadResult.secure_url;
        finalMessageType = 'voice';
      }

      if (req.files.video) {
        // Загружаем видеосообщение в Cloudinary
        const videoFile = req.files.video[0];
        
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'video',
              format: 'mp4',
              transformation: [
                { quality: 'auto' },
                { width: 300, height: 300, crop: 'fill' }, // Квадратное видео как в Telegram
                { duration: 60 } // Максимум 60 секунд
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(videoFile.buffer);
        });

        mediaUrl = uploadResult.secure_url;
        finalMessageType = 'video_note';
      }
    } catch (uploadError) {
      console.error('Media upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload media file' });
    }

    // Создаем сообщение
    const messageData = {
      sender: senderId,
      receiver: receiverId,
      messageType: finalMessageType,
      mediaUrl: mediaUrl
    };

    const message = new Message(messageData);
    await message.save();

    // Получаем полную информацию о сообщении с данными отправителя
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username fullName profileImage')
      .populate('receiver', 'username fullName profileImage');

    // Отправляем сообщение через Socket.io
    if (req.io) {
      // Отправляем получателю
      req.io.to(`user_${receiverId}`).emit('receiveMessage', populatedMessage);
      
      // Отправляем отправителю для подтверждения
      req.io.to(`user_${senderId}`).emit('messageSent', populatedMessage);
    }

    res.status(201).json({
      message: 'Media message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Send media message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getChats,
  markAsRead,
  deleteMessage,
  getUnreadMessagesCount,
  searchUsers,
  sharePost,
  sendMediaMessage
}; 