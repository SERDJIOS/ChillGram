import React from 'react'
import { Box, Container } from '@mui/material'
import AuthForm from '../../components/AuthForm/AuthForm'
import ChillgramLogo from '../../assets/logo.png'
import styles from './SignUpPage.module.css'

const SignUpPage = () => {

  return (
    <Container maxWidth="sm" className={styles.signupContainer}>
      <Box className={styles.formSection}>
        <Box className={styles.formWrapper}>
          {/* Логотип Chillgram */}
          <img 
            src={ChillgramLogo} 
            alt="Chillgram" 
            className={styles.logoImage}
          />

          {/* Форма регистрации */}
          <AuthForm type="signup" />
        </Box>
      </Box>
    </Container>
  )
}

export default SignUpPage 