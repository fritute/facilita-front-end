import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, User, Phone, Star, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { API_ENDPOINTS } from '../config/constants';
import { notificationService } from '../services/notificationService';

interface ServiceDetails {
  id: number;
  descricao: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  valor: string;
  valor_adicional?: string;
  created_at: string;
  updated_at: string;
  origem_endereco?: string;
  destino_endereco?: string;
  origem_lat?: number;
  origem_lng?: number;
  destino_lat?: number;
  destino_lng?: number;
  categoria?: {
    id: number;
    nome: string;
    descricao: string;
  };
  contratante?: {
    id: number;
    usuario: {
      nome: string;
      telefone: string;
      email: string;
    };
  };
  prestador?: {
    id: number;
    usuario: {
      nome: string;
      telefone: string;
      email: string;
    };
  };
  avaliacao?: {
    id: number;
    nota: number;
    comentario: string;
    created_at: string;
  };
  rastreamento?: Array<{
    id: number;
    status: string;
    latitude: string;
    longitude: string;
    endereco: string;
    created_at: string;
  }>;
  detalhes_valor?: {
    valor_base: number;
    valor_adicional: number;
    valor_distancia: number;
    valor_total: number;
  };
}

interface ServiceDetailsScreenProps {
  serviceId: number;
  onBack: () => void;
  onConfirmCompletion?: (serviceId: number) => void;
}

const ServiceDetailsScreen: React.FC<ServiceDetailsScreenProps> = ({
  serviceId,
  onBack,
  onConfirmCompletion
}) => {
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const fetchServiceDetails = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        notificationService.showError('Erro', 'Token de autenticação não encontrado');
        return;
      }

      const response = await fetch(API_ENDPOINTS.SERVICE_DETAILS(serviceId.toString()), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setService(data.data || data);
      } else {
        const errorData = await response.json();
        notificationService.showError('Erro', errorData.message || 'Não foi possível carregar os detalhes');
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      notificationService.showError('Erro', 'Erro de conexão ao carregar detalhes');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!service || service.status !== 'EM_ANDAMENTO') return;

    try {
      setConfirming(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        notificationService.showError('Erro', 'Token de autenticação não encontrado');
        return;
      }

      const response = await fetch(API_ENDPOINTS.SERVICE_CONFIRM(service.id.toString()), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        notificationService.showSuccess('Sucesso', 'Serviço confirmado como concluído!');
        
        // Atualizar o status local
        setService(prev => prev ? { ...prev, status: 'CONCLUIDO' } : null);
        
        // Chamar callback se fornecido
        if (onConfirmCompletion) {
          onConfirmCompletion(service.id);
        }
      } else {
        const errorData = await response.json();
        notificationService.showError('Erro', errorData.message || 'Não foi possível confirmar a conclusão');
      }
    } catch (error) {
      console.error('Erro ao confirmar conclusão:', error);
      notificationService.showError('Erro', 'Erro de conexão ao confirmar conclusão');
    } finally {
      setConfirming(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'text-yellow-600 bg-yellow-100';
      case 'EM_ANDAMENTO': return 'text-blue-600 bg-blue-100';
      case 'CONCLUIDO': return 'text-green-600 bg-green-100';
      case 'CANCELADO': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  useEffect(() => {
    fetchServiceDetails();
  }, [serviceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Serviço não encontrado</h3>
          <p className="text-gray-500 mb-4">Não foi possível carregar os detalhes do serviço.</p>
          <button
            onClick={onBack}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Voltar
          </button>
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
            <div>
              <h1 className="text-lg font-bold">Detalhes do Serviço</h1>
              <p className="text-sm opacity-90">#{service.id}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
            {getStatusText(service.status)}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Service Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Informações do Serviço</h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Descrição</p>
              <p className="font-medium text-gray-900">{service.descricao}</p>
            </div>
            
            {service.categoria && (
              <div>
                <p className="text-sm text-gray-500">Categoria</p>
                <p className="font-medium text-gray-900">{service.categoria.nome}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Criado em</p>
                <p className="font-medium text-gray-900">{formatDate(service.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Atualizado em</p>
                <p className="font-medium text-gray-900">{formatDate(service.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Endereços</h2>
          
          <div className="space-y-4">
            {service.origem_endereco && (
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Origem</p>
                  <p className="text-sm text-gray-600">{service.origem_endereco}</p>
                  {service.origem_lat && service.origem_lng && (
                    <p className="text-xs text-gray-400">
                      {service.origem_lat.toFixed(6)}, {service.origem_lng.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {service.destino_endereco && (
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Destino</p>
                  <p className="text-sm text-gray-600">{service.destino_endereco}</p>
                  {service.destino_lat && service.destino_lng && (
                    <p className="text-xs text-gray-400">
                      {service.destino_lat.toFixed(6)}, {service.destino_lng.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Provider Info */}
        {service.prestador && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Prestador</h2>
            
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{service.prestador.usuario.nome}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-600">{service.prestador.usuario.telefone}</p>
                </div>
                <p className="text-sm text-gray-500">{service.prestador.usuario.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Detalhes do Pagamento</h2>
          
          {service.detalhes_valor ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Valor base:</span>
                <span className="font-medium">{formatCurrency(service.detalhes_valor.valor_base)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor por distância:</span>
                <span className="font-medium">{formatCurrency(service.detalhes_valor.valor_distancia)}</span>
              </div>
              {service.detalhes_valor.valor_adicional > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor adicional:</span>
                  <span className="font-medium">{formatCurrency(service.detalhes_valor.valor_adicional)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="font-bold text-green-600 text-lg">{formatCurrency(service.detalhes_valor.valor_total)}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Valor total:</span>
              <span className="font-bold text-green-600 text-lg">{formatCurrency(service.valor)}</span>
            </div>
          )}
        </div>

        {/* Rating */}
        {service.avaliacao && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Avaliação</h2>
            
            <div className="flex items-start space-x-3">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= service.avaliacao!.nota
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{service.avaliacao.nota}/5</p>
                {service.avaliacao.comentario && (
                  <p className="text-sm text-gray-600 mt-1">{service.avaliacao.comentario}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Avaliado em {formatDate(service.avaliacao.created_at)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tracking History */}
        {service.rastreamento && service.rastreamento.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Histórico de Rastreamento</h2>
            
            <div className="space-y-3">
              {service.rastreamento.map((track) => (
                <div key={track.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{track.status}</p>
                    <p className="text-sm text-gray-600">{track.endereco}</p>
                    <p className="text-xs text-gray-400">{formatDate(track.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {service.status === 'EM_ANDAMENTO' && service.prestador && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Ações</h2>
            <p className="text-sm text-gray-600 mb-4">
              O prestador finalizou o serviço. Confirme se tudo foi realizado conforme solicitado.
            </p>
            <button
              onClick={handleConfirmCompletion}
              disabled={confirming}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {confirming ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Confirmando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Confirmar Conclusão</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceDetailsScreen;
