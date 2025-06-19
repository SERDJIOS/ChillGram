import React from 'react'
import { Box, Container, useTheme, useMediaQuery } from '@mui/material'
import AuthForm from '../../components/AuthForm/AuthForm'
import LoginBackground from '../../assets/logo_back.jpg'
import ChillgramLogo from '../../assets/logo.png'
import styles from './LoginPage.module.css'

const LoginPage = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Container maxWidth="lg" className={styles.loginContainer}>
      {/* Левая часть с фоновым изображением - только на десктопе */}
      {!isMobile && (
        <Box className={styles.backgroundSection}>
          <Box
            className={styles.phonePreview}
            sx={{
              backgroundImage: `url(${LoginBackground})`,
            }}
          />
        </Box>
      )}

      {/* Правая часть с формой логина */}
      <Box className={styles.formSection}>
        <Box className={styles.formWrapper}>
          {/* Логотип Chillgram */}
          <img 
            src={ChillgramLogo} 
            alt="Chillgram" 
            className={styles.logoImage}
          />

          {/* Форма авторизации */}
          <AuthForm type="login" />
        </Box>
      </Box>
    </Container>
  )
}

export default LoginPage 