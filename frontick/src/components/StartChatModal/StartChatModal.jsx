import React, { useState, useEffect } from 'react'
import styles from './StartChatModal.module.css'
import { API_CONFIG } from '../../config/api.js'

const StartChatModal = ({ isOpen, onClose, onUserSelect }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentChats, setRecentChats] = useState([])

  // Поиск пользователей с задержкой
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery)
      }, 300)

      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  // Загружаем недавние чаты при открытии
  useEffect(() => {
    if (isOpen) {
      loadRecentChats()
    }
  }, [isOpen])

  const loadRecentChats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_CONFIG.API_URL}/messages/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRecentChats(data.chats?.slice(0, 5) || [])
      }
    } catch (error) {
      console.error('Error loading recent chats:', error)
    }
  }

  const searchUsers = async (query) => {
    if (!query.trim()) return

    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_CONFIG.API_URL}/profile/search/users?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users || [])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error searching users:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserSelect = (user) => {
    onUserSelect(user)
    onClose()
    setSearchQuery('')
    setSearchResults([])
  }

  const handleRecentChatSelect = (chat) => {
    onUserSelect(chat.otherUser)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>New Message</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.searchContainer}>
          <div className={styles.searchInputContainer}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
            {searchQuery && (
              <button 
                className={styles.clearButton} 
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className={styles.content}>
          {isLoading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <span>Searching...</span>
            </div>
          )}

          {/* Показываем недавние чаты, если нет поискового запроса */}
          {!searchQuery && recentChats.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Recent Chats</h3>
              <div className={styles.usersList}>
                {recentChats.map((chat) => (
                  <div
                    key={`recent-${chat.otherUser._id}`}
                    className={styles.userItem}
                    onClick={() => handleRecentChatSelect(chat)}
                  >
                    <div className={styles.userAvatar}>
                      <img
                        src={chat.otherUser.profileImage || '/default-avatar.png'}
                        alt={chat.otherUser.username}
                        onError={(e) => {
                          e.target.src = '/default-avatar.png'
                        }}
                      />
                    </div>
                    <div className={styles.userInfo}>
                      <div className={styles.username}>{chat.otherUser.username}</div>
                      <div className={styles.fullName}>{chat.otherUser.fullName}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Показываем результаты поиска */}
          {searchQuery && searchResults.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Users</h3>
              <div className={styles.usersList}>
                {searchResults.map((user) => (
                  <div
                    key={`search-${user.id}`}
                    className={styles.userItem}
                    onClick={() => handleUserSelect({
                      _id: user.id,
                      username: user.username,
                      fullName: user.fullName,
                      profileImage: user.profileImage
                    })}
                  >
                    <div className={styles.userAvatar}>
                      <img
                        src={user.profileImage || '/default-avatar.png'}
                        alt={user.username}
                        onError={(e) => {
                          e.target.src = '/default-avatar.png'
                        }}
                      />
                    </div>
                    <div className={styles.userInfo}>
                      <div className={styles.username}>{user.username}</div>
                      <div className={styles.fullName}>{user.fullName}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Показываем сообщение если нет результатов */}
          {searchQuery && !isLoading && searchResults.length === 0 && (
            <div className={styles.noResults}>
              <p>No users found for "{searchQuery}"</p>
            </div>
          )}

          {/* Показываем сообщение если нет недавних чатов */}
          {!searchQuery && recentChats.length === 0 && (
            <div className={styles.noResults}>
              <p>Start typing to search for users</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StartChatModal 