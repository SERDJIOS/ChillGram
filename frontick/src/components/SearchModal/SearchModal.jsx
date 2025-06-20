import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './SearchModal.module.css'
import DefaultProfilePic from '../../assets/profile.png'
import { API_CONFIG } from '../../config/api.js';

const SearchModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const navigate = useNavigate()

  // Загружаем недавние поиски при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      loadRecentSearches()
    }
  }, [isOpen])

  // Поиск пользователей с задержкой
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery)
      }, 300) // Задержка 300мс для оптимизации

      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const loadRecentSearches = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Можно добавить API для получения недавних поисков
      // Пока используем localStorage
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
      setRecentSearches(recent.slice(0, 5)) // Показываем только последние 5
    } catch (error) {
      console.error('Error loading recent searches:', error)
    }
  }

  const searchUsers = async (query) => {
    if (!query.trim()) return

    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${API_CONFIG.API_URL}/users/search?query=${encodeURIComponent(query)}`, {
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

  const handleUserClick = (user) => {
    // Сохраняем в недавние поиски
    saveToRecentSearches(user)
    
    // Закрываем модальное окно
    onClose()
    
    // Переходим на страницу пользователя
    navigate(`/user/${user._id}`)
  }

  const saveToRecentSearches = (user) => {
    try {
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
      
      // Удаляем пользователя если он уже есть в списке
      const filtered = recent.filter(item => item._id !== user._id)
      
      // Добавляем в начало списка
      const updated = [user, ...filtered].slice(0, 10) // Храним максимум 10
      
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      setRecentSearches(updated.slice(0, 5))
    } catch (error) {
      console.error('Error saving to recent searches:', error)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
  }

  const clearRecentSearches = () => {
    localStorage.removeItem('recentSearches')
    setRecentSearches([])
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Search</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.searchContainer}>
          <div className={styles.searchInputContainer}>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
            {searchQuery && (
              <button className={styles.clearButton} onClick={clearSearch}>
                ×
              </button>
            )}
          </div>
        </div>

        <div className={styles.content}>
          {isLoading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
            </div>
          )}

          {!searchQuery && recentSearches.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>Recent</h3>
                <button 
                  className={styles.clearAllButton}
                  onClick={clearRecentSearches}
                >
                  Clear all
                </button>
              </div>
              <div className={styles.usersList}>
                {recentSearches.map((user) => (
                  <div
                    key={user._id}
                    className={styles.userItem}
                    onClick={() => handleUserClick(user)}
                  >
                    <div className={styles.userAvatar}>
                      <img
                        src={user.profileImage || DefaultProfilePic}
                        alt={user.username}
                        onError={(e) => {
                          e.target.src = DefaultProfilePic
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

          {searchQuery && searchResults.length > 0 && (
            <div className={styles.usersList}>
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className={styles.userItem}
                  onClick={() => handleUserClick(user)}
                >
                  <div className={styles.userAvatar}>
                    <img
                      src={user.profileImage || DefaultProfilePic}
                      alt={user.username}
                      onError={(e) => {
                        e.target.src = DefaultProfilePic
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
          )}

          {searchQuery && !isLoading && searchResults.length === 0 && (
            <div className={styles.noResults}>
              <p>No results found.</p>
            </div>
          )}

          {!searchQuery && recentSearches.length === 0 && (
            <div className={styles.noResults}>
              <p>No recent searches.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchModal 