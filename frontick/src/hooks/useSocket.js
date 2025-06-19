import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Socket connection attempt
    
    if (!token) {
      console.warn('❌ No token found, skipping socket connection');
      return;
    }

    if (!user) {
      console.warn('❌ No user data found in localStorage');
      return;
    }

    // Проверяем, что токен не пустой и имеет правильный формат
    if (token.length < 10) {
      console.error('❌ Token seems too short:', token.length);
      return;
    }

    // Проверяем, что пользователь корректно парсится
    try {
      const userData = JSON.parse(user);
      if (!userData.id) {
        console.error('❌ User data missing ID:', userData);
        return;
      }
      // User data valid
    } catch (e) {
      console.error('❌ Invalid user data in localStorage:', e);
      return;
    }

    // Проверяем валидность токена перед подключением к Socket.IO
    const verifyToken = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/auth/verify-token', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('❌ Token verification failed:', response.status);
          // Очищаем недействительный токен
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return false;
        }

        const data = await response.json();
        // Token verified successfully
        return true;
      } catch (error) {
        console.error('❌ Token verification error:', error);
        return false;
      }
    };

    // Проверяем токен перед подключением
    verifyToken().then(isValid => {
      if (!isValid) {
        console.warn('❌ Invalid token, skipping socket connection');
        return;
      }

      // Creating Socket.IO connection

    // Создаем подключение к Socket.io
    socketRef.current = io('http://localhost:3001', {
      auth: {
        token: token
      },
        autoConnect: true,
        timeout: 20000,
        forceNew: true
    });

    const socket = socketRef.current;

    // Обработчики событий подключения
    socket.on('connect', () => {
      // Connected to Socket.io server
      // Socket ID logged
      setIsConnected(true);
      
      // Запрашиваем список активных пользователей
      socket.emit('getActiveUsers');
    });

    socket.on('disconnect', () => {
      // Disconnected from Socket.io server
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
        
        // Если ошибка аутентификации, возможно нужно обновить токен
        if (error.message.includes('Authentication') || error.message.includes('token')) {
          console.warn('🔄 Authentication error, token might be invalid');
          // Можно добавить логику для обновления токена или редиректа на логин
        }
    });

    // Обработчики событий пользователей
    socket.on('userOnline', (data) => {
      // User came online
      setActiveUsers(prev => {
        const exists = prev.find(user => user.userId === data.userId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    });

    socket.on('userOffline', (data) => {
      // User went offline
      setActiveUsers(prev => prev.filter(user => user.userId !== data.userId));
    });

    socket.on('activeUsers', (users) => {
      // Active users logged
      setActiveUsers(users);
      });
    });

    // Cleanup при размонтировании
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Функция для отправки сообщения
  const sendMessage = (receiverId, text, messageType = 'text') => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      // Создаем уникальный ID для сообщения
      const messageId = Date.now() + Math.random();
      
      // Слушаем подтверждение отправки
      const handleMessageSent = (message) => {
        socketRef.current.off('messageSent', handleMessageSent);
        socketRef.current.off('error', handleError);
        resolve(message);
      };

      const handleError = (error) => {
        socketRef.current.off('messageSent', handleMessageSent);
        socketRef.current.off('error', handleError);
        reject(new Error(error.message || 'Failed to send message'));
      };

      socketRef.current.on('messageSent', handleMessageSent);
      socketRef.current.on('error', handleError);

      // Отправляем сообщение
      socketRef.current.emit('sendMessage', {
        receiverId,
        text,
        messageType,
        messageId
      });

      // Таймаут на случай если ответ не придет
      setTimeout(() => {
        socketRef.current.off('messageSent', handleMessageSent);
        socketRef.current.off('error', handleError);
        reject(new Error('Message send timeout'));
      }, 10000);
    });
  };

  // Функция для отметки сообщений как прочитанных
  const markAsRead = (senderId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('markAsRead', { senderId });
    }
  };

  // Функция для уведомления о наборе текста
  const sendTyping = (receiverId, isTyping) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing', { receiverId, isTyping });
    }
  };

  // Функция для подписки на события
  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  // Функция для отписки от событий
  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    activeUsers,
    sendMessage,
    markAsRead,
    sendTyping,
    on,
    off
  };
};

export default useSocket; 