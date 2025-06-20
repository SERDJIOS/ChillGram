import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import PostViewModal from '../../components/PostViewModal/PostViewModal'
import Sidebar from '../../components/Sidebar/Sidebar'
import styles from './OtherProfile.module.css'
import sidebarLogo from '../../assets/sidebar.png'
import DefaultProfilePic from '../../assets/profile.png'
import { API_CONFIG } from '../../config/api.js';
import IconHeart from '../../assets/reactions/like.svg'
import IconComment from '../../assets/reactions/comment.svg'

const OtherProfile = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [postsLoaded, setPostsLoaded] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [showPostModal, setShowPostModal] = useState(false)
  const [currentPostIndex, setCurrentPostIndex] = useState(0)
  
  // Состояния для подписки
  const [followStatus, setFollowStatus] = useState({
    isFollowing: false,
    isFollowedBy: false,
    isMutual: false
  })
  
  // Состояния для модального окна followers/following
  const [showFollowModal, setShowFollowModal] = useState(false)
  const [followModalType, setFollowModalType] = useState('')
  const [followUsers, setFollowUsers] = useState([])
  const [followPage, setFollowPage] = useState(1)
  const [hasMoreFollow, setHasMoreFollow] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchProfile()
      fetchFollowStatus()
    }
  }, [userId])

  useEffect(() => {
    if (profile) {
      fetchUserPosts()
    }
  }, [profile])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await axios.get(`${API_CONFIG.API_URL}/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      setProfile(response.data.user)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchFollowStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await axios.get(`${API_CONFIG.API_URL}/follow/${userId}/status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      setFollowStatus(response.data)
    } catch (error) {
      console.error('Error fetching follow status:', error)
    }
  }

  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await axios.get(`${API_CONFIG.API_URL}/posts/user/${userId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      
      setPosts(response.data.posts || [])
      setPostsLoaded(true)
    } catch (error) {
      console.error('Error fetching posts:', error)
      setPostsLoaded(true)
    }
  }

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token')
      
      if (followStatus.isFollowing) {
        // Отписаться
        await axios.delete(`${API_CONFIG.API_URL}/follow/${userId}/follow`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        
        setFollowStatus(prev => ({
          ...prev,
          isFollowing: false,
          isMutual: false
        }))
        
        // Обновляем счетчик подписчиков
        setProfile(prev => ({
          ...prev,
          followersCount: Math.max(0, (prev.followersCount || 0) - 1)
        }))
        
      } else {
        // Подписаться
        await axios.post(`${API_CONFIG.API_URL}/follow/${userId}/follow`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        
        setFollowStatus(prev => ({
          ...prev,
          isFollowing: true,
          isMutual: prev.isFollowedBy
        }))
        
        // Обновляем счетчик подписчиков
        setProfile(prev => ({
          ...prev,
          followersCount: (prev.followersCount || 0) + 1
        }))
      }
      
    } catch (error) {
      console.error('Error toggling follow:', error)
    }
  }

  const handleMessage = () => {
    // Переходим на страницу сообщений с этим пользователем
    navigate(`/messages?user=${userId}`)
  }

  const handlePostClick = (post) => {
    const postIndex = posts.findIndex(p => p._id === post._id)
    setSelectedPost(post)
    setCurrentPostIndex(postIndex)
    setShowPostModal(true)
  }

  const handleClosePostModal = () => {
    setShowPostModal(false)
    setSelectedPost(null)
  }

  const handlePostUpdated = (updatedPost) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      )
    )
    setSelectedPost(updatedPost)
  }

  const handlePostDeleted = (postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post._id !== postId))
    setSelectedPost(null)
    setShowPostModal(false)
  }



  // Функции для модального окна followers/following
  const openFollowModal = (type) => {
    setFollowModalType(type)
    setShowFollowModal(true)
    setFollowUsers([])
    setFollowPage(1)
    setHasMoreFollow(false)
    fetchFollowUsers(type, 1)
  }

  const closeFollowModal = () => {
    setShowFollowModal(false)
    setFollowModalType('')
    setFollowUsers([])
  }

  const fetchFollowUsers = async (type, pageNum = 1) => {
    try {
      const token = localStorage.getItem('token')
      const endpoint = type === 'followers' ? 'followers' : 'following'
      
      const response = await axios.get(
        `${API_CONFIG.API_URL}/follow/${userId}/${endpoint}?page=${pageNum}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const newUsers = response.data[type] || []
      
      if (pageNum === 1) {
        setFollowUsers(newUsers)
      } else {
        setFollowUsers(prev => [...prev, ...newUsers])
      }
      
      setHasMoreFollow(response.data.pagination?.hasNextPage || false)
      setFollowPage(pageNum)
      
    } catch (error) {
      console.error('Error fetching follow users:', error)
    }
  }

  const handleFollowToggle = async (targetUserId, isCurrentlyFollowing) => {
    try {
      const token = localStorage.getItem('token')
      
      if (isCurrentlyFollowing) {
        await axios.delete(`${API_CONFIG.API_URL}/follow/${targetUserId}/follow`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      } else {
        await axios.post(`${API_CONFIG.API_URL}/follow/${targetUserId}/follow`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      }
      
      // Обновляем локальное состояние
      setFollowUsers(prev => 
        prev.map(item => 
          item.user._id === targetUserId 
            ? { ...item, isFollowing: !isCurrentlyFollowing }
            : item
        )
              )
      
    } catch (error) {
      console.error('Error toggling follow in modal:', error)
    }
  }

  const handleUserClick = (clickedUserId) => {
    closeFollowModal()
    navigate(`/profile/${clickedUserId}`)
  }

  const loadMoreFollowUsers = () => {
    fetchFollowUsers(followModalType, followPage + 1)
  }

  if (!profile) {
    return null
  }

  return (
    <div className={styles.profilePageContainer}>
      <Sidebar />
      <div className={styles.content}>
        {/* Мобильный хедер */}
        <div className={styles.mobileHeader}>
          <button 
            className={styles.backButton}
            onClick={() => navigate(-1)}
          >
            ←
          </button>
          <img src={sidebarLogo} alt="ChillGram" className={styles.mobileLogo} />
          <div className={styles.spacer}></div>
        </div>

        <div className={styles.profileContainer}>
          {/* Шапка профиля */}
          <div className={styles.profileHeader}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarContainer}>
                <img 
                  src={profile.profileImage || DefaultProfilePic} 
                  alt={profile.username}
                  className={styles.avatar}
                />
              </div>
            </div>

            <div className={styles.profileInfo}>
              <div className={styles.profileTop}>
                <h1 className={styles.username}>{profile.username}</h1>
                
                <div className={styles.actionButtons}>
                  <button 
                    className={`${styles.followButton} ${followStatus.isFollowing ? styles.following : styles.follow}`}
                    onClick={handleFollow}
                  >
                    {followStatus.isFollowing ? 'Following' : 'Follow'}
                  </button>
                  
                  <button 
                    className={styles.messageButton}
                    onClick={handleMessage}
                  >
                    Message
                  </button>
                </div>
              </div>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>{posts.length}</span>
                  <span className={styles.statLabel}>posts</span>
                </div>
                <div className={`${styles.stat} ${styles.clickableStat}`} onClick={() => openFollowModal('followers')}>
                  <span className={styles.statNumber}>{profile.followersCount || 0}</span>
                  <span className={styles.statLabel}>followers</span>
                </div>
                <div className={`${styles.stat} ${styles.clickableStat}`} onClick={() => openFollowModal('following')}>
                  <span className={styles.statNumber}>{profile.followingCount || 0}</span>
                  <span className={styles.statLabel}>following</span>
                </div>
              </div>

              <div className={styles.bio}>
                {profile.fullName && (
                  <div className={styles.fullName}>{profile.fullName}</div>
                )}
                {profile.bio && (
                  <div className={styles.bioText}>
                    {profile.bio}
                  </div>
                )}
                {profile.website && (
                  <div className={styles.bioLink}>
                    <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer">
                      🔗 {profile.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Статус взаимной подписки */}
              {followStatus.isMutual && (
                <div className={styles.mutualFollow}>
                  <span className={styles.mutualText}>You follow each other</span>
                </div>
              )}
            </div>
          </div>

          {/* Сетка постов */}
          <div className={styles.postsSection}>
            {!postsLoaded ? null : posts.length > 0 ? (
              <div className={styles.postsGrid}>
                {posts.map((post) => {
                  const firstMedia = post.images?.[0] || post.image;
                  const isVideo = firstMedia && (
                    firstMedia.includes('.mp4') || 
                    firstMedia.includes('.webm') || 
                    firstMedia.includes('.mov') || 
                    firstMedia.includes('video/upload/') || 
                    firstMedia.includes('resource_type/video')
                  );
                  
                  return (
                    <div 
                      key={post._id} 
                      className={styles.postItem}
                      onClick={() => handlePostClick(post)}
                    >
                      {isVideo ? (
                        <video 
                          src={firstMedia} 
                          alt={post.caption || 'Post'} 
                          className={styles.postImage}
                          muted
                          loop
                          autoPlay
                          preload="metadata"
                          playsInline
                        />
                      ) : (
                        <img 
                          src={firstMedia} 
                          alt={post.caption || 'Post'} 
                          className={styles.postImage}
                        />
                      )}
                      {/* Индикатор множественных изображений */}
                      {post.images && post.images.length > 1 && (
                        <div className={styles.multipleImagesIndicator}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v10H7V7zm2 2v6h6V9H9z"/>
                          </svg>
                        </div>
                      )}
                      {/* Индикатор видео */}
                      {isVideo && (
                        <div className={styles.videoIndicator}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      )}
                      <div className={styles.postOverlay}>
                        <div className={styles.postStats}>
                          <div className={styles.postStat}>
                            <img src={IconHeart} alt="Likes" className={styles.statIcon} />
                            <span>{post.likesCount || 0}</span>
                          </div>
                          <div className={styles.postStat}>
                            <img src={IconComment} alt="Comments" className={styles.statIcon} />
                            <span>{post.commentsCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.noPosts}>
                <div className={styles.noPostsIcon}>📷</div>
                <p>No posts yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PostViewModal
        isOpen={showPostModal}
        onClose={handleClosePostModal}
        post={selectedPost}
        posts={posts}
        currentPostIndex={currentPostIndex}
        onPostChange={(newIndex) => {
          setCurrentPostIndex(newIndex)
          setSelectedPost(posts[newIndex])
        }}
        currentUserId={(() => {
          const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
          return userId;
        })()}
        onPostUpdated={handlePostUpdated}
        onPostDeleted={handlePostDeleted}
      />

      {/* Модальное окно подписчиков/подписок */}
      {showFollowModal && (
        <div className={styles.modalOverlay} onClick={closeFollowModal}>
          <div className={styles.followModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {followModalType === 'followers' ? 'Followers' : 'Following'}
              </h2>
              <button className={styles.closeButton} onClick={closeFollowModal}>×</button>
            </div>

            <div className={styles.modalContent}>
              {followUsers.length === 0 ? (
                <div className={styles.modalEmpty}>
                  <p>No {followModalType} yet</p>
                </div>
              ) : (
                <>
                  <div className={styles.usersList}>
                    {followUsers.map((item) => {
                      const user = item.user
                      const isFollowing = item.isFollowing
                      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
                      const isCurrentUser = user._id === currentUser.id

                      return (
                        <div key={user._id} className={styles.userItem}>
                          <div className={styles.userInfo} onClick={() => handleUserClick(user._id)}>
                            <div className={styles.userAvatar}>
                              <img 
                                src={user.profileImage || DefaultProfilePic} 
                                alt={user.username}
                                className={styles.userAvatarImage}
                              />
                            </div>
                            <div className={styles.userDetails}>
                              <span className={styles.userUsername}>{user.username}</span>
                              {user.fullName && (
                                <span className={styles.userFullName}>{user.fullName}</span>
                              )}
                            </div>
                          </div>

                          {!isCurrentUser && (
                            <button
                              className={`${styles.followButton} ${isFollowing ? styles.following : styles.follow}`}
                              onClick={() => handleFollowToggle(user._id, isFollowing)}
                            >
                              {isFollowing ? 'Following' : 'Follow'}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {hasMoreFollow && (
                    <div className={styles.loadMoreContainer}>
                      <button 
                        className={styles.loadMoreButton} 
                        onClick={loadMoreFollowUsers}
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OtherProfile 