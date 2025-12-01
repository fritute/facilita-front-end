// WebSocket Service para tracking em tempo real e chat
import { io, Socket } from 'socket.io-client'

interface UserData {
  userId: number
  userType: 'contratante' | 'prestador'
  userName: string
}

interface LocationData {
  servicoId: number
  latitude: number
  longitude: number
  userId: number
}

interface MessageData {
  servicoId: number
  mensagem: string
  sender: 'contratante' | 'prestador'
  targetUserId: number
}

interface CallInitiateData {
  servicoId: string | number
  callerId: string | number
  callerName: string
  targetUserId: string | number
  callType: 'video' | 'audio'
}

interface CallAcceptData {
  servicoId: string | number
  callId: string
  callerId: string | number
  answer: RTCSessionDescriptionInit
}

interface CallEndData {
  servicoId: string | number
  callId: string
  targetUserId: string | number
  reason: string
}

interface CallIceCandidateData {
  servicoId: string | number
  targetUserId: string | number
  candidate: RTCIceCandidateInit
  callId: string
}

interface CallToggleMediaData {
  servicoId: string | number
  targetUserId: string | number
  mediaType: 'video' | 'audio'
  enabled: boolean
  callId: string
}

interface ReceivedMessage {
  servicoId: number
  mensagem: string
  sender: 'contratante' | 'prestador'
  userName: string
  timestamp: string
}

interface LocationUpdate {
  servicoId: number
  latitude: number
  longitude: number
  prestadorName: string
  timestamp: string
}

class WebSocketService {
  private socket: Socket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  // URLs do WebSocket - conforme documentação oficial
  private readonly WEBSOCKET_URL = 'wss://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net'

  connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // Conectando ao WebSocket
        console.log('🔌 WebSocketService: Conectando em:', this.WEBSOCKET_URL)
        
        this.socket = io(this.WEBSOCKET_URL, {
          transports: ['websocket'],
          timeout: 10000,
          forceNew: true
        })

        this.socket.on('connect', () => {
          // WebSocket conectado com sucesso
          this.isConnected = true
          this.reconnectAttempts = 0
          resolve(true)
        })

        this.socket.on('connect_error', (error) => {
          // Erro na conexão WebSocket
          this.isConnected = false
          this.handleReconnect()
          reject(error)
        })

        this.socket.on('disconnect', (reason) => {
          // WebSocket desconectado
          this.isConnected = false
          if (reason === 'io server disconnect') {
            // Servidor desconectou, tentar reconectar
            this.handleReconnect()
          }
        })

