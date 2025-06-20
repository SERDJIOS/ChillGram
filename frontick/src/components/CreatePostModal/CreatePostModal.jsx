import React, { useState, useRef, useEffect } from 'react'
import styles from './CreatePostModal.module.css'
import arrowBackIcon from '../../assets/arrow_back.svg'
import arrowForwardIcon from '../../assets/arrow_forward.svg'

const CreatePostModal = ({ isOpen, onClose, onCreatePost }) => {
  const [selectedImages, setSelectedImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [caption, setCaption] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // Функция для проверки мобильного устройства
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  };

  // Cleanup camera stream when modal closes
  useEffect(() => {
    if (!isOpen) {
      closeCamera()
    }
  }, [isOpen])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files)
    if (files.length > 0) {
      setSelectedImages(files)
      setError('') // Очищаем ошибку при выборе нового файла
      setCurrentImageIndex(0) // Сбрасываем на первое изображение
      
      // Создаем превью для всех файлов (изображения и видео)
      const previews = []
      let loadedCount = 0
      
      files.forEach((file, index) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          previews[index] = e.target.result
          loadedCount++
          
          if (loadedCount === files.length) {
            setImagePreviews([...previews])
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleCameraCapture = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedImages([file])
      setError('')
      setCurrentImageIndex(0)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews([e.target.result])
      }
      reader.readAsDataURL(file)
    }
  }

  const handleTakePhotoVideo = () => {
    if (isMobileDevice()) {
      // На мобильных устройствах открываем нативную камеру для фото и видео
      document.getElementById('cameraInput').click()
    } else {
      // На десктопе используем веб-камеру
      openCamera()
    }
  }

  const openCamera = async () => {
    try {
      // Проверяем, мобильное ли это устройство
      const isMobile = isMobileDevice()
      
      if (isMobile) {
        // На мобильных устройствах сразу открываем нативную камеру
        document.getElementById('cameraInput').click()
      } else {
        // На десктопе используем getUserMedia для веб-камеры
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment' // Предпочитаем заднюю камеру
            }
          })
          
          setStream(mediaStream)
          setShowCamera(true)
          
          // Ждем, пока видео элемент будет готов
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream
              videoRef.current.play()
            }
          }, 100)
        } else {
          // Fallback - используем input с capture
          document.getElementById('cameraInput').click()
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setError('Не удалось получить доступ к камере. Попробуйте выбрать файл.')
      // Fallback - открываем обычный выбор файла
      document.getElementById('cameraInput').click()
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      // Устанавливаем размеры canvas равными размерам видео
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Рисуем текущий кадр видео на canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Конвертируем canvas в blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Создаем File объект из blob
          const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' })
          setSelectedImages([file])
          setCurrentImageIndex(0)
          
          // Создаем превью
          const reader = new FileReader()
          reader.onload = (e) => {
            setImagePreviews([e.target.result])
          }
          reader.readAsDataURL(file)
          
          // Закрываем камеру
          closeCamera()
        }
      }, 'image/jpeg', 0.8)
    }
  }

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (selectedImages.length === 0) {
      setError('Please select at least one image or video')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      // Отправляем все файлы (изображения и видео)
      await onCreatePost({
        images: selectedImages, // Отправляем массив всех файлов
        caption: caption.trim()
      })
      
      // Сброс формы
      setSelectedImages([])
      setImagePreviews([])
      setCurrentImageIndex(0)
      setCaption('')
      setError('')
      onClose()
    } catch (error) {
      console.error('Error creating post:', error)
      setError('Failed to create post. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      closeCamera()
      setSelectedImages([])
      setImagePreviews([])
      setCurrentImageIndex(0)
      setCaption('')
      setError('')
      onClose()
    }
  }

  const nextImage = () => {
    if (currentImageIndex < imagePreviews.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div 
      className={styles.overlay} 
      onClick={handleClose}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create new post</h2>
          <button 
            className={styles.closeButton} 
            onClick={handleClose}
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Показываем ошибку, если есть */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {/* Секция выбора изображения */}
          <div className={styles.imageSection}>
            {imagePreviews.length > 0 ? (
              <div className={styles.imagePreview}>
                {selectedImages[currentImageIndex]?.type?.startsWith('video/') ? (
                  <video 
                    src={imagePreviews[currentImageIndex]} 
                    className={styles.previewImage}
                    controls
                    muted
                    autoPlay={false}
                  />
                ) : (
                  <img 
                    src={imagePreviews[currentImageIndex]} 
                    alt="Preview" 
                    className={styles.previewImage}
                  />
                )}
                
                {/* Navigation buttons for multiple files */}
                {imagePreviews.length > 1 && (
                  <>
                    <button 
                      type="button"
                      className={`${styles.navButton} ${styles.prevButton}`}
                      onClick={prevImage}
                      disabled={currentImageIndex === 0 || isLoading}
                    >
                      <img src={arrowBackIcon} alt="Previous" />
                    </button>
                    <button 
                      type="button"
                      className={`${styles.navButton} ${styles.nextButton}`}
                      onClick={nextImage}
                      disabled={currentImageIndex === imagePreviews.length - 1 || isLoading}
                    >
                      <img src={arrowForwardIcon} alt="Next" />
                    </button>
                  </>
                )}
                
                {/* Indicators */}
                {imagePreviews.length > 1 && (
                  <div className={styles.indicators}>
                    {imagePreviews.map((_, index) => (
                      <div 
                        key={index}
                        className={`${styles.indicator} ${index === currentImageIndex ? styles.active : ''}`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                )}
                
                <button 
                  type="button"
                  className={styles.changeImageButton}
                  onClick={() => {
                    setSelectedImages([])
                    setImagePreviews([])
                    setCurrentImageIndex(0)
                  }}
                  disabled={isLoading}
                >
                  Change files
                </button>
              </div>
            ) : showCamera ? (
              <div className={styles.cameraPreview}>
                <video 
                  ref={videoRef}
                  className={styles.cameraVideo}
                  autoPlay
                  playsInline
                  muted
                />
                <canvas 
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
                <div className={styles.cameraControls}>
                  <button 
                    type="button"
                    className={styles.captureButton}
                    onClick={capturePhoto}
                  >
                    📷 Capture Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.imagePlaceholder}>
                <div className={styles.uploadIcon}>📷</div>
                <p className={styles.uploadText}>Drag photos and videos here</p>
                <div className={styles.buttonGroup}>
                  <button 
                    type="button"
                    className={styles.selectButton}
                    onClick={() => document.getElementById('imageInput').click()}
                    disabled={isLoading}
                  >
                    Select from Gallery
                  </button>
                  <button 
                    type="button"
                    className={styles.cameraButton}
                    onClick={handleTakePhotoVideo}
                    disabled={isLoading}
                  >
                    Take Photo/Video
                  </button>
                </div>
              </div>
            )}
            
            <input
              id="imageInput"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleImageSelect}
              className={styles.fileInput}
            />
            
            <input
              id="cameraInput"
              type="file"
              accept="image/*,video/*"
              capture="environment"
              onChange={handleCameraCapture}
              className={styles.fileInput}
            />
          </div>

          {/* Секция описания */}
          {imagePreviews.length > 0 && (
            <div className={styles.captionSection}>
              <div className={styles.formGroup}>
                
                <textarea
                  className={styles.textarea}
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={2200}
                  rows={4}
                  disabled={isLoading}
                />
                <div className={styles.charCount}>
                  {caption.length}/2,200
                </div>
              </div>
            </div>
          )}

          {/* Кнопки */}
          <div className={styles.buttonContainer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.createButton}
              disabled={selectedImages.length === 0 || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePostModal 