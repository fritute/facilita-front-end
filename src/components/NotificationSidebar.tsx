import React from 'react'
import { X, Bell, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Notification {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  time: string
  read: boolean
}

interface NotificationSidebarProps {
  isOpen: boolean
  onClose: () => void
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onClearAll: () => void
}

const NotificationSidebar: React.FC<NotificationSidebarProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onClearAll
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Bell className="w-5 h-5 text-blue-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <>
      {/* Overlay escuro */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar de notificações */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 md:w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-green-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-bold">Notificações</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contador e ações */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {notifications.filter(n => !n.read).length} não lidas
            </span>
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Limpar tudo
              </button>
            )}
          </div>
        </div>

        {/* Lista de notificações */}
        <div className="overflow-y-auto h-[calc(100vh-140px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <Bell className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-center">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => onMarkAsRead(notification.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    getTypeColor(notification.type)
                  } ${!notification.read ? 'ring-2 ring-green-300' : 'opacity-75'}`}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-800 text-sm">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {notification.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default NotificationSidebar
