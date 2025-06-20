import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './SharePostModal.module.css';
import DefaultProfilePic from '../../assets/default_profile_pic.png';
import { API_CONFIG } from '../../config/api.js';

const SharePostModal = ({ isOpen, onClose, post, currentUserId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      if (searchQuery.trim()) {
        fetchSearchUsers();
      } else {
        fetchChatUsers();
      }
    }
  }, [isOpen]);

  // Получаем пользователей из чатов (приоритет)
  const fetchChatUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_CONFIG.API_URL}/messages/chats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Chats response logged

      // Извлекаем пользователей из чатов
      const chatUsers = response.data.chats?.map(chat => ({
        id: chat.otherUser._id,
        username: chat.otherUser.username,
        fullName: chat.otherUser.fullName,
        profileImage: chat.otherUser.profileImage
      })) || [];

      // Chat users logged

      if (chatUsers.length === 0) {
        // Если нет чатов, загружаем всех пользователей
        fetchAllUsers();
      } else {
        setUsers(chatUsers);
      }
      
    } catch (error) {
      console.error('Error fetching chat users:', error);
      // Если нет чатов, пробуем загрузить всех пользователей
      fetchAllUsers();
    } finally {
      setLoading(false);
    }
  };

  // Поиск пользователей по запросу
  const fetchSearchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_CONFIG.API_URL}/profile/search/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          query: searchQuery,
          limit: 50
        }
      });

      // Фильтруем текущего пользователя
      const filteredUsers = response.data.users.filter(user => user.id !== currentUserId);
      setUsers(filteredUsers);
      
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  // Получаем всех пользователей (резервный вариант)
  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_CONFIG.API_URL}/profile/search/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          query: '',
          limit: 50
        }
      });

      // All users response logged

      // Фильтруем текущего пользователя
      const filteredUsers = response.data.users?.filter(user => user.id !== currentUserId) || [];
      // Filtered users logged
      setUsers(filteredUsers);
      
    } catch (error) {
      console.error('Error fetching all users:', error);
      setError('Failed to load users');
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        if (searchQuery.trim()) {
          fetchSearchUsers();
        } else {
          fetchChatUsers();
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, isOpen]);

  const handleUserSelect = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSendPost = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    try {
      setSending(true);
      setError('');
      
      const token = localStorage.getItem('token');
      

      
      // Отправляем пост каждому выбранному пользователю
      const responses = await Promise.all(selectedUsers.map(user => 
        axios.post(`${API_CONFIG.API_URL}/messages/share-post`, {
          recipientId: user.id,
          postId: post._id,
          message: `Shared a post with you`
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ));



      // Закрываем модальное окно
      handleClose();
      
      // Небольшая задержка перед переходом, чтобы модальное окно успело закрыться
      setTimeout(() => {
        // Если выбран только один пользователь, переходим в диалог с ним
        if (selectedUsers.length === 1) {

          navigate(`/messages?user=${selectedUsers[0].id}`);
        } else {
          // Если несколько пользователей, переходим на страницу сообщений
          
          navigate('/messages');
        }
      }, 100);
      
    } catch (error) {
      console.error('Error sharing post:', error);
      setError('Failed to share post');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setSearchQuery('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Share Post</h2>
          <button className={styles.closeButton} onClick={handleClose}>×</button>
        </div>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <span>Loading users...</span>
            </div>
                      ) : users.length === 0 ? (
              <div className={styles.empty}>
                <p>{searchQuery.trim() ? 'No users found' : 'No conversations yet'}</p>
                {!searchQuery.trim() && (
                  <p className={styles.emptySubtext}>Start typing to search for users</p>
                )}
              </div>
            ) : (
              <>
                {!searchQuery.trim() && users.length > 0 && (
                  <div className={styles.sectionHeader}>
                    <span>Recent conversations</span>
                  </div>
                )}
                {searchQuery.trim() && users.length > 0 && (
                  <div className={styles.sectionHeader}>
                    <span>Search results</span>
                  </div>
                )}
                <div className={styles.usersList}>
                {users.map((user) => {
                  const isSelected = selectedUsers.find(u => u.id === user.id);
                  
                  return (
                    <div 
                      key={user.id} 
                      className={`${styles.userItem} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                          <img 
                            src={user.profileImage || DefaultProfilePic} 
                            alt={user.username}
                            className={styles.avatarImage}
                          />
                        </div>
                        <div className={styles.userDetails}>
                          <span className={styles.username}>{user.username}</span>
                          {user.fullName && (
                            <span className={styles.fullName}>{user.fullName}</span>
                          )}
                        </div>
                      </div>
                      <div className={styles.checkbox}>
                        {isSelected && (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="20,6 9,17 4,12"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedUsers.length > 0 && (
                <div className={styles.selectedUsers}>
                  <p className={styles.selectedCount}>
                    Selected {selectedUsers.length} user(s):
                  </p>
                  <div className={styles.selectedList}>
                    {selectedUsers.map(user => (
                      <span key={user.id} className={styles.selectedUser}>
                        {user.username}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.cancelButton} 
            onClick={handleClose}
            disabled={sending}
          >
            Cancel
          </button>
          <button 
            className={styles.sendButton} 
            onClick={handleSendPost}
            disabled={selectedUsers.length === 0 || sending}
          >
            {sending ? 'Sending...' : `Send${selectedUsers.length > 0 ? ` (${selectedUsers.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharePostModal; 