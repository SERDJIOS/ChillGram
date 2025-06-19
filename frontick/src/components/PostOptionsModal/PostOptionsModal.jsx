import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PostOptionsModal.module.css';

const PostOptionsModal = ({ isOpen, onClose, post, onEdit, onDelete, isOwnPost }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleEdit = () => {
    onEdit(post);
    onClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(post._id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(postUrl);
    onClose();
  };

  const handleGoToPost = () => {
    // Навигация к отдельной странице поста
    navigate(`/post/${post._id}`);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {showDeleteConfirm ? (
          // Подтверждение удаления
          <div className={styles.deleteConfirm}>
            <div className={styles.deleteIcon}>
              <svg width="96" height="96" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#1313" strokeWidth="2"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke="#1313" strokeWidth="2"/>
              </svg>
            </div>
            <h3 className={styles.deleteTitle}>Delete post?</h3>
            <p className={styles.deleteMessage}>
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className={styles.deleteActions}>
              <button 
                className={styles.deleteButton}
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
              <button 
                className={styles.cancelButton}
                onClick={handleDeleteCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // Основные опции
          <div className={styles.options}>
            {isOwnPost && (
              <>
                <button className={styles.option} onClick={handleEdit}>
                  <span className={styles.optionText}>Edit</span>
                </button>
                <div className={styles.separator}></div>
                <button 
                  className={`${styles.option} ${styles.deleteOption}`} 
                  onClick={handleDeleteClick}
                >
                  <span className={styles.optionText}>Delete</span>
                </button>
                <div className={styles.separator}></div>
              </>
            )}
            
            <button className={styles.option} onClick={handleGoToPost}>
              <span className={styles.optionText}>Go to post</span>
            </button>
            <div className={styles.separator}></div>
            
            <button className={styles.option} onClick={handleCopyLink}>
              <span className={styles.optionText}>Copy link</span>
            </button>
            <div className={styles.separator}></div>
            
            {!isOwnPost && (
              <>
                <button className={`${styles.option} ${styles.reportOption}`}>
                  <span className={styles.optionText}>Report</span>
                </button>
                <div className={styles.separator}></div>
              </>
            )}
            
            <button className={styles.option} onClick={onClose}>
              <span className={styles.optionText}>Cancel</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostOptionsModal; 