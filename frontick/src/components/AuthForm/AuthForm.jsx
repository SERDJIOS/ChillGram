import React, { useState } from 'react'
import {
  TextField,
  Button,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  Divider,
  Box,
  Alert
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_CONFIG } from '../../config/api.js'
import styles from './AuthForm.module.css'

const AuthForm = ({ type = 'login' }) => {
  // Общие стили для всех TextField
  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#FFFFFF',
      borderRadius: '3px',
      fontSize: '14px',
      '& fieldset': {
        borderColor: '#DBDBDB',
      },
      '&:hover fieldset': {
        borderColor: '#A8A8A8',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#1976d2',
        borderWidth: '1px'
      },
      '&.Mui-error fieldset': {
        borderColor: '#ed4956',
      },
      '&.Mui-error:hover fieldset': {
        borderColor: '#ed4956',
      },
      '&.Mui-error.Mui-focused fieldset': {
        borderColor: '#ed4956',
      }
    },
    '& .MuiInputBase-input': {
      padding: '14px 12px',
      fontSize: '14px',
      fontWeight: 400
    },
    '& .MuiFormHelperText-root': {
      color: '#ed4956',
      fontSize: '12px',
      marginTop: '4px',
      marginLeft: '0px',
      fontWeight: 400,
      lineHeight: '16px'
    }
  };

  const [formData, setFormData] = useState(() => {
    // Автозаполнение email после регистрации
    const signupEmail = localStorage.getItem('signupEmail')
    if (type === 'login' && signupEmail) {
      localStorage.removeItem('signupEmail') // Удаляем после использования
      return {
        username: signupEmail,
        email: '',
        password: '',
        fullName: ''
      }
    }
    return {
      username: '',
      email: '',
      password: '',
      fullName: ''
    }
  })


  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  
  const navigate = useNavigate()

  // Валидация email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Валидация формы
  const validateForm = () => {
    const newErrors = {}
    
    if (type === 'signup') {
      // Email валидация
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required'
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
      
      // Full name валидация
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full name is required'
      } else if (formData.fullName.trim().length < 2) {
        newErrors.fullName = 'Full name must be at least 2 characters'
      } else if (formData.fullName.trim().length > 50) {
        newErrors.fullName = 'Full name must be less than 50 characters'
      }
      
      // Username валидация
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required'
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters'
      } else if (formData.username.length > 30) {
        newErrors.username = 'Username must be less than 30 characters'
      } else if (!/^[a-zA-Z0-9._]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, dots and underscores'
      }
    } else {
      // Для логина можем использовать email или username
      if (!formData.username.trim()) {
        newErrors.username = 'Username or email is required'
      }
    }
    
    // Password валидация
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    } else if (formData.password.length > 128) {
      newErrors.password = 'Password must be less than 128 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Обработка изменения полей
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Очищаем ошибки при вводе
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    // Очищаем общую ошибку API
    if (apiError) {
      setApiError('')
    }
  }

  // Валидация при потере фокуса
  const handleBlur = (e) => {
    const { name, value } = e.target
    const newErrors = { ...errors }
    
    // Валидируем конкретное поле
    if (name === 'email' && type === 'signup') {
      if (!value.trim()) {
        newErrors.email = 'Email is required'
      } else if (!validateEmail(value)) {
        newErrors.email = 'Please enter a valid email address'
      } else {
        delete newErrors.email
      }
    } else if (name === 'fullName' && type === 'signup') {
      if (!value.trim()) {
        newErrors.fullName = 'Full name is required'
      } else if (value.trim().length < 2) {
        newErrors.fullName = 'Full name must be at least 2 characters'
      } else if (value.trim().length > 50) {
        newErrors.fullName = 'Full name must be less than 50 characters'
      } else {
        delete newErrors.fullName
      }
    } else if (name === 'username') {
      if (type === 'signup') {
        if (!value.trim()) {
          newErrors.username = 'Username is required'
        } else if (value.length < 3) {
          newErrors.username = 'Username must be at least 3 characters'
        } else if (value.length > 30) {
          newErrors.username = 'Username must be less than 30 characters'
        } else if (!/^[a-zA-Z0-9._]+$/.test(value)) {
          newErrors.username = 'Username can only contain letters, numbers, dots and underscores'
        } else {
          delete newErrors.username
        }
      } else {
        if (!value.trim()) {
          newErrors.username = 'Username or email is required'
        } else {
          delete newErrors.username
        }
      }
    } else if (name === 'password') {
      if (!value) {
        newErrors.password = 'Password is required'
      } else if (value.length < 6) {
        newErrors.password = 'Password must be at least 6 characters'
      } else if (value.length > 128) {
        newErrors.password = 'Password must be less than 128 characters'
      } else {
        delete newErrors.password
      }
    }
    
    setErrors(newErrors)
  }

  // Показать/скрыть пароль
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setApiError('')

    try {
      const endpoint = type === 'login' ? '/auth/login' : '/auth/register'
      const payload = type === 'login' 
        ? { 
            username: formData.username, // может быть email или username
            password: formData.password 
          }
        : {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName
          }

      // Sending request to endpoint
      // Payload logged
      
              const response = await axios.post(`${API_CONFIG.API_URL}${endpoint}`, payload)
      
      // Response logged
      
      if (response.data.token) {
        // Сохраняем JWT токен
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        // Перенаправляем на страницу логина после регистрации
        if (type === 'signup') {
          // Сохраняем email для автозаполнения на странице логина
          localStorage.setItem('signupEmail', formData.email)
          navigate('/login')
        } else {
          navigate('/feed') // Перенаправляем на главную страницу после входа
        }
      }
      
    } catch (error) {
      console.error('Auth error:', error)
      
      if (error.response?.data?.error) {
        setApiError(error.response.data.error)
      } else if (error.response?.data?.message) {
        setApiError(error.response.data.message)
      } else if (error.response?.status === 400) {
        setApiError('Invalid credentials. Please check your input.')
      } else if (error.response?.status === 409) {
        setApiError('User already exists with this email or username.')
      } else if (error.code === 'ERR_NETWORK') {
        setApiError('Cannot connect to server. Please make sure the backend is running.')
      } else {
        setApiError('Something went wrong. Please try again.')
      }
    } finally {
      // Removed loading state
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      className={styles.authForm}
    >
      {/* API Error Alert */}
      {apiError && (
        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
          {apiError}
        </Alert>
      )}

      {/* Email - первое поле для регистрации */}
      {type === 'signup' && (
        <TextField
          fullWidth
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
          onBlur={handleBlur}
          error={!!errors.email}
          helperText={errors.email}
          className={styles.textField}
          sx={textFieldStyles}
        />
      )}

      {/* Full Name - второе поле для регистрации */}
      {type === 'signup' && (
        <TextField
          fullWidth
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleInputChange}
          onBlur={handleBlur}
          error={!!errors.fullName}
          helperText={errors.fullName}
          className={styles.textField}
          sx={textFieldStyles}
        />
      )}

      {/* Username */}
      <TextField
        fullWidth
        name="username"
        placeholder={type === 'login' ? "Username, or email" : "Username"}
        value={formData.username}
        onChange={handleInputChange}
        onBlur={handleBlur}
        error={!!errors.username}
        helperText={errors.username}
        className={styles.textField}
        sx={textFieldStyles}
      />

      {/* Password */}
      <TextField
        fullWidth
        name="password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Password"
        value={formData.password}
        onChange={handleInputChange}
        onBlur={handleBlur}
        error={!!errors.password}
        helperText={errors.password}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleClickShowPassword}
                edge="end"
                size="small"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        className={styles.textField}
        sx={textFieldStyles}
      />

   

    

      {/* Submit Button */}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        className={styles.submitButton}
        sx={{
          mb: 2,
          py: 1.5,
          backgroundColor: '#0095F6',
          color: '#FFFFFF',
          borderRadius: '8px',
          textTransform: 'none',
          fontSize: '14px',
          fontWeight: 600,
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: '#1877F2'
          },
          '&:disabled': {
            backgroundColor: '#B2DFFC',
            color: '#FFFFFF'
          }
        }}
      >
        {type === 'login' ? 'Log in' : 'Sign up'}
      </Button>

      {/* OR Divider - только для логина */}
      {type === 'login' && (
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 2 }}>
          <Divider sx={{ flex: 1 }} />
          <Typography
            variant="body2"
            sx={{
              mx: 2,
              color: '#8E8E8E',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            OR
          </Typography>
          <Divider sx={{ flex: 1 }} />
        </Box>
      )}

      {/* Forgot password - только для логина */}
      {type === 'login' && (
        <Link
          component="button"
          type="button"
          onClick={() => navigate('/reset')}
          sx={{
            mb: 4,
            fontSize: '12px',
            color: '#00376B',
            textDecoration: 'none',
            fontWeight: 400,
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          Forgot password?
        </Link>
      )}

      {/* Switch between login/signup */}
      <Box
        sx={{
          border: '1px solid #DBDBDB',
          borderRadius: '1px',
          padding: '20px',
          width: '100%',
          textAlign: 'center',
          backgroundColor: '#FFFFFF'
        }}
      >
        <Typography
          variant="body2"
          sx={{ fontSize: '14px', color: '#262626' }}
        >
          {type === 'login' ? "Don't have an account? " : "Have an account? "}
          <Link
            component="button"
            type="button"
            onClick={() => navigate(type === 'login' ? '/signup' : '/login')}
            sx={{
              color: '#0095F6',
              textDecoration: 'none',
              fontWeight: 600,
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            {type === 'login' ? 'Sign up' : 'Log in'}
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}

export default AuthForm 