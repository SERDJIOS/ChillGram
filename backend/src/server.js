const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/userModel');
const auth = require('./middlewares/auth');
const multer = require('multer');
const { handleConnection } = require('./socket/socketHandler');
require('dotenv').config();

// Импорт маршрутов
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const likeRoutes = require('./routes/likeRoutes');
const commentRoutes = require('./routes/commentRoutes');
const followRoutes = require('./routes/followRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();
const server = http.createServer(app);

// Настройка Socket.io
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5000',
      'http://localhost:5001', 
      'http://localhost:5002',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Подключение к MongoDB
connectDB();

// Middleware для передачи io в контроллеры
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5000',
    'http://localhost:5001', 
    'http://localhost:5002',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Настройка multer для загрузки изображений
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB максимум
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/profile', profileRoutes);



// Debug роут
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({
      count: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Базовый маршрут
app.get('/', (req, res) => {
  res.json({ 
    message: 'Instagram Clone API with Real-time Messaging',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      posts: '/api/posts',
      likes: '/api/likes',
      comments: '/api/comments',
      follow: '/api/follow',
      notifications: '/api/notifications',
      messages: '/api/messages',
      profile: '/api/profile',
      debug: '/api/debug'
    },
    socketEvents: {
      sendMessage: 'Send a message to another user',
      receiveMessage: 'Receive a message from another user',
      markAsRead: 'Mark messages as read',
      typing: 'Notify when user is typing',
      userOnline: 'User came online',
      userOffline: 'User went offline'
    }
  });
});

// Обработка 404 ошибок
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Глобальная обработка ошибок
app.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }
  
  if (error.name === 'MulterError') {
    return res.status(400).json({ error: 'File upload error: ' + error.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Инициализация Socket.io
handleConnection(io);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for real-time messaging`);
}); 