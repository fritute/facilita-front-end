// Serviço centralizado para chamadas de API
import { API_ENDPOINTS } from '../config/constants'
import { notificationService } from './notificationService'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json()
      
      if (!response.ok) {
        // Tratar diferentes tipos de erro
        switch (response.status) {
          case 401:
            notificationService.showError('Sessão expirada', 'Faça login novamente.')
            localStorage.removeItem('authToken')
            localStorage.removeItem('userData')
            break
          case 403:
            notificationService.showError('Acesso negado', 'Você não tem permissão para esta ação.')
            break
          case 404:
            notificationService.showError('Não encontrado', 'Recurso não encontrado.')
            break
          case 409:
            notificationService.showError('Conflito', data.message || 'Recurso já existe.')
            break
          case 500:
            notificationService.showError('Erro do servidor', 'Erro interno. Tente novamente mais tarde.')
            break
          default:
            notificationService.showError('Erro', data.message || 'Erro inesperado.')
        }
        
        return {
          success: false,
          error: data.message || 'Erro na requisição',
          data: data
        }
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message
      }
    } catch (error) {
      notificationService.showError('Erro de rede', 'Verifique sua conexão com a internet.')
      return {
        success: false,
        error: 'Erro de rede'
      }
    }
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        error: 'Erro de conexão'
      }
    }
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined
      })
      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        error: 'Erro de conexão'
      }
    }
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined
      })
      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        error: 'Erro de conexão'
      }
    }
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        error: 'Erro de conexão'
      }
    }
  }

  async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined
      })
      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        error: 'Erro de conexão'
      }
    }
  }
}

// Métodos específicos para cada endpoint da API
export class FacilitaApiService extends ApiService {
  
  // === AUTENTICAÇÃO ===
  async login(email: string, senha: string) {
    return this.post(API_ENDPOINTS.LOGIN, { email, senha })
  }

  async register(userData: any) {
    return this.post(API_ENDPOINTS.REGISTER, userData)
  }

  async updateProfile(profileData: any) {
    return this.put(API_ENDPOINTS.UPDATE_PROFILE, profileData)
  }

  async changePassword(passwordData: any) {
    return this.post(API_ENDPOINTS.CHANGE_PASSWORD, passwordData)
  }

  async recoverPassword(contact: string) {
    return this.post(API_ENDPOINTS.RECOVER_PASSWORD, { contact })
  }

  async verifyCode(code: string, token: string) {
    return this.post(API_ENDPOINTS.VERIFY_CODE, { code, token })
  }

  async resetPassword(newPassword: string, token: string) {
    return this.post(API_ENDPOINTS.RESET_PASSWORD, { newPassword, token })
  }

  // === CONTRATANTE ===
  async registerContratante(contratanteData: any) {
    return this.post(API_ENDPOINTS.CONTRATANTE_REGISTER, contratanteData)
  }

  async getContratanteById(id: string) {
    return this.get(API_ENDPOINTS.CONTRATANTE_BY_ID(id))
  }

  async getContratanteByUserId(userId: string) {
    return this.get(API_ENDPOINTS.CONTRATANTE_BY_USER_ID(userId))
  }

  // === PRESTADORES ===
  async getPrestadores() {
    return this.get(API_ENDPOINTS.PRESTADORES)
  }

  async getPrestadorById(id: string) {
    return this.get(API_ENDPOINTS.PRESTADOR_BY_ID(id))
  }

  // === SERVIÇOS ===
  async createService(serviceData: any) {
    return this.post(API_ENDPOINTS.SERVICES, serviceData)
  }

  async createServiceFromCategory(categoryId: number, serviceData: any) {
    return this.post(API_ENDPOINTS.SERVICE_FROM_CATEGORY(categoryId), serviceData)
  }

  async getServiceById(id: string) {
    return this.get(API_ENDPOINTS.SERVICE_BY_ID(id))
  }

  async getServicesByContratante(contratanteId: string) {
    return this.get(API_ENDPOINTS.SERVICES_BY_CONTRATANTE(contratanteId))
  }

  async getAvailableServices() {
    return this.get(`${API_ENDPOINTS.SERVICES}/disponiveis`)
  }

  async acceptService(serviceId: string) {
    return this.post(`${API_ENDPOINTS.SERVICE_BY_ID(serviceId)}/aceitar`)
  }

  async finishService(serviceId: string) {
    return this.post(`${API_ENDPOINTS.SERVICE_BY_ID(serviceId)}/finalizar`)
  }

  async confirmService(serviceId: string) {
    return this.post(`${API_ENDPOINTS.SERVICE_BY_ID(serviceId)}/confirmar`)
  }

  // === CATEGORIAS ===
  async getCategories() {
    return this.get(API_ENDPOINTS.CATEGORIES)
  }

  // === AVALIAÇÕES ===
  async createRating(ratingData: any) {
    return this.post(API_ENDPOINTS.RATINGS, ratingData)
  }

  async getRatingsByPrestador(prestadorId: string) {
    return this.get(`${API_ENDPOINTS.RATINGS}/prestador/${prestadorId}`)
  }

  async getRatingByService(serviceId: string) {
    return this.get(`${API_ENDPOINTS.RATINGS}/servico/${serviceId}`)
  }

  // === CARTEIRA ===
  async createWallet(walletData: any) {
    return this.post(API_ENDPOINTS.WALLET, walletData)
  }

  async getMyWallet() {
    return this.get(API_ENDPOINTS.MY_WALLET)
  }

  async getWalletById(id: string) {
    return this.get(API_ENDPOINTS.WALLET_BY_ID(id))
  }

  async requestRecharge(rechargeData: any) {
    return this.post(API_ENDPOINTS.WALLET_RECHARGE, rechargeData)
  }

  async getWalletTransactions(walletId: string) {
    return this.get(API_ENDPOINTS.WALLET_TRANSACTIONS(walletId))
  }

  async createTransaction(transactionData: any) {
    return this.post(API_ENDPOINTS.CREATE_TRANSACTION, transactionData)
  }

  // === PAGAMENTOS ===
  async payWithWallet(paymentData: any) {
    return this.post(`${API_ENDPOINTS.SERVICES}/pagar`, paymentData)
  }

  async payWithPagBank(paymentData: any) {
    return this.post(API_ENDPOINTS.PAGBANK_PAYMENT, paymentData)
  }

  // === CHAT ===
  async sendMessage(serviceId: string, messageData: any) {
    return this.post(`${API_ENDPOINTS.SERVICES}/${serviceId}/chat/enviar`, messageData)
  }

  async getMessages(serviceId: string) {
    return this.get(`${API_ENDPOINTS.SERVICES}/${serviceId}/chat/mensagens`)
  }

  async markMessagesAsRead(serviceId: string) {
    return this.patch(`${API_ENDPOINTS.SERVICES}/${serviceId}/chat/marcar-lidas`)
  }

  // === NOTIFICAÇÕES ===
  async getNotifications() {
    return this.get(`${API_ENDPOINTS.SERVICES.replace('/servico', '')}/notificacao`)
  }

  async markNotificationAsRead(notificationId: string) {
    return this.patch(`${API_ENDPOINTS.SERVICES.replace('/servico', '')}/notificacao/${notificationId}/marcar-lida`)
  }

  async markAllNotificationsAsRead() {
    return this.patch(`${API_ENDPOINTS.SERVICES.replace('/servico', '')}/notificacao/marcar-todas-lidas`)
  }
}

export const facilitaApi = new FacilitaApiService()
export default facilitaApi
