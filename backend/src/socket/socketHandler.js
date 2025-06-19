const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Message = require('../models/messageModel');

// Хранилище активных пользователей
const activeUsers = new Map();

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    // Socket auth attempt
    
    if (!token) {
      console.error('❌ Socket auth: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    // Verifying JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // JWT decoded successfully
    
    // Looking for user in database
    
    // Check total users in database
    const totalUsers = await User.countDocuments();
    // Total users count logged
    
    // Find sample user for debugging
    const anyUser = await User.findOne().select('_id username email');
    // Sample user logged
    
    // Find all users for debugging
    const allUsers = await User.find().select('_id username email').limit(5);
    // All users logged
    
    const user = await User.findById(decoded.userId).select('-password');
    // User search result
    
    if (!user) {
      console.error('❌ Socket auth: User not found for ID:', decoded.userId);
      
      // Try search by different methods
      const userByString = await User.findOne({ _id: decoded.userId.toString() }).select('-password');
      // User search by string ID
      
      const userByObjectId = await User.findOne({ _id: require('mongoose').Types.ObjectId(decoded.userId) }).select('-password');
      // User search by ObjectId
      
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    // Socket auth successful for user
    next();
  } catch (error) {
    console.error('❌ Socket auth error:', error.message);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Authentication error: Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }
    next(new Error('Authentication error'));
  }
};

const handleConnection = (io) => {
  // Middleware для аутентификации
  io.use(socketAuth);

  io.on('connection', (socket) => {
    // User connected with socket ID

    // Присоединяем пользователя к его персональной комнате
    const userRoom = `user_${socket.userId}`;
    socket.join(userRoom);
    
    // Добавляем пользователя в список активных
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      lastSeen: new Date()
    });

    // Уведомляем других пользователей о том, что пользователь онлайн
    socket.broadcast.emit('userOnline', {
      userId: socket.userId,
      username: socket.user.username
    });

    // Обработка отправки сообщения через Socket
    socket.on('sendMessage', async (data) => {
      try {
        const { receiverId, text, messageType = 'text' } = data;

        if (!receiverId || !text) {
          socket.emit('error', { message: 'Receiver ID and text are required' });
          return;
        }

        // Проверяем существование получателя
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          socket.emit('error', { message: 'Receiver not found' });
          return;
        }

        // Создаем сообщение
        const message = new Message({
          sender: socket.userId,
          receiver: receiverId,
          text: text.trim(),
          messageType
        });

        await message.save();

        // Получаем полную информацию о сообщении
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username fullName profileImage')
          .populate('receiver', 'username fullName profileImage');

        // Отправляем получателю
        io.to(`user_${receiverId}`).emit('receiveMessage', populatedMessage);
        
        // Подтверждаем отправителю
        socket.emit('messageSent', populatedMessage);

        // Message sent from user to user
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Обработка отметки сообщений как прочитанных
    socket.on('markAsRead', async (data) => {
      try {
        const { senderId } = data;

        await Message.updateMany(
          {
            sender: senderId,
            receiver: socket.userId,
            isRead: false
          },
          {
            isRead: true
          }
        );

        // Уведомляем отправителя о прочтении
        io.to(`user_${senderId}`).emit('messagesRead', {
          readBy: socket.userId,
          chatWith: senderId
        });

        // Messages marked as read by user
      } catch (error) {
        console.error('Mark as read error:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    // Обработка набора текста
    socket.on('typing', (data) => {
      const { receiverId, isTyping } = data;
      io.to(`user_${receiverId}`).emit('userTyping', {
        userId: socket.userId,
        username: socket.user.username,
        isTyping
      });
    });

    // Обработка отключения
    socket.on('disconnect', () => {
      // User disconnected
      
      // Удаляем пользователя из списка активных
      activeUsers.delete(socket.userId);
      
      // Уведомляем других пользователей о том, что пользователь офлайн
      socket.broadcast.emit('userOffline', {
        userId: socket.userId,
        username: socket.user.username,
        lastSeen: new Date()
      });
    });

    // Получение списка активных пользователей
    socket.on('getActiveUsers', () => {
      const activeUsersList = Array.from(activeUsers.values()).map(userData => ({
        userId: userData.user._id,
        username: userData.user.username,
        fullName: userData.user.fullName,
        profileImage: userData.user.profileImage,
        lastSeen: userData.lastSeen
      }));
      
      socket.emit('activeUsers', activeUsersList);
    });
  });
};

// Функция для получения активных пользователей
const getActiveUsers = () => {
  return Array.from(activeUsers.values());
};

// Функция для проверки, онлайн ли пользователь
const isUserOnline = (userId) => {
  return activeUsers.has(userId);
};

module.exports = {
  handleConnection,
  getActiveUsers,
  isUserOnline
}; 