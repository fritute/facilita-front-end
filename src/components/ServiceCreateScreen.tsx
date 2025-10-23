import React from 'react'
import { ArrowLeft, MapPin } from 'lucide-react'

interface ServiceCreateScreenProps {
  userAddress: string
  selectedOriginLocation: string
  selectedLocation: string
  serviceDescription: string
  selectedServiceType: string
  pickupLocation: { address: string; lat: number; lng: number } | null
  deliveryLocation: { address: string; lat: number; lng: number } | null
  stopPoints: Array<{ address: string; lat: number; lng: number; description: string }>
  predefinedServices: Array<{ id: string; name: string; icon: string }>
  serviceCategories: Array<any>
  loadingCategories: boolean
  selectedCategoryId: number | null
  onBack: () => void
  onSelectOrigin: () => void
  onSelectDestination: () => void
  onAddStopPoint: () => void
  onRemoveStopPoint: (index: number) => void
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
  stopPoints,
  predefinedServices,
  serviceCategories,
  loadingCategories,
  selectedCategoryId,
  onBack,
  onSelectOrigin,
  onSelectDestination,
  onAddStopPoint,
  onRemoveStopPoint,
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
        {/* Localização Padrão do Usuário */}
        {userAddress && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-4 mb-4 text-white">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium opacity-90 mb-1">📍 Localização Padrão</p>
                <p className="font-semibold text-lg">{userAddress}</p>
              </div>
            </div>
          </div>
        )}

        {/* Serviço Selecionado */}
        {selectedServiceType && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center">
              <div className="bg-blue-500 text-white px-4 py-2 rounded-full font-semibold text-lg">
                ✓ {selectedServiceType} Selecionado
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Descreva o que você precisa
          </h2>
        </div>

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
            
            
            {/* Paradas intermediárias */}
            {stopPoints.length > 0 && (
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">Paradas no caminho:</p>
                {stopPoints.map((stop, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-yellow-50 p-3 rounded-lg">
                    <div className="flex items-center flex-1 min-w-0">
                      <MapPin className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">Parada {index + 1}</p>
                        <p className="text-gray-600 text-xs truncate">{stop.address}</p>
                        {stop.description && (
                          <p className="text-gray-500 text-xs mt-1">{stop.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveStopPoint(index)}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-600 transition-colors whitespace-nowrap flex-shrink-0"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Botão adicionar parada */}
            <div className="border-t pt-4">
              <button
                onClick={onAddStopPoint}
                className="w-full bg-yellow-100 text-yellow-700 px-4 py-3 rounded-lg text-sm font-semibold hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2 border-2 border-dashed border-yellow-300"
              >
                <MapPin className="w-4 h-4" />
                Adicionar Parada no Caminho
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Adicione pontos de parada entre a origem e o destino
              </p>
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
                <label className="font-medium mb-2 block text-gray-800">
                  Descreva o que você precisa
                </label>
                <textarea
                  value={serviceDescription}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  placeholder="Exemplo: Preciso buscar 2 caixas de remédio na farmácia São João. São remédios controlados, então preciso que o entregador leve minha receita médica."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-32 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Dica: Seja específico sobre quantidades, itens, horários ou instruções especiais
                </p>
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
