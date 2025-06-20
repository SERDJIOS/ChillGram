import React, { useState, useEffect } from 'react';
import styles from './EditPostModal.module.css';
import DefaultProfilePic from '../../assets/default_profile_pic.png';

const EditPostModal = ({ isOpen, onClose, post, onSave }) => {
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (post) {
      setCaption(post.caption || '');
    }
  }, [post]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError('');
    
    try {
      await onSave(post._id, caption.trim());
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
      setError('Failed to update post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setCaption(post?.caption || '');
      setError('');
      onClose();
    }
  };

  if (!isOpen || !post) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Edit post</h2>
          <button 
            className={styles.closeButton} 
            onClick={handleClose}
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          {/* Превью изображения */}
          <div className={styles.imagePreview}>
            <img 
              src={post.image} 
              alt="Post preview"
              className={styles.previewImage}
            />
          </div>

          {/* Форма редактирования */}
          <div className={styles.editSection}>
            <div className={styles.userInfo}>
              <img 
                src={post.author?.profileImage || DefaultProfilePic} 
                alt={post.author?.username || 'User'}
                className={styles.profilePic}
              />
              <span className={styles.username}>
                {post.author?.username || 'Unknown User'}
              </span>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>Caption</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={2200}
                  rows={6}
                  disabled={isLoading}
                />
                <div className={styles.charCount}>
                  {caption.length}/2,200
                </div>
              </div>

              <div className={styles.buttonContainer}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal; 