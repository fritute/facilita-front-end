import React, { useState, useRef, useEffect } from 'react'
import { X, Phone, Video, Send, Mic, MicOff, VideoOff, ExternalLink, Image as ImageIcon } from 'lucide-react'
import videoCallService, { VideoCallRoom } from '../services/videoCallService'

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

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, driverName, driverPhone, serviceId }) => {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Buscar mensagens quando o modal abrir
  useEffect(() => {
    if (isOpen && serviceId) {
      fetchMessages()
      // Polling a cada 5 segundos para buscar novas mensagens
      const interval = setInterval(() => {
        fetchMessages()
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [isOpen, serviceId])

  // Função para buscar mensagens da API
  const fetchMessages = async () => {
    if (!serviceId) return
    
    try {
      setIsLoadingMessages(true)
      const token = localStorage.getItem('authToken')
      
      const response = await fetch(`https://servidor-facilita.onrender.com/v1/facilita/chat/${serviceId}/mensagens`, {
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
      console.error('Erro ao buscar mensagens:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // Função para marcar mensagens como lidas
  const markMessagesAsRead = async () => {
    if (!serviceId) return
    
    try {
      const token = localStorage.getItem('authToken')
      
      await fetch(`https://servidor-facilita.onrender.com/v1/facilita/chat/${serviceId}/marcar-lidas`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error)
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

  // Cleanup: parar câmera quando componente for desmontado
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop()
        })
      }
    }
  }, [localStream])

  const sendMessage = async () => {
    if (!serviceId || (!newMessage.trim() && !selectedImage)) return
    
    try {
      setIsSendingMessage(true)
      const token = localStorage.getItem('authToken')
      
      let imageUrl = null
      
      // Se houver imagem, fazer upload primeiro (implementar conforme sua API)
      if (selectedImage) {
        // TODO: Implementar upload de imagem para seu servidor
        // Por enquanto, usar base64 ou URL temporária
        imageUrl = imagePreview
      }
      
      const messageData = {
        mensagem: newMessage.trim() || 'Imagem enviada',
        tipo: selectedImage ? 'imagem' : 'texto',
        url_anexo: imageUrl || ''
      }

      const response = await fetch(`https://servidor-facilita.onrender.com/v1/facilita/chat/${serviceId}/mensagem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.mensagem) {
          // Adicionar mensagem à lista
          setMessages(prev => [...prev, data.mensagem])
        }
        setNewMessage('')
        removeSelectedImage()
        // Atualizar lista de mensagens
        await fetchMessages()
      } else {
        alert('Erro ao enviar mensagem')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert('Erro ao enviar mensagem')
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
      console.error('Erro ao iniciar chamada de voz:', error)
      alert('Erro ao iniciar chamada. Tente novamente.')
      setIsCreatingRoom(false)
    }
  }

  const startVideoCall = async () => {
    try {
      setIsCreatingRoom(true)
      
      // Criar sala de videochamada
      const room = await videoCallService.createRoom(`video-${Date.now()}`)
      setCurrentRoom(room)
      
      // Entrar na sala
      await videoCallService.joinRoom(room.url, 'Cliente')
      
      setIsInCall(true)
      setIsVideoCall(true)
      setIsCreatingRoom(false)
      
      console.log('Videochamada iniciada:', room.url)
      
      // Link será compartilhado através do chat normal se necessário
      
    } catch (error) {
      console.error('Erro ao iniciar videochamada:', error)
      alert('Erro ao iniciar videochamada. Tente novamente.')
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
      console.error('Erro ao encerrar chamada:', error)
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
              <p className="text-sm opacity-90">
                {isInCall ? (isVideoCall ? 'Em videochamada' : 'Em ligação') : 'Online'}
              </p>
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
