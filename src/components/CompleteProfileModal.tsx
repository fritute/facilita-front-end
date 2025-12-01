import React from 'react'
import { User, X, CheckCircle } from 'lucide-react'

interface CompleteProfileModalProps {
  isOpen: boolean
  onComplete: () => void
  onSkip: () => void
  userName: string
}

const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({ 
  isOpen, 
  onComplete, 
  onSkip, 
  userName 
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Complete seu perfil</h2>
          <p className="text-green-100 text-sm">
            Olá, {userName}! 👋
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-700 mb-4">
              Para ter a melhor experiência no Facilita, precisamos de algumas informações adicionais.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Informações necessárias:
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  <strong>CPF</strong> para identificação
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  <strong>Tipo de necessidade</strong> (idoso, mobilidade, etc.)
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Endereço (opcional)
                </li>
              </ul>
              
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                📝 <strong>Dados enviados:</strong> CPF, necessidade e ID de localização
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Isso nos ajuda a conectar você com os melhores prestadores da sua região.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onComplete}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Completar perfil agora
            </button>
            
            <button
              onClick={onSkip}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5 mr-2" />
              Pular por enquanto
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            Você pode completar seu perfil a qualquer momento nas configurações.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CompleteProfileModal
