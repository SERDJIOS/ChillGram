import React, { useState, useRef, useEffect } from 'react'
import styles from './VideoCall.module.css'
import DefaultProfilePic from '../../assets/profile.png'

const VideoCall = ({ 
  isOpen, 
  onClose, 
  otherUser, 
  isIncoming = false,
  callType = 'video' // 'video' или 'audio'
}) => {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(true)
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const callTimerRef = useRef(null)

  useEffect(() => {
    console.log('VideoCall useEffect:', { isOpen, isIncoming, showConfirmModal })
    if (isOpen) {
      if (isIncoming) {
        // Для входящих звонков сразу показываем интерфейс звонка
        console.log('Setting showConfirmModal to false for incoming call')
        setShowConfirmModal(false)
      } else {
        // Для исходящих звонков показываем модальное окно подтверждения
        console.log('Setting showConfirmModal to true for outgoing call')
        setShowConfirmModal(true)
      }
    } else {
      // Когда компонент закрывается, сбрасываем состояния
      setIsCallActive(false)
      setIsConnecting(false)
      setCallDuration(0)
      setShowConfirmModal(true)
    }
  }, [isOpen, isIncoming])

  useEffect(() => {
    if (isCallActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(callTimerRef.current)
    }

    return () => clearInterval(callTimerRef.current)
  }, [isCallActive])

  const startCall = async () => {
    try {
      setIsConnecting(true)
      
      // Получаем доступ к камере и микрофону
      const constraints = {
        video: callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // Передняя камера для селфи
        } : false,
        audio: true
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      localStreamRef.current = stream
      
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream
      }
      
      // Симуляция подключения (в реальном приложении здесь будет WebRTC)
      setTimeout(() => {
        setIsConnecting(false)
        setIsCallActive(true)
      }, 3000) // Увеличиваем время для более реалистичного эффекта
      
    } catch (error) {
      console.error('Error accessing media devices:', error)
      setIsConnecting(false)
      onClose()
    }
  }

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    
    clearInterval(callTimerRef.current)
    onClose()
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current && callType === 'video') {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const confirmCall = () => {
    setShowConfirmModal(false)
    setIsConnecting(true)
    startCall()
  }

  const acceptCall = () => {
    setIsConnecting(true)
    startCall()
  }

  const cancelCall = () => {
    onClose()
  }

  if (!isOpen) return null

  console.log('VideoCall render:', { isOpen, isIncoming, showConfirmModal, callType })

  return (
    <div className={styles.videoCallOverlay}>
      <div className={styles.videoCallContainer}>
        {/* Модальное окно подтверждения звонка */}
        {showConfirmModal && !isIncoming && (
          <div className={styles.confirmModal}>
            <div className={styles.confirmContent}>
              <div className={styles.confirmAvatar}>
                <img 
                  src={otherUser.profileImage || DefaultProfilePic} 
                  alt={otherUser.username}
                />
              </div>
              <div className={styles.confirmInfo}>
                <div className={styles.confirmUsername}>{otherUser.username}</div>
                <div className={styles.confirmQuestion}>Совершить вызов?</div>
              </div>
              <button 
                className={styles.confirmButton}
                onClick={confirmCall}
              >
                Позвонить
              </button>
            </div>
          </div>
        )}

        {/* Основной интерфейс звонка */}
        {!showConfirmModal && (
          <>
            {/* Заголовок */}
            <div className={styles.callHeader}>
              <div className={styles.userInfo}>
                <img 
                  src={otherUser.profileImage || DefaultProfilePic} 
                  alt={otherUser.username}
                  className={styles.userAvatar}
                />
                <div>
                  <div className={styles.userName}>{otherUser.username}</div>
                  <div className={styles.callStatus}>
                    {isConnecting ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className={styles.connectingDots}>
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        Connecting...
                      </span>
                    ) : isCallActive ? (
                      formatCallDuration(callDuration)
                    ) : isIncoming ? (
                      'Incoming call'
                    ) : (
                      'Calling...'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Видео область */}
            {callType === 'video' && (
              <div className={styles.videoContainer}>
                {/* Удаленное видео или заглушка */}
                {isCallActive ? (
                  <video
                    ref={remoteVideoRef}
                    className={styles.remoteVideo}
                    autoPlay
                    playsInline
                  />
                ) : (
                  <div className={styles.remoteVideoPlaceholder}>
                    <img 
                      src={otherUser.profileImage || DefaultProfilePic} 
                      alt={otherUser.username}
                      className={styles.remoteAvatarLarge}
                    />
                    {isConnecting && (
                      <div className={styles.pulsingRing}></div>
                    )}
                  </div>
                )}
                
                {/* Локальное видео */}
                <video
                  ref={localVideoRef}
                  className={styles.localVideo}
                  autoPlay
                  playsInline
                  muted
                  style={{ display: isVideoOff ? 'none' : 'block' }}
                />
                
                {/* Заглушка для выключенной камеры */}
                {isVideoOff && (
                  <div className={styles.localVideoOff}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path 
                        d="M16 16v1a2 2 0 01-2 2H2a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v.34l1 1L23 7v10" 
                        stroke="white" 
                        strokeWidth="2"
                      />
                      <line x1="1" y1="1" x2="23" y2="23" stroke="white" strokeWidth="2"/>
                    </svg>
                  </div>
                )}
              </div>
            )}

            {/* Аудио режим */}
            {callType === 'audio' && (
              <div className={styles.audioContainer}>
                <div className={styles.audioAvatar}>
                  <img 
                    src={otherUser.profileImage || DefaultProfilePic} 
                    alt={otherUser.username}
                  />
                  {isConnecting && (
                    <div className={styles.pulsingRing}></div>
                  )}
                </div>
              </div>
            )}

            {/* Входящий звонок */}
            {isIncoming && !isCallActive && (
              <div className={styles.incomingCallActions}>
                <button 
                  className={`${styles.callButton} ${styles.declineButton}`}
                  onClick={cancelCall}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path 
                      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      transform="rotate(135 12 12)"
                    />
                  </svg>
                </button>
                
                <button 
                  className={`${styles.callButton} ${styles.acceptButton}`}
                  onClick={acceptCall}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path 
                      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Управление звонком */}
            {(isCallActive || (!isIncoming && !isConnecting)) && (
              <div className={styles.callControls}>
                {/* Кнопка камеры */}
                {callType === 'video' && (
                  <button 
                    className={`${styles.controlButton} ${isVideoOff ? styles.active : ''}`}
                    onClick={toggleVideo}
                    title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <circle cx="8" cy="10" r="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                      {isVideoOff && <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2"/>}
                    </svg>
                  </button>
                )}

                {/* Кнопка микрофона */}
                <button 
                  className={`${styles.controlButton} ${isMuted ? styles.active : ''}`}
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M19 10v2a7 7 0 01-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/>
                    <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2"/>
                    {isMuted && <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2"/>}
                  </svg>
                </button>

                {/* Кнопка завершения звонка */}
                <button 
                  className={`${styles.controlButton} ${styles.endCallButton}`}
                  onClick={endCall}
                  title="End call"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path 
                      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      transform="rotate(135 12 12)"
                    />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default VideoCall 