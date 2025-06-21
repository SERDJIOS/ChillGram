import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import LoginPage from './pages/LoginPage/LoginPage'
import SignUpPage from './pages/SignUpPage/SignUpPage'
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage'
import NewPasswordPage from './pages/NewPasswordPage/NewPasswordPage'
import FeedPage from './pages/FeedPage/FeedPage'
import ProfilePage from './pages/ProfilePage/ProfilePage'
import OtherProfile from './pages/OtherProfile/OtherProfile'
import EditProfilePage from './pages/EditProfilePage/EditProfilePage'
import PostPage from './pages/PostPage/PostPage'
import MessagesPage from './pages/MessagesPage/MessagesPage'
import NotificationsPage from './pages/NotificationsPage/NotificationsPage'

// Компонент для защищенных роутов
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// Компонент для публичных роутов (только для неавторизованных)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  
  if (token && user) {
    return <Navigate to="/feed" replace />
  }
  
  return children
}

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Проверяем токен при загрузке приложения
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      
      console.log('🔍 Checking authentication...')
      console.log('Token exists:', !!token)
      console.log('User exists:', !!user)
      
      if (token && user) {
        try {
          // Проверяем что user это валидный JSON
          JSON.parse(user)
          setIsAuthenticated(true)
          console.log('✅ User is authenticated')
        } catch (error) {
          console.log('❌ Invalid user data, clearing localStorage')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setIsAuthenticated(false)
        }
      } else {
        setIsAuthenticated(false)
        console.log('❌ User is not authenticated')
      }
      
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  // Показываем загрузку пока проверяем авторизацию
  if (isLoading) {
    return (
      <Box sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Loading...</div>
      </Box>
    )
  }

  return (
    <Router>
      <Box sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#FFFFFF !important'
      }}>
        <Routes>
          {/* Публичные роуты - только для неавторизованных */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <SignUpPage />
            </PublicRoute>
          } />
          <Route path="/reset" element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          } />
          <Route path="/reset-password/:token" element={
            <PublicRoute>
              <NewPasswordPage />
            </PublicRoute>
          } />

          {/* Защищенные роуты - только для авторизованных */}
          <Route path="/feed" element={
            <ProtectedRoute>
              <FeedPage />
            </ProtectedRoute>
          } />
          <Route path="/search" element={
            <ProtectedRoute>
              <FeedPage />
            </ProtectedRoute>
          } />
          <Route path="/explore" element={
            <ProtectedRoute>
              <FeedPage />
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } />
          <Route path="/create" element={
            <ProtectedRoute>
              <FeedPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/user/:userId" element={
            <ProtectedRoute>
              <OtherProfile />
            </ProtectedRoute>
          } />
          <Route path="/profile/:userId" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/post/:postId" element={
            <ProtectedRoute>
              <PostPage />
            </ProtectedRoute>
          } />
          <Route path="/edit-profile" element={
            <ProtectedRoute>
              <EditProfilePage />
            </ProtectedRoute>
          } />

          {/* Главная страница - перенаправление в зависимости от авторизации */}
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/feed" replace /> : <Navigate to="/login" replace />
          } />
        </Routes>
      </Box>
    </Router>
  )
}

export default App
