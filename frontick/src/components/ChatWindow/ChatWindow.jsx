import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './ChatWindow.module.css'
import VideoCall from '../VideoCall/VideoCall'
import { API_CONFIG } from '../../config/api.js';

const ChatWindow = ({ 
  chat, 
  onSendMessage, 
  onBack, 
  sendTyping, 
  activeUsers, 
  isConnected,
  socket
}) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [typingTimeout, setTypingTimeout] = useState(null)
  const [modalImage, setModalImage] = useState(null)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [showVoiceCall, setShowVoiceCall] = useState(false)
  const [isIncomingCall, setIsIncomingCall] = useState(false)
  const [callType, setCallType] = useState('video') // 'video' или 'audio'
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState(null)
  const [showImageOptions, setShowImageOptions] = useState(false)
  const [showMessageMenu, setShowMessageMenu] = useState(null)
  const [editingMessage, setEditingMessage] = useState(null)
  const [editText, setEditText] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const defaultAvatar = '/default-avatar.png'
  const navigate = useNavigate()

  // Загружаем сообщения при выборе чата
  useEffect(() => {
    if (chat?.otherUser?._id) {
      fetchMessages()
    }
  }, [chat?.otherUser?._id])

  // Автоскролл к последнему сообщению
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Фокус на поле ввода
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [chat])

  // Обработка новых сообщений через Socket.io
  useEffect(() => {
    if (!socket || !chat?.otherUser?._id) return

    const handleReceiveMessage = (message) => {
      // Добавляем только сообщения от других пользователей (не наши собственные)
      if (message.sender._id === chat.otherUser._id && message.receiver._id === currentUser.id) {
        setMessages(prev => {
          // Проверяем, что сообщение еще не добавлено
          const exists = prev.some(msg => msg._id === message._id);
          if (!exists) {
            return [...prev, message];
          }
          return prev;
        });
      }
    };

    const handleMessageSent = (message) => {
      // Добавляем только наши собственные отправленные сообщения
      if (message.sender._id === currentUser.id && message.receiver._id === chat.otherUser._id) {
        setMessages(prev => {
          // Проверяем, что сообщение еще не добавлено
          const exists = prev.some(msg => msg._id === message._id);
          if (!exists) {
            return [...prev, message];
          }
          return prev;
        });
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageSent', handleMessageSent);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageSent', handleMessageSent);
    };
  }, [socket, chat?.otherUser?._id, currentUser.id])

  // Закрытие emoji picker при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false)
      }
      if (showMessageMenu && !event.target.closest('.message-menu-container')) {
        setShowMessageMenu(null)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (modalImage) {
          closeImageModal()
        } else if (showEmojiPicker) {
          setShowEmojiPicker(false)
        } else if (showMessageMenu) {
          setShowMessageMenu(null)
        } else if (editingMessage) {
          handleCancelEdit()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showEmojiPicker, modalImage, showMessageMenu, editingMessage])

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  const fetchMessages = async () => {
    if (!chat?.otherUser?._id) return

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${API_CONFIG.API_URL}/messages/chat/${chat.otherUser._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if ((!newMessage.trim() && !selectedImage) || sending) return

    const messageText = newMessage.trim()
    setNewMessage('')
    setSending(true)

    try {
      if (selectedImage) {
        // Отправляем изображение
        await handleImageSend(messageText)
      } else {
        // Отправляем обычное текстовое сообщение
        await onSendMessage(messageText)
      }
      
      // Не добавляем сообщение локально - оно придет через Socket.io
    } catch (error) {
      // Возвращаем текст в поле ввода при ошибке
      setNewMessage(messageText)
    } finally {
      setSending(false)
      // Очищаем выбранное изображение
      clearSelectedImage()
    }
  }

  const handleImageSend = async (text) => {
    if (!selectedImage || !imagePreview) return null



    try {
      // Отправляем сообщение с base64 изображением напрямую
      const token = localStorage.getItem('token')
      const messageResponse = await fetch('${API_CONFIG.API_URL}/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: chat.otherUser._id,
          text: text || '',
          image: imagePreview // Используем base64 из превью
        })
      })

      if (!messageResponse.ok) {
        const errorText = await messageResponse.text()
        throw new Error('Failed to send message')
      }

      const messageData = await messageResponse.json()
      return messageData.data
    } catch (error) {
      throw error
    }
  }

  const handleInputChange = (e) => {
    setNewMessage(e.target.value)
    
    // Отправляем индикатор печатания
    if (sendTyping && chat.otherUser._id) {
      sendTyping(chat.otherUser._id)
      
      // Очищаем предыдущий таймаут
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
      
      // Устанавливаем новый таймаут для остановки индикатора печатания
      const timeout = setTimeout(() => {
        // Здесь можно добавить логику для остановки индикатора печатания
      }, 1000)
      
      setTypingTimeout(timeout)
    }
  }

  const handleImageUpload = () => {
    setShowImageOptions(true)
  }

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
    setShowImageOptions(false)
  }

  const openCamera = async () => {
    setShowImageOptions(false)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment' // Предпочитаем заднюю камеру на мобильных
          }
        })
        
        setStream(mediaStream)
        setShowCamera(true)
        
        // Ждем, пока видео элемент будет готов
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream
            videoRef.current.play()
          }
        }, 100)
      } else {
        // Fallback для старых браузеров - используем input с capture
        const cameraInput = document.getElementById('cameraInput')
        if (cameraInput) {
          cameraInput.click()
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      // Fallback - открываем обычный выбор файла
      const cameraInput = document.getElementById('cameraInput')
      if (cameraInput) {
        cameraInput.click()
      }
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      // Устанавливаем размеры canvas равными размерам видео
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Рисуем текущий кадр видео на canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Конвертируем canvas в blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Создаем File объект из blob
          const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' })
          setSelectedImage(file)
          
          // Создаем превью
          const reader = new FileReader()
          reader.onload = (e) => {
            setImagePreview(e.target.result)
          }
          reader.readAsDataURL(file)
          
          // Закрываем камеру
          closeCamera()
        }
      }, 'image/jpeg', 0.8)
    }
  }

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  const handleCameraCapture = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedImage(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    
    if (file) {
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // Проверяем размер файла (максимум 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }

      setSelectedImage(file)
      
      // Создаем превью изображения
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearSelectedImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleEmojiClick = (emoji) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleEmojiToggle = () => {
    setShowEmojiPicker(!showEmojiPicker)
  }

  const openImageModal = (imageUrl) => {
    setModalImage(imageUrl)
  }

  const closeImageModal = () => {
    setModalImage(null)
  }

  const handleVideoCall = () => {
    setCallType('video')
    setIsIncomingCall(false)
    setShowVideoCall(true)
  }

  const handleVoiceCall = () => {
    setCallType('audio')
    setIsIncomingCall(false)
    setShowVoiceCall(true)
  }

  const closeVideoCall = () => {
    setShowVideoCall(false)
  }

  const closeVoiceCall = () => {
    setShowVoiceCall(false)
  }

  const handleSharedPostClick = (postId) => {
    // Shared post clicked
    if (!postId) {
      console.error('No postId provided');
      return;
    }
    // Переходим на страницу поста
    navigate(`/post/${postId}`)
  }

  const handleUserProfileClick = () => {
    // Переходим на профиль собеседника
    navigate(`/user/${chat.otherUser._id}`)
  }

  const handleMessageClick = (message) => {
    // Показываем контекстное меню только для собственных сообщений
    if (message.sender._id === currentUser.id) {
      setShowMessageMenu(message._id)
    }
  }

  const handleDeleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_CONFIG.API_URL}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Удаляем сообщение из локального списка
        setMessages(prev => prev.filter(msg => msg._id !== messageId))
        setShowMessageMenu(null)
      }
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const handleEditMessage = (message) => {
    setEditingMessage(message._id)
    setEditText(message.text || '')
    setShowMessageMenu(null)
  }

  const handleSaveEdit = async () => {
    if (!editText.trim() || !editingMessage) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_CONFIG.API_URL}/messages/${editingMessage}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: editText.trim()
        })
      })

      if (response.ok) {
        const updatedMessage = await response.json()
        // Обновляем сообщение в локальном списке
        setMessages(prev => prev.map(msg => 
          msg._id === editingMessage ? { ...msg, text: editText.trim(), edited: true } : msg
        ))
        setEditingMessage(null)
        setEditText('')
      }
    } catch (error) {
      console.error('Error editing message:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingMessage(null)
    setEditText('')
  }

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else if (diffInHours < 168) { // 7 дней
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
  }

  const isUserOnline = (userId) => {
    return activeUsers && activeUsers.has && activeUsers.has(userId)
  }

  const groupMessagesByDate = (messages) => {
    const groups = []
    let currentGroup = null
    
    messages.forEach(message => {
      const messageDate = new Date(message.createdAt).toDateString()
      
      if (!currentGroup || currentGroup.date !== messageDate) {
        currentGroup = {
          date: messageDate,
          messages: [message]
        }
        groups.push(currentGroup)
      } else {
        currentGroup.messages.push(message)
      }
    })
    
    return groups
  }

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString)
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    
    if (dateString === today) {
      return 'Today'
    } else if (dateString === yesterday) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  // Список эмодзи
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
    '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾'
  ]

  if (!chat) return null

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className={styles.container}>
      {/* Заголовок чата */}
      <div className={styles.header}>
        {onBack && (
          <button className={styles.backButton} onClick={onBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path 
                d="M19 12H5M12 19l-7-7 7-7" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        
        <div className={styles.chatInfo}>
          <div className={styles.avatarContainer}>
            <img 
              src={chat.otherUser.profileImage || defaultAvatar} 
              alt={chat.otherUser.username}
              className={styles.avatar}
              onClick={handleUserProfileClick}
              style={{ cursor: 'pointer' }}
            />
            {isUserOnline(chat.otherUser._id) && (
              <div className={styles.onlineIndicator}></div>
            )}
          </div>
          
          <div className={styles.userInfo} onClick={handleUserProfileClick} style={{ cursor: 'pointer' }}>
            <div className={styles.username}>{chat.otherUser.username}</div>
            <div className={styles.status}>
              {isUserOnline(chat.otherUser._id) ? 'Active now' : 'Offline'}
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.actionButton} title="Video call" onClick={handleVideoCall}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path 
                d="M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v8a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
          
          <button className={styles.actionButton} title="Voice call" onClick={handleVoiceCall}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path 
                d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
          
          <button className={styles.actionButton} title="Info">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Область сообщений */}
      <div className={styles.messagesContainer}>
        {loading ? (
          <div className={styles.loading}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className={styles.noMessages}>
            <div className={styles.noMessagesContent}>
              <img 
                src={chat.otherUser.profileImage || defaultAvatar} 
                alt={chat.otherUser.username}
                className={styles.noMessagesAvatar}
              />
              <h3>{chat.otherUser.username}</h3>
              <p>You haven't chatted with {chat.otherUser.username} yet.</p>
            </div>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messageGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <div className={styles.dateHeader}>
                  {formatDateHeader(group.date)}
                </div>
                
                {group.messages.map((message, index) => {
                  const isOwn = message.sender._id === currentUser.id
                  const showAvatar = !isOwn && (
                    index === group.messages.length - 1 || 
                    group.messages[index + 1]?.sender._id !== message.sender._id
                  )
                  
                  return (
                    <div 
                      key={message._id} 
                      className={`${styles.messageWrapper} ${isOwn ? styles.own : styles.other}`}
                    >
                      {!isOwn && showAvatar && (
                        <img 
                          src={message.sender.profileImage || defaultAvatar} 
                          alt={message.sender.username}
                          className={styles.messageAvatar}
                        />
                      )}
                      
                      <div 
                        className={`${styles.message} ${isOwn ? styles.ownMessage : styles.otherMessage}`}
                        onClick={() => handleMessageClick(message)}
                      >
                        {/* Контекстное меню для собственных сообщений */}
                        {isOwn && showMessageMenu === message._id && (
                          <div className={`${styles.messageMenu} message-menu-container`}>
                            {message.text && (
                              <button 
                                className={styles.menuButton}
                                onClick={() => handleEditMessage(message)}
                              >
                                Edit
                              </button>
                            )}
                            <button 
                              className={styles.menuButton}
                              onClick={() => handleDeleteMessage(message._id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}

                        {/* Проверяем тип сообщения */}
                        {message.messageType === 'shared_post' && message.sharedPost ? (
                          <div 
                            className={`${styles.sharedPost} ${styles.clickablePost}`}
                            onClick={() => handleSharedPostClick(message.sharedPost.postId)}
                            title="Click to view post"
                          >
                            <div className={styles.sharedPostHeader}>
                              <img 
                                src={message.sharedPost.author.profileImage || defaultAvatar} 
                                alt={message.sharedPost.author.username}
                                className={styles.sharedPostAvatar}
                              />
                              <span className={styles.sharedPostAuthor}>
                                {message.sharedPost.author.username}
                              </span>
                            </div>
                            {message.sharedPost.image && (
                              <div className={styles.sharedPostImage}>
                                <img 
                                  src={message.sharedPost.image} 
                                  alt="Shared post"
                                  className={styles.sharedPostImg}
                                />
                              </div>
                            )}
                            {message.sharedPost.caption && (
                              <div className={styles.sharedPostCaption}>
                                {message.sharedPost.caption}
                              </div>
                            )}
                            {message.text && (
                              <div className={styles.sharedPostMessage}>
                                {message.text}
                              </div>
                            )}
                            <div className={styles.sharedPostOverlay}>
                              <div className={styles.viewPostButton}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path 
                                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" 
                                    stroke="currentColor" 
                                    strokeWidth="2"
                                  />
                                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                                <span>View Post</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Проверяем, есть ли изображение в сообщении */}
                            {message.image && (
                              <div className={styles.messageImage}>
                                <img 
                                  src={message.image} 
                                  alt="Shared image"
                                  className={styles.chatImage}
                                  onClick={() => openImageModal(message.image)}
                                />
                              </div>
                            )}
                            {message.text && (
                              <div className={styles.messageText}>
                                {editingMessage === message._id ? (
                                  <div className={styles.editContainer}>
                                    <input
                                      type="text"
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      className={styles.editInput}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSaveEdit()
                                        } else if (e.key === 'Escape') {
                                          handleCancelEdit()
                                        }
                                      }}
                                      autoFocus
                                    />
                                    <div className={styles.editButtons}>
                                      <button 
                                        className={styles.saveButton}
                                        onClick={handleSaveEdit}
                                      >
                                        Save
                                      </button>
                                      <button 
                                        className={styles.cancelButton}
                                        onClick={handleCancelEdit}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {message.text}
                                    {message.edited && (
                                      <span className={styles.editedLabel}> (edited)</span>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </>
                        )}
                        <div className={styles.messageTime}>
                          {formatMessageTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            
            {isTyping && (
              <div className={styles.typingIndicator}>
                <div className={styles.typingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Поле ввода сообщения */}
      <div className={styles.inputContainer}>
        {/* Превью выбранного изображения */}
        {imagePreview && (
          <div className={styles.imagePreview}>
            <div className={styles.previewContainer}>
              <img src={imagePreview} alt="Preview" className={styles.previewImage} />
              <button 
                className={styles.removeImageButton}
                onClick={clearSelectedImage}
                title="Remove image"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M18 6L6 18M6 6l12 12" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className={`${styles.emojiPicker} emoji-picker-container`}>
            <div className={styles.emojiGrid}>
              {emojis.map((emoji, index) => (
                <button
                  key={index}
                  className={styles.emojiButton}
                  onClick={() => handleEmojiClick(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className={styles.inputForm}>
          <div className={styles.inputWrapper}>
            <button 
              type="button" 
              className={styles.imageButton} 
              title="Add photo"
              onClick={handleImageUpload}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
            
            <input
              ref={inputRef}
              type="text"
              placeholder="Message..."
              value={newMessage}
              onChange={handleInputChange}
              className={styles.messageInput}
              disabled={sending || !isConnected}
            />
            
            <button 
              type="button" 
              className={styles.emojiButton} 
              title="Add emoji"
              onClick={handleEmojiToggle}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <button 
              type="submit" 
              className={`${styles.sendButton} ${(newMessage.trim() || selectedImage) ? styles.active : ''}`}
              disabled={(!newMessage.trim() && !selectedImage) || sending || !isConnected}
            >
              {sending ? (
                <div className={styles.sendingSpinner}></div>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M2 21l21-9L2 3v7l15 2-15 2v7z" 
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>
          </div>
        </form>
        
        {/* Скрытый input для загрузки файлов */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {/* Скрытый input для камеры */}
        <input
          id="cameraInput"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          style={{ display: 'none' }}
        />
        
        {!isConnected && (
          <div className={styles.connectionStatus}>
            Connecting...
          </div>
        )}
      </div>

      {/* Модальное окно для просмотра изображения */}
      {modalImage && (
        <div className={styles.imageModal} onClick={closeImageModal}>
          <div className={styles.imageModalContent} onClick={(e) => e.stopPropagation()}>
            <img 
              src={modalImage} 
              alt="Full size" 
              className={styles.imageModalImage}
            />
            <button 
              className={styles.imageModalClose}
              onClick={closeImageModal}
              title="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно выбора способа загрузки изображения */}
      {showImageOptions && (
        <div className={styles.imageOptionsModal} onClick={() => setShowImageOptions(false)}>
          <div className={styles.imageOptionsContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.imageOptionsHeader}>
              <h3>Select Image</h3>
              <button 
                className={styles.imageOptionsClose}
                onClick={() => setShowImageOptions(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.imageOptionsButtons}>
              <div className={styles.uploadIcon}>📷</div>
              <p className={styles.uploadText}>Select photos to share</p>
              <div className={styles.buttonGroup}>
                <button 
                  className={styles.imageOptionButton}
                  onClick={handleFileUpload}
                >
                  Select from computer
                </button>
                <button 
                  className={styles.imageOptionButton}
                  onClick={openCamera}
                >
                  Take a picture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно камеры */}
      {showCamera && (
        <div className={styles.cameraModal} onClick={closeCamera}>
          <div className={styles.cameraContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.cameraHeader}>
              <h3>Take a Picture</h3>
              <button 
                className={styles.cameraClose}
                onClick={closeCamera}
              >
                ×
              </button>
            </div>
            <div className={styles.cameraPreview}>
              <video 
                ref={videoRef}
                className={styles.cameraVideo}
                autoPlay
                playsInline
                muted
              />
              <canvas 
                ref={canvasRef}
                style={{ display: 'none' }}
              />
            </div>
            <div className={styles.cameraControls}>
              <button 
                className={styles.captureButton}
                onClick={capturePhoto}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Capture
              </button>
              <button 
                className={styles.cancelCameraButton}
                onClick={closeCamera}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Видео звонок */}
      <VideoCall
        isOpen={showVideoCall}
        onClose={closeVideoCall}
        otherUser={chat.otherUser}
        callType="video"
        isIncoming={isIncomingCall}
      />

      {/* Аудио звонок */}
      <VideoCall
        isOpen={showVoiceCall}
        onClose={closeVoiceCall}
        otherUser={chat.otherUser}
        callType="audio"
        isIncoming={isIncomingCall}
      />
    </div>
  )
}

export default ChatWindow 