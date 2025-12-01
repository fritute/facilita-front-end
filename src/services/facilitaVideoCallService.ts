import { facilitaApi } from './apiService'

export interface FacilitaVideoCallResponse {
  success: boolean
  data?: {
    id_chamada?: string
    url_chamada?: string
    room_name?: string
    token_acesso?: string
    sala?: string
    token?: string
  }
  message?: string
}

export interface FacilitaVideoCallRequest {
  idServico: number
  usuarioId: number
}

class FacilitaVideoCallService {
  async createVideoCall(serviceId: number, userId: number): Promise<FacilitaVideoCallResponse> {
    try {
      console.log('📹 Criando videochamada via API Facilita...')
      
      const requestData: FacilitaVideoCallRequest = {
        idServico: serviceId,
        usuarioId: userId
      }

      const response = await facilitaApi.createVideoCall(requestData)
      console.log('📥 Resposta bruta da API:', response)
      
      // Se a resposta já tem a estrutura esperada
      if (response && typeof response === 'object') {
        // Se a resposta tem sucesso explícito
        if (response.success || response.data || response.sala) {
          // Normalizar a resposta para nossa estrutura
          const sala = response.sala || response.data?.sala
          const token = response.token || response.data?.token
          
          const normalizedResponse: FacilitaVideoCallResponse = {
            success: true,
            data: {
              // Mapear diferentes campos possíveis
              sala: sala,
              token: token,
              // Gerar URL correta usando a sala e token
              url_chamada: sala ? `https://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net/v1/facilita/chamada/video?sala=${sala}&token=${token}` : (response.url_chamada || response.data?.url_chamada),
              room_name: response.room_name || response.data?.room_name,
              id_chamada: response.id_chamada || response.data?.id_chamada,
              token_acesso: response.token_acesso || response.data?.token_acesso
            }
          }
          console.log('✅ Resposta normalizada:', normalizedResponse)
          return normalizedResponse
        }
      }
      
      // Se chegou aqui, a resposta não tem a estrutura esperada
      console.error('❌ Estrutura de resposta inesperada:', response)
      return {
        success: false,
        message: 'Estrutura de resposta inválida'
      }
    } catch (error: any) {
      console.error('❌ Erro na chamada da API de videochamada:', error)
      return {
        success: false,
        message: error.message || 'Erro de conexão com o servidor'
      }
    }
  }

  async createVoiceCall(serviceId: number, userId: number): Promise<FacilitaVideoCallResponse> {
    try {
      console.log('📞 Criando chamada de voz via API Facilita...')
      
      const requestData: FacilitaVideoCallRequest = {
        idServico: serviceId,
        usuarioId: userId
      }

      const response = await facilitaApi.createVoiceCall(requestData) as FacilitaVideoCallResponse
      
      if (response.success) {
        console.log('✅ Chamada de voz criada com sucesso:', response.data)
        return response
      } else {
        console.error('❌ Erro ao criar chamada de voz:', response.message)
        return {
          success: false,
          message: response.message || 'Erro ao criar chamada de voz'
        }
      }
    } catch (error: any) {
      console.error('❌ Erro na chamada da API de chamada de voz:', error)
      return {
        success: false,
        message: error.message || 'Erro de conexão com o servidor'
      }
    }
  }

  // Método para gerar URL de videochamada usando a API do Facilita
  generateVideoCallUrl(roomName: string): string {
    return `https://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net/v1/facilita/chamada/video/${roomName}`
  }

  // Método para gerar URL de videochamada a partir do campo 'sala' usando a API do Facilita
  generateVideoCallUrlFromSala(sala: string): string {
    return `https://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net/v1/facilita/chamada/video/${sala}`
  }

  // Método para validar se a resposta da API contém os dados necessários
  validateVideoCallResponse(response: FacilitaVideoCallResponse): boolean {
    return !!(
      response.success &&
      response.data &&
      (response.data.url_chamada || response.data.room_name || response.data.sala)
    )
  }
}

export const facilitaVideoCallService = new FacilitaVideoCallService()
export default facilitaVideoCallService
