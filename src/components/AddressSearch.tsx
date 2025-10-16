import React, { useState, useEffect } from 'react'
import { Search, MapPin, Loader } from 'lucide-react'
import { geocodingService, LocationCoordinates } from '../services/geocoding.service'

interface AddressSearchProps {
  onSelectLocation: (location: LocationCoordinates) => void
  placeholder?: string
  defaultValue?: string
}

const AddressSearch: React.FC<AddressSearchProps> = ({
  onSelectLocation,
  placeholder = 'Digite o CEP ou endereço',
  defaultValue = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(defaultValue)
  const [results, setResults] = useState<LocationCoordinates[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [searchType, setSearchType] = useState<'cep' | 'address'>('address')

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 3) {
        handleSearch()
      } else {
        setResults([])
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const handleSearch = async () => {
    setIsSearching(true)
    setShowResults(true)

    try {
      // Detecta se é CEP (apenas números)
      const cleanQuery = searchQuery.replace(/\D/g, '')
      const isCEP = cleanQuery.length === 8 && /^\d+$/.test(cleanQuery)

      if (isCEP) {
        setSearchType('cep')
        const result = await geocodingService.searchByCEP(cleanQuery)
        if (result) {
          setResults([result])
        } else {
          setResults([])
        }
      } else {
        setSearchType('address')
        const results = await geocodingService.searchByAddress(searchQuery)
        setResults(results)
      }
    } catch (error) {
      console.error('Erro na busca:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectResult = (location: LocationCoordinates) => {
    onSelectLocation(location)
    setSearchQuery(location.address)
    setShowResults(false)
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {isSearching && (
          <Loader className="absolute right-3 top-3 w-5 h-5 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Dica de uso */}
      <p className="text-xs text-gray-500 mt-1">
        💡 Digite um CEP (ex: 01310-100) ou endereço (ex: Av Paulista, São Paulo)
      </p>

      {/* Resultados */}
      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelectResult(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 line-clamp-2">{result.address}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {result.lat.toFixed(6)}, {result.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Nenhum resultado */}
      {showResults && !isSearching && results.length === 0 && searchQuery.length >= 3 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-600 text-center">
            {searchType === 'cep' 
              ? '❌ CEP não encontrado. Verifique se digitou corretamente.'
              : '❌ Nenhum endereço encontrado. Tente ser mais específico.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default AddressSearch
