import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import io from 'socket.io-client'
import ConversationList from '../../components/ConversationList/ConversationList'
import ChatWindow from '../../components/ChatWindow/ChatWindow'
import Sidebar from '../../components/Sidebar/Sidebar'
import styles from './MessagesPage.module.css'

const MessagesPage = () => {
  const [conversations, setConversations] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState(null)
  const [activeUsers, setActiveUsers] = useState(new Set())
  const [isConnected, setIsConnected] = useState(false)
  const [showChatList, setShowChatList] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 905)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Обновляем isMobile при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 905)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      // Инициализация Socket.IO
      const newSocket = io('http://localhost:3001', {
        auth: {
          token: token
        }
      })

      newSocket.on('connect', () => {
        setIsConnected(true)
        setError(null)
      })

      newSocket.on('disconnect', () => {
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        setError('Failed to connect to server')
      })

      newSocket.on('activeUsers', (users) => {
        setActiveUsers(new Set(users))
      })

      newSocket.on('newMessage', (message) => {
        try {
          // Обновляем список сообщений
          setConversations(prev => {
            return prev.map(conv => {
              if (conv.otherUser._id === message.sender._id || 
                  conv.otherUser._id === message.receiver._id) {
                return {
                  ...conv,
                  lastMessage: message,
                  unreadCount: conv.otherUser._id === message.sender._id ? 
                    (conv.unreadCount || 0) + 1 : conv.unreadCount
                }
              }
              return conv
            })
          })
        } catch (error) {
        }
      })

      newSocket.on('messageSent', (message) => {
        try {
  
          // Обновляем список разговоров для отправителя
          setConversations(prev => {
            const existingConv = prev.find(conv => conv.otherUser._id === message.receiver._id);
            
            if (existingConv) {
              // Обновляем существующий разговор
              return prev.map(conv => 
                conv.otherUser._id === message.receiver._id 
                  ? { ...conv, lastMessage: message }
                  : conv
              );
            } else {
              // Если чата нет, создаем новый разговор
              const newConversation = {
                otherUser: message.receiver,
                lastMessage: message,
                unreadCount: 0
              };
              return [newConversation, ...prev];
            }
          });
        } catch (error) {

        }
      })

      newSocket.on('userTyping', ({ userId, isTyping }) => {
        // Обработка индикатора печатания
      })

      setSocket(newSocket)
      fetchConversations()

      return () => {
        newSocket.disconnect()
      }
    } catch (error) {
      setError('Failed to initialize messages')
    }
  }, [navigate])

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/messages/chats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const data = await response.json()
      setConversations(data.chats || [])
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const handleChatSelect = useCallback(async (chat) => {
    setSelectedChat(chat)
    if (isMobile) {
      setShowChatList(false)
    }
    
    // Отмечаем сообщения как прочитанные на сервере, если есть непрочитанные
    if (chat.unreadCount > 0) {
      try {
        const token = localStorage.getItem('token')
        await fetch(`http://localhost:3001/api/messages/read/${chat.otherUser._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        // Уведомляем Sidebar об обновлении счетчика
        window.dispatchEvent(new CustomEvent('messagesRead'))
      } catch (error) {
        console.error('Error marking messages as read:', error)
      }
    }
    
    // Сбрасываем счетчик непрочитанных сообщений локально
    setConversations(prev => 
      prev.map(conv => 
        conv.otherUser._id === chat.otherUser._id 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    )
  }, [isMobile])

  const handleUserChat = useCallback(async (userId) => {
    try {
      // Сначала проверяем, есть ли уже чат с этим пользователем
      const existingChat = conversations.find(conv => conv.otherUser._id === userId)
      
      if (existingChat) {
        // Если чат уже существует, просто выбираем его
        handleChatSelect(existingChat)
        // Очищаем URL параметр
        navigate('/messages', { replace: true })
        return
      }

      // Если чата нет, получаем информацию о пользователе и создаем новый чат
      const token = localStorage.getItem('token')
      const userResponse = await fetch(`http://localhost:3001/api/profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user profile')
      }

      const userData = await userResponse.json()
      
      // Создаем объект чата для нового пользователя
      const newChat = {
        otherUser: userData.user,
        lastMessage: null,
        unreadCount: 0
      }
      
      // Выбираем новый чат
      setSelectedChat(newChat)
      if (isMobile) {
        setShowChatList(false)
      }

      // Очищаем URL параметр
      navigate('/messages', { replace: true })

    } catch (error) {
      // В случае ошибки просто очищаем URL параметр
      navigate('/messages', { replace: true })
    }
  }, [conversations, isMobile, navigate, handleChatSelect])

  // Обрабатываем URL параметр для автоматического открытия чата
  useEffect(() => {
    const userId = searchParams.get('user')
    if (userId && conversations.length > 0) {
      handleUserChat(userId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, conversations.length])

  const handleBackToList = () => {
    setShowChatList(true)
    setSelectedChat(null)
  }

  const handleSendMessage = async (messageText) => {
    if (!selectedChat || !socket) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedChat.otherUser._id,
          text: messageText
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      // Убираем socket.emit - сообщение уже отправляется через HTTP API
      // и будет получено через Socket.io события от сервера (messageSent/receiveMessage)
      // Дублирование socket.emit вызывало появление двух одинаковых сообщений

      // Обновляем список разговоров
      setConversations(prev => {
        const existingConv = prev.find(conv => conv.otherUser._id === selectedChat.otherUser._id)
        
        if (existingConv) {
          // Обновляем существующий разговор
          return prev.map(conv => 
            conv.otherUser._id === selectedChat.otherUser._id 
              ? { ...conv, lastMessage: data.data }
              : conv
          )
        } else {
          // Добавляем новый разговор в начало списка
          const newConversation = {
            ...selectedChat,
            lastMessage: data.data
          }
          return [newConversation, ...prev]
        }
      })

      return data.data
    } catch (error) {
      throw error
    }
  }

  const sendTyping = (receiverId) => {
    if (socket) {
      socket.emit('typing', { receiverId, isTyping: true })
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <Sidebar />
        <div className={styles.loadingContainer}>
          <div className={styles.loading}>Loading conversations...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Sidebar />
        <div className={styles.loadingContainer}>
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.messagesContainer}>
        {/* Список разговоров */}
        <div className={`${styles.conversationPanel} ${
          isMobile && !showChatList ? styles.hidden : ''
        }`}>
          <ConversationList
            conversations={conversations}
            onChatSelect={handleChatSelect}
            selectedChat={selectedChat}
            activeUsers={activeUsers}
          />
        </div>

        {/* Окно чата */}
        <div className={`${styles.chatPanel} ${
          isMobile && showChatList ? styles.hidden : ''
        }`}>
          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              onSendMessage={handleSendMessage}
              onBack={isMobile ? handleBackToList : null}
              sendTyping={sendTyping}
              activeUsers={activeUsers}
              isConnected={isConnected}
              socket={socket}
            />
          ) : (
            <div className={styles.noChatSelected}>
              <div className={styles.noChatContent}>
                <div className={styles.messageIcon}>💬</div>
                <h3>Your Messages</h3>
                <p>Send private photos and messages to a friend or group.</p>
                <button 
                  className={styles.sendMessageButton}
                  onClick={() => {
                    // Можно добавить логику для открытия поиска пользователей
                  }}
                >
                  Send Message
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessagesPage 