// Serviço para gerenciar o fluxo completo de serviços conforme documentação da API
import { facilitaApi } from './apiService'
import { notificationService } from './notificationService'

export interface ServiceData {
  id?: number
  categoria_id: number
  descricao: string
  id_localizacao_origem: number
  id_localizacao_destino: number
  pontos_parada?: Array<{
    id_localizacao: number
    descricao: string
  }>
  valor?: number
  status?: 'PENDENTE' | 'EM_ANDAMENTO' | 'AGUARDANDO_CONFIRMACAO' | 'FINALIZADO' | 'CANCELADO'
  id_contratante?: number
  id_prestador?: number
  data_criacao?: string
  data_aceite?: string
  data_finalizacao?: string
}

export interface ServiceFlowResult {
  success: boolean
  data?: any
  message?: string
  nextStep?: string
}

class ServiceFlowService {
  
  /**
   * 1. Criar serviço (Contratante)
   * Status inicial: PENDENTE
   */
  async createService(serviceData: ServiceData): Promise<ServiceFlowResult> {
    try {
      const response = await facilitaApi.createService(serviceData)
      
      if (response.success) {
        notificationService.showSuccess(
          'Serviço criado',
          'Seu serviço foi criado e está disponível para prestadores.'
        )
        
        return {
          success: true,
          data: response.data,
          nextStep: 'waiting-driver', // Próximo passo: aguardar prestador
          message: 'Serviço criado com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao criar serviço'
      }
    } catch (error) {
      notificationService.showError('Erro', 'Falha ao criar serviço')
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 2. Criar serviço por categoria pré-definida
   */
  async createServiceFromCategory(categoryId: number, serviceData: Omit<ServiceData, 'categoria_id'>): Promise<ServiceFlowResult> {
    try {
      const response = await facilitaApi.createServiceFromCategory(categoryId, serviceData)
      
      if (response.success) {
        notificationService.showSuccess(
          'Serviço criado',
          'Seu serviço foi criado e está disponível para prestadores.'
        )
        
        return {
          success: true,
          data: response.data,
          nextStep: 'waiting-driver',
          message: 'Serviço criado com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao criar serviço'
      }
    } catch (error) {
      notificationService.showError('Erro', 'Falha ao criar serviço')
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 3. Listar serviços disponíveis (Prestador)
   */
  async getAvailableServices(): Promise<ServiceFlowResult> {
    try {
      const response = await facilitaApi.getAvailableServices()
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Serviços carregados com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao carregar serviços'
      }
    } catch (error) {
      notificationService.showError('Erro', 'Falha ao carregar serviços disponíveis')
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 4. Aceitar serviço (Prestador)
   * Status: PENDENTE → EM_ANDAMENTO
   */
  async acceptService(serviceId: string): Promise<ServiceFlowResult> {
    try {
      const response = await facilitaApi.acceptService(serviceId)
      
      if (response.success) {
        notificationService.showSuccess(
          'Serviço aceito',
          'Você aceitou o serviço. O contratante foi notificado.'
        )
        
        return {
          success: true,
          data: response.data,
          nextStep: 'service-execution', // Próximo: executar serviço
          message: 'Serviço aceito com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao aceitar serviço'
      }
    } catch (error) {
      notificationService.showError('Erro', 'Falha ao aceitar serviço')
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 5. Finalizar serviço (Prestador)
   * Status: EM_ANDAMENTO → AGUARDANDO_CONFIRMACAO
   */
  async finishService(serviceId: string): Promise<ServiceFlowResult> {
    try {
      const response = await facilitaApi.finishService(serviceId)
      
      if (response.success) {
        notificationService.showSuccess(
          'Serviço finalizado',
          'Serviço marcado como finalizado. Aguardando confirmação do contratante.'
        )
        
        return {
          success: true,
          data: response.data,
          nextStep: 'waiting-confirmation', // Próximo: aguardar confirmação
          message: 'Serviço finalizado com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao finalizar serviço'
      }
    } catch (error) {
      notificationService.showError('Erro', 'Falha ao finalizar serviço')
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 6. Confirmar conclusão (Contratante)
   * Status: AGUARDANDO_CONFIRMACAO → FINALIZADO
   */
  async confirmService(serviceId: string): Promise<ServiceFlowResult> {
    try {
      const response = await facilitaApi.confirmService(serviceId)
      
      if (response.success) {
        notificationService.showSuccess(
          'Serviço confirmado',
          'Serviço confirmado como concluído. Pagamento será processado.'
        )
        
        return {
          success: true,
          data: response.data,
          nextStep: 'payment', // Próximo: processar pagamento
          message: 'Serviço confirmado com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao confirmar serviço'
      }
    } catch (error) {
      notificationService.showError('Erro', 'Falha ao confirmar serviço')
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 7. Processar pagamento com carteira
   */
  async payServiceWithWallet(serviceId: string): Promise<ServiceFlowResult> {
    try {
      const response = await facilitaApi.payWithWallet({ id_servico: serviceId })
      
      if (response.success) {
        notificationService.showSuccess(
          'Pagamento realizado',
          'Pagamento processado com sucesso via carteira digital.'
        )
        
        return {
          success: true,
          data: response.data,
          nextStep: 'rating', // Próximo: avaliar serviço (opcional)
          message: 'Pagamento realizado com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao processar pagamento'
      }
    } catch (error) {
      notificationService.showError('Erro', 'Falha ao processar pagamento')
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 8. Avaliar serviço (Opcional)
   */
  async rateService(serviceId: string, rating: number, comment?: string): Promise<ServiceFlowResult> {
    try {
      const ratingData = {
        id_servico: serviceId,
        nota: rating,
        comentario: comment || ''
      }
      
      const response = await facilitaApi.createRating(ratingData)
      
      if (response.success) {
        notificationService.showSuccess(
          'Avaliação enviada',
          'Sua avaliação foi registrada com sucesso.'
        )
        
        return {
          success: true,
          data: response.data,
          nextStep: 'completed', // Fluxo completo
          message: 'Avaliação enviada com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao enviar avaliação'
      }
    } catch (error) {
      notificationService.showError('Erro', 'Falha ao enviar avaliação')
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * Verificar status do serviço
   */
  async getServiceStatus(serviceId: string): Promise<ServiceFlowResult> {
    try {
      const response = await facilitaApi.getServiceById(serviceId)
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Status obtido com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao verificar status'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * Obter próximo passo baseado no status atual
   */
  getNextStepByStatus(status: string, userType: 'CONTRATANTE' | 'PRESTADOR'): string {
    switch (status) {
      case 'PENDENTE':
        return userType === 'CONTRATANTE' ? 'waiting-driver' : 'available-services'
      
      case 'EM_ANDAMENTO':
        return userType === 'PRESTADOR' ? 'service-execution' : 'service-tracking'
      
      case 'AGUARDANDO_CONFIRMACAO':
        return userType === 'CONTRATANTE' ? 'service-confirmation' : 'waiting-confirmation'
      
      case 'FINALIZADO':
        return 'payment'
      
      case 'CANCELADO':
        return 'home'
      
      default:
        return 'home'
    }
  }

  /**
   * Fluxo completo automatizado para contratante
   */
  async executeContratanteFlow(serviceData: ServiceData): Promise<ServiceFlowResult> {
    // 1. Criar serviço
    const createResult = await this.createService(serviceData)
    
    if (!createResult.success) {
      return createResult
    }
    
    // Retornar com próximo passo para aguardar prestador
    return {
      success: true,
      data: createResult.data,
      nextStep: 'waiting-driver',
      message: 'Serviço criado. Aguardando prestador aceitar.'
    }
  }

  /**
   * Fluxo completo automatizado para prestador
   */
  async executePrestadorFlow(serviceId: string): Promise<ServiceFlowResult> {
    // 1. Aceitar serviço
    const acceptResult = await this.acceptService(serviceId)
    
    if (!acceptResult.success) {
      return acceptResult
    }
    
    // Retornar com próximo passo para executar serviço
    return {
      success: true,
      data: acceptResult.data,
      nextStep: 'service-execution',
      message: 'Serviço aceito. Inicie a execução.'
    }
  }
}

export const serviceFlowService = new ServiceFlowService()
export default serviceFlowService
