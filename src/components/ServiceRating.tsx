// ServiceRating.tsx - Tela de avaliação do serviço
import React, { useState } from 'react'
import { ArrowLeft, Star, MessageSquare, Clock, CheckCircle, Home } from 'lucide-react'

interface ServiceRatingProps {
  onBack: () => void
  onFinish: () => void
  entregador: {
    nome: string
    telefone: string
    veiculo: string
    placa: string
    rating: number
    tempoEstimado: string
    distancia: string
  }
  serviceCompletionTime?: Date
  serviceStartTime?: Date
}

const ServiceRating: React.FC<ServiceRatingProps> = ({ 
  onBack, 
  onFinish, 
  entregador, 
  serviceCompletionTime,
  serviceStartTime 
}) => {
  const [rating, setRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [comment, setComment] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calcular duração do serviço
  const getServiceDuration = () => {
    if (!serviceStartTime || !serviceCompletionTime) return 'N/A'
    
    const duration = Math.floor((serviceCompletionTime.getTime() - serviceStartTime.getTime()) / 1000)
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    
    if (minutes > 0) {
      return `${minutes}min ${seconds}s`
    }
    return `${seconds}s`
  }

  // Formatar horário
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  // Submeter avaliação
  const handleSubmitRating = async () => {
    if (rating === 0) {
      alert('Por favor, selecione uma avaliação de 1 a 5 estrelas')
      return
    }

    setIsSubmitting(true)

    try {
      // Simular envio da avaliação para API
      console.log('📝 Enviando avaliação:', {
        prestador: entregador.nome,
        rating,
        comment,
        completionTime: serviceCompletionTime,
        duration: getServiceDuration()
      })

      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 2000))

      console.log('✅ Avaliação enviada com sucesso!')
      
      // Finalizar e voltar para home
      onFinish()
      
    } catch (error) {
      console.error('❌ Erro ao enviar avaliação:', error)
      alert('Erro ao enviar avaliação. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
          <h1 className="text-lg font-bold">Serviço Concluído!</h1>
          <p className="text-sm opacity-90 mt-1">Avalie sua experiência</p>
        </div>
      </div>

      {/* Success Animation */}
      <div className="bg-white p-6 text-center border-b">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Serviço realizado com sucesso!
        </h2>
        <p className="text-gray-600 text-sm">
          O prestador chegou ao destino e o serviço foi finalizado automaticamente
        </p>
      </div>

      {/* Service Summary */}
      <div className="bg-white p-4 border-b">
        <h3 className="font-semibold text-gray-800 mb-3">Resumo do Serviço</h3>
        
        <div className="space-y-2 text-sm">
          {serviceStartTime && (
            <div className="flex justify-between">
              <span className="text-gray-600">Início:</span>
              <span className="font-medium">{formatTime(serviceStartTime)}</span>
            </div>
          )}
          
          {serviceCompletionTime && (
            <div className="flex justify-between">
              <span className="text-gray-600">Conclusão:</span>
              <span className="font-medium">{formatTime(serviceCompletionTime)}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-600">Duração:</span>
            <span className="font-medium">{getServiceDuration()}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Prestador:</span>
            <span className="font-medium">{entregador.nome}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Veículo:</span>
            <span className="font-medium">{entregador.veiculo} - {entregador.placa}</span>
          </div>
        </div>
      </div>

      {/* Rating Section */}
      <div className="flex-1 bg-white p-6">
        <div className="max-w-md mx-auto">
          {/* Provider Info */}
          <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <img 
              src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" 
              alt={entregador.nome}
              className="w-16 h-16 rounded-full border-2 border-gray-200"
            />
            <div className="flex-1">
              <h3 className="font-bold text-lg">{entregador.nome}</h3>
              <div className="flex items-center space-x-1 mt-1">
                <span className="text-sm text-gray-600">{entregador.rating}</span>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-gray-500">• {entregador.veiculo}</span>
              </div>
            </div>
          </div>

          {/* Rating Stars */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-4">Como foi o atendimento?</h3>
            <div className="flex justify-center space-x-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star 
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              {rating === 0 && 'Toque nas estrelas para avaliar'}
              {rating === 1 && 'Muito ruim'}
              {rating === 2 && 'Ruim'}
              {rating === 3 && 'Regular'}
              {rating === 4 && 'Bom'}
              {rating === 5 && 'Excelente'}
            </p>
          </div>

          {/* Comment Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentário (opcional)
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Conte como foi sua experiência..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={4}
                maxLength={500}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 caracteres
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSubmitRating}
              disabled={rating === 0 || isSubmitting}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                rating === 0 || isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Enviando avaliação...</span>
                </div>
              ) : (
                'Enviar Avaliação'
              )}
            </button>

            <button
              onClick={onFinish}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Pular e Ir para Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceRating
