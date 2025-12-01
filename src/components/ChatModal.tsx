import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Phone, PhoneCall, Video, Image } from 'lucide-react';
import { API_BASE_URL } from '../config/constants';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'driver';
  timestamp: Date;
  type: 'text' | 'image';
  imageUrl?: string;
  enviado_por?: string;
  mensagem?: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverName: string;
  driverPhone: string;
  serviceId: string;
  onStartVoiceCall?: () => void;
  onStartVideoCall?: () => void;
  isWebSocketConnected?: boolean;
  userType?: 'contratante' | 'prestador';
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  driverName,
  driverPhone,
  serviceId,
  onStartVoiceCall,
  onStartVideoCall,
  isWebSocketConnected = false,
  userType = 'contratante'
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll para última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar mensagens quando o modal abrir
  useEffect(() => {
    if (isOpen && serviceId) {
      loadMessages();
    }
  }, [isOpen, serviceId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Carregar mensagens do serviço
  const loadMessages = async () => {
    if (!serviceId) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('📥 Carregando mensagens do serviço:', serviceId);

      const response = await fetch(`${API_BASE_URL}/servico/${serviceId}/mensagens`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Mensagens carregadas:', data);

        if (data.success && Array.isArray(data.mensagens)) {
          const formattedMessages = data.mensagens.map((msg: any) => ({
            id: msg.id || Date.now().toString(),
            text: msg.mensagem || msg.text || '',
            sender: msg.enviado_por === userType ? 'user' : 'driver',
            timestamp: new Date(msg.created_at || msg.timestamp || Date.now()),
            type: msg.tipo || 'text',
            imageUrl: msg.url_anexo || msg.imageUrl
          }));
          setMessages(formattedMessages);
        }
      } else {
        console.warn('⚠️ Erro ao carregar mensagens:', response.status);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar mensagem
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
    
    // Adicionar mensagem localmente (optimistic update)
    const tempMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      type: selectedImage ? 'image' : 'text',
      imageUrl: imageUrl || undefined
    };
    
    setMessages(prev => [...prev, tempMessage]);

    // Preparar dados para envio
    const messageData = {
      mensagem: messageText,
      tipo: selectedImage ? 'imagem' : 'texto',
      url_anexo: imageUrl || null,
      id_servico: parseInt(serviceId),
      enviado_por: userType
    };

    try {
      const token = localStorage.getItem('token');
      console.log('💬 Enviando mensagem via API...');
      console.log('📊 Dados da mensagem:', messageData);

      // Tentar via WebSocket primeiro se conectado
      if (isWebSocketConnected) {
        console.log('🔗 Tentando enviar via WebSocket...');
        
        // Obter dados do prestador para WebSocket
        const foundDriver = JSON.parse(localStorage.getItem('foundDriver') || '{}');
        const entregadorData = JSON.parse(localStorage.getItem('entregadorData') || '{}');
        const targetUserId = foundDriver.id_prestador || entregadorData.id || 2;

        console.log('🎯 Dados para envio WebSocket:', {
          serviceId: parseInt(serviceId),
          targetUserId,
          message: messageText,
          sender: userType
        });

        // Emitir via WebSocket (usando any para evitar erro TypeScript)
        const websocketService = (window as any).websocketService;
        if (websocketService && websocketService.emit) {
          websocketService.emit('send_message', {
            servicoId: parseInt(serviceId),
            mensagem: messageText,
            sender: userType,
            targetUserId: targetUserId
          });
          console.log('✅ Mensagem enviada via WebSocket');
        }
      }

      // Enviar via API REST (sempre como backup ou principal)
      const response = await fetch(`${API_BASE_URL}/servico/${serviceId}/mensagem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Mensagem enviada com sucesso via API:', data);
        
        // Atualizar mensagem local com dados do servidor se necessário
        if (data.success && data.mensagem) {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            if (lastIndex >= 0) {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                id: data.mensagem.id || newMessages[lastIndex].id
              };
            }
            return newMessages;
          });
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Erro na API:', response.status, errorData);
        
        // Remover mensagem local em caso de erro
        setMessages(prev => prev.slice(0, -1));
        alert('Erro ao enviar mensagem. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      // Remover mensagem local em caso de erro
      setMessages(prev => prev.slice(0, -1));
      alert('Erro de conexão. Verifique sua internet.');
    }

    // Limpar campos
    setNewMessage('');
    setSelectedImage(null);
    setImagePreview(null);
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
                {isWebSocketConnected ? '🟢 Online' : '🔴 Offline'}
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
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user'
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
                      {message.text && message.text !== 'Imagem enviada' && (
                        <p className="text-sm">{message.text}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm">{message.text}</p>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))
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
            {isWebSocketConnected ? (
              <span className="text-green-600">✅ Conectado - Mensagens em tempo real</span>
            ) : (
              <span className="text-orange-600">⚠️ Modo offline - Mensagens via API</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;