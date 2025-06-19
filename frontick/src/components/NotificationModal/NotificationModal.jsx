import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './NotificationModal.module.css'
import defaultAvatar from '../../assets/default_profile_pic.png'
import { API_CONFIG } from '../../config/api.js';

const NotificationModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [followingStatus, setFollowingStatus] = useState({})
  const [followLoading, setFollowLoading] = useState({})
  const modalRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.classList.contains(styles.overlay)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('${API_CONFIG.API_URL}/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
        
        const followNotifications = data.notifications.filter(n => n.type === 'follow')
        if (followNotifications.length > 0) {
          await checkFollowingStatus(followNotifications)
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkFollowingStatus = async (followNotifications) => {
    try {
      const token = localStorage.getItem('token')
      const statusPromises = followNotifications.map(async (notification) => {
        const response = await fetch(`${API_CONFIG.API_URL}/follow/${notification.sender._id}/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          return {
            userId: notification.sender._id,
            isFollowing: data.isFollowing
          }
        }
        return {
          userId: notification.sender._id,
          isFollowing: false
        }
      })

      const statuses = await Promise.all(statusPromises)
      const statusMap = {}
      statuses.forEach(status => {
        statusMap[status.userId] = status.isFollowing
      })
      
      setFollowingStatus(statusMap)
    } catch (error) {
      console.error('Error checking following status:', error)
    }
  }

  const handleFollowBack = async (userId, event) => {
    event.stopPropagation()
    
    try {
      setFollowLoading(prev => ({ ...prev, [userId]: true }))
      const token = localStorage.getItem('token')
      
      const isCurrentlyFollowing = followingStatus[userId]
      
      if (isCurrentlyFollowing) {
        await fetch(`${API_CONFIG.API_URL}/follow/${userId}/follow`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        setFollowingStatus(prev => ({ ...prev, [userId]: false }))
      } else {
        await fetch(`${API_CONFIG.API_URL}/follow/${userId}/follow`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        setFollowingStatus(prev => ({ ...prev, [userId]: true }))
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }))
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      
      await fetch(`${API_CONFIG.API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // Обновляем локальное состояние
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      
      await fetch('${API_CONFIG.API_URL}/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // Обновляем локальное состояние
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleNotificationClick = (notification) => {
    // Отмечаем как прочитанное
    if (!notification.isRead) {
      markAsRead(notification._id)
    }

    // Навигация в зависимости от типа уведомления
    switch (notification.type) {
      case 'like':
      case 'comment':
        if (notification.post) {
          // Переходим к посту (можно открыть модальное окно поста)
          onClose()
        }
        break
      case 'follow':
        // Переходим к профилю пользователя
        navigate(`/user/${notification.sender._id}`)
        onClose()
        break
      default:
        break
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60))
      return diffInMinutes < 1 ? 'now' : `${diffInMinutes}m`
    } else if (diffInHours < 24) {
      return `${diffInHours}h`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 7) {
        return `${diffInDays}d`
      } else {
        return date.toLocaleDateString()
      }
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return '❤️'
      case 'comment':
        return '💬'
      case 'follow':
        return '👤'
      default:
        return '🔔'
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div 
        className={styles.modal}
        ref={modalRef}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>Notifications</h3>
          {unreadCount > 0 && (
            <button 
              className={styles.markAllButton}
              onClick={markAllAsRead}
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
           
            </div>
          ) : notifications.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🔔</div>
              <h4>No notifications yet</h4>
              <p>When someone likes or comments on your posts, you'll see it here.</p>
            </div>
          ) : (
            <div className={styles.notificationsList}>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`${styles.notificationItem} ${
                    !notification.isRead ? styles.unread : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={styles.avatarContainer}>
                    <img
                      src={notification.sender?.profileImage || defaultAvatar}
                      alt={notification.sender?.username}
                      className={styles.avatar}
                    />
                    <div className={styles.typeIcon}>
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  <div className={styles.notificationContent}>
                    <div className={styles.message}>
                      <span className={styles.username}>
                        {notification.sender?.username}
                      </span>
                      <span className={styles.text}>
                        {notification.message}
                      </span>
                    </div>
                    <div className={styles.time}>
                      {formatTime(notification.createdAt)}
                    </div>
                  </div>

                  {notification.type === 'follow' && (
                    <div className={styles.followButtonContainer}>
                      <button
                        className={`${styles.followButton} ${
                          followingStatus[notification.sender._id] ? styles.following : styles.follow
                        }`}
                        onClick={(e) => handleFollowBack(notification.sender._id, e)}
                        disabled={followLoading[notification.sender._id]}
                      >
                        {followingStatus[notification.sender._id] ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  )}

                  {notification.post?.imageUrl && (
                    <div className={styles.postPreview}>
                      <img
                        src={notification.post.imageUrl}
                        alt="Post"
                        className={styles.postImage}
                      />
                    </div>
                  )}

                  {!notification.isRead && (
                    <div className={styles.unreadDot}></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationModal 