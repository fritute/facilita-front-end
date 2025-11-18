// Hook personalizado para gerenciar WebSocket
import { useState, useEffect, useCallback } from 'react'
import websocketService, { LocationUpdate, ReceivedMessage } from '../services/websocketService'
import locationTracker from '../services/locationTracker'

interface UseWebSocketProps {
  serviceId?: string | number
  enableTracking?: boolean
  enableChat?: boolean
}

interface UseWebSocketReturn {
  isConnected: boolean
  sendLocation: (lat: number, lng: number) => void
  sendMessage: (message: string, targetUserId: number) => void
  onLocationUpdate: (callback: (data: LocationUpdate) => void) => void
  onMessageReceived: (callback: (message: ReceivedMessage) => void) => void
  connect: () => Promise<void>
  disconnect: () => void
  startLocationTracking: () => void
  stopLocationTracking: () => void
  isTrackingLocation: boolean
}

export const useWebSocket = ({ 
  serviceId, 
  enableTracking = false, 
  enableChat = false 
}: UseWebSocketProps): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false)
  const [isTrackingLocation, setIsTrackingLocation] = useState(false)

  // Conectar ao WebSocket
  const connect = useCallback(async () => {
    if (isConnected || !serviceId) return

    try {
      console.log('🔌 Conectando WebSocket via hook...')
      
      // Conectar ao serviço
      await websocketService.connect()
      setIsConnected(true)
      
      // Obter dados do usuário
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const userType = localStorage.getItem('userType') || 'CONTRATANTE'
      
      // Autenticar usuário com formato exato da documentação
      await websocketService.authenticateUser({
        userId: userData.id || userData.id_usuario || 1,
        userType: userType.toLowerCase() as 'contratante' | 'prestador',
        userName: userData.nome || userData.name || 'Usuário'
      })
      
      // Entrar na sala do serviço
      await websocketService.joinService(serviceId)
      
      console.log('✅ WebSocket conectado via hook')
      
    } catch (error) {
      console.error('❌ Erro ao conectar WebSocket via hook:', error)
      setIsConnected(false)
    }
  }, [serviceId, isConnected])

  // Desconectar do WebSocket
  const disconnect = useCallback(() => {
    if (isConnected) {
      console.log('🔌 Desconectando WebSocket via hook...')
      websocketService.removeAllListeners()
      websocketService.disconnect()
      setIsConnected(false)
    }
  }, [isConnected])

  // Enviar localização
  const sendLocation = useCallback((lat: number, lng: number) => {
    if (!isConnected || !serviceId) return

    const userData = JSON.parse(localStorage.getItem('userData') || '{}')
    
    websocketService.sendLocation({
      servicoId: typeof serviceId === 'string' ? parseInt(serviceId) : serviceId,
      latitude: lat,
      longitude: lng,
      userId: userData.id || userData.id_usuario || 1
    })
  }, [isConnected, serviceId])

  // Enviar mensagem
  const sendMessage = useCallback((message: string, targetUserId?: number) => {
    if (!isConnected || !serviceId) {
      console.error('❌ WebSocket não conectado ou serviceId não definido')
      return
    }

    const userType = localStorage.getItem('userType') || 'CONTRATANTE'
    
    // Usar exatamente o formato da documentação
    websocketService.sendMessage({
      servicoId: typeof serviceId === 'string' ? parseInt(serviceId) : serviceId,
      mensagem: message,
      sender: userType.toLowerCase() as 'contratante' | 'prestador',
      targetUserId: targetUserId || 1 // Fallback para ID 1 se não especificado
    })
  }, [isConnected, serviceId])

  // Escutar atualizações de localização
  const onLocationUpdate = useCallback((callback: (data: LocationUpdate) => void) => {
    if (!enableTracking || !isConnected) {
      console.log('⚠️ WebSocket não conectado para tracking, aguardando conexão...')
      return
    }
    websocketService.onLocationUpdate(callback)
  }, [enableTracking, isConnected])

  // Escutar mensagens
  const onMessageReceived = useCallback((callback: (message: ReceivedMessage) => void) => {
    if (!enableChat || !isConnected) {
      console.log('⚠️ WebSocket não conectado para chat, aguardando conexão...')
      return
    }
    websocketService.onMessageReceived(callback)
  }, [enableChat, isConnected])

  // Iniciar tracking automático de localização
  const startLocationTracking = useCallback(() => {
    if (!serviceId || !isConnected || isTrackingLocation) {
      console.log('⚠️ Não é possível iniciar tracking:', { serviceId, isConnected, isTrackingLocation })
      return
    }

    const userData = JSON.parse(localStorage.getItem('userData') || '{}')
    
    locationTracker.startTracking({
      serviceId: typeof serviceId === 'string' ? parseInt(serviceId) : serviceId,
      userId: userData.id || userData.id_usuario || 1,
      intervalMs: 5000, // 5 segundos
      simulateMovement: true // Simular movimento para testes
    })

    setIsTrackingLocation(true)
    console.log('📍 Tracking de localização iniciado')
  }, [serviceId, isConnected, isTrackingLocation])

  // Parar tracking de localização
  const stopLocationTracking = useCallback(() => {
    if (isTrackingLocation) {
      locationTracker.stopTracking()
      setIsTrackingLocation(false)
      console.log('🛑 Tracking de localização parado')
    }
  }, [isTrackingLocation])

  // Conectar automaticamente quando o hook for montado
  useEffect(() => {
    if (serviceId && (enableTracking || enableChat)) {
      connect()
    }

    // Cleanup ao desmontar
    return () => {
      disconnect()
    }
  }, [serviceId, enableTracking, enableChat, connect, disconnect])

  // Verificar status da conexão periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = websocketService.getConnectionStatus()
      if (currentStatus !== isConnected) {
        setIsConnected(currentStatus)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isConnected])

  return {
    isConnected,
    sendLocation,
    sendMessage,
    onLocationUpdate,
    onMessageReceived,
    connect,
    disconnect,
    startLocationTracking,
    stopLocationTracking,
    isTrackingLocation
  }
}

export default useWebSocket
