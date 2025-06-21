import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PostViewModal.module.css';
import moreIcon from '../../assets/more.svg';
import PostOptionsModal from '../PostOptionsModal/PostOptionsModal';
import EditPostModal from '../EditPostModal/EditPostModal';
import SharePostModal from '../SharePostModal/SharePostModal';
import arrowBackIcon from '../../assets/arrow_back.svg';
import arrowForwardIcon from '../../assets/arrow_forward.svg';
import shareIcon from '../../assets/share_icon.svg';
import profilePic from '../../assets/profile.png';
import { API_CONFIG } from '../../config/api.js';

const PostViewModal = ({ isOpen, onClose, post, posts, currentPostIndex, onPostChange, currentUserId, onPostUpdated, onPostDeleted }) => {
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  
    // Обновляем состояние при изменении поста
  React.useEffect(() => {
    if (post) {
      setCurrentPost(post);
      setCurrentImageIndex(0); // Сбрасываем индекс изображения при смене поста
    }
  }, [post]);

  // Используем новые поля из архитектуры ТЗ
  const isLiked = currentPost?.isLiked || false;
  const likesCount = currentPost?.likesCount || 0;

  // Поддержка множественных изображений
  const images = currentPost?.images || (currentPost?.image ? [currentPost.image] : []);
  
  // Функция для определения типа файла по URL
  const isVideoFile = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext)) || 
           url.includes('video/upload/') || // Cloudinary video URLs
           url.includes('resource_type/video');
  };
  
  const nextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // Навигация между постами (как в Instagram)
  const nextPost = () => {
    if (posts && currentPostIndex < posts.length - 1 && onPostChange) {
      onPostChange(currentPostIndex + 1);
    }
  };

  const prevPost = () => {
    if (posts && currentPostIndex > 0 && onPostChange) {
      onPostChange(currentPostIndex - 1);
    }
  };

  // Клавиатурные сокращения для навигации
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;
      
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (posts && posts.length > 1) {
          // Left = предыдущий пост
          prevPost();
        } else if (images.length > 1) {
          // Если только один пост, то навигация по изображениям
          prevImage();
        }
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (posts && posts.length > 1) {
          // Right = следующий пост
          nextPost();
        } else if (images.length > 1) {
          // Если только один пост, то навигация по изображениям
          nextImage();
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentImageIndex, images.length, currentPostIndex, posts, prevPost, nextPost, prevImage, nextImage, onClose]);

  // Условный возврат ПОСЛЕ всех хуков
  if (!isOpen || !post || !currentPost) {
    return null;
  }

  const handleUserClick = (userId) => {
    if (userId && userId !== currentUserId) {
      navigate(`/user/${userId}`);
    } else if (userId === currentUserId) {
      navigate('/profile');
    }
  };

  const handleLike = async () => {
    try {
      // Оптимистичное обновление
      const newIsLiked = !isLiked;
      const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;
      
      const updatedPost = {
        ...currentPost,
        isLiked: newIsLiked,
        likesCount: Math.max(0, newLikesCount)
      };
      
      setCurrentPost(updatedPost);
      
      // Обновляем родительский компонент
      if (onPostUpdated) {
        onPostUpdated(updatedPost);
      }

      // Отправляем запрос на сервер
      const response = await fetch(`${API_CONFIG.API_URL}/likes/${currentPost._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // В случае ошибки откатываем изменения к исходному посту
      if (post) {
        setCurrentPost(post);
      }
    }
  };

  const handleMoreClick = () => {
    setShowOptionsModal(true);
  };

  const handleOptionsClose = () => {
    setShowOptionsModal(false);
  };

  const handleEdit = () => {
    setShowOptionsModal(false);
    setShowEditModal(true);
  };

  const handleEditClose = () => {
    setShowEditModal(false);
  };

  const handleEditSave = async (postId, newCaption) => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ caption: newCaption })
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      const result = await response.json();
      
      // Обновляем текущий пост
      const updatedPost = {
        ...currentPost,
        caption: result.post.caption
      };
      
      setCurrentPost(updatedPost);
      setShowEditModal(false);
      
      // Обновляем родительский компонент
      if (onPostUpdated) {
        onPostUpdated(updatedPost);
      }
    } catch (error) {
      console.error('Error updating post:', error);
      throw error; // Пробрасываем ошибку для обработки в EditPostModal
    }
  };

  const handleDelete = async (postId) => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      
      // Закрываем модальное окно и уведомляем о удалении
      setShowOptionsModal(false);
      onClose();
      if (onPostDeleted) {
        onPostDeleted(postId);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const commentToSend = commentText.trim();

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Оптимистичное обновление - добавляем комментарий сразу
      const newComment = {
        _id: 'temp-' + Date.now(), // Временный ID
        text: commentToSend,
        author: {
          _id: user.id,
          username: user.username,
          profileImage: user.profileImage
        },
        createdAt: new Date().toISOString()
      };

      const updatedPost = {
        ...currentPost,
        comments: [...(currentPost.comments || []), newComment],
        commentsCount: currentPost.commentsCount + 1
      };
      
      setCurrentPost(updatedPost);
      setCommentText('');
      
      // Обновляем родительский компонент
      if (onPostUpdated) {
        onPostUpdated(updatedPost);
      }

      // Отправляем запрос на сервер
      const response = await fetch(`${API_CONFIG.API_URL}/comments/${currentPost._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: commentToSend })
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const result = await response.json();
      
      // Обновляем пост с реальным комментарием от сервера
      if (result.comment) {
        const finalUpdatedPost = {
          ...updatedPost,
          comments: updatedPost.comments.map(comment => 
            comment._id === newComment._id ? result.comment : comment
          )
        };
        setCurrentPost(finalUpdatedPost);
        if (onPostUpdated) {
          onPostUpdated(finalUpdatedPost);
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      // В случае ошибки откатываем изменения к исходному посту
      if (post) {
        setCurrentPost(post);
      }
      setCommentText('');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      // Оптимистичное обновление - удаляем комментарий из UI
      const updatedComments = currentPost.comments.filter(comment => comment._id !== commentId);
      const updatedPost = {
        ...currentPost,
        comments: updatedComments,
        commentsCount: Math.max(0, currentPost.commentsCount - 1)
      };
      
      setCurrentPost(updatedPost);
      
      // Обновляем родительский компонент
      if (onPostUpdated) {
        onPostUpdated(updatedPost);
      }

      // Отправляем запрос на сервер для удаления комментария
      const response = await fetch(`${API_CONFIG.API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete comment: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ PostViewModal: Error deleting comment:', error);
      // В случае ошибки откатываем изменения
      if (post) {
        setCurrentPost(post);
        if (onPostUpdated) {
          onPostUpdated(post);
        }
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Менее часа - показываем минуты
    if (diffMinutes < 60) {
      if (diffMinutes === 0) return 'Just now';
      return `${diffMinutes}m`;
    }
    
    // Менее суток - показываем часы
    if (diffHours < 24) {
      return `${diffHours}h`;
    }
    
    // Менее недели - показываем дни
    if (diffDays < 7) {
      return `${diffDays}d`;
    }
    
    // Более недели - показываем полную дату
    const options = { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.postCard}>
          {/* Header */}
          <div className={styles.postHeader}>
            <div className={styles.userInfo}>
              <img 
                src={currentPost?.author?.profileImage || profilePic} 
                alt={currentPost?.author?.username || 'User'}
                className={styles.profilePic}
                onClick={() => handleUserClick(currentPost?.author?._id)}
              />
              <span 
                className={styles.username}
                onClick={() => handleUserClick(currentPost?.author?._id)}
              >
                {currentPost?.author?.username || 'Unknown User'}
              </span>
            </div>
            <div className={styles.headerRight}>
              <span className={styles.timestamp}>{currentPost?.createdAt ? formatDate(currentPost.createdAt) : ''}</span>
              <button className={styles.moreButton} onClick={handleMoreClick}>
                <img src={moreIcon} alt="More options" />
              </button>
              <button className={styles.closeButton} onClick={onClose}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* Images */}
          {images.length > 0 && (
            <div className={styles.imageContainer}>
              {isVideoFile(images[currentImageIndex]) ? (
                <video 
                  src={images[currentImageIndex]} 
                  className={styles.postImage}
                  controls
                  muted
                  autoPlay={false}
                  preload="metadata"
                />
              ) : (
                <img 
                  src={images[currentImageIndex]} 
                  alt="Post" 
                  className={styles.postImage}
                />
              )}
              
              {/* Navigation arrows for images within post */}
              {images.length > 1 && (
                <>
                  <button 
                    className={`${styles.navButton} ${styles.prevButton}`}
                    onClick={prevImage}
                    disabled={currentImageIndex === 0}
                  >
                    <img src={arrowBackIcon} alt="Previous" />
                  </button>
                  <button 
                    className={`${styles.navButton} ${styles.nextButton}`}
                    onClick={nextImage}
                    disabled={currentImageIndex === images.length - 1}
                  >
                    <img src={arrowForwardIcon} alt="Next" />
                  </button>
                </>
              )}
              
              {/* Navigation arrows for posts (Instagram style) */}
              {posts && posts.length > 1 && (
                <>
                  <button 
                    className={`${styles.postNavButton} ${styles.prevPostButton}`}
                    onClick={prevPost}
                    disabled={currentPostIndex === 0}
                  >
                    <img src={arrowBackIcon} alt="Previous post" />
                  </button>
                  <button 
                    className={`${styles.postNavButton} ${styles.nextPostButton}`}
                    onClick={nextPost}
                    disabled={currentPostIndex === posts.length - 1}
                  >
                    <img src={arrowForwardIcon} alt="Next post" />
                  </button>
                </>
              )}
              
              {/* Indicators */}
              {images.length > 1 && (
                <div className={styles.indicators}>
                  {images.map((_, index) => (
                    <div 
                      key={index}
                      className={`${styles.indicator} ${index === currentImageIndex ? styles.active : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <div className={styles.leftActions}>
              <button 
                className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
                onClick={handleLike}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? "#ed4956" : "none"}>
                  <path 
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                    stroke={isLiked ? "#ed4956" : "#262626"} 
                    strokeWidth="2"
                  />
                </svg>
              </button>
            </div>
            <div className={styles.rightActions}>
              <button className={styles.actionButton} onClick={() => setShowShareModal(true)}>
                <img src={shareIcon} alt="Share" />
              </button>
            </div>
          </div>

          {/* Likes */}
          {likesCount > 0 && (
            <div className={styles.likes}>
              <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
            </div>
          )}

          {/* Caption */}
          {currentPost?.caption && (
            <div className={styles.caption}>
              <span 
                className={styles.username}
                onClick={() => handleUserClick(currentPost?.author?._id)}
              >
                {currentPost?.author?.username || 'Unknown User'}
              </span>
              <span className={styles.captionText}>{currentPost.caption}</span>
            </div>
          )}

          {/* Comments */}
          {currentPost?.comments && currentPost.comments.length > 0 && (
            <div className={styles.comments}>
              {currentPost.comments.length > 2 && !showAllComments && (
                <div 
                  className={styles.commentsHeader}
                  onClick={() => setShowAllComments(true)}
                >
                  View all {currentPost.comments.length} comments
                </div>
              )}
              {showAllComments ? (
                // Показываем все комментарии
                currentPost.comments.map((comment, index) => (
                  <div key={comment._id || index} className={styles.comment}>
                    <div className={styles.commentContent}>
                      <span 
                        className={styles.commentUsername}
                        onClick={() => handleUserClick(comment?.author?._id)}
                      >
                        {comment?.author?.username || 'Unknown User'}
                      </span>
                      <span className={styles.commentText}>{comment?.text || ''}</span>
                    </div>
                    {comment?.author?._id === currentUserId && (
                      <button 
                        className={styles.deleteCommentButton}
                        onClick={() => handleDeleteComment(comment._id)}
                        title="Delete comment"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              ) : (
                // Показываем только последние 2 комментария
                currentPost.comments.slice(-2).map((comment, index) => (
                  <div key={comment._id || index} className={styles.comment}>
                    <div className={styles.commentContent}>
                      <span 
                        className={styles.commentUsername}
                        onClick={() => handleUserClick(comment?.author?._id)}
                      >
                        {comment?.author?.username || 'Unknown User'}
                      </span>
                      <span className={styles.commentText}>{comment?.text || ''}</span>
                    </div>
                    {comment?.author?._id === currentUserId && (
                      <button 
                        className={styles.deleteCommentButton}
                        onClick={() => handleDeleteComment(comment._id)}
                        title="Delete comment"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Add comment */}
          <form className={styles.addComment} onSubmit={handleComment}>
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className={styles.commentInput}
            />
            {commentText.trim() && (
              <button type="submit" className={styles.postButton}>
                Post
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Модальные окна */}
      <PostOptionsModal
        isOpen={showOptionsModal}
        onClose={handleOptionsClose}
        post={currentPost}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isOwnPost={currentPost?.author?._id === currentUserId}
      />

      <EditPostModal
        isOpen={showEditModal}
        onClose={handleEditClose}
        post={currentPost}
        onSave={handleEditSave}
      />

      <SharePostModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={currentPost}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default PostViewModal; 