import React from 'react'
import providerAvatar from '../assets/images/undraw_friendly-guy-avatar_dqp5 3.png'

interface ServiceProviderScreenProps {
  onBack: () => void
}

const ServiceProviderScreen: React.FC<ServiceProviderScreenProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-green-500 text-white p-6 text-center">
        <h1 className="text-2xl font-bold">Tipo de conta</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="bg-green-100 rounded-lg w-48 h-48 flex items-center justify-center mb-8 p-4">
          <img 
            src={providerAvatar}
            alt="Prestador" 
            className="w-full h-full object-contain"
          />
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Prestador de Serviço</h2>
        
        <p className="text-center text-gray-700 mb-2 max-w-md">
          Este aplicativo de delivery foi desenvolvido exclusivamente para uso em dispositivos móveis (celulares).
        </p>
        
        <p className="text-center text-gray-700 mb-8 max-w-md">
          Por favor, acesse pelo seu <span className="text-green-600 font-semibold">smartphone</span> para continuar utilizando.
        </p>

        <button
          onClick={onBack}
          className="bg-green-500 text-white py-3 px-12 rounded-full text-lg font-semibold hover:bg-green-600 transition-colors"
        >
          Voltar
        </button>
      </div>
    </div>
  )
}

export default ServiceProviderScreen
