import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './Sidebar.module.css'
import CreatePostModal from '../CreatePostModal/CreatePostModal'
import NotificationModal from '../NotificationModal/NotificationModal'
import SearchModal from '../SearchModal/SearchModal'
import NotificationBadge from '../NotificationBadge/NotificationBadge'
import ChillgramLogo from '../../assets/sidebar.png'

// Импорт иконок
import homeIcon from '../../assets/nav_icons/home/home.svg'
import homeFillIcon from '../../assets/nav_icons/home/home_fill.svg'
import searchIcon from '../../assets/nav_icons/search/search.svg'
import searchFillIcon from '../../assets/nav_icons/search/search_fill.svg'
import exploreIcon from '../../assets/nav_icons/explore/explore.svg'
import exploreFillIcon from '../../assets/nav_icons/explore/explore_fill.svg'
import messagesIcon from '../../assets/nav_icons/messages/messages.svg'
import messagesFillIcon from '../../assets/nav_icons/messages/messages_fill.svg'
import notificationsIcon from '../../assets/nav_icons/notifications/notifications.svg'
import notificationsFillIcon from '../../assets/nav_icons/notifications/notifications_fill.png'
import createIcon from '../../assets/nav_icons/create/create.svg'
import createFillIcon from '../../assets/nav_icons/create/create_fill.svg'
import profileIcon from '../../assets/default_profile_pic.png'
import logoutIcon from '../../assets/nav_icons/logout.svg'
import { API_CONFIG } from '../../config/api.js';

