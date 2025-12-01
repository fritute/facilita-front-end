import { facilitaApi } from './apiService'

export interface FacilitaVideoCallResponse {
  success: boolean
  data?: {
    id_chamada?: string
    url_chamada?: string
    room_name?: string
    token_acesso?: string
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

      const response = await facilitaApi.createVideoCall(requestData) as FacilitaVideoCallResponse
      
      if (response.success) {
        console.log('✅ Videochamada criada com sucesso:', response.data)
        return response
      } else {
        console.error('❌ Erro ao criar videochamada:', response.message)
        return {
          success: false,
          message: response.message || 'Erro ao criar videochamada'
        }
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

  // Método para gerar URL de videochamada se a API retornar room_name
  generateVideoCallUrl(roomName: string): string {
    return `https://facilita-app.daily.co/${roomName}`
  }

  // Método para validar se a resposta da API contém os dados necessários
  validateVideoCallResponse(response: FacilitaVideoCallResponse): boolean {
    return !!(
      response.success &&
      response.data &&
      (response.data.url_chamada || response.data.room_name)
    )
  }
}

export const facilitaVideoCallService = new FacilitaVideoCallService()
export default facilitaVideoCallService
