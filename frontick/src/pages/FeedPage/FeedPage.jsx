import React, { useState, useEffect } from 'react'
import axios from 'axios'
import PostCard from '../../components/PostCard/PostCard'
import Sidebar from '../../components/Sidebar/Sidebar'
import { API_CONFIG } from '../../config/api.js'
import styles from './FeedPage.module.css'
import sidebarLogo from '../../assets/sidebar.png'

const FeedPage = () => {
  const [posts, setPosts] = useState([])
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    // Получаем ID текущего пользователя
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setCurrentUserId(user.id)
    
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_CONFIG.API_URL}/posts`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      
      // API возвращает объект с полем posts
      const postsData = response.data.posts || []
      
      // Сортируем посты по дате создания (новые сначала)
      const sortedPosts = postsData.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )
      
      setPosts(sortedPosts)
      setError('')
    } catch (error) {
      console.error('Error fetching posts:', error)
      setError('Failed to load posts. Please try again.')
    }
  }

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please log in to like posts')
        return
      }

      // Оптимистичное обновление - сначала обновляем UI
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            const newIsLiked = !post.isLiked
            const newLikesCount = newIsLiked 
              ? post.likesCount + 1
              : post.likesCount - 1
            
            return {
              ...post,
              isLiked: newIsLiked,
              likesCount: Math.max(0, newLikesCount)
            }
          }
          return post
        })
      )

      // Затем отправляем запрос на сервер
      await axios.post(
        `${API_CONFIG.API_URL}/likes/${postId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

    } catch (error) {
      console.error('Error liking post:', error)
      setError('Failed to like post')
      // В случае ошибки откатываем изменения
      fetchPosts()
    }
  }

  const handleComment = async (postId, commentText, updatedComments) => {
    try {
      // Если переданы updatedComments, это означает обновление после удаления комментария
      if (updatedComments !== undefined) {
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? { 
                  ...post, 
                  comments: updatedComments,
                  commentsCount: updatedComments.length
                }
              : post
          )
        )
        return
      }

      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please log in to comment')
        return
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}')
      
      // Оптимистичное обновление - сначала добавляем комментарий в UI
      const newComment = {
        _id: 'temp-' + Date.now(), // Временный ID
        text: commentText,
        author: {
          _id: user.id,
          username: user.username,
          profileImage: user.profileImage
        },
        createdAt: new Date().toISOString()
      }

      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              comments: [...(post.comments || []), newComment],
              commentsCount: post.commentsCount + 1
            }
          }
          return post
        })
      )

      // Затем отправляем запрос на сервер
      const response = await axios.post(
        `${API_CONFIG.API_URL}/comments/${postId}`,
        { text: commentText },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      // Обновляем пост с реальным комментарием от сервера
      if (response.data.comment) {
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post._id === postId) {
              const updatedComments = post.comments.map(comment => 
                comment._id === newComment._id ? response.data.comment : comment
              )
              return {
                ...post,
                comments: updatedComments
              }
            }
            return post
          })
        )
      }

    } catch (error) {
      console.error('Error adding comment:', error)
      setError('Failed to add comment')
      // В случае ошибки откатываем изменения
      fetchPosts()
    }
  }

  const handleEditPost = async (postId, newCaption) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please log in to edit posts')
        return
      }

      // Оптимистичное обновление - сначала обновляем пост в UI
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId 
            ? { ...post, caption: newCaption }
            : post
        )
      )

      // Затем отправляем запрос на сервер
      await axios.put(
        `${API_CONFIG.API_URL}/posts/${postId}`,
        { caption: newCaption },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

    } catch (error) {
      console.error('Error editing post:', error)
      setError('Failed to edit post')
      // В случае ошибки восстанавливаем посты
      fetchPosts()
    }
  }

  const handleDeletePost = async (postId) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please log in to delete posts')
        return
      }

      // Оптимистичное обновление - сначала удаляем пост из UI
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId))

      // Затем отправляем запрос на сервер
      await axios.delete(
        `${API_CONFIG.API_URL}/posts/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

    } catch (error) {
      console.error('Error deleting post:', error)
      setError('Failed to delete post')
      // В случае ошибки восстанавливаем посты
      fetchPosts()
    }
  }

  return (
    <div className={styles.feedPageContainer}>
      <Sidebar onPostCreated={fetchPosts} />
      <div className={styles.content}>
        {/* Мобильный хедер */}
        <div className={styles.mobileHeader}>
          <img src={sidebarLogo} alt="Sidebar Logo" className={styles.mobileLogo} />
        </div>
        
        <div className={styles.feedContainer}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.postsContainer}>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeedPage 