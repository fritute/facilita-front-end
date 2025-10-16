import React, { useState } from 'react'
import { ArrowLeft, MapPin, Home, Package } from 'lucide-react'
import AddressSearch from '../components/AddressSearch'
import { LocationCoordinates } from '../services/geocoding.service'

interface ServiceCreateScreenProps {
  userAddress: string
  serviceDescription: string
  selectedServiceType: string
  pickupLocation: LocationCoordinates | null
  deliveryLocation: LocationCoordinates | null
  predefinedServices: Array<{ id: string; name: string; icon: string }>
  onBack: () => void
  onPickupLocationChange: (location: LocationCoordinates) => void
  onDeliveryLocationChange: (location: LocationCoordinates) => void
  onDescriptionChange: (value: string) => void
  onServiceTypeChange: (value: string) => void
  onConfirmService: () => void
}

const ServiceCreateScreen: React.FC<ServiceCreateScreenProps> = ({
  userAddress,
  serviceDescription,
  selectedServiceType,
  pickupLocation,
  deliveryLocation,
  predefinedServices,
  onBack,
  onPickupLocationChange,
  onDeliveryLocationChange,
  onDescriptionChange,
  onServiceTypeChange,
  onConfirmService
}) => {
  const [showPickupSearch, setShowPickupSearch] = useState(false)
  const [showDeliverySearch, setShowDeliverySearch] = useState(false)

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const calculatePrice = (distance: number): number => {
    const basePrice = 5.00
    const pricePerKm = 2.50
    return basePrice + (distance * pricePerKm)
  }

  const distance = pickupLocation && deliveryLocation
    ? calculateDistance(pickupLocation.lat, pickupLocation.lng, deliveryLocation.lat, deliveryLocation.lng)
    : 0

  const price = calculatePrice(distance)

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
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
            Descreva o que você precisa e<br />
            escolha como deseja receber
          </h2>
        </div>

        {/* Endereço do usuário */}
        {userAddress && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
            <div className="flex items-start">
              <Home className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 mb-1">Seu endereço cadastrado</p>
                <p className="text-sm text-gray-600">{userAddress}</p>
              </div>
            </div>
          </div>
        )}

        {/* Seleção de origem e destino */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <h3 className="font-semibold mb-4 text-gray-800">Localizações</h3>
          
          <div className="space-y-6">
            {/* Origem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 Buscar em (Origem)
              </label>
              {!showPickupSearch && !pickupLocation ? (
                <button
                  onClick={() => setShowPickupSearch(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
                >
                  Clique para selecionar origem
                </button>
              ) : showPickupSearch ? (
                <AddressSearch
                  onSelectLocation={(location) => {
                    onPickupLocationChange(location)
                    setShowPickupSearch(false)
                  }}
                  placeholder="Digite CEP ou endereço de origem"
                />
              ) : pickupLocation ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 line-clamp-2">{pickupLocation.address}</p>
                    </div>
                    <button
                      onClick={() => setShowPickupSearch(true)}
                      className="ml-2 text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap"
                    >
                      Alterar
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Destino */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 Entregar em (Destino)
              </label>
              {!showDeliverySearch && !deliveryLocation ? (
                <button
                  onClick={() => setShowDeliverySearch(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors"
                >
                  Clique para selecionar destino
                </button>
              ) : showDeliverySearch ? (
                <AddressSearch
                  onSelectLocation={(location) => {
                    onDeliveryLocationChange(location)
                    setShowDeliverySearch(false)
                  }}
                  placeholder="Digite CEP ou endereço de destino"
                />
              ) : deliveryLocation ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 line-clamp-2">{deliveryLocation.address}</p>
                    </div>
                    <button
                      onClick={() => setShowDeliverySearch(true)}
                      className="ml-2 text-green-600 hover:text-green-700 text-sm font-medium whitespace-nowrap"
                    >
                      Alterar
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Informações de distância e preço */}
          {pickupLocation && deliveryLocation && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Distância</p>
                  <p className="text-lg font-bold text-gray-800">{distance.toFixed(2)} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Preço estimado</p>
                  <p className="text-lg font-bold text-green-600">R$ {price.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Descrição do pedido */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <h3 className="font-semibold mb-4 text-gray-800">Descrição do Pedido</h3>
          <textarea
            value={serviceDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Descreva o que você precisa... (ex: Comprar remédio X na farmácia Y)"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[100px] resize-none"
          />
        </div>

        {/* Tipo de serviço */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <h3 className="font-semibold mb-4 text-gray-800">Tipo de Serviço</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {predefinedServices.map((service) => (
              <button
                key={service.id}
                onClick={() => onServiceTypeChange(service.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedServiceType === service.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="text-3xl mb-2">{service.icon}</div>
                <p className="text-sm font-medium text-gray-800">{service.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Botão confirmar */}
        <button
          onClick={onConfirmService}
          disabled={!pickupLocation || !deliveryLocation || !serviceDescription}
          className="w-full bg-green-500 text-white py-4 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
        >
          Confirmar Serviço
        </button>
      </div>
    </div>
  )
}

export default ServiceCreateScreen
