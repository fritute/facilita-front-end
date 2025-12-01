// ServiceTracking.tsx - Rastreamento com OSRM e WebSocket
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Star, CheckCircle, Phone, MessageCircle, X, Send, Video, PhoneCall, CreditCard } from 'lucide-react';
import WebSocketStatus from './WebSocketStatus';
import useWebSocket from '../hooks/useWebSocket';
import { API_ENDPOINTS } from '../config/constants';
import { notificationService } from '../services/notificationService';
import { chatService, ChatMessage } from '../services/chatService';
import { useCall } from '../hooks/useCall';
import facilitaVideoCallService from '../services/facilitaVideoCallService';
import facilitaVoiceCallService from '../services/facilitaVoiceCallService';

// Fix para ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Função para criar ícone SVG customizado
const createCustomIcon = (color: string, symbol?: string) => {
  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="${color}" stroke="#000" stroke-width="1"/>
      <circle cx="12.5" cy="12.5" r="8" fill="white"/>
      ${symbol ? `<text x="12.5" y="17" text-anchor="middle" font-size="10" font-weight="bold" fill="${color}">${symbol}</text>` : ''}
    </svg>
  `;
  
  return new L.DivIcon({
    html: svgIcon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    className: 'custom-marker-icon'
  });
};

// Ícones customizados mais robustos
const driverIcon = createCustomIcon('#2563eb', '🚗'); // Azul
const pickupIcon = createCustomIcon('#16a34a', '📍'); // Verde  
const destinationIcon = createCustomIcon('#dc2626', '🎯'); // Vermelho

// CSS para os ícones customizados
const iconStyles = `
  .custom-marker-icon {
    background: none !important;
    border: none !important;
  }
  .custom-marker-icon svg {
    filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
  }
`;

// Adicionar estilos ao documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = iconStyles;
  document.head.appendChild(styleSheet);
}

interface ServiceTrackingProps {
  onBack: () => void;
  onServiceCompleted: () => void;
  onServiceFinalized?: () => void;
  serviceId?: string;
  entregador: {
    nome: string;
    telefone: string;
    veiculo: string;
    placa: string;
    rating: string;
    tempoEstimado: string;
  };
  destination: {
    lat: number;
    lng: number;
    address: string;
  };
  driverOrigin?: {
    lat: number;
    lng: number;
  };
  pickupLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
}

const ServiceTracking: React.FC<ServiceTrackingProps> = ({
  onBack,
  onServiceCompleted,
  onServiceFinalized,
  serviceId,
  entregador,
  destination,
  driverOrigin,
  pickupLocation
}) => {

  // Estados básicos
  const [driverPosition, setDriverPosition] = useState(driverOrigin || { lat: -23.5324859, lng: -46.7916801 });
  const [progress, setProgress] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [isServicePaid, setIsServicePaid] = useState(false);
  const [isFinishingService, setIsFinishingService] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [videoCallData, setVideoCallData] = useState<{sala: string, token: string} | null>(null);

  // Hook de chamadas - apenas usando funções necessárias
  const {
    callState,
    isInitialized: isCallInitialized,
    initializeCall
  } = useCall();

  // Função para obter ID do serviço
  const getCurrentServiceId = () => {
    // 1. Verificar prop serviceId
    if (serviceId) {
      return serviceId;
    }
    
    // 2. Verificar localStorage direto
    const directIds = [
      localStorage.getItem('currentServiceId'),
      localStorage.getItem('createdServiceId'), 
      localStorage.getItem('activeServiceId')
    ].filter(Boolean);
    
    if (directIds.length > 0) {
      return directIds[0];
    }
    
    // 3. Verificar currentService
    try {
      const currentService = localStorage.getItem('currentService');
      
      if (currentService) {
        const serviceData = JSON.parse(currentService);
        
        const possibleIds = [
          serviceData.id,
          serviceData.serviceId,
          serviceData.service_id,
          serviceData.data?.id
        ].filter(Boolean);
        
        if (possibleIds.length > 0) {
          return possibleIds[0].toString();
        }
      }
    } catch (error) {
      console.warn('Erro ao parsear dados do serviço');
    }
    
    return null;
  };

  // Função para carregar mensagens do chat
  const loadChatMessages = async () => {
    const chatServiceId = getCurrentServiceId();
    if (!chatServiceId) return;

    try {
      setIsLoadingMessages(true);
      const result = await chatService.getMessages(chatServiceId);
      
      if (result.success && result.data) {
        const messages = Array.isArray(result.data) ? result.data : [];
        setChatMessages(messages);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Função para enviar mensagem no chat via API
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const chatServiceId = getCurrentServiceId();
    if (!chatServiceId) {
      notificationService.showError('Chat', 'ID do serviço não encontrado');
      return;
    }

    try {
      const result = await chatService.sendTextMessage(chatServiceId, newMessage.trim());
      
      if (result.success) {
        setNewMessage('');
        await loadChatMessages();
      } else {
        notificationService.showError('Chat', result.message || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      notificationService.showError('Chat', 'Erro de conexão');
    }
  };

  // Função para ligar para o prestador
  const callDriver = async () => {
    // Se sistema não inicializado, tentar inicializar primeiro
    if (!isCallInitialized) {
      if (!currentServiceId) {
        alert(`Sistema não disponível. Número: ${entregador.telefone}`);
        return;
      }
      
      // Usar dados de usuário real se disponível
      const realUserId = localStorage.getItem('realUserId');
      const realUserName = localStorage.getItem('realUserName');
      
      const userId = realUserId || localStorage.getItem('userId') || '1';
      const userName = realUserName || localStorage.getItem('loggedUser') || entregador.nome;
      
      try {
        const initialized = await initializeCall(currentServiceId, userId, userName);
        if (initialized) {
          // Aguardar um pouco para garantir inicialização
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Tentar chamada novamente
          handleVideoCall();
        } else {
          alert(`Falha no sistema de chamadas. Número: ${entregador.telefone}`);
        }
      } catch (error) {
        alert(`Erro no sistema. Número: ${entregador.telefone}`);
      }
    } else {
      handleVideoCall();
    }
  };

  // Função para finalizar serviço via API
  const finishService = async () => {
    const currentServiceIdForFinish = getCurrentServiceId();
    if (!currentServiceIdForFinish) {
      notificationService.showError('Erro', 'ID do serviço não encontrado');
      return;
    }

    try {
      setIsFinishingService(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        notificationService.showError('Erro', 'Token de autenticação não encontrado');
        return;
      }

      const response = await fetch(API_ENDPOINTS.SERVICE_FINISH(currentServiceIdForFinish), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await response.json();
        notificationService.showSuccess('Serviço Finalizado', 'Serviço finalizado com sucesso! Aguardando confirmação do contratante.');
        
        setProgress(100);
        // setIsServiceCompleted(true); // Comentado pois variável não foi declarada
        
        // Se o serviço já foi pago, finaliza completamente
        if (isServicePaid && onServiceFinalized) {
          onServiceFinalized();
        } else {
          // Se não foi pago, apenas completa para pagamento
          onServiceCompleted();
        }
      } else {
        const errorData = await response.json();
        notificationService.showError('Erro', errorData.message || 'Não foi possível finalizar o serviço');
      }
    } catch (error) {
      console.error('Erro ao finalizar serviço:', error);
      notificationService.showError('Erro', 'Erro de conexão ao finalizar serviço');
    } finally {
      setIsFinishingService(false);
    }
  };
  
  const currentServiceId = getCurrentServiceId();
  
  // WebSocket hook - apenas usando o necessário
  const { 
    isConnected: isWebSocketConnected, 
    onLocationUpdate
  } = useWebSocket({
    serviceId: currentServiceId || undefined,
    enableTracking: true,
    enableChat: false
  });

  // Inicializar sistema de chamadas
  useEffect(() => {
    if (currentServiceId && !isCallInitialized) {
      // Usar dados de usuário real se disponível
      const realUserId = localStorage.getItem('realUserId');
      const realUserName = localStorage.getItem('realUserName');
      
      const userId = realUserId || localStorage.getItem('userId') || '1';
      const userName = realUserName || localStorage.getItem('loggedUser') || entregador.nome;
      
      initializeCall(currentServiceId, userId, userName);
    }
  }, [currentServiceId, isCallInitialized, initializeCall, entregador.nome]);

  // Conectar ao WebSocket do chat quando necessário
  useEffect(() => {
    if (isChatOpen && currentServiceId) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        chatService.connectToChat(currentServiceId, userId);
        
        const removeMessageListener = chatService.onNewMessage((newMessage: ChatMessage) => {
          setChatMessages(prev => [...prev, newMessage]);
        });

        return () => {
          removeMessageListener();
          chatService.disconnectFromChat();
        };
      }
    }
  }, [isChatOpen, currentServiceId]);

  // Função para criar rota real usando OpenRouteService
  const createRealRoute = async (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    try {
      console.log('🗺️ Criando rota real de', start, 'para', end);
      
      // Usar OSRM (Open Source Routing Machine) - gratuito
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates;
          
          // Converter coordenadas [lng, lat] para [lat, lng] para o Leaflet
          const routeCoords: [number, number][] = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          
          setRouteCoordinates(routeCoords);
          
          // Atualizar tempo estimado
          const durationMinutes = Math.round(route.duration / 60);
          setEstimatedTime(durationMinutes);
          
          console.log(`✅ Rota criada com ${routeCoords.length} pontos, tempo estimado: ${durationMinutes} min`);
          return;
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao criar rota real, usando rota simples:', error);
    }
    
    // Fallback: criar linha reta se a API falhar
    const route: [number, number][] = [
      [start.lat, start.lng],
      [end.lat, end.lng]
    ];
    setRouteCoordinates(route);
  };

  // Escutar atualizações de localização em tempo real
  useEffect(() => {
    onLocationUpdate((locationData) => {
      const newPosition = {
        lat: locationData.latitude,
        lng: locationData.longitude
      };
      setDriverPosition(newPosition);
      
      // Atualizar rota quando a posição do motorista mudar
      createRealRoute(newPosition, destination);
    });
  }, [onLocationUpdate, destination]);

  // Criar rota inicial
  useEffect(() => {
    if (driverPosition && destination) {
      createRealRoute(driverPosition, destination);
    }
  }, [driverPosition, destination]);

  // Funções de chamada
  const handleVideoCall = async () => {
    // Evitar múltiplas chamadas simultâneas
    if (isStartingCall) {
      console.log('⚠️ Chamada já está sendo iniciada, ignorando...');
      return;
    }
    
    // Se já está em chamada, não fazer nada
    if (callState.isInCall) {
      console.log('⚠️ Chamada já está ativa, ignorando...');
      return;
    }
    
    console.log('📹 ServiceTracking - INICIANDO VIDEOCHAMADA VIA API FACILITA');
    setIsStartingCall(true);
    
    try {
      // Obter IDs do serviço e usuário
      const serviceId = parseInt(currentServiceId || localStorage.getItem('activeServiceId') || '1');
      const userId = parseInt(localStorage.getItem('realUserId') || localStorage.getItem('userId') || '1');
      
      console.log('📊 Dados da videochamada:', { serviceId, userId });
      
      // Criar videochamada via API Facilita
      const response = await facilitaVideoCallService.createVideoCall(serviceId, userId);
      
      if (response.success && response.data) {
        console.log('✅ Videochamada criada com sucesso:', response.data);
        console.log('🔍 Debug campos da resposta:', {
          url_chamada: response.data.url_chamada,
          room_name: response.data.room_name,
          sala: response.data.sala,
          token: response.data.token
        });
        
        // Usar a URL da videochamada diretamente da resposta da API
        let videoCallUrl = response.data.url_chamada;
        
        console.log('🌐 URL final da videochamada:', videoCallUrl);
        
        if (response.data.sala && response.data.token) {
          // Videochamada criada com sucesso - mostrar modal com dados
          console.log('✅ Videochamada configurada:', {
            sala: response.data.sala,
            token: response.data.token
          });
          
          setVideoCallData({
            sala: response.data.sala,
            token: response.data.token
          });
          
          notificationService.showSuccess(
            'Videochamada',
            `Sala "${response.data.sala}" criada com sucesso!`
          );
        } else {
          throw new Error('Dados da videochamada não encontrados');
        }
      } else {
        throw new Error(response.message || 'Erro ao criar videochamada');
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao iniciar videochamada:', error);
      notificationService.showError(
        'Videochamada',
        error.message || 'Não foi possível iniciar a videochamada'
      );
    } finally {
      setIsStartingCall(false);
    }
  };

  const handleAudioCall = async () => {
    // Evitar múltiplas chamadas simultâneas
    if (isStartingCall) {
      console.log('⚠️ Chamada já está sendo iniciada, ignorando...');
      return;
    }
    
    // Se já está em chamada, não fazer nada
    if (callState.isInCall) {
      console.log('⚠️ Chamada já está ativa, ignorando...');
      return;
    }
    
    console.log('📞 ServiceTracking - INICIANDO CHAMADA DE VOZ VIA WEBSOCKET');
    setIsStartingCall(true);
    
    try {
      // Obter IDs do serviço e usuário
      const serviceId = parseInt(currentServiceId || localStorage.getItem('activeServiceId') || '1');
      const userId = parseInt(localStorage.getItem('realUserId') || localStorage.getItem('userId') || '1');
      const targetUserId = parseInt(localStorage.getItem('prestadorId') || '2');
      const userName = localStorage.getItem('realUserName') || localStorage.getItem('loggedUser') || 'Cliente';
      
      console.log('📊 Dados da chamada de voz:', { serviceId, userId, targetUserId, userName });
      
      // Conectar ao WebSocket se não estiver conectado
      const connected = await facilitaVoiceCallService.connect();
      if (!connected) {
        throw new Error('Não foi possível conectar ao servidor de chamada');
      }
      
      // Iniciar chamada de voz
      const success = await facilitaVoiceCallService.initiateVoiceCall({
        serviceId,
        userId,
        targetUserId,
        userName
      });
      
      if (success) {
        console.log('✅ Chamada de voz iniciada com sucesso!');
        notificationService.showSuccess(
          'Chamada de Voz',
          'Chamada de voz iniciada! Aguardando o prestador aceitar...'
        );
        
        // Configurar listeners para eventos da chamada
        facilitaVoiceCallService.onIncomingCall((data) => {
          console.log('📞 Chamada recebida:', data);
          notificationService.showInfo('Chamada', 'Recebendo chamada...');
        });
        
        facilitaVoiceCallService.onCallAccepted((data) => {
          console.log('✅ Chamada aceita:', data);
          notificationService.showSuccess('Chamada', 'Chamada aceita! Conectando...');
        });
        
        facilitaVoiceCallService.onCallRejected((data) => {
          console.log('❌ Chamada rejeitada:', data);
          notificationService.showError('Chamada', 'Chamada foi rejeitada');
        });
        
        facilitaVoiceCallService.onCallEnded((data) => {
          console.log('📞 Chamada encerrada:', data);
          notificationService.showInfo('Chamada', 'Chamada encerrada');
        });
        
      } else {
        throw new Error('Falha ao iniciar chamada de voz');
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao iniciar chamada de voz:', error);
      notificationService.showError(
        'Chamada de Voz',
        error.message || 'Não foi possível iniciar a chamada de voz'
      );
    } finally {
      setIsStartingCall(false); // Sempre resetar o estado
    }
  };

  const getEstimatedArrival = () => {
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + (estimatedTime * 60000));
    return arrivalTime.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="relative h-screen bg-gray-100 overflow-hidden">
      {/* Mapa */}
      <div className="absolute inset-0">
        <MapContainer
          center={[driverPosition.lat, driverPosition.lng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Linha da rota */}
          {routeCoordinates.length > 0 && (
            <Polyline 
              positions={routeCoordinates} 
              color="#10b981" 
              weight={4}
              dashArray="10, 10"
            />
          )}
          
          {/* Marcador do motorista */}
          {driverPosition && driverPosition.lat && driverPosition.lng && (
            <Marker 
              position={[driverPosition.lat, driverPosition.lng]} 
              icon={driverIcon}
              key={`driver-${driverPosition.lat}-${driverPosition.lng}`}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">{entregador.nome}</p>
                  <p className="text-sm text-gray-600">{entregador.veiculo}</p>
                  <p className="text-xs text-gray-500">{entregador.placa}</p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Marcador da origem (pickup) */}
          {pickupLocation && pickupLocation.lat && pickupLocation.lng && (
            <Marker 
              position={[pickupLocation.lat, pickupLocation.lng]} 
              icon={pickupIcon}
              key={`pickup-${pickupLocation.lat}-${pickupLocation.lng}`}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">Origem (Coleta)</p>
                  <p className="text-sm text-gray-600">{pickupLocation.address || 'Endereço de coleta'}</p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Marcador do destino */}
          {destination && destination.lat && destination.lng && (
            <Marker 
              position={[destination.lat, destination.lng]} 
              icon={destinationIcon}
              key={`destination-${destination.lat}-${destination.lng}`}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">Destino</p>
                  <p className="text-sm text-gray-600">{destination.address || 'Endereço de destino'}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-md z-10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button 
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            
          </div>
          
          <div className="text-center">
            <h1 className="text-lg font-bold">Acompanhar Serviço</h1>
            <p className="text-sm text-gray-600">
              Tempo estimado: {estimatedTime > 0 ? `${estimatedTime} min` : entregador.tempoEstimado}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <WebSocketStatus isConnected={isWebSocketConnected} />
          </div>
        </div>
      </div>

      {/* Bottom Card */}
      <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white p-4 rounded-t-3xl shadow-2xl z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img 
              src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" 
              alt={entregador.nome}
              className="w-12 h-12 rounded-full border-2 border-white"
            />
            <div>
              <h3 className="font-bold text-lg">{entregador.nome}</h3>
              <div className="flex items-center space-x-1">
                <span className="text-sm">{entregador.rating}</span>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Botão de Chamada de Vídeo */}
            <button 
              onClick={handleVideoCall}
              disabled={isStartingCall || callState.isInCall}
              className={`p-2 rounded-full transition-all ${
                isStartingCall || callState.isInCall 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
              title={
                callState.isInCall ? 'Chamada ativa' : 
                isStartingCall ? 'Iniciando chamada...' : 
                'Chamada de vídeo'
              }
            >
              <Video className="w-5 h-5" />
            </button>
            
            {/* Botão de Chamada de Áudio */}
            <button 
              onClick={handleAudioCall}
              disabled={isStartingCall || callState.isInCall}
              className={`p-2 rounded-full transition-all ${
                isStartingCall || callState.isInCall 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
              title={
                callState.isInCall ? 'Chamada ativa' : 
                isStartingCall ? 'Iniciando chamada...' : 
                'Chamada de áudio'
              }
            >
              <PhoneCall className="w-5 h-5" />
            </button>
            
            {/* Botão de Ligação Telefônica */}
            <button 
              onClick={callDriver}
              className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-all"
              title="Ligar telefone"
            >
              <Phone className="w-5 h-5" />
            </button>

            {/* Botão de Chat */}
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            
            {/* Botão de Pagar Serviço - apenas se não foi pago */}
            {!isServicePaid && (
              <button 
                onClick={() => {
                  setIsServicePaid(true);
                  onServiceCompleted();
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                title="Pagar serviço"
              >
                <CreditCard className="w-5 h-5" />
                <span>Pagar</span>
              </button>
            )}
            
            {/* Botão de Finalizar Serviço */}
            <button 
              onClick={finishService}
              disabled={isFinishingService}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isFinishingService ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs opacity-75">
              Progresso: {Math.round(progress)}%
            </p>
            <p className="text-xs opacity-75">
              Chegada: {getEstimatedArrival()}
            </p>
          </div>
        </div>
      </div>

      {/* Modal do Chat */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-md h-96 rounded-t-2xl flex flex-col">
            {/* Header do Chat */}
            <div className="bg-green-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" 
                  alt={entregador.nome}
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
                <div>
                  <h3 className="font-bold">{entregador.nome}</h3>
                  <p className="text-xs opacity-90">Prestador</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Botões de chamada no chat */}
                <button 
                  onClick={handleVideoCall}
                  className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-all"
                >
                  <Video className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleAudioCall}
                  className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-all"
                >
                  <PhoneCall className="w-5 h-5" />
                </button>
                <button 
                  onClick={callDriver}
                  className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-all"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Área de mensagens */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {isLoadingMessages ? (
                <div className="text-center text-gray-500 mt-8">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin mx-auto mb-2"></div>
                  <p>Carregando mensagens...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Inicie uma conversa com o prestador</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatMessages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex ${message.enviado_por === 'contratante' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-xs px-4 py-2 rounded-2xl ${
                          message.enviado_por === 'contratante' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-white border border-gray-200 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.mensagem}</p>
                        <p className={`text-xs mt-1 ${
                          message.enviado_por === 'contratante' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.data_envio).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input de mensagem */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Videochamada */}
      {videoCallData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Videochamada Configurada
              </h3>
              <button
                onClick={() => setVideoCallData(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Video className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">
                    Sala de videochamada criada!
                  </span>
                </div>
                
                <div className="space-y-3 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sala:
                    </label>
                    <div className="bg-gray-100 p-2 rounded border text-sm font-mono">
                      {videoCallData.sala}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Token:
                    </label>
                    <div className="bg-gray-100 p-2 rounded border text-xs font-mono break-all">
                      {videoCallData.token}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <p className="mb-2">
                    <strong>Instruções:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Use estes dados para conectar no aplicativo de videochamada</li>
                    <li>Compartilhe a sala com o prestador de serviço</li>
                    <li>O token é necessário para autenticação</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Sala: ${videoCallData.sala}\nToken: ${videoCallData.token}`);
                    alert('Dados copiados para a área de transferência!');
                  }}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors text-sm"
                >
                  Copiar Dados
                </button>
                <button
                  onClick={() => setVideoCallData(null)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interface de Chamada - removida para simplificar */}
      {/* Se necessário, pode ser adicionada novamente com as variáveis corretas */}
    </div>
  );
};

export default ServiceTracking;
