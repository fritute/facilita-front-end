import React from 'react'
import { ArrowLeft, MapPin, Home } from 'lucide-react'

interface ServiceCreateScreenProps {
  userAddress: string
  selectedOriginLocation: string
  selectedLocation: string
  serviceDescription: string
  selectedServiceType: string
  pickupLocation: { address: string; lat: number; lng: number } | null
  deliveryLocation: { address: string; lat: number; lng: number } | null
  predefinedServices: Array<{ id: string; name: string; icon: string }>
  serviceCategories: Array<any>
  loadingCategories: boolean
  selectedCategoryId: number | null
  onBack: () => void
  onSelectOrigin: () => void
  onSelectDestination: () => void
  onDescriptionChange: (value: string) => void
  onServiceTypeChange: (value: string) => void
  onCategorySelect: (categoryId: number) => void
  onConfirmService: () => void
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number
  calculatePrice: (distance: number) => number
}

const ServiceCreateScreen: React.FC<ServiceCreateScreenProps> = ({
  userAddress,
  selectedOriginLocation,
  selectedLocation,
  serviceDescription,
  selectedServiceType,
  pickupLocation,
  deliveryLocation,
  predefinedServices,
  serviceCategories,
  loadingCategories,
  selectedCategoryId,
  onBack,
  onSelectOrigin,
  onSelectDestination,
  onDescriptionChange,
  onServiceTypeChange,
  onCategorySelect,
  onConfirmService
}) => {
  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Header */}
      <div className="bg-green-500 text-white p-4 relative">
        <button
          onClick={onBack}
          className="absolute left-4 top-4 text-white hover:text-gray-200"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-center text-lg font-bold">Monte o seu serviço</h1>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Descreva o que você precisa e<br />
            escolha como deseja receber
          </h2>
        </div>

        {/* Endereço do usuário */}
        {userAddress && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start">
              <Home className="w-5 h-5 text-green-500 mr-3 mt-1" />
              <div className="flex-1">
                <p className="font-semibold text-gray-800 mb-1">Seu endereço</p>
                <p className="text-gray-600 text-sm">{userAddress}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Este será usado como endereço de entrega padrão
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Seleção de origem e destino */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-semibold mb-4 text-gray-800">Localizações</h3>
          
          <div className="mb-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center flex-1 min-w-0">
                <MapPin className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base">Buscar em (Origem)</p>
                  <p className="text-gray-600 text-xs sm:text-sm truncate">
                    {selectedOriginLocation || 'Clique para selecionar'}
                  </p>
                </div>
              </div>
              <button
                onClick={onSelectOrigin}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors whitespace-nowrap flex-shrink-0"
              >
                {selectedOriginLocation ? 'Alterar' : 'Selecionar'}
              </button>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center flex-1 min-w-0">
                  <MapPin className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base">Entregar em (Destino)</p>
                    <p className="text-gray-600 text-xs sm:text-sm truncate">
                      {selectedLocation || 'Usando seu endereço'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onSelectDestination}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  {selectedLocation ? 'Alterar' : 'Selecionar'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Descrição do pedido */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-semibold mb-4">Pedido</h3>
          
          <div className="mb-6">
            <div className="flex items-start mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-1">
                <span className="text-white text-sm">✏️</span>
              </div>
              <div className="flex-1">
                <p className="font-medium mb-2">Preciso que alguém me acompanhe até o hospital</p>
                <textarea
                  value={serviceDescription}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  placeholder="Descreva detalhadamente o que você precisa..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Categorias de serviço da API */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-gray-700">Categorias disponíveis</h4>
            {loadingCategories ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <p className="text-gray-600 mt-2">Carregando categorias...</p>
              </div>
            ) : serviceCategories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {serviceCategories.map((category) => (
                  <button
                    key={category.id || category.id_categoria}
                    onClick={() => onCategorySelect(category.id || category.id_categoria)}
                    className={`p-4 border rounded-lg text-left transition-all hover:shadow-md ${
                      selectedCategoryId === (category.id || category.id_categoria)
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xl">{category.icone || '📦'}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{category.nome}</p>
                        {category.preco_base && (
                          <p className="text-xs text-green-600 font-medium">R$ {parseFloat(category.preco_base).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                    {category.descricao && (
                      <p className="text-xs text-gray-600 mt-2">{category.descricao}</p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Nenhuma categoria disponível no momento</p>
              </div>
            )}
          </div>

          {/* Serviços predefinidos (mantidos como fallback) */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-gray-700">Ou escolha um serviço rápido</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {predefinedServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => onServiceTypeChange(service.id)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    selectedServiceType === service.id
                      ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                      : 'border-gray-300 hover:border-green-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{service.icon}</div>
                  <p className="font-medium text-sm">{service.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Botão confirmar */}
          <button
            onClick={onConfirmService}
            disabled={!serviceDescription && !selectedServiceType}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              serviceDescription || selectedServiceType
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirmar Serviço
          </button>
        </div>
      </div>
    </div>
  )
}

export default ServiceCreateScreen
