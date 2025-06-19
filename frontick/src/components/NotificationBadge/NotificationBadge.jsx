import React, { useState, useEffect } from 'react'
import styles from './NotificationBadge.module.css'

const NotificationBadge = ({ count }) => {
  const [displayCount, setDisplayCount] = useState(0)

  useEffect(() => {
    setDisplayCount(count)
  }, [count])

  if (displayCount === 0) return null

  return (
    <div className={styles.badge}>
      {displayCount > 99 ? '99+' : displayCount}
    </div>
  )
}

export default NotificationBadge 