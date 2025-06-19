import { API_CONFIG, getAuthHeaders } from '../config/api.js';

const API_BASE_URL = API_CONFIG.API_URL;

// API для лайков
export const likeAPI = {
  // Лайк/дизлайк поста
  toggleLike: async (postId) => {
    const response = await fetch(`${API_BASE_URL}/likes/${postId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to toggle like: ${response.status}`);
    }
    
    return response.json();
  },

  // Получение лайков поста
  getPostLikes: async (postId, page = 1, limit = 20) => {
    const response = await fetch(`${API_BASE_URL}/likes/${postId}?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get likes: ${response.status}`);
    }
    
    return response.json();
  }
};

// API для комментариев
export const commentAPI = {
  // Создание комментария
  createComment: async (postId, text) => {
    const response = await fetch(`${API_BASE_URL}/comments/${postId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create comment: ${response.status}`);
    }
    
    return response.json();
  },

  // Получение комментариев поста
  getPostComments: async (postId, page = 1, limit = 20) => {
    const response = await fetch(`${API_BASE_URL}/comments/${postId}?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get comments: ${response.status}`);
    }
    
    return response.json();
  },

  // Обновление комментария
  updateComment: async (commentId, text) => {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update comment: ${response.status}`);
    }
    
    return response.json();
  },

  // Удаление комментария
  deleteComment: async (commentId) => {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete comment: ${response.status}`);
    }
    
    return response.json();
  }
};

// API для постов
export const postAPI = {
  // Получение всех постов
  getAllPosts: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/posts?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get posts: ${response.status}`);
    }
    
    return response.json();
  },

  // Получение постов пользователя
  getUserPosts: async (userId, page = 1, limit = 12) => {
    const response = await fetch(`${API_BASE_URL}/posts/user/${userId}?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get user posts: ${response.status}`);
    }
    
    return response.json();
  },

  // Получение поста по ID
  getPostById: async (postId) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get post: ${response.status}`);
    }
    
    return response.json();
  },

  // Создание поста
  createPost: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create post: ${response.status}`);
    }
    
    return response.json();
  },

  // Обновление поста
  updatePost: async (postId, formData) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update post: ${response.status}`);
    }
    
    return response.json();
  },

  // Удаление поста
  deletePost: async (postId) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete post: ${response.status}`);
    }
    
    return response.json();
  }
}; 