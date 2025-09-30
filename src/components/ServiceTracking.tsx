// ServiceTracking.tsx - Rastreamento com OSRM
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, MessageSquare, Star, Clock, CheckCircle } from 'lucide-react';

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
}

const ServiceTracking: React.FC<ServiceTrackingProps> = ({ onBack, entregador, destination }) => {
  // Posição inicial do motorista (exemplo: um ponto distante do destino)
  const initialDriverPosition = {
    lat: -23.5324859,
    lng: -46.7916801
  };

  const [driverPosition, setDriverPosition] = useState<{ lat: number; lng: number }>(initialDriverPosition);
  const [progress, setProgress] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);

  // Buscar rota real usando OSRM
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${initialDriverPosition.lng},${initialDriverPosition.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates: [number, number][] = route.geometry.coordinates.map(
            (coord: number[]) => [coord[1], coord[0]] // Inverter para [lat, lng]
          );
          
          setRouteCoordinates(coordinates);
          setEstimatedTime(Math.round(route.duration / 60)); // Converter para minutos
          
          console.log('Rota calculada:', {
            distancia: `${(route.distance / 1000).toFixed(2)} km`,
            tempo: `${Math.round(route.duration / 60)} min`,
            pontos: coordinates.length
          });
        }
      } catch (error) {
        console.error('Erro ao buscar rota:', error);
        // Fallback: linha reta
        setRouteCoordinates([
          [initialDriverPosition.lat, initialDriverPosition.lng],
          [destination.lat, destination.lng]
        ]);
      }
    };

    fetchRoute();
  }, [destination]);

  // Simular movimento do motorista ao longo da rota
  useEffect(() => {
    if (routeCoordinates.length === 0) return;

    const interval = setInterval(() => {
      setCurrentRouteIndex(prev => {
        const nextIndex = prev + 1;
        
        if (nextIndex >= routeCoordinates.length) {
          setProgress(100);
          return prev; // Chegou ao destino
        }
        
        // Atualizar posição do motorista
        const newPosition = routeCoordinates[nextIndex];
        setDriverPosition({ lat: newPosition[0], lng: newPosition[1] });
        
        // Calcular progresso
        const newProgress = (nextIndex / routeCoordinates.length) * 100;
        setProgress(newProgress);
        
        return nextIndex;
      });
    }, 2000); // Move para o próximo ponto a cada 2 segundos

    return () => clearInterval(interval);
  }, [routeCoordinates]);

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
        </div>
      </div>

      {/* Map Area - OpenStreetMap */}
      <div className="flex-1 relative z-0" style={{ minHeight: '400px' }}>
        <MapContainer
          center={mapCenter}
          zoom={14}
          style={{ height: '100%', width: '100%', position: 'absolute' }}
          className="z-0"
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
          <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-2 rounded-full">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">
              {estimatedTime > 0 
                ? Math.ceil(estimatedTime * (1 - progress / 100))
                : Math.ceil(parseInt(entregador.tempoEstimado) * (1 - progress / 100))
              } Min
            </span>
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Status */}
        <div className="bg-white bg-opacity-10 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Status</p>
              <p className="font-bold text-lg">
                {progress >= 100 ? 'Prestador chegou!' : 'Prestador em rota'}
              </p>
            </div>
            <button className="bg-white text-green-600 px-4 py-2 rounded-full font-semibold hover:bg-opacity-90 transition-all flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Conversar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceTracking;