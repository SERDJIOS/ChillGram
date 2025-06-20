import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'
import DefaultProfilePic from '../../assets/profile.png'
import styles from './EditProfilePage.module.css'
import axios from 'axios'
import { API_CONFIG } from '../../config/api.js';

const EditProfilePage = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState({
    username: '',
    fullName: '',
    bio: '',
    website: '',
    profileImage: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await axios.get(`${API_CONFIG.API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const userData = response.data.user
      setProfile({
        username: userData.username || '',
        fullName: userData.fullName || '',
        bio: userData.bio || '',
        website: userData.website || '',
        profileImage: userData.profileImage || ''
      })
      setImagePreview(userData.profileImage || '')
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfile(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      let response
      
      if (imageFile) {
        // Если есть новое изображение, используем FormData
        const formData = new FormData()
        formData.append('username', profile.username)
        formData.append('fullName', profile.fullName)
        formData.append('bio', profile.bio)
        formData.append('website', profile.website)
        formData.append('profileImage', imageFile)

        response = await axios.put(`${API_CONFIG.API_URL}/profile`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
      } else {
        // Если нет нового изображения, используем JSON
        const updateData = {
          username: profile.username,
          fullName: profile.fullName,
          bio: profile.bio,
          website: profile.website
        }

        response = await axios.put(`${API_CONFIG.API_URL}/profile`, updateData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      }

      // Обновляем данные пользователя в localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      const updatedUser = { ...currentUser, ...response.data.user }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      // Принудительно обновляем состояние профиля
      setProfile(prev => ({
        ...prev,
        ...response.data.user
      }))
      
      // Сразу переходим на страницу профиля
      navigate('/profile')
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.editProfileContainer}>
        <Sidebar />
        <div className={styles.content}>
          <div className={styles.loading}></div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.editProfileContainer}>
      <Sidebar />
      <div className={styles.content}>
        {/* Мобильный хедер */}
        <div className={styles.mobileHeader}>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/profile')}
          >
            ←
          </button>
          <h2 className={styles.mobileTitle}>Edit profile</h2>
          <div className={styles.placeholder}></div>
        </div>

        <div className={styles.editContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>Edit profile</h1>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Секция фото профиля */}
            <div className={styles.photoSection}>
              <div className={styles.avatarContainer}>
                <img 
                  src={imagePreview || profile.profileImage || DefaultProfilePic} 
                  alt="Profile"
                  className={styles.avatar}
                />
              </div>
                             <div className={styles.photoInfo}>
                 <div className={styles.username}>{profile.username}</div>
               </div>
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.fileInput}
              />
              <label htmlFor="profileImage" className={styles.newPhotoButton}>
                New photo
              </label>
            </div>

            {/* Поля формы */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input
                type="text"
                name="username"
                value={profile.username}
                onChange={handleInputChange}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Website</label>
              <input
                type="url"
                                 name="website"
                 value={profile.website}
                 onChange={handleInputChange}
                 className={styles.input}
                 placeholder="Website URL"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>About</label>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleInputChange}
                                 className={styles.textarea}
                 rows={4}
                 maxLength={150}
                 placeholder="Tell people about yourself..."
              />
              <div className={styles.charCount}>
                {profile.bio.length} / 150
              </div>
            </div>

            {/* Сообщения об ошибках */}
            {error && <div className={styles.error}>{error}</div>}

            {/* Кнопка сохранения */}
            <div className={styles.buttonContainer}>
              <button
                type="submit"
                disabled={saving}
                className={styles.saveButton}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditProfilePage 