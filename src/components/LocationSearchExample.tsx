import React, { useState } from 'react'
import { Search, MapPin, Loader, Check, X } from 'lucide-react'
import { LocationData, geocodingService } from '../services/geocodingService'
import { looksLikeCEP } from '../utils/locationUtils'

interface LocationSearchExampleProps {
  onLocationSelect?: (location: LocationData) => void
  placeholder?: string
  className?: string
}

/**
 * Componente de exemplo para busca de localização
 * Pode ser reutilizado em qualquer tela que precise de busca de endereço
 */
const LocationSearchExample: React.FC<LocationSearchExampleProps> = ({
  onLocationSelect,
  placeholder = "Digite um endereço ou CEP (ex: 01310-100)",
  className = ""
}) => {
  const [searchInput, setSearchInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [foundLocation, setFoundLocation] = useState<LocationData | null>(null)
  const [foundLocations, setFoundLocations] = useState<LocationData[]>([])
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [showMultipleOptions, setShowMultipleOptions] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      setError('Digite um endereço ou CEP para buscar')
      return
    }

    setIsSearching(true)
    setError('')
    setFoundLocation(null)
    setFoundLocations([])
    setShowSuggestion(false)
    setShowMultipleOptions(false)

    try {
      const locations = await geocodingService.searchMultipleLocations(searchInput.trim(), 5)
      
      if (locations.length > 0) {
        if (locations.length === 1) {
          setFoundLocation(locations[0])
          setShowSuggestion(true)
        } else {
          setFoundLocations(locations)
          setShowMultipleOptions(true)
        }
      } else {
        setError('Não foi possível encontrar a localização. Verifique o endereço ou CEP.')
      }
    } catch (error: any) {
      setError('Erro ao buscar localização. Tente novamente.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectLocation = (location: LocationData) => {
    setFoundLocation(location)
    setShowMultipleOptions(false)
    setShowSuggestion(true)
    setFoundLocations([])
  }

  const handleAcceptLocation = () => {
    if (foundLocation) {
      onLocationSelect?.(foundLocation)
      setSearchInput(foundLocation.address)
      setShowSuggestion(false)
      setFoundLocation(null)
    }
  }

  const handleRejectLocation = () => {
    setShowSuggestion(false)
    setFoundLocation(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Campo de busca */}
      <div className="relative">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setError('')
            if (showSuggestion) {
              setShowSuggestion(false)
              setFoundLocation(null)
            }
          }}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full p-3 pr-12 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none text-gray-800"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchInput.trim()}
          className="absolute right-2 top-2 p-2 text-gray-400 hover:text-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Buscar localização"
        >
          {isSearching ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Dica de uso */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <MapPin className="w-3 h-3" />
        <span>
          {looksLikeCEP(searchInput) 
            ? 'CEP detectado - busca automática com coordenadas' 
            : 'Digite um CEP para busca mais precisa'
          }
        </span>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Múltiplas opções de endereços */}
      {showMultipleOptions && foundLocations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-yellow-600 flex-shrink-0" />
            <p className="text-sm font-medium text-yellow-800">
              {foundLocations.length} opções encontradas. Escolha a mais precisa:
            </p>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {foundLocations.map((location, index) => (
              <button
                key={index}
                onClick={() => handleSelectLocation(location)}
                className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-800 break-words">
                  {location.address}
                </p>
                {location.city && location.state && (
                  <p className="text-xs text-gray-500 mt-1">
                    {location.city}, {location.state}
                    {location.zipCode && ` - CEP: ${location.zipCode}`}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sugestão de localização */}
      {showSuggestion && foundLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-700">Localização selecionada:</p>
              <p className="text-sm text-blue-600 break-words">{foundLocation.address}</p>
              {foundLocation.city && foundLocation.state && (
                <p className="text-xs text-blue-500">
                  {foundLocation.city}, {foundLocation.state}
                  {foundLocation.zipCode && ` - CEP: ${foundLocation.zipCode}`}
                </p>
              )}
              <p className="text-xs text-blue-500">
                📍 Coordenadas: {foundLocation.lat.toFixed(6)}, {foundLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAcceptLocation}
              className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Check className="w-4 h-4" />
              Usar este endereço
            </button>
            <button
              onClick={handleRejectLocation}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationSearchExample

// Exemplo de uso:
/*
import LocationSearchExample from '../components/LocationSearchExample'

function MyScreen() {
  const handleLocationSelect = (location: LocationData) => {
    console.log('Localização selecionada:', location)
    // Usar location.lat, location.lng, location.address
  }

  return (
    <div>
      <h2>Buscar Endereço</h2>
      <LocationSearchExample 
        onLocationSelect={handleLocationSelect}
        placeholder="Digite seu endereço ou CEP"
      />
    </div>
  )
}
*/
