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

  // URLs do WebSocket
  private readonly WEBSOCKET_URL = 'wss://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net'

  connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Conectando ao WebSocket:', this.WEBSOCKET_URL)
        
        this.socket = io(this.WEBSOCKET_URL, {
          transports: ['websocket'],
          timeout: 10000,
          forceNew: true
        })

        this.socket.on('connect', () => {
          console.log('✅ WebSocket conectado com sucesso')
          console.log('🆔 Socket ID:', this.socket?.id)
          this.isConnected = true
          this.reconnectAttempts = 0
          resolve(true)
        })

        this.socket.on('connect_error', (error) => {
          console.error('❌ Erro na conexão WebSocket:', error)
          this.isConnected = false
          this.handleReconnect()
          reject(error)
        })

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 WebSocket desconectado:', reason)
          this.isConnected = false
          if (reason === 'io server disconnect') {
            // Servidor desconectou, tentar reconectar
            this.handleReconnect()
          }
        })

        // Timeout para conexão
        setTimeout(() => {
          if (!this.isConnected) {
            console.error('⏰ Timeout na conexão WebSocket')
            reject(new Error('Timeout na conexão'))
          }
        }, 10000)

      } catch (error) {
        console.error('❌ Erro ao inicializar WebSocket:', error)
        reject(error)
      }
    })
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('❌ Falha na reconexão:', error)
        })
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('❌ Máximo de tentativas de reconexão atingido')
    }
  }

  // Autenticar usuário no WebSocket
  authenticateUser(userData: UserData): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket não conectado'))
        return
      }

      console.log('🔐 Autenticando usuário:', userData)
      
      // Enviar exatamente como na documentação
      this.socket.emit('user_connected', {
        userId: userData.userId,
        userType: userData.userType,
        userName: userData.userName
      })
      
      // Escutar resposta de conexão estabelecida
      this.socket.once('connection_established', (response) => {
        console.log('✅ Conexão estabelecida:', response)
        resolve(response)
      })

      // Timeout para autenticação
      setTimeout(() => {
        console.log('✅ User connected enviado, continuando...')
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

      console.log('🏠 Entrando na sala do serviço:', servicoId)
      
      // Enviar evento join_servico conforme documentação (apenas o número do serviço)
      this.socket.emit('join_servico', parseInt(servicoId.toString()))
      
      // Escutar confirmação de entrada na sala
      this.socket.once('joined_servico', (response) => {
        console.log('✅ Entrou na sala do serviço:', response)
        resolve(response)
      })

      // Timeout
      setTimeout(() => {
        console.log('✅ Join servico enviado, continuando...')
        resolve({ success: true, servicoId })
      }, 2000)
    })
  }

  // Enviar localização
  sendLocation(locationData: LocationData) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ WebSocket não conectado para enviar localização')
      return
    }

    console.log('📍 Enviando localização:', locationData)
    this.socket.emit('update_location', locationData)
  }

  // Escutar atualizações de localização
  onLocationUpdate(callback: (data: LocationUpdate) => void) {
    if (!this.socket) {
      console.error('❌ WebSocket não conectado para escutar localização')
      return
    }

    this.socket.on('location_updated', (data: LocationUpdate) => {
      console.log('📍 Localização atualizada recebida:', data)
      callback(data)
    })
  }

  // Enviar mensagem no chat
  sendMessage(messageData: MessageData) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ WebSocket não conectado para enviar mensagem')
      return
    }

    // Usar exatamente o formato da documentação
    const payload = {
      servicoId: messageData.servicoId,
      mensagem: messageData.mensagem,
      sender: messageData.sender,
      targetUserId: messageData.targetUserId
    }

    console.log('💬 Enviando mensagem via WebSocket:', payload)
    this.socket.emit('send_message', payload)
  }

  // Escutar mensagens do chat
  onMessageReceived(callback: (message: ReceivedMessage) => void) {
    if (!this.socket) {
      console.error('❌ WebSocket não conectado para escutar mensagens')
      return
    }

    this.socket.on('receive_message', (message: ReceivedMessage) => {
      console.log('💬 Mensagem recebida via WebSocket:', message)
      callback(message)
    })
  }

  // Desconectar
  disconnect() {
    if (this.socket) {
      console.log('🔌 Desconectando WebSocket')
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  // Verificar se está conectado
  getConnectionStatus(): boolean {
    return this.isConnected && this.socket?.connected === true
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
