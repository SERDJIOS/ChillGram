import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PostCard.module.css';
import PostOptionsModal from '../PostOptionsModal/PostOptionsModal';
import EditPostModal from '../EditPostModal/EditPostModal';
import SharePostModal from '../SharePostModal/SharePostModal';
import arrowBackIcon from '../../assets/arrow_back.svg';
import arrowForwardIcon from '../../assets/arrow_forward.svg';
import { API_CONFIG } from '../../config/api.js';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const PostCard = ({ post, onLike, onComment, onEdit, onDelete, currentUserId, isLoading }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className={styles.postCard}>
        <div className={styles.postHeader}>
          <div className={styles.userInfo}>
            <Skeleton circle width={40} height={40} style={{ marginRight: '10px' }} />
            <Skeleton width={150} />
          </div>
        </div>
        <Skeleton height={400} />
        <div className={styles.postActions} style={{ marginTop: '10px' }}>
          <Skeleton width={80} />
        </div>
        <div className={styles.likesCount}>
          <Skeleton width={100} />
        </div>
        <div className={styles.caption} style={{ marginTop: '5px' }}>
          <Skeleton count={2} />
        </div>
      </div>
    );
  }

  const isLiked = post.isLiked || false;
  const likesCount = post.likesCount || 0;
  const commentsCount = post.commentsCount || 0;
  const isOwnPost = currentUserId && post.author?._id === currentUserId;
  const images = post.images || (post.image ? [post.image] : []);
  
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

  const handleUserClick = () => {
    if (post.author?._id && post.author._id !== currentUserId) {
      navigate(`/user/${post.author._id}`);
    } else if (post.author?._id === currentUserId) {
      navigate('/profile');
    }
  };

  const handleLike = () => {
    if (onLike) {
      onLike(post._id);
    }
  };

  const handleComment = (e) => {
    e.preventDefault();
    if (commentText.trim() && onComment) {
      onComment(post._id, commentText);
      setCommentText('');
    }
  };

  const handleOptionsClick = () => {
    setShowOptionsModal(true);
  };

  const handleEditPost = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = async (postId, newCaption) => {
    if (onEdit) {
      await onEdit(postId, newCaption);
    }
  };

  const handleDeletePost = async (postId) => {
    if (onDelete) {
      await onDelete(postId);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
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

      if (onComment) {
        const updatedComments = post.comments.filter(comment => comment._id !== commentId);
        onComment(post._id, null, updatedComments);
      }
      
    } catch (error) {
      console.error('❌ PostCard: Error deleting comment:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <div className={styles.postCard}>
        <div className={styles.postHeader}>
          <div className={styles.userInfo}>
            <img 
              src={post.author?.profileImage || '/src/assets/default_profile_pic.png'} 
              alt={post.author?.username || 'User'}
              className={styles.profilePic}
              onClick={handleUserClick}
            />
            <span className={styles.username} onClick={handleUserClick}>
              {post.author?.username || 'Unknown User'}
            </span>
          </div>
          <button className={styles.moreButton} onClick={handleOptionsClick}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="6" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="18" cy="12" r="1.5" fill="currentColor"/>
            </svg>
          </button>
        </div>

        {images.length > 0 && (
          <div className={styles.imageContainer}>
            <img 
              src={images[currentImageIndex]} 
              alt="Post content"
              className={styles.postImage}
            />
            
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

        <div className={styles.postActions}>
          <div className={styles.leftActions}>
            <button 
              className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
              onClick={handleLike}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? "#ed4956" : "none"} stroke="currentColor">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <button className={styles.actionButton} onClick={() => setShowShareModal(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16,6 12,2 8,6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.likesCount}>
          <span>{likesCount} likes</span>
        </div>

        {post.caption && (
          <div className={styles.caption}>
            <span className={styles.username} onClick={handleUserClick}>{post.author?.username}</span>
            <span className={styles.captionText}>{post.caption}</span>
          </div>
        )}

        {post.comments && post.comments.length > 0 && (
          <div className={styles.commentsPreview}>
            {post.comments.length > 2 && (
              <button 
                className={styles.viewAllComments}
                onClick={() => setShowComments(!showComments)}
              >
                View all {commentsCount} comments
              </button>
            )}
            {post.comments.slice(-2).map((comment, index) => (
              <div key={comment._id || index} className={styles.comment}>
                <div className={styles.commentContent}>
                  <span className={styles.username} onClick={handleUserClick}>{comment.author?.username}</span>
                  <span className={styles.commentText}>{comment.text}</span>
                </div>
                {comment.author?._id === currentUserId && (
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
            ))}
          </div>
        )}

        {showComments && post.comments && post.comments.length > 2 && (
          <div className={styles.expandedComments}>
            {post.comments.slice(0, -2).map((comment, index) => (
              <div key={comment._id || index} className={styles.comment}>
                <div className={styles.commentContent}>
                  <span className={styles.username} onClick={handleUserClick}>{comment.author?.username}</span>
                  <span className={styles.commentText}>{comment.text}</span>
                </div>
                {comment.author?._id === currentUserId && (
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
            ))}
          </div>
        )}

        <div className={styles.timestamp}>
          {formatDate(post.createdAt)}
        </div>

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

      <PostOptionsModal
        isOpen={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        post={post}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
        isOwnPost={isOwnPost}
      />

      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={post}
        onSave={handleSaveEdit}
      />

      <SharePostModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
        currentUserId={currentUserId}
      />
    </>
  );
}; 