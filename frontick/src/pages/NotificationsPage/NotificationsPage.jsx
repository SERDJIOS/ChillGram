import React from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'
import styles from './NotificationsPage.module.css'

const NotificationsPage = () => {
  const navigate = useNavigate()

  return (
    <div className={styles.notificationsPageContainer}>
      <Sidebar />
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Notifications</h1>
          <p>Click on the notifications icon in the sidebar to see your notifications!</p>
        </div>
        
        <div className={styles.info}>
          <div className={styles.infoCard}>
            <h3>📱 How to use notifications</h3>
            <ul>
              <li>Click the bell icon in the sidebar to open notifications</li>
              <li>You'll see notifications for likes, comments, and new followers</li>
              <li>Click on any notification to navigate to the related content</li>
              <li>Red badge shows unread notifications count</li>
            </ul>
          </div>
          
          <div className={styles.infoCard}>
            <h3>🔔 Notification types</h3>
            <ul>
              <li><strong>❤️ Likes:</strong> When someone likes your post</li>
              <li><strong>💬 Comments:</strong> When someone comments on your post</li>
              <li><strong>👤 Follows:</strong> When someone starts following you</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage 