import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import PostViewModal from '../../components/PostViewModal/PostViewModal'
import Sidebar from '../../components/Sidebar/Sidebar'
import styles from './ProfilePage.module.css'
import logoutIcon from '../../assets/nav_icons/logout.svg'
import sidebarLogo from '../../assets/sidebar.png'
import DefaultProfilePic from '../../assets/default_profile_pic.png'

const ProfilePage = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [postsLoaded, setPostsLoaded] = useState(false)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [showPostModal, setShowPostModal] = useState(false)
  const [currentPostIndex, setCurrentPostIndex] = useState(0)
  
  // Состояние для модального окна подписчиков/подписок
  const [showFollowModal, setShowFollowModal] = useState(false)
  const [followModalType, setFollowModalType] = useState('') // 'followers' или 'following'
  const [followUsers, setFollowUsers] = useState([])
  const [followPage, setFollowPage] = useState(1)
  const [hasMoreFollow, setHasMoreFollow] = useState(true)

  useEffect(() => {
    // Проверяем токен при загрузке
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    // Если есть userId в параметрах, это чужой профиль - перенаправляем на OtherProfile
    if (userId) {
      navigate(`/user/${userId}`, { replace: true })
      return
    }
    
    fetchProfile()
  }, [userId, navigate])

  useEffect(() => {
    if (profile) {
      fetchUserPosts()
    }
  }, [profile])

  // Обновляем профиль при возврате на страницу
  useEffect(() => {
    const handleFocus = () => {
      if (!userId) { // Только для собственного профиля
        fetchProfile()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [userId])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        navigate('/login')
        return
      }
      
      // Всегда получаем собственный профиль
      const response = await axios.get('http://localhost:3001/api/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      setProfile(response.data.user)
      setIsOwnProfile(true)
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Если ошибка 401 - токен недействительный, перенаправляем на логин
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
        return
      }
    }
  }

  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await axios.get(`http://localhost:3001/api/posts/user/${profile.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      
      setPosts(response.data.posts || [])
      setPostsLoaded(true)
    } catch (error) {
      console.error('Error fetching posts:', error)
      setPostsLoaded(true)
    }
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
    // Обновляем пост в списке постов
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      )
    )
    setSelectedPost(updatedPost)
  }

  const handlePostDeleted = (postId) => {
    // Удаляем пост из списка постов
    setPosts(prevPosts => prevPosts.filter(post => post._id !== postId))
    setSelectedPost(null)
    setShowPostModal(false)
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

  // Функции для модального окна подписчиков/подписок
  const openFollowModal = (type) => {
    if (!profile) {
      return
    }
    
    setFollowModalType(type)
    setShowFollowModal(true)
    setFollowUsers([])
    setFollowPage(1)
    setHasMoreFollow(true)
    fetchFollowUsers(type, 1)
  }

  const closeFollowModal = () => {
    setShowFollowModal(false)
    setFollowUsers([])
  }

  const fetchFollowUsers = async (type, pageNum = 1) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        return
      }

      if (!profile) {
        return
      }

      // Используем правильное поле для ID (как в fetchUserPosts)
      const userId = profile.id || profile._id

      if (!userId) {
        return
      }

      const endpoint = type === 'followers' ? 'followers' : 'following'
      const url = `http://localhost:3001/api/follow/${userId}/${endpoint}?page=${pageNum}&limit=20`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        return
      }

      const data = await response.json()
      
      if (pageNum === 1) {
        setFollowUsers(data[type] || [])
      } else {
        setFollowUsers(prev => [...prev, ...(data[type] || [])])
      }
      
      setHasMoreFollow(data.pagination?.hasNextPage || false)
      setFollowPage(pageNum)
    } catch (error) {
      console.error('Error fetching follow users:', error)
    }
  }

  const handleFollowToggle = async (targetUserId, isCurrentlyFollowing) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const method = isCurrentlyFollowing ? 'DELETE' : 'POST'
      const response = await fetch(`http://localhost:3001/api/follow/${targetUserId}/follow`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Обновляем локальное состояние
        setFollowUsers(prevUsers => 
          prevUsers.map(user => 
            user.user._id === targetUserId 
              ? { ...user, isFollowing: !isCurrentlyFollowing }
              : user
          )
        )
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    }
  }

  const handleUserClick = (userId) => {
    closeFollowModal()
    navigate(`/user/${userId}`)
  }

  const loadMoreFollowUsers = () => {
    if (hasMoreFollow) {
      fetchFollowUsers(followModalType, followPage + 1)
    }
  }

  // Функция для переключения между постами в карусели
  const handlePostChange = (newIndex) => {
    if (newIndex >= 0 && newIndex < posts.length) {
      setCurrentPostIndex(newIndex)
      setSelectedPost(posts[newIndex])
    }
  }

  // Если есть userId, компонент не должен рендериться (произойдет редирект)
    if (userId) {
    return null
  }

  return (
    <div className={styles.profilePageContainer}>
      <Sidebar onPostCreated={fetchUserPosts} />
      <div className={styles.content}>
        {/* Мобильный хедер */}
        <div className={styles.mobileHeader}>
          <div className={styles.spacer}></div>
          <img src={sidebarLogo} alt="CHILLGRAM" className={styles.mobileLogo} />
          <button 
            className={styles.mobileLogoutButton}
            onClick={handleLogout}
            aria-label="Logout"
          >
            <img src={logoutIcon} alt="Logout" className={styles.logoutIcon} />
          </button>
        </div>

        <div className={styles.profileContainer}>
          {profile && (
            <>
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
                      {isOwnProfile && (
                        <button 
                          className={styles.editButton}
                          onClick={() => navigate('/edit-profile')}
                        >
                          Edit profile
                        </button>
                      )}
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
                </div>
              </div>

              {/* Сетка постов */}
              <div className={styles.postsSection}>
                {!postsLoaded ? null : posts.length > 0 ? (
                  <div className={styles.postsGrid}>
                    {posts.map((post) => (
                      <div 
                        key={post._id} 
                        className={styles.postItem}
                        onClick={() => handlePostClick(post)}
                      >
                        <img 
                          src={post.image} 
                          alt={post.caption || 'Post'} 
                          className={styles.postImage}
                        />
                        <div className={styles.postOverlay}>
                          <div className={styles.postStats}>
                            <div className={styles.postStat}>
                              <span>❤️ {post.likesCount || 0}</span>
                            </div>
                            <div className={styles.postStat}>
                              <span>💬 {post.commentsCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noPosts}>
                    <div className={styles.noPostsIcon}>📷</div>
                    <p>No posts yet</p>
                    <p>When you share photos, they will appear on your profile.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <PostViewModal
        isOpen={showPostModal}
        onClose={handleClosePostModal}
        post={selectedPost}
        posts={posts}
        currentPostIndex={currentPostIndex}
        onPostChange={handlePostChange}
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
                              {user.profileImage ? (
                                <img 
                                  src={user.profileImage} 
                                  alt={user.username}
                                  className={styles.userAvatarImage}
                                />
                              ) : (
                                <div className={styles.userAvatarPlaceholder}>
                                  {user.fullName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
                                </div>
                              )}
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

export default ProfilePage 