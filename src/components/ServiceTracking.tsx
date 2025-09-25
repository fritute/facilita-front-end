// ServiceTracking.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, MessageSquare, Star, Clock, Truck } from 'lucide-react';

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
  const [driverPosition, setDriverPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(entregador.tempoEstimado);

  // Simular movimento do motorista em tempo real
  useEffect(() => {
    // Posição inicial aleatória próxima ao destino (para demonstração)
    const initialLat = destination.lat + (Math.random() * 0.02 - 0.01);
    const initialLng = destination.lng + (Math.random() * 0.02 - 0.01);
    
    setDriverPosition({ lat: initialLat, lng: initialLng });

    // Simular movimento em tempo real
    const interval = setInterval(() => {
      setDriverPosition(prev => {
        if (!prev) return null;
        
        // Mover gradualmente em direção ao destino
        const latDiff = destination.lat - prev.lat;
        const lngDiff = destination.lng - prev.lng;
        
        const newLat = prev.lat + latDiff * 0.1;
        const newLng = prev.lng + lngDiff * 0.1;
        
        // Calcular progresso
        const totalDistance = Math.sqrt(
          Math.pow(destination.lat - initialLat, 2) + 
          Math.pow(destination.lng - initialLng, 2)
        );
        const currentDistance = Math.sqrt(
          Math.pow(destination.lat - newLat, 2) + 
          Math.pow(destination.lng - newLng, 2)
        );
        
        const newProgress = Math.max(0, Math.min(100, 100 - (currentDistance / totalDistance) * 100));
        setProgress(newProgress);
        
        // Atualizar ETA baseado no progresso
        const remainingTime = parseInt(entregador.tempoEstimado) * (1 - newProgress / 100);
        setEta(`${Math.ceil(remainingTime)} min`);
        
        return { lat: newLat, lng: newLng };
      });
    }, 3000); // Atualizar a cada 3 segundos

    return () => clearInterval(interval);
  }, [destination, entregador.tempoEstimado]);

  return (
    <div className="min-h-screen bg-gray-100">
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

      {/* Driver Info */}
      <div className="bg-white p-4 mx-4 mt-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <Truck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">{entregador.nome}</h3>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm ml-1">{entregador.rating} ▼</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end text-green-600">
              <Clock className="w-4 h-4 mr-1" />
              <span className="font-semibold">{eta}</span>
            </div>
            <p className="text-sm text-gray-600">{entregador.distancia}</p>
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Veículo:</span>
              <p className="font-medium">{entregador.veiculo}</p>
            </div>
            <div>
              <span className="text-gray-600">Placa:</span>
              <p className="font-medium">{entregador.placa}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-4 mx-4 mt-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Status do trajeto</span>
          <span className="text-sm text-green-600">{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>Motorista a caminho</span>
          <span>Chegando</span>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white p-4 mx-4 mt-4 rounded-lg shadow-md">
        <h3 className="font-semibold mb-3">Localização em tempo real</h3>
        <div className="h-64 bg-gray-200 rounded-lg relative overflow-hidden">
          {/* Mapa simplificado - Em produção, integraria com OpenStreetMap */}
          <div className="absolute inset-0 bg-blue-50">
            {/* Simulação do mapa */}
            <div className="w-full h-full relative">
              {/* Rua principal */}
              <div className="absolute top-1/2 left-0 right-0 h-4 bg-gray-300 transform -translate-y-1/2"></div>
              
              {/* Destino */}
              <div 
                className="absolute w-6 h-6 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: '80%',
                  top: '50%'
                }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Destino
                </div>
              </div>
              
              {/* Motorista */}
              {driverPosition && (
                <div 
                  className="absolute w-8 h-8 bg-green-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg"
                  style={{
                    left: `${20 + progress * 0.6}%`,
                    top: '50%'
                  }}
                >
                  <Truck className="w-4 h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {entregador.nome.split(' ')[0]}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 flex space-x-3">
        <button className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center hover:bg-green-600 transition-colors">
          <Phone className="w-5 h-5 mr-2" />
          Ligar
        </button>
        <button className="flex-1 bg-white border border-green-500 text-green-500 py-3 rounded-lg font-semibold flex items-center justify-center hover:bg-green-50 transition-colors">
          <MessageSquare className="w-5 h-5 mr-2" />
          Mensagem
        </button>
      </div>

      {/* Status Timeline */}
      <div className="bg-white p-4 mx-4 mb-4 rounded-lg shadow-md">
        <h3 className="font-semibold mb-3">Status do serviço</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium">Serviço confirmado</p>
              <p className="text-sm text-gray-600">Há 5 minutos</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium">Prestador a caminho</p>
              <p className="text-sm text-gray-600">Há 3 minutos</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
            <div>
              <p className="text-gray-400">Serviço em andamento</p>
              <p className="text-sm text-gray-500">Em breve</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
            <div>
              <p className="text-gray-400">Serviço finalizado</p>
              <p className="text-sm text-gray-500">--:--</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceTracking;