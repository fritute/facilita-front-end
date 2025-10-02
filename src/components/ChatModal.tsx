import React, { useState, useRef, useEffect } from 'react'
import { X, Phone, Video, Send, Mic, MicOff, VideoOff, ExternalLink } from 'lucide-react'
import videoCallService, { VideoCallRoom } from '../services/videoCallService'

interface Message {
  id: string
  text: string
  sender: 'user' | 'driver'
  timestamp: Date
}

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  driverName: string
  driverPhone: string
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, driverName, driverPhone }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Estou a caminho do local de coleta.',
      sender: 'driver',
      timestamp: new Date(Date.now() - 300000) // 5 minutos atrás
    },
    {
      id: '2', 
      text: 'Oi! Obrigado pelo contato. Estarei esperando.',
      sender: 'user',
      timestamp: new Date(Date.now() - 240000) // 4 minutos atrás
    }
  ])
  const [newMessage, setNewMessage] = useState('')
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

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: 'user',
        timestamp: new Date()
      }
      setMessages([...messages, message])
      setNewMessage('')
      
      // Simular resposta automática do motorista
      setTimeout(() => {
        const driverResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Recebido! Qualquer coisa me avise.',
          sender: 'driver',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, driverResponse])
      }, 2000)
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
      
      // Enviar link para o prestador via chat
      const linkMessage: Message = {
        id: Date.now().toString(),
        text: `📹 Videochamada iniciada! Link: ${room.url}`,
        sender: 'user',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, linkMessage])
      
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
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
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={sendMessage}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Send className="w-5 h-5" />
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
