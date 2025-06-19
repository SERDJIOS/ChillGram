import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostViewModal from '../../components/PostViewModal/PostViewModal';
import styles from './PostPage.module.css';
import { API_CONFIG } from '../../config/api.js';

const PostPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_CONFIG.API_URL}/posts/${postId}`);
      setPost(response.data.post);
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Post not found');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate(-1); // Возвращаемся на предыдущую страницу
  };

  const handlePostUpdated = (updatedPost) => {
    setPost(updatedPost);
  };

  const handlePostDeleted = () => {
    navigate('/feed'); // Перенаправляем на главную страницу после удаления
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Post not found</h2>
          <button onClick={() => navigate('/feed')}>Go to Feed</button>
        </div>
      </div>
    );
  }

  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;

  return (
    <div className={styles.container}>
      <PostViewModal
        isOpen={true}
        onClose={handleClose}
        post={post}
        currentUserId={currentUserId}
        onPostUpdated={handlePostUpdated}
        onPostDeleted={handlePostDeleted}
      />
    </div>
  );
};

export default PostPage; 