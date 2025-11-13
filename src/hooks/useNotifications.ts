import { useState, useEffect } from 'react'
import { notificationService, type NotificationData } from '../services/notificationService'

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications)
    setNotifications(notificationService.getNotifications())
    
    return unsubscribe
  }, [])

  const showError = (title: string, message: string) => {
    notificationService.showError(title, message)
  }

  const showWarning = (title: string, message: string) => {
    notificationService.showWarning(title, message)
  }

  const showSuccess = (title: string, message: string) => {
    notificationService.showSuccess(title, message)
  }

  const showInfo = (title: string, message: string) => {
    notificationService.showInfo(title, message)
  }

  const markAsRead = (id: string) => {
    notificationService.markAsRead(id)
  }

  const clearAll = () => {
    notificationService.clearAll()
  }

  return {
    notifications,
    showError,
    showWarning,
    showSuccess,
    showInfo,
    markAsRead,
    clearAll
  }
}
