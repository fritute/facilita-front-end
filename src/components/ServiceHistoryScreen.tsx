import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, MapPin, Star, Eye, Filter, RefreshCw } from 'lucide-react';
import { API_ENDPOINTS } from '../config/constants';
import { notificationService } from '../services/notificationService';

interface Service {
  id: number;
  descricao: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  valor: string;
  created_at: string;
  updated_at: string;
  origem_endereco?: string;
  destino_endereco?: string;
  prestador?: {
    id: number;
    usuario: {
      nome: string;
      telefone: string;
    };
  };
  avaliacao?: {
    nota: number;
    comentario: string;
  };
}

interface ServiceHistoryScreenProps {
  onBack: () => void;
  onViewDetails: (serviceId: number) => void;
  contratanteId: string;
}

const ServiceHistoryScreen: React.FC<ServiceHistoryScreenProps> = ({
  onBack,
  onViewDetails,
  contratanteId
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [refreshing, setRefreshing] = useState(false);

  const statusOptions = [
    { value: 'TODOS', label: 'Todos os serviços', color: 'bg-gray-500' },
    { value: 'PENDENTE', label: 'Pendentes', color: 'bg-yellow-500' },
    { value: 'EM_ANDAMENTO', label: 'Em andamento', color: 'bg-blue-500' },
    { value: 'CONCLUIDO', label: 'Concluídos', color: 'bg-green-500' },
    { value: 'CANCELADO', label: 'Cancelados', color: 'bg-red-500' }
  ];

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        notificationService.showError('Erro', 'Token de autenticação não encontrado');
        return;
      }

      const response = await fetch(API_ENDPOINTS.SERVICES_BY_CONTRATANTE(contratanteId), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const servicesList = data.data || data || [];
        setServices(servicesList);
        setFilteredServices(servicesList);
      } else {
        const errorData = await response.json();
        notificationService.showError('Erro', errorData.message || 'Não foi possível carregar o histórico');
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      notificationService.showError('Erro', 'Erro de conexão ao carregar histórico');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
  };

  const filterServices = (status: string) => {
    setSelectedStatus(status);
    if (status === 'TODOS') {
      setFilteredServices(services);
    } else {
      setFilteredServices(services.filter(service => service.status === status));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-yellow-500';
      case 'EM_ANDAMENTO': return 'bg-blue-500';
      case 'CONCLUIDO': return 'bg-green-500';
      case 'CANCELADO': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'Aguardando prestador';
      case 'EM_ANDAMENTO': return 'Em andamento';
      case 'CONCLUIDO': return 'Concluído';
      case 'CANCELADO': return 'Cancelado';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value);
    return numValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  useEffect(() => {
    fetchServices();
  }, [contratanteId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-green-500 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="text-white hover:text-gray-200"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold">Histórico de Serviços</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status Filter */}
        <div className="mt-4">
          <div className="flex items-center space-x-2 mb-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtrar por status:</span>
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => filterServices(option.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedStatus === option.value
                    ? 'bg-white text-green-600'
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="p-4 space-y-4">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedStatus === 'TODOS' ? 'Nenhum serviço encontrado' : `Nenhum serviço ${selectedStatus.toLowerCase()}`}
            </h3>
            <p className="text-gray-500">
              {selectedStatus === 'TODOS' 
                ? 'Você ainda não criou nenhum serviço.'
                : 'Tente selecionar outro filtro.'
              }
            </p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              {/* Service Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-500">
                      Serviço #{service.id}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(service.status)}`}>
                      {getStatusText(service.status)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {service.descricao}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(service.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(service.valor)}
                  </p>
                  <button
                    onClick={() => onViewDetails(service.id)}
                    className="mt-1 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ver detalhes</span>
                  </button>
                </div>
              </div>

              {/* Addresses */}
              {(service.origem_endereco || service.destino_endereco) && (
                <div className="space-y-2 mb-3">
                  {service.origem_endereco && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Origem</p>
                        <p className="text-sm text-gray-700">{service.origem_endereco}</p>
                      </div>
                    </div>
                  )}
                  {service.destino_endereco && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Destino</p>
                        <p className="text-sm text-gray-700">{service.destino_endereco}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Provider Info */}
              {service.prestador && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-500 mb-1">Prestador</p>
                  <p className="font-medium text-gray-900">{service.prestador.usuario.nome}</p>
                  <p className="text-sm text-gray-600">{service.prestador.usuario.telefone}</p>
                </div>
              )}

              {/* Rating */}
              {service.avaliacao && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-medium text-gray-900">{service.avaliacao.nota}/5</span>
                  </div>
                  {service.avaliacao.comentario && (
                    <p className="text-sm text-gray-600">{service.avaliacao.comentario}</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredServices.length > 0 && (
        <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {filteredServices.length} serviço{filteredServices.length !== 1 ? 's' : ''} 
              {selectedStatus !== 'TODOS' && ` ${selectedStatus.toLowerCase()}`}
            </p>
            {selectedStatus === 'TODOS' && (
              <p className="text-xs text-gray-500 mt-1">
                Total gasto: {formatCurrency(
                  filteredServices
                    .filter(s => s.status === 'CONCLUIDO')
                    .reduce((sum, s) => sum + parseFloat(s.valor), 0)
                    .toString()
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceHistoryScreen;
