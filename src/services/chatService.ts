// Serviço para gerenciar chat em tempo real entre contratante e prestador
import { facilitaApi } from './apiService'
import { notificationService } from './notificationService'
import { WEBSOCKET_URLS, WEBSOCKET_EVENTS } from '../config/constants'

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
      console.log('🚀 ChatService: Iniciando envio de mensagem...');
      console.log('📊 ChatService: Estado da conexão WebSocket:', {
        exists: !!this.wsConnection,
        readyState: this.wsConnection?.readyState,
        isOpen: this.wsConnection?.readyState === WebSocket.OPEN
      });
      
      // Tentar enviar via WebSocket primeiro se conectado
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        const messageData = {
          serviceId: parseInt(serviceId),
          userId: parseInt(localStorage.getItem('userId') || '1'),
          userType: 'contratante',
          userName: localStorage.getItem('loggedUser') || 'Usuário',
          mensagem,
          tipo: 'texto'
        }
        
        console.log('📤 ChatService: Enviando mensagem via WebSocket:', messageData)
        
        // Enviar mensagem conforme documentação oficial
        const sendMessageData = {
          servicoId: parseInt(serviceId),
          mensagem,
          sender: 'contratante',
          targetUserId: this.getTargetUserId() // ID do prestador
        }
        
        console.log('📤 Enviando send_message:', sendMessageData)
        
        this.wsConnection.send(JSON.stringify({
          event: WEBSOCKET_EVENTS.SEND_MESSAGE,
          data: sendMessageData
        }))
        
        console.log('✅ ChatService: Mensagem enviada via WebSocket com sucesso');
        
        return {
          success: true,
          message: 'Mensagem enviada via WebSocket'
        }
      }
      
      console.log('📡 ChatService: WebSocket não disponível, usando API REST...');
      
      // Fallback para API REST se WebSocket não disponível
      const messageData = {
        mensagem,
        tipo: 'texto'
      }
      
      console.log('📤 ChatService: Enviando via API REST:', messageData);
      
      const response = await facilitaApi.sendMessage(serviceId, messageData)
      
      console.log('📥 ChatService: Resposta da API REST:', response);
      
      if (response.success) {
        console.log('✅ ChatService: Mensagem enviada via API REST com sucesso');
        return {
          success: true,
          data: response.data,
          message: 'Mensagem enviada com sucesso'
        }
      }
      
      console.error('❌ ChatService: Falha na API REST:', response.error);
      return {
        success: false,
        message: response.error || 'Erro ao enviar mensagem'
      }
    } catch (error) {
      console.error('❌ ChatService: Erro ao enviar mensagem:', error);
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
      console.log('📥 ChatService: Tentando carregar mensagens para serviceId:', serviceId)
      
      // Se WebSocket está conectado, não precisamos carregar via API REST
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        console.log('💬 WebSocket conectado, mensagens virão em tempo real')
        return {
          success: true,
          data: [], // Sempre retornar array vazio
          message: 'WebSocket conectado - mensagens em tempo real'
        }
      }
      
      const response = await facilitaApi.getMessages(serviceId)
      
      if (response.success) {
        console.log('✅ Mensagens carregadas via API:', response.data)
        // Garantir que sempre retornamos um array
        const messages = Array.isArray(response.data) ? response.data : 
                        (response.data && Array.isArray((response.data as any).mensagens)) ? (response.data as any).mensagens : 
                        []
        console.log('📋 Mensagens processadas:', messages)
        return {
          success: true,
          data: messages,
          message: 'Mensagens carregadas com sucesso'
        }
      }
      
      console.warn('⚠️ Falha ao carregar mensagens via API:', response.error)
      return {
        success: false,
        message: response.error || 'Erro ao carregar mensagens'
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error)
      return {
        success: false,
        message: 'Erro de conexão - usando apenas WebSocket'
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
   * 5. Conectar ao WebSocket para chat em tempo real - conforme documentação oficial
   */
  connectToChat(serviceId: string, userId: string): void {
    try {
      console.log('🔌 Conectando ao WebSocket do chat...')
      console.log('📊 Dados da conexão:', { serviceId, userId, wsUrl: WEBSOCKET_URLS.CHAT })
      console.log('🌐 URL WebSocket:', WEBSOCKET_URLS.CHAT)
      
      // Conectar ao WebSocket usando URL de produção
      this.wsConnection = new WebSocket(WEBSOCKET_URLS.CHAT)
      
      this.wsConnection.onopen = () => {
        console.log('✅ WebSocket conectado com sucesso!')
        
        // 1. Primeiro evento: user_connected (conforme documentação)
        const userConnectionData = {
          userId: parseInt(userId),
          userType: 'contratante',
          userName: localStorage.getItem('loggedUser') || 'Usuário'
        }
        
        console.log('📤 1. Enviando user_connected:', userConnectionData)
        this.wsConnection?.send(JSON.stringify({
          event: WEBSOCKET_EVENTS.USER_CONNECTED,
          data: userConnectionData
        }))
        
        // 2. Segundo evento: join_servico (conforme documentação)
        const joinServiceData = {
          servicoId: parseInt(serviceId)
        }
        
        console.log('📤 2. Enviando join_servico:', joinServiceData)
        this.wsConnection?.send(JSON.stringify({
          event: WEBSOCKET_EVENTS.JOIN_SERVICO,
          data: joinServiceData
        }))
        
        this.notifyConnectionListeners(true)
      }
      
      this.wsConnection.onmessage = (event) => {
        try {
          console.log('📨 Mensagem WebSocket recebida:', event.data)
          const data = JSON.parse(event.data)
          
          console.log('🔍 Processando evento:', data.event || 'sem evento')
          
          // Processar eventos conforme documentação oficial
          switch (data.event) {
            case WEBSOCKET_EVENTS.CONNECTION_ESTABLISHED:
              console.log('✅ Conexão estabelecida:', data)
              break
              
            case WEBSOCKET_EVENTS.JOINED_SERVICE:
              console.log('✅ Entrou no serviço:', data)
              break
              
            case WEBSOCKET_EVENTS.RECEIVE_MESSAGE:
              console.log('💬 Nova mensagem recebida:', data.data || data)
              const messageData = data.data || data
              if (messageData) {
                // Converter formato da documentação para nosso formato
                const message: ChatMessage = {
                  id: Date.now(), // Gerar ID temporário
                  id_servico: messageData.servicoId,
                  id_contratante: 0,
                  id_prestador: 0,
                  mensagem: messageData.mensagem,
                  tipo: 'texto',
                  url_anexo: null,
                  enviado_por: messageData.sender === 'contratante' ? 'contratante' : 'prestador',
                  lida: false,
                  data_envio: messageData.timestamp || new Date().toISOString()
                }
                this.notifyMessageListeners(message)
              }
              break
              
            case WEBSOCKET_EVENTS.MESSAGE_NOTIFICATION:
              console.log('🔔 Notificação de mensagem:', data.data || data)
              break
              
            default:
              console.log('📨 Evento não reconhecido:', data.event, data)
              // Tentar processar como mensagem direta (fallback)
              if (data.message || data.mensagem) {
                console.log('🔄 Tentando processar como mensagem direta...')
              }
          }
        } catch (error) {
          console.error('❌ Erro ao processar mensagem do WebSocket:', error)
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
  private getTargetUserId(): number {
    // Tentar obter ID do prestador de múltiplas fontes
    try {
      const foundDriver = JSON.parse(localStorage.getItem('foundDriver') || '{}')
      const entregadorData = JSON.parse(localStorage.getItem('entregadorData') || '{}')
      
      const targetUserId = foundDriver.id_prestador || 
                          foundDriver.id || 
                          entregadorData.id || 
                          entregadorData.id_prestador || 
                          2 // Fallback padrão
      
      console.log('🎯 ID do prestador encontrado:', targetUserId)
      return parseInt(targetUserId.toString())
    } catch (error) {
      console.warn('⚠️ Erro ao obter ID do prestador, usando fallback:', error)
      return 2 // Fallback padrão
    }
  }

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
