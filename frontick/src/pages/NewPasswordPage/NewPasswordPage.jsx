import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { TextField, Button, Box, Alert, InputAdornment, IconButton } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import axios from 'axios'
import styles from './NewPasswordPage.module.css'
import lockIcon from '../../assets/lock.svg'
import { API_CONFIG } from '../../config/api.js';

const NewPasswordPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      setError('Both password fields are required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${API_CONFIG.API_URL}/auth/reset-password`, {
        token,
        newPassword: password
      })

      setSuccess(true)
      
      // Перенаправляем на страницу логина через 3 секунды
      setTimeout(() => {
        navigate('/login')
      }, 3000)
      
    } catch (error) {
      console.error('Reset password error:', error)
      
      if (error.response?.data?.error) {
        setError(error.response.data.error)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className={styles.resetContainer}>
        <div className={styles.formWrapper}>
          <div className={styles.lockIcon}>
            <img src={lockIcon} alt="Lock" />
          </div>
          
          <h1 className={styles.title}>Password Reset Successful!</h1>
          
          <p className={styles.subtitle}>
            Your password has been successfully reset. You will be redirected to the login page in a few seconds.
          </p>

          <Alert severity="success" sx={{ mb: 2, width: '100%' }}>
            Password reset successfully! Redirecting to login...
          </Alert>

          <Link to="/login" className={styles.backToLogin}>
            Go to login now
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.resetContainer}>
      <div className={styles.formWrapper}>
        <div className={styles.lockIcon}>
          <img src={lockIcon} alt="Lock" />
        </div>
        
        <h1 className={styles.title}>Reset Your Password</h1>
        
        <p className={styles.subtitle}>
          Enter your new password below.
        </p>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            fullWidth
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
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
                }
              },
              '& .MuiInputBase-input': {
                padding: '14px 12px',
                fontSize: '14px',
                fontWeight: 400
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#8E8E8E',
                opacity: 1
              }
            }}
          />

          <TextField
            fullWidth
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    size="small"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
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
                }
              },
              '& .MuiInputBase-input': {
                padding: '14px 12px',
                fontSize: '14px',
                fontWeight: 400
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#8E8E8E',
                opacity: 1
              }
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: loading ? '#B2DFFC' : '#4CB5F9',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: loading ? '#B2DFFC' : '#1877F2',
                boxShadow: 'none'
              },
              '&:disabled': {
                backgroundColor: '#B2DFFC',
                color: 'white'
              }
            }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </Box>

        <Link to="/login" className={styles.backToLogin}>
          Back to login
        </Link>
      </div>
    </div>
  )
}

export default NewPasswordPage 