import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Phone, PhoneCall, Video, Image } from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/constants';
import { useChat } from '../hooks/useChat';

interface Message {
  servicoId: number;
  mensagem: string;
  sender: 'contratante' | 'prestador';
  timestamp?: string;
  userInfo?: {
    userId: number;
    userType: string;
    userName: string;
  };
  type?: 'text' | 'image';
  imageUrl?: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverName: string;
  driverPhone: string;
  serviceId: string;
  userId: number;
  userName: string;
  targetUserId: number;
  onStartVoiceCall?: () => void;
  onStartVideoCall?: () => void;
  userType?: 'contratante' | 'prestador';
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  driverName,
  driverPhone,
  serviceId,
  userId,
  userName,
  targetUserId,
  onStartVoiceCall,
  onStartVideoCall,
  userType = 'contratante'
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Usar o hook de chat em tempo real
  const { messages, sendMessage, isConnected, clearMessages } = useChat(
    userId,
    userType,
    userName,
    parseInt(serviceId)
  );

  // Auto scroll para última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Limpar mensagens quando fechar o modal
  useEffect(() => {
    if (!isOpen) {
      clearMessages();
    }
  }, [isOpen, clearMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Enviar mensagem via Socket.IO
  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return;
    if (!serviceId) return;

    let imageUrl = '';
    
    // Upload da imagem se selecionada
    if (selectedImage) {
      setIsUploading(true);
      try {
        // Simular upload - substituir pela implementação real
        imageUrl = URL.createObjectURL(selectedImage);
        console.log('📷 Imagem selecionada para envio:', selectedImage.name);
      } catch (error) {
        console.error('❌ Erro ao fazer upload da imagem:', error);
      } finally {
        setIsUploading(false);
      }
    }

    const messageText = newMessage.trim() || 'Imagem enviada';
    
    // Enviar via Socket.IO
    const success = sendMessage(messageText, targetUserId);
    
    if (success) {
      console.log('✅ Mensagem enviada via Socket.IO');
      // Limpar campos
      setNewMessage('');
      setSelectedImage(null);
      setImagePreview(null);
    } else {
      console.error('❌ Erro ao enviar mensagem via Socket.IO');
      alert('Erro ao enviar mensagem. Verifique a conexão.');
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhoneCall = () => {
    const phoneNumber = driverPhone.replace(/\D/g, '');
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">
                {driverName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{driverName}</h3>
              <p className="text-xs opacity-90">
                {isConnected ? '🟢 Online - Chat em tempo real' : '🔴 Desconectado'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Botão de Ligação Telefônica Direta */}
            <button
              onClick={handlePhoneCall}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
              title="Fazer ligação telefônica"
            >
              <Phone className="w-5 h-5" />
            </button>

            {/* Botão de Chamada de Voz Online */}
            <button
              onClick={onStartVoiceCall}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
              title="Chamada de voz online"
            >
              <PhoneCall className="w-5 h-5" />
            </button>

            {/* Botão de Videochamada */}
            <button
              onClick={onStartVideoCall}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
              title="Videochamada online"
            >
              <Video className="w-5 h-5" />
            </button>

            {/* Botão Fechar */}
            <button
              onClick={onClose}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm">Carregando mensagens...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm">Inicie uma conversa com {driverName}</p>
              <p className="text-xs mt-1">As mensagens aparecerão aqui</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isMyMessage = message.sender === userType;
              return (
                <div
                  key={`${message.servicoId}-${index}-${message.timestamp}`}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isMyMessage
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {message.type === 'image' && message.imageUrl ? (
                      <div className="space-y-2">
                        <img
                          src={message.imageUrl}
                          alt="Imagem enviada"
                          className="rounded-lg max-w-full h-auto"
                        />
                        {message.mensagem && message.mensagem !== 'Imagem enviada' && (
                          <p className="text-sm">{message.mensagem}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm">{message.mensagem}</p>
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        isMyMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp ? formatTime(new Date(message.timestamp)) : 'Agora'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Preview da Imagem Selecionada */}
        {imagePreview && (
          <div className="px-4 py-2 border-t bg-gray-50">
            <div className="flex items-center space-x-3">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-12 h-12 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Imagem selecionada</p>
                <p className="text-xs text-gray-500">{selectedImage?.name}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input de Mensagem */}
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <div className="flex items-center space-x-2">
            {/* Botão de Anexar Imagem */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
              title="Anexar imagem"
            >
              <Image className="w-5 h-5" />
            </button>

            {/* Input de Arquivo (Oculto) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Campo de Texto */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Digite sua mensagem..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isUploading}
              />
            </div>

            {/* Botão Enviar */}
            <button
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && !selectedImage) || isUploading}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Status da Conexão */}
          <div className="mt-2 text-xs text-center">
            {isConnected ? (
              <span className="text-green-600">✅ Conectado - Socket.IO ativo</span>
            ) : (
              <span className="text-red-600">❌ Desconectado - Tentando reconectar...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;