const Sidebar = ({ onPostCreated }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [hoveredItem, setHoveredItem] = useState(null)

  // Загружаем количество непрочитанных уведомлений и сообщений при загрузке компонента
  useEffect(() => {
    fetchUnreadCount()
    fetchUnreadMessagesCount()
    
    // Обновляем каждые 30 секунд
    const interval = setInterval(() => {
      fetchUnreadCount()
      fetchUnreadMessagesCount()
    }, 30000)

    // Слушаем событие обновления счетчика сообщений
    const handleMessagesRead = () => {
      fetchUnreadMessagesCount()
    }
    
    window.addEventListener('messagesRead', handleMessagesRead)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('messagesRead', handleMessagesRead)
    }
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${API_CONFIG.API_URL}/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const fetchUnreadMessagesCount = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('No auth token found for fetching unread messages count')
        return
      }

      const response = await fetch(`${API_CONFIG.API_URL}/messages/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUnreadMessagesCount(data.unreadCount || 0)
      } else {
        console.error('Failed to fetch unread messages count:', response.status, response.statusText)
        // Не устанавливаем счетчик в 0, оставляем предыдущее значение
      }
    } catch (error) {
      console.error('Error fetching unread messages count:', error)
      // Не устанавливаем счетчик в 0, оставляем предыдущее значение
    }
  }

  const menuItems = [
    {
      id: 'home',
      label: 'Home',
      path: '/feed',
      icon: homeIcon,
      fillIcon: homeFillIcon
    },
    {
      id: 'search',
      label: 'Search',
      path: '/search',
      icon: searchIcon,
      fillIcon: searchFillIcon
    },
    {
      id: 'explore',
      label: 'Explore',
      path: '/explore',
      icon: exploreIcon,
      fillIcon: exploreFillIcon
    },
    {
      id: 'messages',
      label: 'Messages',
      path: '/messages',
      icon: messagesIcon,
      fillIcon: messagesFillIcon
    },
    {
      id: 'notifications',
      label: 'Notifications',
      path: '/notifications',
      icon: notificationsIcon,
      fillIcon: notificationsFillIcon
    },
    {
      id: 'create',
      label: 'Create',
      path: '/create',
      icon: createIcon,
      fillIcon: createFillIcon
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/profile',
      icon: profileIcon,
      fillIcon: profileIcon
    }
  ]

  const handleNavigation = (path, itemId, event) => {
    if (itemId === 'create') {
      setIsCreateModalOpen(true)
    } else if (itemId === 'notifications') {
      event.preventDefault()
      setIsNotificationModalOpen(!isNotificationModalOpen)
    } else if (itemId === 'search') {
      event.preventDefault()
      setIsSearchModalOpen(!isSearchModalOpen)
    } else {
      navigate(path)
    }
  }

  const handleCloseNotificationModal = () => {
    setIsNotificationModalOpen(false)
    // Обновляем количество непрочитанных после закрытия
    fetchUnreadCount()
  }

  const handleCloseSearchModal = () => {
    setIsSearchModalOpen(false)
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  // Функция для определения какую иконку показывать
  const getIconToShow = (item) => {
    const isItemActive = isActive(item.path)
    const isItemHovered = hoveredItem === item.id
    
    // Показываем заполненную иконку если элемент активен или на него наведен курсор
    return (isItemActive || isItemHovered) ? item.fillIcon : item.icon
  }

  const handleCreatePost = async (postData) => {
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      
      // Поддержка множественных изображений
      if (postData.images && postData.images.length > 0) {
        // Новый формат - массив изображений
        postData.images.forEach((image) => {
          formData.append('images', image)
        })
      } else if (postData.image) {
        // Старый формат - одно изображение (для совместимости)
      formData.append('image', postData.image)
      }
      
      formData.append('caption', postData.caption)

      const response = await fetch(`${API_CONFIG.API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to create post')
      }

      await response.json()
      // Post created successfully
      

      
      // Вызываем callback для обновления ленты
      if (onPostCreated) {
        onPostCreated()
      }
      
      // Обновляем страницу, если мы на профиле
      if (location.pathname === '/profile') {
        window.location.reload()
      }
      
    } catch (error) {
      console.error('Error creating post:', error)
      throw error
    }
  }

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
  }



  // Функция выхода из системы
  const handleLogout = () => {
    // Очищаем данные из localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('signupEmail')
    
    // Перенаправляем на страницу логина
    navigate('/login')
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        <img 
          src={ChillgramLogo} 
          alt="Chillgram" 
          className={styles.logoImage}
        />
      </div>
      
      <nav className={styles.navigation}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            data-item={item.id}
            className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
            onClick={(event) => handleNavigation(item.path, item.id, event)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className={styles.iconContainer}>
              <img 
                src={getIconToShow(item)} 
                alt={item.label}
                className={`${styles.icon} ${item.id === 'profile' ? styles.profileIcon : ''}`}
              />
              {/* Мобильные уведомления на иконках */}
              {item.id === 'notifications' && unreadCount > 0 && (
                <div className={styles.mobileNotificationBadge}>
                  <NotificationBadge count={unreadCount} />
                </div>
              )}
              {item.id === 'messages' && unreadMessagesCount > 0 && (
                <div className={styles.mobileNotificationBadge}>
                  <NotificationBadge count={unreadMessagesCount} />
                </div>
              )}
            </div>
            <div className={styles.labelContainer}>
              <span className={styles.label}>{item.label}</span>
              {/* Десктопные уведомления рядом с текстом */}
              {item.id === 'notifications' && unreadCount > 0 && (
                <div className={styles.desktopNotificationBadge}>
                <NotificationBadge count={unreadCount} />
                </div>
              )}
              {item.id === 'messages' && unreadMessagesCount > 0 && (
                <div className={styles.desktopNotificationBadge}>
                <NotificationBadge count={unreadMessagesCount} />
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Кнопка логаута */}
        <div className={styles.logoutSection}>
          <div
            className={`${styles.navItem} ${styles.logoutItem}`}
            onClick={handleLogout}
          >
            <div className={styles.iconContainer}>
              <img 
                src={logoutIcon} 
                alt="Logout"
                className={styles.icon}
              />
            </div>
            <span className={styles.label}>Logout</span>
          </div>
        </div>
      </nav>

      <CreatePostModal 
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onCreatePost={handleCreatePost}
      />



      <NotificationModal 
        isOpen={isNotificationModalOpen}
        onClose={handleCloseNotificationModal}
      />

      <SearchModal 
        isOpen={isSearchModalOpen}
        onClose={handleCloseSearchModal}
      />
    </div>
  )
}

export default Sidebar 