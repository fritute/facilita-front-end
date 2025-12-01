import { WEBSOCKET_URLS } from '../config/constants'

export interface VoiceCallEvent {
  event: string
  data: any
  timestamp?: string
}

export interface VoiceCallData {
  serviceId: number
  userId: number
  targetUserId: number
  userName: string
}

class FacilitaVoiceCallService {
  private websocket: WebSocket | null = null
  private isConnected: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 3
  private reconnectDelay: number = 2000

  // Event listeners
  private onIncomingCallCallbacks: ((data: any) => void)[] = []
  private onCallAcceptedCallbacks: ((data: any) => void)[] = []
  private onCallRejectedCallbacks: ((data: any) => void)[] = []
  private onCallEndedCallbacks: ((data: any) => void)[] = []
  private onConnectionCallbacks: ((connected: boolean) => void)[] = []

  async connect(): Promise<boolean> {
    try {
      console.log('🔌 Conectando ao WebSocket de chamada de voz...')
      
      if (this.websocket && this.isConnected) {
        console.log('✅ Já conectado ao WebSocket de voz')
        return true
      }

      this.websocket = new WebSocket(WEBSOCKET_URLS.CHAT)

      this.websocket.onopen = () => {
        console.log('✅ Conectado ao WebSocket de chamada de voz')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.notifyConnectionCallbacks(true)
      }

      this.websocket.onmessage = (event) => {
        try {
          const voiceEvent: VoiceCallEvent = JSON.parse(event.data)
          this.handleVoiceEvent(voiceEvent)
        } catch (error) {
          console.error('❌ Erro ao processar mensagem de voz:', error)
        }
      }

      this.websocket.onclose = () => {
        console.log('🔌 Conexão WebSocket de voz encerrada')
        this.isConnected = false
        this.notifyConnectionCallbacks(false)
        this.handleReconnect()
      }

      this.websocket.onerror = (error) => {
        console.error('❌ Erro na conexão WebSocket de voz:', error)
        this.isConnected = false
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.isConnected)
        }, 3000)
      })

    } catch (error) {
      console.error('❌ Erro ao conectar WebSocket de voz:', error)
      return false
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 Tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts} de reconexão...`)
      
      setTimeout(() => {
        this.connect()
      }, this.reconnectDelay)
    } else {
      console.error('❌ Máximo de tentativas de reconexão atingido')
    }
  }

  private handleVoiceEvent(event: VoiceCallEvent): void {
    console.log('📞 Evento de chamada de voz recebido:', event)

    switch (event.event) {
      case 'incoming_call':
        this.notifyIncomingCallCallbacks(event.data)
        break
      case 'call_accepted':
        this.notifyCallAcceptedCallbacks(event.data)
        break
      case 'call_rejected':
        this.notifyCallRejectedCallbacks(event.data)
        break
      case 'call_ended':
        this.notifyCallEndedCallbacks(event.data)
        break
      default:
        console.log('📞 Evento não tratado:', event.event)
    }
  }

  async initiateVoiceCall(callData: VoiceCallData): Promise<boolean> {
    try {
      if (!this.isConnected) {
        const connected = await this.connect()
        if (!connected) {
          throw new Error('Não foi possível conectar ao WebSocket')
        }
      }

      const callEvent = {
        event: 'initiate_call',
        data: {
          serviceId: callData.serviceId,
          userId: callData.userId,
          targetUserId: callData.targetUserId,
          userName: callData.userName,
          callType: 'voice'
        }
      }

      console.log('📞 Iniciando chamada de voz:', callEvent)
      this.websocket?.send(JSON.stringify(callEvent))
      return true

    } catch (error) {
      console.error('❌ Erro ao iniciar chamada de voz:', error)
      return false
    }
  }

  async acceptCall(callId: string): Promise<boolean> {
    try {
      const acceptEvent = {
        event: 'accept_call',
        data: {
          callId: callId
        }
      }

      console.log('✅ Aceitando chamada de voz:', acceptEvent)
      this.websocket?.send(JSON.stringify(acceptEvent))
      return true

    } catch (error) {
      console.error('❌ Erro ao aceitar chamada de voz:', error)
      return false
    }
  }

  async rejectCall(callId: string): Promise<boolean> {
    try {
      const rejectEvent = {
        event: 'reject_call',
        data: {
          callId: callId
        }
      }

      console.log('❌ Rejeitando chamada de voz:', rejectEvent)
      this.websocket?.send(JSON.stringify(rejectEvent))
      return true

    } catch (error) {
      console.error('❌ Erro ao rejeitar chamada de voz:', error)
      return false
    }
  }

  async endCall(callId: string): Promise<boolean> {
    try {
      const endEvent = {
        event: 'end_call',
        data: {
          callId: callId
        }
      }

      console.log('📞 Encerrando chamada de voz:', endEvent)
      this.websocket?.send(JSON.stringify(endEvent))
      return true

    } catch (error) {
      console.error('❌ Erro ao encerrar chamada de voz:', error)
      return false
    }
  }

  disconnect(): void {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
    this.isConnected = false
    this.reconnectAttempts = 0
  }

  // Event listener methods
  onIncomingCall(callback: (data: any) => void): void {
    this.onIncomingCallCallbacks.push(callback)
  }

  onCallAccepted(callback: (data: any) => void): void {
    this.onCallAcceptedCallbacks.push(callback)
  }

  onCallRejected(callback: (data: any) => void): void {
    this.onCallRejectedCallbacks.push(callback)
  }

  onCallEnded(callback: (data: any) => void): void {
    this.onCallEndedCallbacks.push(callback)
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.onConnectionCallbacks.push(callback)
  }

  private notifyIncomingCallCallbacks(data: any): void {
    this.onIncomingCallCallbacks.forEach(callback => callback(data))
  }

  private notifyCallAcceptedCallbacks(data: any): void {
    this.onCallAcceptedCallbacks.forEach(callback => callback(data))
  }

  private notifyCallRejectedCallbacks(data: any): void {
    this.onCallRejectedCallbacks.forEach(callback => callback(data))
  }

  private notifyCallEndedCallbacks(data: any): void {
    this.onCallEndedCallbacks.forEach(callback => callback(data))
  }

  private notifyConnectionCallbacks(connected: boolean): void {
    this.onConnectionCallbacks.forEach(callback => callback(connected))
  }

  // Getters
  get connectionStatus(): boolean {
    return this.isConnected
  }
}

export const facilitaVoiceCallService = new FacilitaVoiceCallService()
export default facilitaVoiceCallService
