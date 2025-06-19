import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { TextField, Button, Box, Alert } from '@mui/material'
import axios from 'axios'
import styles from './ResetPasswordPage.module.css'
import lockIcon from '../../assets/lock.svg'

const ResetPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Email or username is required')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await axios.post('http://localhost:3001/api/auth/forgot-password', {
        email: email.trim()
      })

      setMessage(response.data.message)
      setEmailSent(true)
      setEmail('')
      
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

  return (
    <div className={styles.resetContainer}>
      <div className={styles.formWrapper}>
        <div className={styles.lockIcon}>
          <img src={lockIcon} alt="Lock" />
        </div>
        
        <h1 className={styles.title}>Trouble logging in?</h1>
        
        <p className={styles.subtitle}>
          Enter your email, phone, or username and we'll send you a link to get back into your account.
        </p>

        {/* Success Message */}
        {message && (
          <Alert severity="success" sx={{ mb: 2, width: '100%' }}>
            {message}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error}
          </Alert>
        )}

        {!emailSent && (
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              fullWidth
              name="email"
              type="text"
              placeholder="Email or Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
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
              {loading ? 'Sending...' : 'Reset your password'}
            </Button>
          </Box>
        )}

        {emailSent && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              onClick={() => {
                setEmailSent(false)
                setMessage('')
                setError('')
              }}
              sx={{
                color: '#0095F6',
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Send another email
            </Button>
          </Box>
        )}

        <div className={styles.divider}>
          <span className={styles.dividerText}>OR</span>
        </div>

        <Link to="/signup" style={{ 
          color: '#262626', 
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          Create new account
        </Link>

        <Link to="/login" className={styles.backToLogin}>
          Back to login
        </Link>
      </div>
    </div>
  )
}

export default ResetPasswordPage 