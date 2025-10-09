// Utilitários para gerenciar o rastreamento de serviços
export interface ServiceTrackingState {
  serviceId: string;
  driverPosition: { lat: number; lng: number };
  progress: number;
  routeCoordinates: [number, number][];
  currentRouteIndex: number;
  estimatedTime: number;
  serviceStartTime: string;
  isServiceCompleted: boolean;
  destination: {
    address: string;
    lat: number;
    lng: number;
  };
  entregador: {
    nome: string;
    telefone: string;
    veiculo: string;
    placa: string;
    rating: number;
    tempoEstimado: string;
    distancia: string;
  };
  // Campos adicionais para melhor persistência
  lastUpdated?: string;
  originalOrigin?: { lat: number; lng: number };
}

export class ServiceTrackingManager {
  private static readonly ACTIVE_SERVICE_KEY = 'active_service_tracking';
  private static readonly SERVICE_HISTORY_KEY = 'service_tracking_history';

  // Salvar serviço ativo
  static saveActiveService(state: ServiceTrackingState): void {
    try {
      const stateToSave = {
        ...state,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.ACTIVE_SERVICE_KEY, JSON.stringify(stateToSave));
      console.log('✅ Serviço ativo salvo:', {
        id: state.serviceId,
        progress: Math.round(state.progress),
        routeIndex: state.currentRouteIndex,
        driverPosition: `${state.driverPosition.lat.toFixed(4)}, ${state.driverPosition.lng.toFixed(4)}`,
        completed: state.isServiceCompleted
      });
    } catch (error) {
      console.error('❌ Erro ao salvar serviço ativo:', error);
    }
  }

  // Carregar serviço ativo
  static loadActiveService(): ServiceTrackingState | null {
    try {
      const saved = localStorage.getItem(this.ACTIVE_SERVICE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        console.log('📋 Serviço ativo carregado:', {
          id: state.serviceId,
          progress: Math.round(state.progress || 0),
          routePoints: state.routeCoordinates?.length || 0,
          routeIndex: state.currentRouteIndex || 0,
          driverPosition: state.driverPosition ? `${state.driverPosition.lat.toFixed(4)}, ${state.driverPosition.lng.toFixed(4)}` : 'N/A',
          completed: state.isServiceCompleted,
          lastUpdated: state.lastUpdated
        });
        
        // Verificar se o serviço não está muito antigo (mais de 24 horas)
        if (state.lastUpdated) {
          const lastUpdate = new Date(state.lastUpdated);
          const now = new Date();
          const hoursDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff > 24) {
            console.log('⚠️ Serviço muito antigo, removendo...');
            this.clearActiveService();
            return null;
          }
        }
        
        // Validar integridade dos dados
        if (!state.serviceId || !state.driverPosition || !state.destination) {
          console.log('⚠️ Dados do serviço corrompidos, removendo...');
          this.clearActiveService();
          return null;
        }
        
        return state;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar serviço ativo:', error);
      // Limpar dados corrompidos
      this.clearActiveService();
    }
    return null;
  }

  // Verificar se existe serviço ativo
  static hasActiveService(): boolean {
    const activeService = this.loadActiveService();
    return activeService !== null && !activeService.isServiceCompleted;
  }

  // Finalizar serviço ativo
  static completeActiveService(): void {
    try {
      const activeService = this.loadActiveService();
      if (activeService) {
        // Marcar como concluído
        const completedService = {
          ...activeService,
          isServiceCompleted: true,
          completedAt: new Date().toISOString(),
          progress: 100
        };
        
        // Mover para histórico
        this.addToHistory(completedService);
        
        // Remover serviço ativo
        this.clearActiveService();
        console.log('🎉 Serviço finalizado e movido para histórico');
      }
    } catch (error) {
      console.error('❌ Erro ao finalizar serviço:', error);
    }
  }

  // Adicionar ao histórico
  private static addToHistory(service: ServiceTrackingState): void {
    try {
      const history = this.getServiceHistory();
      const completedService = {
        ...service,
        isServiceCompleted: true,
        completedAt: new Date().toISOString()
      };
      
      history.unshift(completedService);
      
      // Manter apenas os últimos 10 serviços
      const limitedHistory = history.slice(0, 10);
      
      localStorage.setItem(this.SERVICE_HISTORY_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('❌ Erro ao adicionar ao histórico:', error);
    }
  }

  // Obter histórico de serviços
  static getServiceHistory(): any[] {
    try {
      const saved = localStorage.getItem(this.SERVICE_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
      return [];
    }
  }

  // Limpar serviço ativo apenas
  static clearActiveService(): void {
    localStorage.removeItem(this.ACTIVE_SERVICE_KEY);
    console.log('🧹 Serviço ativo removido');
  }

  // Limpar todos os dados
  static clearAllData(): void {
    localStorage.removeItem(this.ACTIVE_SERVICE_KEY);
    localStorage.removeItem(this.SERVICE_HISTORY_KEY);
    console.log('🧹 Todos os dados de rastreamento limpos');
  }

  // Forçar reset do serviço ativo (para debug)
  static resetActiveService(): void {
    console.log('🔄 Forçando reset do serviço ativo...');
    this.clearActiveService();
  }

  // Gerar ID único para serviço
  static generateServiceId(): string {
    return `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
