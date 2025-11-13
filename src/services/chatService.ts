// Serviço para gerenciar chat em tempo real entre contratante e prestador
import { facilitaApi } from './apiService'
import { notificationService } from './notificationService'

export interface ChatMessage {
  id: number
  id_servico: number
  id_contratante: number
  id_prestador: number
  mensagem: string
  tipo: 'texto' | 'imagem'
  url_anexo: string | null
  enviado_por: 'contratante' | 'prestador'
  lida: boolean
  data_envio: string
  contratante?: {
    id: number
    usuario: {
      id: number
      nome: string
      foto_perfil: string | null
    }
  }
  prestador?: {
    id: number
    usuario: {
      id: number
      nome: string
      foto_perfil: string | null
    }
  }
}

export interface ChatServiceResult {
  success: boolean
  data?: any
  message?: string
}

class ChatService {
  private wsConnection: WebSocket | null = null
  private messageListeners: ((message: ChatMessage) => void)[] = []
  private connectionListeners: ((connected: boolean) => void)[] = []

  /**
   * 1. Enviar mensagem de texto
   */
  async sendTextMessage(serviceId: string, mensagem: string): Promise<ChatServiceResult> {
    try {
      const messageData = {
        mensagem,
        tipo: 'texto'
      }
      
      const response = await facilitaApi.sendMessage(serviceId, messageData)
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Mensagem enviada com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao enviar mensagem'
      }
    } catch (error) {
      notificationService.showError('Chat', 'Falha ao enviar mensagem')
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 2. Enviar mensagem com imagem
   */
  async sendImageMessage(serviceId: string, imageFile: File, mensagem?: string): Promise<ChatServiceResult> {
    try {
      // Converter imagem para base64
      const base64Image = await this.fileToBase64(imageFile)
      
      const messageData = {
        mensagem: mensagem || '',
        tipo: 'imagem',
        url_anexo: base64Image
      }
      
      const response = await facilitaApi.sendMessage(serviceId, messageData)
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Imagem enviada com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao enviar imagem'
      }
    } catch (error) {
      notificationService.showError('Chat', 'Falha ao enviar imagem')
      return {
        success: false,
        message: 'Erro ao processar imagem'
      }
    }
  }

  /**
   * 3. Buscar mensagens do chat
   */
  async getMessages(serviceId: string): Promise<ChatServiceResult> {
    try {
      const response = await facilitaApi.getMessages(serviceId)
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Mensagens carregadas com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao carregar mensagens'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 4. Marcar mensagens como lidas
   */
  async markMessagesAsRead(serviceId: string): Promise<ChatServiceResult> {
    try {
      const response = await facilitaApi.markMessagesAsRead(serviceId)
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Mensagens marcadas como lidas'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao marcar mensagens como lidas'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 5. Conectar ao WebSocket para chat em tempo real
   */
  connectToChat(serviceId: string, userId: string): void {
    try {
      const wsUrl = `wss://servidor-facilita.onrender.com/chat/${serviceId}?userId=${userId}`
      
      this.wsConnection = new WebSocket(wsUrl)
      
      this.wsConnection.onopen = () => {
        console.log('✅ Conectado ao chat em tempo real')
        this.notifyConnectionListeners(true)
      }
      
      this.wsConnection.onmessage = (event) => {
        try {
          const message: ChatMessage = JSON.parse(event.data)
          this.notifyMessageListeners(message)
        } catch (error) {
          console.error('Erro ao processar mensagem do WebSocket:', error)
        }
      }
      
      this.wsConnection.onclose = () => {
        console.log('❌ Conexão do chat fechada')
        this.notifyConnectionListeners(false)
      }
      
      this.wsConnection.onerror = (error) => {
        console.error('Erro na conexão WebSocket:', error)
        notificationService.showWarning('Chat', 'Problemas na conexão do chat em tempo real')
        this.notifyConnectionListeners(false)
      }
      
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error)
      notificationService.showError('Chat', 'Falha ao conectar chat em tempo real')
    }
  }

  /**
   * 6. Desconectar do WebSocket
   */
  disconnectFromChat(): void {
    if (this.wsConnection) {
      this.wsConnection.close()
      this.wsConnection = null
      this.notifyConnectionListeners(false)
    }
  }

  /**
   * 7. Adicionar listener para novas mensagens
   */
  onNewMessage(callback: (message: ChatMessage) => void): () => void {
    this.messageListeners.push(callback)
    
    // Retorna função para remover o listener
    return () => {
      this.messageListeners = this.messageListeners.filter(listener => listener !== callback)
    }
  }

  /**
   * 8. Adicionar listener para status de conexão
   */
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.push(callback)
    
    // Retorna função para remover o listener
    return () => {
      this.connectionListeners = this.connectionListeners.filter(listener => listener !== callback)
    }
  }

  /**
   * 9. Verificar se está conectado
   */
  isConnected(): boolean {
    return this.wsConnection?.readyState === WebSocket.OPEN
  }

  /**
   * 10. Enviar mensagem via WebSocket (tempo real)
   */
  sendRealtimeMessage(message: Partial<ChatMessage>): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(message))
    }
  }

  /**
   * Métodos auxiliares privados
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  private notifyMessageListeners(message: ChatMessage): void {
    this.messageListeners.forEach(listener => {
      try {
        listener(message)
      } catch (error) {
        console.error('Erro no listener de mensagem:', error)
      }
    })
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected)
      } catch (error) {
        console.error('Erro no listener de conexão:', error)
      }
    })
  }

  /**
   * 11. Validar arquivo de imagem
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Imagem muito grande. Máximo 5MB.'
      }
    }
    
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.'
      }
    }
    
    return { valid: true }
  }

  /**
   * 12. Formatar tempo da mensagem
   */
  formatMessageTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  /**
   * 13. Determinar se mensagem é do usuário atual
   */
  isMyMessage(message: ChatMessage, userType: 'CONTRATANTE' | 'PRESTADOR'): boolean {
    if (userType === 'CONTRATANTE') {
      return message.enviado_por === 'contratante'
    } else {
      return message.enviado_por === 'prestador'
    }
  }
}

export const chatService = new ChatService()
export default chatService
