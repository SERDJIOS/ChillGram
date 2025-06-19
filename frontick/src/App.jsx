import React from 'react'
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

function App() {
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/reset" element={<ResetPasswordPage />} />
          <Route path="/reset-password/:token" element={<NewPasswordPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/search" element={<FeedPage />} />
          <Route path="/explore" element={<FeedPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/create" element={<FeedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/user/:userId" element={<OtherProfile />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/post/:postId" element={<PostPage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Box>
    </Router>
  )
}

export default App
