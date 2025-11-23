import React, { useState, useRef, useEffect } from 'react'
import { X, Phone, Video, Send, Mic, MicOff, VideoOff, ExternalLink, Image as ImageIcon } from 'lucide-react'
import videoCallService, { VideoCallRoom } from '../services/videoCallService'
import { notificationService } from '../services/notificationService'
import useWebSocket from '../hooks/useWebSocket'
import WebSocketStatus from './WebSocketStatus'

interface Message {
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

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  driverName: string
  driverPhone: string
  serviceId?: number // ID do serviço para buscar mensagens
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, driverName, driverPhone: _, serviceId }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isInCall, setIsInCall] = useState(false)
  const [isVideoCall, setIsVideoCall] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [currentRoom, setCurrentRoom] = useState<VideoCallRoom | null>(null)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)

  // WebSocket para chat em tempo real
  const { 
    isConnected: isWebSocketConnected,
    sendMessage: sendWebSocketMessage,
    onMessageReceived
  } = useWebSocket({
    serviceId,
    enableTracking: false,
    enableChat: true // Chat agora usa WebSocket
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Buscar mensagens quando o modal abrir e configurar WebSocket
  useEffect(() => {
    if (isOpen && serviceId) {
      // Buscar mensagens históricas
      fetchMessages()
      
      // Configurar listener para mensagens em tempo real via WebSocket
      if (isWebSocketConnected) {
        onMessageReceived((message) => {
          console.log('💬 Mensagem em tempo real recebida:', message)
          
          // Converter formato WebSocket para formato da API
          const newMessage: Message = {
            id: Date.now(),
            id_servico: message.servicoId,
            id_contratante: 0,
            id_prestador: 0,
            mensagem: message.mensagem,
            tipo: 'texto',
            url_anexo: null,
            enviado_por: message.sender,
            lida: false,
            data_envio: message.timestamp
          }
          
          // Adicionar mensagem se não for do usuário atual
          const userType = localStorage.getItem('userType') || 'CONTRATANTE'
          const currentUserType = userType.toLowerCase()
          if (message.sender !== currentUserType) {
            setMessages(prev => [...prev, newMessage])
          }
        })
      }
    }
  }, [isOpen, serviceId, isWebSocketConnected, onMessageReceived])

  // Polling para buscar novas mensagens (fallback quando WebSocket não conectado)
  useEffect(() => {
    if (isOpen && serviceId && !isWebSocketConnected) {
      // Polling a cada 3 segundos apenas se WebSocket não estiver conectado
      const interval = setInterval(() => {
        fetchMessages()
      }, 3000)
      
      return () => clearInterval(interval)
    }
  }, [isOpen, serviceId, isWebSocketConnected])

  // Função para buscar mensagens da API
  const fetchMessages = async () => {
    if (!serviceId) return
    
    try {
      setIsLoadingMessages(true)
      const token = localStorage.getItem('authToken')
      
      // Usar URL correta da API
      const response = await fetch(`https://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net/v1/facilita/servico/${serviceId}/mensagens`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.mensagens) {
          setMessages(data.mensagens)
          // Marcar mensagens como lidas
          await markMessagesAsRead()
        }
      }
    } catch (error) {
      notificationService.showError('Chat', 'Não foi possível carregar as mensagens do chat.')
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // Função para marcar mensagens como lidas
  const markMessagesAsRead = async () => {
    if (!serviceId) return
    
    try {
      const token = localStorage.getItem('authToken')
      
      await fetch(`https://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net/v1/facilita/servico/${serviceId}/mensagens/marcar-lidas`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      // Erro silencioso para marcar como lidas
    }
  }

  // Função para fazer upload de imagem
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        alert('Imagem muito grande. Máximo 5MB')
        return
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Função para remover imagem selecionada
  const removeSelectedImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  // Conectar stream ao vídeo quando disponível
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log('Conectando stream ao elemento video')
      localVideoRef.current.srcObject = localStream
      
      // Garantir que o vídeo vai tocar
      localVideoRef.current.onloadedmetadata = () => {
        console.log('Metadata carregada, iniciando reprodução')
        localVideoRef.current?.play().catch(e => {
          console.error('Erro ao reproduzir vídeo:', e)
        })
      }
    }
  }, [localStream, isVideoCall])

  // Cleanup: parar câmera e limpar videoCallService quando componente for desmontado
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop()
        })
      }
      
      // Limpar instância do videoCallService
      videoCallService.destroy().catch(error => {
        console.warn('Erro ao limpar videoCallService:', error)
      })
    }
  }, [localStream])

  const sendMessage = async () => {
    if (!serviceId || (!newMessage.trim() && !selectedImage)) return
    
    try {
      setIsSendingMessage(true)
      
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const userType = localStorage.getItem('userType') || 'CONTRATANTE'
      
      // Se WebSocket estiver conectado, usar WebSocket
      if (isWebSocketConnected) {
        console.log('💬 Enviando mensagem via WebSocket...')
        console.log('📊 Status da conexão WebSocket:', { isWebSocketConnected, serviceId })
        
        // Obter ID do prestador do serviço atual (se disponível)
        const foundDriver = JSON.parse(localStorage.getItem('foundDriver') || '{}')
        const entregadorData = JSON.parse(localStorage.getItem('entregadorData') || '{}')
        const targetUserId = foundDriver.id_prestador || entregadorData.id || 2 // Fallback para ID 2
        
        console.log('🎯 Dados para envio WebSocket:', {
          serviceId,
          targetUserId,
          foundDriver,
          entregadorData,
          message: newMessage.trim()
        })
        
        // Enviar via WebSocket usando a documentação oficial
        sendWebSocketMessage(newMessage.trim() || 'Imagem enviada', targetUserId)
        
        // Adicionar mensagem à lista localmente (optimistic update)
        const optimisticMessage: Message = {
          id: Date.now(),
          id_servico: serviceId,
          id_contratante: userType === 'CONTRATANTE' ? userData.id || userData.id_usuario : 0,
          id_prestador: userType === 'PRESTADOR' ? userData.id || userData.id_usuario : 0,
          mensagem: newMessage.trim() || 'Imagem enviada',
          tipo: selectedImage ? 'imagem' : 'texto',
          url_anexo: selectedImage ? imagePreview : null,
          enviado_por: userType.toLowerCase() as 'contratante' | 'prestador',
          lida: false,
          data_envio: new Date().toISOString()
        }
        
        setMessages(prev => [...prev, optimisticMessage])
        setNewMessage('')
        removeSelectedImage()
        
      } else {
        // Fallback para API REST quando WebSocket não conectado
        console.log('💬 WebSocket desconectado, usando API REST...')
        
        const token = localStorage.getItem('authToken')
        
        let imageUrl = null
        
        // Se houver imagem, fazer upload primeiro
        if (selectedImage) {
          imageUrl = imagePreview
        }
        
        // Baseado na documentação oficial da API
        const messageData = {
          mensagem: newMessage.trim() || 'Imagem enviada',
          tipo: selectedImage ? 'imagem' : 'texto',
          url_anexo: imageUrl || null,
          id_servico: serviceId,
          enviado_por: userType.toLowerCase()
        }

        console.log('📤 Enviando mensagem para prestador via API:', messageData)

        // Usar endpoint correto baseado na documentação
        const response = await fetch(`https://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net/v1/facilita/servico/${serviceId}/mensagem`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messageData)
        })

        if (response.ok) {
          const data = await response.json()
          console.log('✅ Mensagem enviada com sucesso via API:', data)
          
          if (data.success && data.mensagem) {
            setMessages(prev => [...prev, data.mensagem])
          }
          setNewMessage('')
          removeSelectedImage()
          
          // Atualizar lista de mensagens
          await fetchMessages()
        } else {
          const errorData = await response.text()
          console.error('❌ Erro na API:', response.status, errorData)
          throw new Error(`Erro ${response.status}: ${errorData}`)
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error)
      notificationService.showError('Chat', 'Não foi possível enviar a mensagem. Tente novamente.')
    } finally {
      setIsSendingMessage(false)
    }
  }

  const startVoiceCall = async () => {
    try {
      setIsCreatingRoom(true)
      
      // Criar sala de videochamada (mas com vídeo desabilitado)
      const room = await videoCallService.createRoom(`voice-${Date.now()}`)
      setCurrentRoom(room)
      
      // Entrar na sala
      await videoCallService.joinRoom(room.url, 'Cliente')
      
      // Desabilitar vídeo para chamada de voz
      await videoCallService.toggleCamera() // Desligar câmera
      
      setIsInCall(true)
      setIsVideoCall(false)
      setIsCreatingRoom(false)
      
      console.log('Chamada de voz iniciada:', room.url)
    } catch (error) {
      notificationService.showError('Chamada de voz', 'Não foi possível iniciar a chamada de voz. Tente novamente.')
      setIsCreatingRoom(false)
    }
  }

  const startVideoCall = async () => {
    try {
      setIsCreatingRoom(true)
      
      console.log('🎥 Iniciando videochamada...')
      
      // Garantir que não há instâncias anteriores com timeout
      console.log('🧹 Limpeza forçada antes de criar nova videochamada...')
      await videoCallService.destroy()
      
      // Aguardar um pouco mais para garantir limpeza completa
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Criar sala de videochamada
      const room = await videoCallService.createRoom(`video-${Date.now()}`)
      setCurrentRoom(room)
      
      console.log('🏠 Sala criada, entrando...', room.url)
      
      // Aguardar antes de tentar entrar na sala
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Entrar na sala
      await videoCallService.joinRoom(room.url, 'Cliente')
      
      setIsInCall(true)
      setIsVideoCall(true)
      setIsCreatingRoom(false)
      
      console.log('Videochamada iniciada:', room.url)
      
      // Link será compartilhado através do chat normal se necessário
      
    } catch (error) {
      notificationService.showError('Videochamada', 'Não foi possível iniciar a videochamada. Tente novamente.')
      setIsCreatingRoom(false)
    }
  }

  const endCall = async () => {
    try {
      // Sair da sala Daily.co
      await videoCallService.leaveRoom()
      
      // Parar stream local se existir
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop()
        })
        setLocalStream(null)
      }
      
      setIsInCall(false)
      setIsVideoCall(false)
      setIsMuted(false)
      setIsVideoEnabled(true)
      setCurrentRoom(null)
      
      console.log('Chamada encerrada')
    } catch (error) {
      // Erro silencioso ao encerrar chamada
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Determinar se a mensagem foi enviada pelo usuário atual
  const isMyMessage = (message: Message) => {
    const userType = localStorage.getItem('userType') // 'CONTRATANTE' ou 'PRESTADOR'
    if (userType === 'CONTRATANTE') {
      return message.enviado_por === 'contratante'
    } else {
      return message.enviado_por === 'prestador'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-green-500 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" 
              alt={driverName}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <div>
              <h3 className="font-semibold">{driverName}</h3>
              <div className="flex items-center space-x-2">
                <p className="text-sm opacity-90">
                  {isInCall ? (isVideoCall ? 'Em videochamada' : 'Em ligação') : 'Online'}
                </p>
                <WebSocketStatus isConnected={isWebSocketConnected} className="text-white" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isInCall && (
              <>
                <button
                  onClick={startVoiceCall}
                  disabled={isCreatingRoom}
                  className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all disabled:opacity-50"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button
                  onClick={startVideoCall}
                  disabled={isCreatingRoom}
                  className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all disabled:opacity-50"
                >
                  <Video className="w-5 h-5" />
                </button>
              </>
            )}
            {isCreatingRoom && (
              <div className="text-sm opacity-75">Criando sala...</div>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Call Interface - Daily.co Integration */}
        {isInCall && currentRoom && (
          <div className="flex-1 bg-gray-900 flex flex-col text-white">
            <div className="p-4 bg-gray-800 text-center">
              <p className="text-sm opacity-75 mb-2">
                {isVideoCall ? 'Videochamada' : 'Chamada de voz'} com {driverName}
              </p>
              <div className="flex items-center justify-center space-x-2 text-xs">
                <span className="bg-green-500 w-2 h-2 rounded-full animate-pulse"></span>
                <span>Conectado</span>
                <button
                  onClick={() => window.open(currentRoom.url, '_blank')}
                  className="ml-2 text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Abrir em nova aba</span>
                </button>
              </div>
            </div>
            
            {/* Embed Daily.co iframe */}
            <div className="flex-1 relative">
              <iframe
                src={currentRoom.url + '?embed=true'}
                className="w-full h-full border-0"
                allow="camera microphone fullscreen speaker display-capture"
              />
            </div>
            
            {/* Quick Controls */}
            <div className="p-4 bg-gray-800 flex justify-center space-x-4">
              <button
                onClick={async () => {
                  const newState = await videoCallService.toggleMicrophone()
                  setIsMuted(!newState)
                }}
                className={`p-3 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-600'}`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              {isVideoCall && (
                <button
                  onClick={async () => {
                    const newState = await videoCallService.toggleCamera()
                    setIsVideoEnabled(newState)
                  }}
                  className={`p-3 rounded-full ${isVideoEnabled ? 'bg-gray-600' : 'bg-red-600'}`}
                >
                  {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              )}
              
              <button
                onClick={endCall}
                className="p-3 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
              >
                <Phone className="w-5 h-5 transform rotate-135" />
              </button>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {!isInCall && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingMessages && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Carregando mensagens...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Nenhuma mensagem ainda. Inicie a conversa!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isMine = isMyMessage(message)
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isMine
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {message.tipo === 'imagem' && message.url_anexo && (
                          <img 
                            src={message.url_anexo} 
                            alt="Imagem enviada" 
                            className="rounded-lg mb-2 max-w-full"
                          />
                        )}
                        <p className="text-sm">{message.mensagem}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs ${
                            isMine ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.data_envio)}
                          </p>
                          {isMine && (
                            <span className="text-xs ml-2">
                              {message.lida ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="px-4 py-2 border-t bg-gray-50">
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-20 rounded-lg" />
                  <button
                    onClick={removeSelectedImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <label className="cursor-pointer flex items-center justify-center px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && sendMessage()}
                  placeholder="Digite sua mensagem..."
                  disabled={isSendingMessage}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
                <button
                  onClick={sendMessage}
                  disabled={isSendingMessage || (!newMessage.trim() && !selectedImage)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSendingMessage ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ChatModal
