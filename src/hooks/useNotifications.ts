import { useState, useEffect, useCallback } from 'react'
import { facilitaApi } from '../services/apiService'
import { notificationService } from '../services/notificationService'

interface ApiNotification {
  id: number
  titulo: string
  mensagem: string
  tipo: string
  lida: boolean
  created_at: string
  updated_at: string
}

interface Notification {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  time: string
  read: boolean
}

const mapNotificationType = (apiType: string): 'success' | 'info' | 'warning' | 'error' => {
  switch (apiType.toLowerCase()) {
    case 'sucesso':
    case 'success':
      return 'success'
    case 'aviso':
    case 'warning':
      return 'warning'
    case 'erro':
    case 'error':
      return 'error'
    default:
      return 'info'
  }
}

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'agora'
  if (diffInMinutes < 60) return `há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`
  
  return date.toLocaleDateString('pt-BR')
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const mapApiNotification = (apiNotification: ApiNotification): Notification => ({
    id: apiNotification.id.toString(),
    type: mapNotificationType(apiNotification.tipo),
    title: apiNotification.titulo,
    message: apiNotification.mensagem,
    time: formatTimeAgo(apiNotification.created_at),
    read: apiNotification.lida
  })

  const fetchNotifications = useCallback(async () => {
    try {
      console.log('🔔 Buscando notificações da API...')
      const response = await facilitaApi.getNotifications()
      console.log('📋 Resposta da API de notificações:', response)
      
      if (response && (response.success || response.data || Array.isArray(response))) {
        // Tentar diferentes estruturas de resposta
        let apiNotifications: ApiNotification[] = []
        
        if (Array.isArray(response)) {
          apiNotifications = response
        } else if (response.data && Array.isArray(response.data)) {
          apiNotifications = response.data
        } else if (response.data && typeof response.data === 'object') {
          // Se data é um objeto único, tentar convertê-lo
          try {
            apiNotifications = [response.data as ApiNotification]
          } catch (e) {
            console.log('Não foi possível converter data como ApiNotification')
          }
        }
        
        console.log('📨 Notificações processadas:', apiNotifications)
        
        if (apiNotifications.length > 0) {
          const mappedNotifications = apiNotifications.map(mapApiNotification)
          console.log('✅ Notificações mapeadas:', mappedNotifications)
          
          setNotifications(mappedNotifications)
          setUnreadCount(mappedNotifications.filter(n => !n.read).length)
          return
        }
      }
      
      console.log('⚠️ API não retornou notificações válidas, usando fallback mock')
      // Fallback para notificações mock se API falhar
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'success',
          title: 'Serviço concluído',
          message: 'Seu pedido foi finalizado com sucesso!',
          time: 'há 5 minutos',
          read: false
        },
        {
          id: '2',
          type: 'info',
          title: 'Prestador a caminho',
          message: 'O prestador está se dirigindo ao local.',
          time: 'há 15 minutos',
          read: false
        }
      ]
      
      setNotifications(mockNotifications)
      setUnreadCount(mockNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      
      // Usar notificações mock em caso de erro
      const mockNotifications: Notification[] = [
        {
          id: 'mock-1',
          type: 'warning',
          title: 'Erro de conexão',
          message: 'Não foi possível carregar notificações. Usando dados offline.',
          time: 'agora',
          read: false
        }
      ]
      
      setNotifications(mockNotifications)
      setUnreadCount(1)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const markAsRead = async (id: string) => {
    try {
      console.log('📝 Marcando notificação como lida:', id)
      
      // Atualizar localmente primeiro para UX responsiva
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true }
            : notification
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))

      // Só tentar atualizar no servidor se não for notificação mock/local
      if (!id.startsWith('mock-') && !id.startsWith('local-')) {
        console.log('🌐 Enviando requisição para marcar como lida...')
        const response = await facilitaApi.markNotificationAsRead(id)
        console.log('✅ Resposta do servidor:', response)
      } else {
        console.log('📱 Notificação local/mock - apenas atualização local')
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      notificationService.showError('Erro', 'Não foi possível marcar a notificação como lida')
      
      // Reverter mudança local em caso de erro
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: false }
            : notification
        )
      )
      setUnreadCount(prev => prev + 1)
    }
  }

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read)
    
    try {
      console.log('📝 Marcando todas as notificações como lidas')
      
      // Atualizar localmente primeiro
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      )
      setUnreadCount(0)

      // Verificar se há notificações reais (não mock/local) para atualizar no servidor
      const realNotifications = unreadNotifications.filter(n => !n.id.startsWith('mock-') && !n.id.startsWith('local-'))
      
      if (realNotifications.length > 0) {
        console.log('🌐 Enviando requisição para marcar todas como lidas...')
        await facilitaApi.markAllNotificationsAsRead()
        console.log('✅ Todas as notificações marcadas como lidas no servidor')
      } else {
        console.log('📱 Apenas notificações locais/mock - apenas atualização local')
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      notificationService.showError('Erro', 'Não foi possível marcar todas as notificações como lidas')
      
      // Reverter mudanças locais em caso de erro
      setNotifications(prev => 
        prev.map(notification => {
          const wasUnread = unreadNotifications.find(n => n.id === notification.id)
          return wasUnread ? { ...notification, read: false } : notification
        })
      )
      setUnreadCount(unreadNotifications.length)
    }
  }

  const clearAll = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  const refresh = async () => {
    setRefreshing(true)
    await fetchNotifications()
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'time'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `local-${Date.now()}`,
      time: 'agora'
    }
    
    setNotifications(prev => [newNotification, ...prev])
    if (!notification.read) {
      setUnreadCount(prev => prev + 1)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    refreshing,
    markAsRead,
    markAllAsRead,
    clearAll,
    addNotification,
    refresh
  }
}
