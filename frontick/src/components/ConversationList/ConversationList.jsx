import React, { useState, useEffect } from 'react'
import styles from './ConversationList.module.css'

const ConversationList = ({ 
  conversations, 
  onChatSelect, 
  selectedChat, 
  activeUsers 
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const defaultAvatar = '/default-avatar.png'

  const filteredConversations = (conversations || []).filter(chat =>
    chat?.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Поиск пользователей в базе данных
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/profile/search/users?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          // Фильтруем пользователей, которые уже есть в разговорах
          const existingUserIds = conversations.map(conv => conv.otherUser._id)
          const newUsers = data.users.filter(user => !existingUserIds.includes(user.id))
          setSearchResults(newUsers)
        }
      } catch (error) {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const timeoutId = setTimeout(searchUsers, 300) // Debounce
    return () => clearTimeout(timeoutId)
  }, [searchQuery, conversations])

  const handleUserSelect = (user) => {
    // Создаем объект чата для нового пользователя
    const newChat = {
      otherUser: {
        _id: user.id, // Преобразуем id в _id
        username: user.username,
        fullName: user.fullName,
        profileImage: user.profileImage,
        followersCount: user.followersCount,
        followStatus: user.followStatus
      },
      lastMessage: null,
      unreadCount: 0
    }
    onChatSelect(newChat)
    setSearchQuery('') // Очищаем поиск
  }

  const formatLastMessageTime = (dateString) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`
    } else if (diffInHours < 168) { // 7 дней
      return `${Math.floor(diffInHours / 24)}d`
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const getLastMessagePreview = (message) => {
    if (!message) return 'Start a conversation'
    
    // Если сообщение - поделенный пост
    if (message.messageType === 'shared_post') {
      return '📷 Shared a post'
    }
    
    // Если сообщение содержит изображение
    if (message.image) {
      return message.text ? `📷 ${message.text}` : '📷 Photo'
    }
    
    // Обычное текстовое сообщение
    return message.text || 'Message'
  }

  const isUserOnline = (userId) => {
    return activeUsers && activeUsers.has && activeUsers.has(userId)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.title}>Messages</h2>
        </div>
      </div>

      <div className={styles.searchContainer}>
        <div className={styles.searchInputContainer}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <input
            type="text"
            placeholder="Search users and conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.chatsList}>
        {/* Показываем результаты поиска пользователей, если есть поисковый запрос */}
        {searchQuery.trim().length >= 2 && (
          <>
            {isSearching && (
              <div className={styles.searchingIndicator}>
                <div className={styles.searchingText}>Searching users...</div>
              </div>
            )}
            
            {searchResults.length > 0 && (
              <div className={styles.searchSection}>
                <div className={styles.sectionTitle}>Users</div>
                {searchResults.map((user) => (
                  <div
                    key={`search-${user.id}`}
                    className={styles.chatItem}
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className={styles.chatAvatarContainer}>
                      <img
                        src={user.profileImage || defaultAvatar}
                        alt={user.username}
                        className={styles.chatAvatar}
                      />
                      {isUserOnline(user.id) && (
                        <div className={styles.onlineIndicator}></div>
                      )}
                    </div>
                    
                    <div className={styles.chatInfo}>
                      <div className={styles.chatHeader}>
                        <span className={styles.chatUsername}>
                          {user.username}
                        </span>
                      </div>
                      
                      <div className={styles.chatPreview}>
                        <span className={styles.lastMessage}>
                          {user.fullName || 'Start a conversation'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Показываем отфильтрованные разговоры */}
        {filteredConversations.length > 0 && (
          <>
            {searchQuery.trim().length >= 2 && (
              <div className={styles.sectionTitle}>Conversations</div>
            )}
            {filteredConversations.map((chat) => {
              if (!chat.otherUser) return null;
              
              return (
                <div
                  key={chat.otherUser._id}
                  className={`${styles.chatItem} ${
                    selectedChat?.otherUser._id === chat.otherUser._id ? styles.selected : ''
                  }`}
                  onClick={() => onChatSelect(chat)}
                >
                  <div className={styles.chatAvatarContainer}>
                    <img
                      src={chat.otherUser.profileImage || defaultAvatar}
                      alt={chat.otherUser.username}
                      className={styles.chatAvatar}
                    />
                    {isUserOnline(chat.otherUser._id) && (
                      <div className={styles.onlineIndicator}></div>
                    )}
                  </div>
                  
                  <div className={styles.chatInfo}>
                    <div className={styles.chatHeader}>
                      <span className={styles.chatUsername}>
                        {chat.otherUser.username}
                      </span>
                      {chat.lastMessage && (
                        <span className={styles.chatTime}>
                          {formatLastMessageTime(chat.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    
                    <div className={styles.chatPreview}>
                      <span className={`${styles.lastMessage} ${
                        chat.unreadCount > 0 ? styles.unread : ''
                      }`}>
                        {getLastMessagePreview(chat.lastMessage)}
                      </span>
                      {chat.unreadCount > 0 && (
                        <div className={styles.unreadBadge}>
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </>
        )}

        {/* Показываем сообщение "нет результатов", только если нет поискового запроса и нет разговоров */}
        {searchQuery.trim().length === 0 && filteredConversations.length === 0 && (
          <div className={styles.noChats}>
            <div className={styles.noChatsIcon}>💬</div>
            <div className={styles.noChatsText}>No messages yet</div>
            <div className={styles.noChatsSubtext}>Start a conversation with your friends</div>
          </div>
        )}

        {/* Показываем сообщение "нет результатов поиска" */}
        {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && filteredConversations.length === 0 && (
          <div className={styles.noChats}>
            <div className={styles.noChatsIcon}>🔍</div>
            <div className={styles.noChatsText}>No results found</div>
            <div className={styles.noChatsSubtext}>Try searching for a different username</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConversationList 