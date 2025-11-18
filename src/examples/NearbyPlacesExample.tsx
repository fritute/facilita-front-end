import React, { useState } from 'react'
import NearbyPlacesMap from '../components/NearbyPlacesMap'
import { PlaceData } from '../services/placesService'

/**
 * Exemplo de uso do componente NearbyPlacesMap
 * Demonstra como integrar a busca de estabelecimentos próximos
 */
const NearbyPlacesExample: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<PlaceData | null>(null)

  // Exemplos de localizações para teste
  const exampleLocations = [
    { lat: -23.5505, lng: -46.6333, address: 'Avenida Paulista, 1000 - Bela Vista, São Paulo - SP' },
    { lat: -22.9068, lng: -43.1729, address: 'Copacabana, Rio de Janeiro - RJ' },
    { lat: -15.7942, lng: -47.8822, address: 'Setor Comercial Sul, Brasília - DF' },
    { lat: -25.4284, lng: -49.2733, address: 'Centro, Curitiba - PR' },
    { lat: -30.0346, lng: -51.2177, address: 'Centro Histórico, Porto Alegre - RS' }
  ]

  const handleLocationSelect = (location: typeof exampleLocations[0]) => {
    setSelectedLocation(location)
    setSelectedPlace(null)
  }

  const handlePlaceSelect = (place: PlaceData) => {
    setSelectedPlace(place)
    console.log('🏪 Estabelecimento selecionado:', place)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            🏪 Exemplo: Estabelecimentos Próximos
          </h1>
          <p className="text-gray-600 mb-6">
            Demonstração do componente que busca estabelecimentos reais próximos usando OpenStreetMap.
          </p>

          {/* Seleção de localização */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              📍 Escolha uma localização para testar:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {exampleLocations.map((location, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(location)}
                  className={`p-3 text-left rounded-lg border-2 transition-colors ${
                    selectedLocation?.address === location.address
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-gray-200 hover:border-green-300 text-gray-700'
                  }`}
                >
                  <p className="font-medium text-sm">{location.address}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Estabelecimento selecionado */}
          {selectedPlace && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">✅ Estabelecimento Selecionado:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-blue-900">{selectedPlace.name}</p>
                  <p className="text-sm text-blue-700">{selectedPlace.type}</p>
                  <p className="text-sm text-blue-600">{selectedPlace.address}</p>
                </div>
                <div className="text-sm text-blue-600">
                  <p><strong>Coordenadas:</strong> {selectedPlace.lat.toFixed(6)}, {selectedPlace.lng.toFixed(6)}</p>
                  {selectedPlace.distance && (
                    <p><strong>Distância:</strong> {selectedPlace.distance < 1 
                      ? `${Math.round(selectedPlace.distance * 1000)}m`
                      : `${selectedPlace.distance.toFixed(1)}km`
                    }</p>
                  )}
                  {selectedPlace.phone && <p><strong>Telefone:</strong> {selectedPlace.phone}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Componente de estabelecimentos próximos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <NearbyPlacesMap
              centerLocation={selectedLocation}
              onPlaceSelect={handlePlaceSelect}
              showFilters={true}
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📋 Como usar:
            </h3>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="font-medium text-gray-800">1. Selecione uma localização</h4>
                <p>Clique em uma das localizações de exemplo acima</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">2. Explore os estabelecimentos</h4>
                <p>Veja a lista de estabelecimentos reais próximos</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">3. Use os filtros</h4>
                <p>Filtre por categoria (Alimentação, Compras, Saúde, etc.)</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">4. Busque por nome</h4>
                <p>Use a barra de busca para encontrar estabelecimentos específicos</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">5. Selecione um estabelecimento</h4>
                <p>Clique em um estabelecimento para ver detalhes e usar como destino</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">💡 Funcionalidades:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Busca estabelecimentos reais via OpenStreetMap</li>
                <li>• Filtragem por categoria e nome</li>
                <li>• Cálculo automático de distância</li>
                <li>• Informações detalhadas (telefone, site, horários)</li>
                <li>• Seleção como destino de serviço</li>
                <li>• Interface responsiva e intuitiva</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NearbyPlacesExample