        // Timeout para conexão
        setTimeout(() => {
          if (!this.isConnected) {
            // Timeout na conexão WebSocket
            reject(new Error('Timeout na conexão'))
          }
        }, 10000)

      } catch (error) {
        // Erro ao inicializar WebSocket
        reject(error)
      }
    })
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      // Tentativa de reconexão
      
      setTimeout(() => {
        this.connect().catch(() => {
          // Falha na reconexão
        })
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      // Máximo de tentativas de reconexão atingido
    }
  }

  // Autenticar usuário no WebSocket
  authenticateUser(userData: UserData): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket não conectado'))
        return
      }

      // Autenticando usuário
      
      // Enviar exatamente como na documentação
      this.socket.emit('user_connected', {
        userId: userData.userId,
        userType: userData.userType,
        userName: userData.userName
      })
      
      // Escutar resposta de conexão estabelecida
      this.socket.once('connection_established', (response) => {
        // Conexão estabelecida
        resolve(response)
      })

      // Timeout para autenticação
      setTimeout(() => {
        // User connected enviado
        resolve({ success: true })
      }, 2000)
    })
  }

  // Entrar na sala do serviço
  joinService(servicoId: string | number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket não conectado'))
        return
      }

      // Entrando na sala do serviço
      
      // Enviar evento join_servico conforme documentação (apenas o número do serviço)
      this.socket.emit('join_servico', parseInt(servicoId.toString()))
      
      // Escutar confirmação de entrada na sala
      this.socket.once('joined_servico', (response) => {
        // Entrou na sala do serviço
        resolve(response)
      })

      // Timeout
      setTimeout(() => {
        // Join servico enviado
        resolve({ success: true, servicoId })
      }, 2000)
    })
  }

  // Enviar localização
  sendLocation(locationData: LocationData) {
    if (!this.socket || !this.isConnected) {
      // WebSocket não conectado para enviar localização
      return
    }

    // Enviando localização
    this.socket.emit('update_location', locationData)
  }

  // Escutar atualizações de localização
  onLocationUpdate(callback: (data: LocationUpdate) => void) {
    if (!this.socket) {
      // WebSocket não conectado para escutar localização
      return
    }

    this.socket.on('location_updated', (data: LocationUpdate) => {
      // Localização atualizada recebida
      callback(data)
    })
  }

  // Enviar mensagem no chat
  sendMessage(messageData: MessageData) {
    if (!this.socket || !this.isConnected) {
      // WebSocket não conectado para enviar mensagem
      return
    }

    // Usar exatamente o formato da documentação
    const payload = {
      servicoId: messageData.servicoId,
      mensagem: messageData.mensagem,
      sender: messageData.sender,
      targetUserId: messageData.targetUserId
    }

    // Enviando mensagem via WebSocket
    this.socket.emit('send_message', payload)
  }

  // Escutar mensagens do chat
  onMessageReceived(callback: (message: ReceivedMessage) => void) {
    if (!this.socket) {
      // WebSocket não conectado para escutar mensagens
      return
    }

    this.socket.on('receive_message', (message: ReceivedMessage) => {
      // Mensagem recebida via WebSocket
      callback(message)
    })
  }

  // Desconectar
  disconnect() {
    if (this.socket) {
      // Desconectando WebSocket
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  // Verificar se está conectado
  getConnectionStatus(): boolean {
    return this.isConnected && this.socket?.connected === true
  }

  // ===== MÉTODOS DE CHAMADA (WebRTC) =====

  // Iniciar chamada
  initiateCall(data: CallInitiateData) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ WebSocket não conectado para iniciar chamada')
      return
    }

    console.log('📞 Iniciando chamada via WebSocket:', data)
    this.socket.emit('call:initiate', data)
  }

  // Aceitar chamada
  acceptCall(data: CallAcceptData) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ WebSocket não conectado para aceitar chamada')
      return
    }

    console.log('✅ Aceitando chamada via WebSocket:', data)
    this.socket.emit('call:accept', data)
  }

  // Rejeitar chamada
  rejectCall(callId: string, reason: string = 'user_rejected') {
    if (!this.socket || !this.isConnected) {
      console.error('❌ WebSocket não conectado para rejeitar chamada')
      return
    }

    console.log('❌ Rejeitando chamada via WebSocket:', callId)
    this.socket.emit('call:reject', {
      callId,
      reason
    })
  }

  // Encerrar chamada
  endCall(data: CallEndData) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ WebSocket não conectado para encerrar chamada')
      return
    }

    console.log('📞 Encerrando chamada via WebSocket:', data)
    this.socket.emit('call:end', data)
  }

  // Enviar ICE candidate
  sendIceCandidate(data: CallIceCandidateData) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ WebSocket não conectado para enviar ICE candidate')
      return
    }

    console.log('🧊 Enviando ICE candidate via WebSocket')
    this.socket.emit('call:ice-candidate', data)
  }

  // Alternar mídia (vídeo/áudio)
  toggleMedia(data: CallToggleMediaData) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ WebSocket não conectado para alternar mídia')
      return
    }

    console.log('🎛️ Alternando mídia via WebSocket:', data)
    this.socket.emit('call:toggle-media', data)
  }

  // Escutar eventos de chamada
  onCallInitiated(callback: (data: any) => void) {
    if (!this.socket) return

    this.socket.on('call:initiated', callback)
  }

  onCallIncoming(callback: (data: any) => void) {
    if (!this.socket) return

    this.socket.on('call:incoming', callback)
  }

  onCallAccepted(callback: (data: any) => void) {
    if (!this.socket) return

    this.socket.on('call:accepted', callback)
  }

  onCallRejected(callback: (data: any) => void) {
    if (!this.socket) return

    this.socket.on('call:rejected', callback)
  }

  onCallEnded(callback: (data: any) => void) {
    if (!this.socket) return

    this.socket.on('call:ended', callback)
  }

  onCallFailed(callback: (data: any) => void) {
    if (!this.socket) return

    this.socket.on('call:failed', callback)
  }

  onCallCancelled(callback: (data: any) => void) {
    if (!this.socket) return

    this.socket.on('call:cancelled', callback)
  }

  onCallIceCandidate(callback: (data: any) => void) {
    if (!this.socket) return

    this.socket.on('call:ice-candidate', callback)
  }

  onCallMediaToggled(callback: (data: any) => void) {
    if (!this.socket) return

    this.socket.on('call:media-toggled', callback)
  }

  // Remover todos os listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners()
    }
  }
}

// Instância singleton
export const websocketService = new WebSocketService()
export default websocketService

// Tipos para exportação
export type {
  UserData,
  LocationData,
  MessageData,
  ReceivedMessage,
  LocationUpdate
}
