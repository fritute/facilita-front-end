// ServiceTracking.tsx - Rastreamento com OSRM
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, MessageSquare, Star, Clock, CheckCircle } from 'lucide-react';
import ChatModal from './ChatModal';
import { ServiceTrackingManager, ServiceTrackingState } from '../utils/serviceTrackingUtils';

// Fix para ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ícone customizado para o motorista
const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Ícone customizado para o destino
const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ServiceTrackingProps {
  onBack: () => void;
  onServiceCompleted: () => void; // Nova prop para quando o serviço for concluído
  entregador: {
    nome: string;
    telefone: string;
    veiculo: string;
    placa: string;
    rating: number;
    tempoEstimado: string;
    distancia: string;
  };
  destination: {
    address: string;
    lat: number;
    lng: number;
  };
  driverOrigin: {
    lat: number;
    lng: number;
  };
}

const ServiceTracking: React.FC<ServiceTrackingProps> = ({ onBack, onServiceCompleted, entregador, destination, driverOrigin }) => {
  // Carregar estado do serviço ativo
  const savedState = ServiceTrackingManager.loadActiveService();
  
  // Log para debug
  console.log('🔄 ServiceTracking iniciado');
  console.log('💾 Estado salvo encontrado:', savedState ? 'Sim' : 'Não');
  if (savedState) {
    console.log('📊 Progresso salvo:', savedState.progress);
    console.log('📍 Posição salva:', savedState.driverPosition);
    console.log('🛣️ Rota salva:', savedState.routeCoordinates?.length || 0, 'pontos');
    console.log('📏 Índice da rota salvo:', savedState.currentRouteIndex);
  }
  
  // CORREÇÃO: Usar sempre a posição salva se existir
  const initialDriverPosition = savedState?.driverPosition || {
    lat: driverOrigin?.lat || -23.5324859,
    lng: driverOrigin?.lng || -46.7916801
  };
  
  console.log('📍 Posição inicial definida:', initialDriverPosition);

  const [driverPosition, setDriverPosition] = useState<{ lat: number; lng: number }>(initialDriverPosition);
  const [progress, setProgress] = useState(savedState?.progress || 0);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>(savedState?.routeCoordinates || []);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(savedState?.currentRouteIndex || 0);
  const [estimatedTime, setEstimatedTime] = useState<number>(savedState?.estimatedTime || 0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [serviceStartTime] = useState<Date>(savedState?.serviceStartTime ? new Date(savedState.serviceStartTime) : new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isServiceCompleted, setIsServiceCompleted] = useState(savedState?.isServiceCompleted || false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasShownCompletionMessage, setHasShownCompletionMessage] = useState(false);

  // Buscar rota real usando OSRM (apenas se não tiver rota salva)
  useEffect(() => {
    if (routeCoordinates.length > 0) {
      console.log('🛣️ Rota já carregada do estado salvo:', routeCoordinates.length, 'pontos');
      
      // CORREÇÃO: Garantir que a posição do motorista está correta baseada no índice salvo
      if (savedState && savedState.currentRouteIndex < routeCoordinates.length) {
        const savedPosition = routeCoordinates[savedState.currentRouteIndex];
        const correctPosition = { lat: savedPosition[0], lng: savedPosition[1] };
        
        console.log('🔄 Ajustando posição do motorista para índice salvo:', savedState.currentRouteIndex);
        console.log('📍 Posição corrigida:', correctPosition);
        
        setDriverPosition(correctPosition);
      }
      return;
    }

    console.log('🗺️ Buscando nova rota...');
    // Usar a posição original para calcular a rota (não a posição atual do motorista)
    const routeOrigin = driverOrigin || { lat: -23.5324859, lng: -46.7916801 };
    
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${routeOrigin.lng},${routeOrigin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
        
        console.log('📡 Fazendo requisição OSRM:', url);
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates: [number, number][] = route.geometry.coordinates.map(
            (coord: number[]) => [coord[1], coord[0]] // Inverter para [lat, lng]
          );
          
          setRouteCoordinates(coordinates);
          setEstimatedTime(Math.round(route.duration / 60)); // Converter para minutos
          
          console.log('✅ Rota calculada:', {
            distancia: `${(route.distance / 1000).toFixed(2)} km`,
            tempo: `${Math.round(route.duration / 60)} min`,
            pontos: coordinates.length
          });
          
          // CORREÇÃO: Se é uma nova rota, começar do início
          if (!savedState) {
            setDriverPosition({ lat: coordinates[0][0], lng: coordinates[0][1] });
            setCurrentRouteIndex(0);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar rota:', error);
        // Fallback: linha reta com mais pontos para simular movimento
        const fallbackRoute: [number, number][] = [];
        const steps = 20; // 20 pontos entre origem e destino
        
        for (let i = 0; i <= steps; i++) {
          const ratio = i / steps;
          const lat = routeOrigin.lat + (destination.lat - routeOrigin.lat) * ratio;
          const lng = routeOrigin.lng + (destination.lng - routeOrigin.lng) * ratio;
          fallbackRoute.push([lat, lng]);
        }
        
        setRouteCoordinates(fallbackRoute);
        console.log('🔄 Usando rota fallback com', fallbackRoute.length, 'pontos');
        
        // CORREÇÃO: Se é uma nova rota, começar do início
        if (!savedState) {
          setDriverPosition({ lat: fallbackRoute[0][0], lng: fallbackRoute[0][1] });
          setCurrentRouteIndex(0);
        }
      }
    };

    fetchRoute();
  }, [destination, driverOrigin?.lat, driverOrigin?.lng, routeCoordinates.length, savedState]);

  // Atualizar horário atual a cada segundo
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Salvar estado sempre que houver mudanças importantes
  useEffect(() => {
    if (savedState && !isServiceCompleted) {
      const currentState: ServiceTrackingState = {
        serviceId: savedState.serviceId,
        driverPosition,
        progress,
        routeCoordinates,
        currentRouteIndex,
        estimatedTime,
        serviceStartTime: serviceStartTime.toISOString(),
        isServiceCompleted,
        destination,
        entregador
      };
      
      ServiceTrackingManager.saveActiveService(currentState);
      console.log('💾 Estado salvo:', {
        progresso: Math.round(progress),
        posicao: `${driverPosition.lat.toFixed(4)}, ${driverPosition.lng.toFixed(4)}`,
        indiceRota: currentRouteIndex,
        concluido: isServiceCompleted
      });
    }
  }, [driverPosition, progress, routeCoordinates, currentRouteIndex, estimatedTime, serviceStartTime, isServiceCompleted, destination, entregador, savedState]);

  // Detectar quando o prestador chegou e encerrar automaticamente
  useEffect(() => {
    if (progress >= 100 && !isServiceCompleted && !hasShownCompletionMessage) {
      console.log('🎉 Prestador chegou ao destino! Encerrando serviço automaticamente...');
      setHasShownCompletionMessage(true);
      
      // Mostrar mensagem de chegada por 3 segundos, depois encerrar
      const completionTimer = setTimeout(() => {
        console.log('✅ Finalizando serviço e redirecionando para avaliação...');
        setIsServiceCompleted(true);
        
        // Aguardar um pouco mais antes de chamar onServiceCompleted
        setTimeout(() => {
          onServiceCompleted();
        }, 500);
      }, 3000);

      return () => clearTimeout(completionTimer);
    }
  }, [progress, isServiceCompleted, onServiceCompleted, hasShownCompletionMessage]);

  // Simular movimento do motorista ao longo da rota
  useEffect(() => {
    if (routeCoordinates.length === 0 || isPaused || isServiceCompleted) {
      if (routeCoordinates.length === 0) {
        console.log('⏳ Aguardando rota ser carregada...');
      } else if (isPaused) {
        console.log('⏸️ Movimento pausado pelo usuário');
      } else if (isServiceCompleted) {
        console.log('✅ Serviço concluído, parando movimento');
      }
      return;
    }

    // CORREÇÃO: Verificar se já chegou ao final baseado no índice salvo
    if (currentRouteIndex >= routeCoordinates.length - 1) {
      console.log('🏁 Já estava no final da rota!');
      setProgress(100);
      return;
    }

    console.log('🚗 Continuando movimento do índice:', currentRouteIndex, 'de', routeCoordinates.length);
    
    const interval = setInterval(() => {
      setCurrentRouteIndex((prev: number) => {
        const nextIndex = prev + 1;
        
        if (nextIndex >= routeCoordinates.length) {
          console.log('🏁 Chegou ao final da rota!');
          setProgress(100);
          return prev; // Chegou ao destino
        }
        
        // Atualizar posição do motorista
        const newPosition = routeCoordinates[nextIndex];
        const newDriverPosition = { lat: newPosition[0], lng: newPosition[1] };
        setDriverPosition(newDriverPosition);
        
        // Calcular progresso
        const newProgress = Math.min(100, (nextIndex / (routeCoordinates.length - 1)) * 100);
        setProgress(newProgress);
        
        console.log(`🚗 Movimento: ${nextIndex}/${routeCoordinates.length} (${Math.round(newProgress)}%)`);
        console.log(`📍 Nova posição: ${newDriverPosition.lat.toFixed(4)}, ${newDriverPosition.lng.toFixed(4)}`);
        
        return nextIndex;
      });
    }, 3000); // Move para o próximo ponto a cada 3 segundos

    return () => clearInterval(interval);
  }, [routeCoordinates, isPaused, isServiceCompleted, currentRouteIndex]);

  // Função para pausar/retomar o tracking
  const toggleTracking = () => {
    setIsPaused(!isPaused);
  };

  // Limpar estado salvo quando o componente for desmontado (apenas se serviço não foi completado)
  useEffect(() => {
    return () => {
      if (!isServiceCompleted) {
        console.log('Mantendo estado salvo para continuidade...');
      }
    };
  }, [isServiceCompleted]);

  // Funções para formatação de horário
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getElapsedTime = () => {
    const elapsed = Math.floor((currentTime.getTime() - serviceStartTime.getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getEstimatedArrival = () => {
    const remainingMinutes = estimatedTime > 0 
      ? Math.ceil(estimatedTime * (1 - progress / 100))
      : Math.ceil(parseInt(entregador.tempoEstimado) * (1 - progress / 100));
    
    const arrivalTime = new Date(currentTime.getTime() + remainingMinutes * 60000);
    return arrivalTime.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Centro do mapa (ponto médio entre motorista e destino)
  const mapCenter: [number, number] = [
    (driverPosition.lat + destination.lat) / 2,
    (driverPosition.lng + destination.lng) / 2
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-green-500 text-white p-4 relative">
        <button
          onClick={onBack}
          className="absolute left-4 top-4 text-white hover:text-gray-200"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold">Acompanhe o serviço</h1>
          <div className="flex justify-between items-center mt-2 text-sm opacity-90">
            <span>Iniciado: {formatTime(serviceStartTime)}</span>
            <span>Atual: {formatTime(currentTime)}</span>
            <span>Duração: {getElapsedTime()}</span>
          </div>
        </div>
      </div>

      {/* Map Area - OpenStreetMap */}
      <div className="flex-1 relative z-0" style={{ minHeight: '400px' }}>
        <MapContainer
          center={mapCenter}
          zoom={14}
          style={{ height: '100%', width: '100%', position: 'absolute' }}
          className="z-0"
          preferCanvas={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            subdomains={['a', 'b', 'c']}
            crossOrigin={true}
            errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
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
          <Marker position={[driverPosition.lat, driverPosition.lng]} icon={driverIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{entregador.nome}</p>
                <p className="text-sm text-gray-600">{entregador.veiculo}</p>
                <p className="text-xs text-gray-500">{entregador.placa}</p>
              </div>
            </Popup>
          </Marker>
          
          {/* Marcador do destino */}
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">Destino</p>
                <p className="text-sm text-gray-600">{destination.address}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Bottom Card - Informações do Prestador */}
      <div className="bg-green-500 text-white p-4 rounded-t-3xl shadow-2xl relative z-10">
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
          <div className="flex flex-col items-end space-y-1">
            <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-2 rounded-full">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">
                {progress >= 100 ? 'Chegou!' : 
                  `${estimatedTime > 0 
                    ? Math.ceil(estimatedTime * (1 - progress / 100))
                    : Math.ceil(parseInt(entregador.tempoEstimado) * (1 - progress / 100))
                  } Min`
                }
              </span>
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            {progress < 100 && (
              <span className="text-xs opacity-75">
                Chegada prevista: {getEstimatedArrival()}
              </span>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="bg-white bg-opacity-10 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm opacity-90">Status</p>
              <p className="font-bold text-lg">
                {progress >= 100 ? '🎉 Prestador chegou!' : isPaused ? '⏸️ Tracking pausado' : '🚗 Prestador em rota'}
              </p>
              {progress >= 100 && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm opacity-90">
                    ✅ Pedido finalizado! Redirecionando para avaliação...
                  </p>
                  <p className="text-xs opacity-75">
                    Horário de chegada: {formatTime(currentTime)}
                  </p>
                  <div className="mt-2 bg-white bg-opacity-20 rounded-lg p-2">
                    <p className="text-xs opacity-90">
                      💾 Progresso salvo automaticamente - você pode fechar o app sem perder o acompanhamento
                    </p>
                  </div>
                </div>
              )}
              {progress < 100 && (
                <div className="mt-1">
                  <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs opacity-75 mt-1">
                    Progresso: {Math.round(progress)}% {isPaused && '(Pausado)'}
                  </p>
                  {savedState && (
                    <p className="text-xs opacity-60 mt-1">
                      💾 Progresso salvo - continue de onde parou
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-2 ml-4">
              <button 
                onClick={() => setIsChatOpen(true)}
                className="bg-white text-green-600 px-4 py-2 rounded-full font-semibold hover:bg-opacity-90 transition-all flex items-center space-x-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Conversar</span>
              </button>
              {progress < 100 && (
                <button 
                  onClick={toggleTracking}
                  className={`px-4 py-2 rounded-full font-semibold hover:bg-opacity-90 transition-all text-sm ${
                    isPaused 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-white bg-opacity-20 text-white'
                  }`}
                >
                  {isPaused ? '▶️ Retomar' : '⏸️ Pausar'}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        driverName={entregador.nome}
        driverPhone={entregador.telefone}
      />
    </div>
  );
};

export default ServiceTracking;