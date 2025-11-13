interface NotificationData {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  time: string
  read: boolean
}

class NotificationService {
  private notifications: NotificationData[] = []
  private listeners: ((notifications: NotificationData[]) => void)[] = []

  subscribe(callback: (notifications: NotificationData[]) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.notifications]))
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private getCurrentTime(): string {
    return new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  showError(title: string, message: string) {
    const notification: NotificationData = {
      id: this.generateId(),
      type: 'error',
      title,
      message,
      time: this.getCurrentTime(),
      read: false
    }
    this.notifications.unshift(notification)
    this.notify()
  }

  showWarning(title: string, message: string) {
    const notification: NotificationData = {
      id: this.generateId(),
      type: 'warning',
      title,
      message,
      time: this.getCurrentTime(),
      read: false
    }
    this.notifications.unshift(notification)
    this.notify()
  }

  showSuccess(title: string, message: string) {
    const notification: NotificationData = {
      id: this.generateId(),
      type: 'success',
      title,
      message,
      time: this.getCurrentTime(),
      read: false
    }
    this.notifications.unshift(notification)
    this.notify()
  }

  showInfo(title: string, message: string) {
    const notification: NotificationData = {
      id: this.generateId(),
      type: 'info',
      title,
      message,
      time: this.getCurrentTime(),
      read: false
    }
    this.notifications.unshift(notification)
    this.notify()
  }

  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id)
    if (notification) {
      notification.read = true
      this.notify()
    }
  }

  clearAll() {
    this.notifications = []
    this.notify()
  }

  getNotifications(): NotificationData[] {
    return [...this.notifications]
  }
}

export const notificationService = new NotificationService()
export type { NotificationData }
