import React, { useState, useEffect } from 'react'
import { MapPin, Store, Search, Navigation, Clock, Phone, Globe } from 'lucide-react'
import { placesService, PlaceData } from '../services/placesService'

interface NearbyPlacesMapProps {
  centerLocation: { lat: number; lng: number; address: string } | null
  onPlaceSelect?: (place: PlaceData) => void
  className?: string
  showFilters?: boolean
  title?: string
  actionButtonText?: string
}

const NearbyPlacesMap: React.FC<NearbyPlacesMapProps> = ({
  centerLocation,
  onPlaceSelect,
  className = "",
  showFilters = true,
  title = "Estabelecimentos Próximos",
  actionButtonText = "Usar como Destino"
}) => {
  const [places, setPlaces] = useState<PlaceData[]>([])
  const [filteredPlaces, setFilteredPlaces] = useState<PlaceData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlace, setSelectedPlace] = useState<PlaceData | null>(null)
  const [showPlaceDetails, setShowPlaceDetails] = useState(false)

  // Categorias para filtro
  const filterCategories = [
    { id: 'all', label: 'Todos', icon: '🏪' },
    { id: 'food', label: 'Alimentação', icon: '🍽️' },
    { id: 'shopping', label: 'Compras', icon: '🛒' },
    { id: 'health', label: 'Saúde', icon: '💊' },
    { id: 'services', label: 'Serviços', icon: '🏦' }
  ]

  // Buscar estabelecimentos quando a localização mudar
  useEffect(() => {
    if (centerLocation) {
      searchNearbyPlaces()
    }
  }, [centerLocation])

  // Filtrar estabelecimentos quando categoria ou busca mudar
  useEffect(() => {
    filterPlaces()
  }, [places, selectedCategory, searchTerm])

  const searchNearbyPlaces = async () => {
    if (!centerLocation) return

    setIsLoading(true)
    try {
      console.log('🔍 Buscando estabelecimentos próximos a:', centerLocation.address)
      
      let results: PlaceData[] = []
      
      if (selectedCategory === 'all') {
        results = await placesService.getNearbyPlaces(centerLocation.lat, centerLocation.lng, 2)
      } else {
        results = await placesService.getPlacesByCategory(centerLocation.lat, centerLocation.lng, selectedCategory, 2)
      }
      
      setPlaces(results)
      console.log(`✅ ${results.length} estabelecimentos encontrados`)
    } catch (error) {
      console.error('❌ Erro ao buscar estabelecimentos:', error)
      setPlaces([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterPlaces = () => {
    let filtered = places

    // Filtrar por categoria
    if (selectedCategory !== 'all') {
      const categoryMap: { [key: string]: string[] } = {
        food: ['restaurant', 'fast_food', 'cafe', 'bar', 'bakery'],
        shopping: ['supermarket', 'convenience', 'clothes', 'electronics'],
        health: ['hospital', 'pharmacy', 'clinic'],
        services: ['bank', 'atm', 'fuel']
      }
      
      const allowedCategories = categoryMap[selectedCategory] || []
      filtered = filtered.filter(place => allowedCategories.includes(place.category))
    }

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(place => 
        place.name.toLowerCase().includes(term) ||
        place.type.toLowerCase().includes(term) ||
        place.address.toLowerCase().includes(term)
      )
    }

    setFilteredPlaces(filtered)
  }

  const handlePlaceClick = (place: PlaceData) => {
    setSelectedPlace(place)
    setShowPlaceDetails(true)
  }

  const handleSelectPlace = (place: PlaceData) => {
    onPlaceSelect?.(place)
    setShowPlaceDetails(false)
    setSelectedPlace(null)
  }

  const getCategoryInfo = (category: string) => {
    return placesService.getCategoryInfo(category)
  }

  if (!centerLocation) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 text-center ${className}`}>
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">Selecione uma localização para ver estabelecimentos próximos</p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Store className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Navigation className="w-4 h-4" />
          <span className="truncate">{centerLocation.address}</span>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="p-4 border-b bg-gray-50">
          {/* Busca */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar estabelecimentos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>

          {/* Categorias */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filterCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span>{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de estabelecimentos */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mb-2"></div>
            <p className="text-sm text-gray-600">Buscando estabelecimentos...</p>
          </div>
        ) : filteredPlaces.length > 0 ? (
          <div className="divide-y">
            {filteredPlaces.slice(0, 20).map((place) => {
              const categoryInfo = getCategoryInfo(place.category)
              return (
                <div
                  key={place.id}
                  onClick={() => handlePlaceClick(place)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                      style={{ backgroundColor: categoryInfo.color }}
                    >
                      {categoryInfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">{place.name}</h4>
                          <p className="text-xs text-gray-500 mb-1">{place.type}</p>
                          <p className="text-xs text-gray-600 truncate">{place.address}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {place.distance && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              {place.distance < 1 
                                ? `${Math.round(place.distance * 1000)}m`
                                : `${place.distance.toFixed(1)}km`
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">Nenhum estabelecimento encontrado</p>
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Tente alterar os filtros de busca' : 'Não há estabelecimentos próximos nesta região'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de detalhes do estabelecimento */}
      {showPlaceDetails && selectedPlace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Detalhes do Local</h3>
                <button
                  onClick={() => setShowPlaceDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-start gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg flex-shrink-0"
                  style={{ backgroundColor: getCategoryInfo(selectedPlace.category).color }}
                >
                  {getCategoryInfo(selectedPlace.category).icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{selectedPlace.name}</h4>
                  <p className="text-sm text-gray-600">{selectedPlace.type}</p>
                  {selectedPlace.distance && (
                    <p className="text-xs text-green-600 font-medium">
                      📍 {selectedPlace.distance < 1 
                        ? `${Math.round(selectedPlace.distance * 1000)}m de distância`
                        : `${selectedPlace.distance.toFixed(1)}km de distância`
                      }
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{selectedPlace.address}</p>
                </div>

                {selectedPlace.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{selectedPlace.phone}</p>
                  </div>
                )}

                {selectedPlace.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-blue-600 truncate">{selectedPlace.website}</p>
                  </div>
                )}

                {selectedPlace.opening_hours && (
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{selectedPlace.opening_hours}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectPlace(selectedPlace)}
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  {actionButtonText}
                </button>
                <button
                  onClick={() => setShowPlaceDetails(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NearbyPlacesMap
