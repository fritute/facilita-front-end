// Serviço para gerenciar sistema de avaliações
import { facilitaApi } from './apiService'
import { notificationService } from './notificationService'

export interface Rating {
  id: number
  id_servico: number
  id_contratante: number
  id_prestador: number
  nota: number // 1-5
  comentario: string
  data_criacao: string
  servico?: {
    id: number
    descricao: string
    valor: number
    data_criacao: string
  }
  contratante?: {
    id: number
    usuario: {
      nome: string
      foto_perfil: string | null
    }
  }
  prestador?: {
    id: number
    usuario: {
      nome: string
      foto_perfil: string | null
    }
  }
}

export interface RatingStats {
  media_geral: number
  total_avaliacoes: number
  distribuicao: {
    estrela_1: number
    estrela_2: number
    estrela_3: number
    estrela_4: number
    estrela_5: number
  }
}

export interface RatingServiceResult {
  success: boolean
  data?: any
  message?: string
}

class RatingService {
  
  /**
   * 1. Criar avaliação para um serviço
   */
  async createRating(serviceId: string | number, nota: number, comentario: string = ''): Promise<RatingServiceResult> {
    try {
      // Validar nota
      if (nota < 1 || nota > 5) {
        notificationService.showError('Avaliação inválida', 'A nota deve ser entre 1 e 5 estrelas.')
        return {
          success: false,
          message: 'Nota inválida'
        }
      }

      const ratingData = {
        id_servico: Number(serviceId),
        nota,
        comentario: comentario.trim()
      }
      
      const response = await facilitaApi.createRating(ratingData)
      
      if (response.success) {
        notificationService.showSuccess(
          'Avaliação enviada',
          'Sua avaliação foi registrada com sucesso!'
        )
        
        return {
          success: true,
          data: response.data,
          message: 'Avaliação criada com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao criar avaliação'
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
   * 2. Buscar avaliações de um prestador
   */
  async getPrestadorRatings(prestadorId: string): Promise<RatingServiceResult> {
    try {
      const response = await facilitaApi.getRatingsByPrestador(prestadorId)
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Avaliações carregadas com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao carregar avaliações'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 3. Buscar avaliação de um serviço específico
   */
  async getServiceRating(serviceId: string): Promise<RatingServiceResult> {
    try {
      const response = await facilitaApi.getRatingByService(serviceId)
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Avaliação carregada com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao carregar avaliação'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 4. Calcular estatísticas de avaliações
   */
  calculateRatingStats(ratings: Rating[]): RatingStats {
    if (ratings.length === 0) {
      return {
        media_geral: 0,
        total_avaliacoes: 0,
        distribuicao: {
          estrela_1: 0,
          estrela_2: 0,
          estrela_3: 0,
          estrela_4: 0,
          estrela_5: 0
        }
      }
    }

    const totalNotas = ratings.reduce((sum, rating) => sum + rating.nota, 0)
    const mediaGeral = totalNotas / ratings.length

    const distribuicao = {
      estrela_1: ratings.filter(r => r.nota === 1).length,
      estrela_2: ratings.filter(r => r.nota === 2).length,
      estrela_3: ratings.filter(r => r.nota === 3).length,
      estrela_4: ratings.filter(r => r.nota === 4).length,
      estrela_5: ratings.filter(r => r.nota === 5).length
    }

    return {
      media_geral: Math.round(mediaGeral * 10) / 10, // Arredondar para 1 casa decimal
      total_avaliacoes: ratings.length,
      distribuicao
    }
  }

  /**
   * 5. Validar se pode avaliar serviço
   */
  canRateService(serviceStatus: string, userType: 'CONTRATANTE' | 'PRESTADOR'): { canRate: boolean; reason?: string } {
    // Apenas contratantes podem avaliar serviços
    if (userType !== 'CONTRATANTE') {
      return {
        canRate: false,
        reason: 'Apenas contratantes podem avaliar serviços'
      }
    }

    // Serviço deve estar finalizado
    if (serviceStatus !== 'FINALIZADO') {
      return {
        canRate: false,
        reason: 'Serviço deve estar finalizado para ser avaliado'
      }
    }

    return { canRate: true }
  }

  /**
   * 6. Obter texto descritivo da nota
   */
  getRatingDescription(nota: number): string {
    switch (nota) {
      case 1:
        return 'Muito ruim'
      case 2:
        return 'Ruim'
      case 3:
        return 'Regular'
      case 4:
        return 'Bom'
      case 5:
        return 'Excelente'
      default:
        return 'Sem avaliação'
    }
  }

  /**
   * 7. Obter cor da estrela baseada na nota
   */
  getStarColor(nota: number): string {
    if (nota >= 4.5) return 'text-green-500'
    if (nota >= 3.5) return 'text-yellow-500'
    if (nota >= 2.5) return 'text-orange-500'
    return 'text-red-500'
  }

  /**
   * 8. Formatar data da avaliação
   */
  formatRatingDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return 'Hoje'
    } else if (diffInDays === 1) {
      return 'Ontem'
    } else if (diffInDays < 7) {
      return `${diffInDays} dias atrás`
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7)
      return `${weeks} semana${weeks > 1 ? 's' : ''} atrás`
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  }

  /**
   * 9. Gerar componente de estrelas (para uso em React)
   */
  generateStarRating(nota: number): {
    stars: Array<{ filled: boolean; half: boolean }>
    rating: number
  } {
    const stars = []
    const fullStars = Math.floor(nota)
    const hasHalfStar = nota % 1 >= 0.5

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push({ filled: true, half: false })
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push({ filled: false, half: true })
      } else {
        stars.push({ filled: false, half: false })
      }
    }

    return {
      stars,
      rating: nota
    }
  }

  /**
   * 10. Validar comentário
   */
  validateComment(comentario: string): { valid: boolean; error?: string } {
    const trimmed = comentario.trim()
    
    if (trimmed.length > 500) {
      return {
        valid: false,
        error: 'Comentário muito longo. Máximo 500 caracteres.'
      }
    }

    // Verificar palavras ofensivas (lista básica)
    const offensiveWords = ['idiota', 'burro', 'lixo', 'merda']
    const hasOffensiveWord = offensiveWords.some(word => 
      trimmed.toLowerCase().includes(word.toLowerCase())
    )

    if (hasOffensiveWord) {
      return {
        valid: false,
        error: 'Comentário contém linguagem inadequada.'
      }
    }

    return { valid: true }
  }

  /**
   * 11. Obter resumo de avaliações para prestador
   */
  async getPrestadorRatingSummary(prestadorId: string): Promise<RatingServiceResult> {
    try {
      const ratingsResponse = await this.getPrestadorRatings(prestadorId)
      
      if (!ratingsResponse.success) {
        return ratingsResponse
      }

      const ratings = ratingsResponse.data as Rating[]
      const stats = this.calculateRatingStats(ratings)
      
      // Pegar as 3 avaliações mais recentes
      const recentRatings = ratings
        .sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime())
        .slice(0, 3)

      return {
        success: true,
        data: {
          stats,
          recentRatings,
          totalRatings: ratings.length
        },
        message: 'Resumo de avaliações carregado com sucesso'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao carregar resumo de avaliações'
      }
    }
  }

  /**
   * 12. Verificar se serviço já foi avaliado
   */
  async checkIfServiceRated(serviceId: string): Promise<RatingServiceResult> {
    try {
      const response = await this.getServiceRating(serviceId)
      
      return {
        success: true,
        data: {
          hasRating: response.success,
          rating: response.success ? response.data : null
        },
        message: response.success ? 'Serviço já foi avaliado' : 'Serviço ainda não foi avaliado'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao verificar avaliação'
      }
    }
  }
}

export const ratingService = new RatingService()
export default ratingService
