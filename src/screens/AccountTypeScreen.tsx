import React from 'react'
import { ArrowLeft } from 'lucide-react'
import friendlyGuyAvatar from '../assets/images/undraw_friendly-guy-avatar_dqp5 3.png'

interface AccountTypeScreenProps {
  selectedAccountType: 'CONTRATANTE' | 'PRESTADOR' | null
  setSelectedAccountType: (type: 'CONTRATANTE' | 'PRESTADOR') => void
  onBack: () => void
  onSubmit: () => void
  isLoading: boolean
  isTransitioning: boolean
}

const AccountTypeScreen: React.FC<AccountTypeScreenProps> = ({
  selectedAccountType,
  setSelectedAccountType,
  onBack,
  onSubmit,
  isLoading,
  isTransitioning
}) => {
  return (
    <div className={`min-h-screen bg-gray-100 flex flex-col transition-all duration-300 ${
      isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
    }`}>
      <div className="bg-green-500 text-white p-4 md:p-6 text-center relative">
        <button
          onClick={onBack}
          className="absolute left-4 top-4 md:left-6 md:top-6 text-white hover:text-gray-200"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg md:text-2xl font-bold px-4">Qual tipo de conta deseja criar?</h1>
        <p className="text-green-100 mt-2 text-sm md:text-base px-4">Escolha a opção que mais combina com seu perfil.</p>
      </div>

      <div className="flex-1 flex flex-col justify-center p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto w-full">
          <div
            onClick={() => setSelectedAccountType('CONTRATANTE')}
            className={`bg-white rounded-lg p-6 md:p-8 shadow-md cursor-pointer transition-all hover:shadow-lg ${
              selectedAccountType === 'CONTRATANTE' ? 'ring-2 ring-green-500 bg-green-50' : ''
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-green-100 rounded-lg flex items-center justify-center p-2 overflow-hidden">
                <img 
                  src={friendlyGuyAvatar} 
                  alt="Contratante" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Contratante</h3>
                <p className="text-sm md:text-base text-gray-600">
                  Quero contratar prestadores de serviço para minhas necessidades.
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedAccountType('PRESTADOR')}
            className={`bg-white rounded-lg p-6 md:p-8 shadow-md cursor-pointer transition-all hover:shadow-lg ${
              selectedAccountType === 'PRESTADOR' ? 'ring-2 ring-green-500 bg-green-50' : ''
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-green-100 rounded-lg flex items-center justify-center p-2 overflow-hidden">
                <img 
                  src={friendlyGuyAvatar} 
                  alt="Prestador" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Prestador de Serviço</h3>
                <p className="text-sm md:text-base text-gray-600">
                  Quero oferecer meus serviços e encontrar clientes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 flex justify-center">
        <button
          onClick={onSubmit}
          disabled={!selectedAccountType || isLoading}
          className="max-w-xs w-full bg-green-500 text-white py-2 md:py-2.5 px-8 rounded-full text-sm md:text-base font-semibold hover:bg-green-600 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? 'Processando...' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}

export default AccountTypeScreen
