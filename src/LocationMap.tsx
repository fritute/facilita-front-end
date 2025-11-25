// LocationMap.tsx - Versão corrigida com busca por CEP
import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, ArrowLeft, Search, Loader } from 'lucide-react'
import { geocodingService } from './services/geocodingService'
import { looksLikeCEP } from './utils/locationUtils'

// Fix para ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export interface Location {
  lat: number
  lng: number
  address: string
}

export interface LocationMapProps {
  onLocationSelect: (address: string, lat: number, lng: number) => void
  onScreenChange: (screen: 'login' | 'cadastro' | 'success' | 'recovery' | 'verification' | 'account-type' | 'service-provider' | 'profile-setup' | 'home' | 'location-select' | 'service-create' | 'waiting-driver' | 'payment' | 'service-tracking' | 'service-confirmed' | 'tracking') => void
}

// Componente para capturar cliques no mapa
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

const LocationMap: React.FC<LocationMapProps> = ({ onLocationSelect, onScreenChange }) => {
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-23.5505, -46.6333])
  const [nearbyAddresses, setNearbyAddresses] = useState<Location[]>([])
  const [isLocating, setIsLocating] = useState(false)
  const [clickedLocation, setClickedLocation] = useState<Location | null>(null)
  
  // Estados para busca por CEP/endereço
  const [searchInput, setSearchInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Função para formatar endereço (apenas nome, número e bairro)
  const formatAddress = (fullAddress: string, city?: string, state?: string) => {
    // Extrair partes relevantes do endereço
    const parts = fullAddress.split(',');
    
    if (parts.length >= 3) {
      // Pegar rua/nome + número (primeira parte) e bairro (segunda parte)
      const streetAndNumber = parts[0].trim();
      const neighborhood = parts[1].trim();
      
      return `${streetAndNumber}, ${neighborhood}`;
    }
    
    // Se não conseguir extrair, usar cidade e estado
    if (city && state) {
      return `${city}, ${state}`;
    }
    
    // Fallback para endereço completo mas limitado
    return fullAddress.length > 50 ? fullAddress.substring(0, 50) + '...' : fullAddress;
  };

  // Função para buscar por CEP/endereço
  const handleSearch = async () => {
    if (!searchInput.trim()) return

    setIsSearching(true)

    try {
      console.log('🔍 Buscando por:', searchInput)
      
      // Usar o geocodingService para buscar múltiplas opções
      const results = await geocodingService.searchMultipleLocations(searchInput.trim(), 8)
      
      if (results.length > 0) {
        console.log(`✅ ${results.length} resultados encontrados`)
        
        // Converter LocationData para Location com endereços formatados
        const locations: Location[] = results.map(result => ({
          lat: result.lat,
          lng: result.lng,
          address: formatAddress(result.address, result.city, result.state)
        }))
        
        setNearbyAddresses(locations)
        
        // Navegar para o primeiro resultado
        const firstResult = results[0]
        setMapCenter([firstResult.lat, firstResult.lng])
        setClickedLocation({
          lat: firstResult.lat,
          lng: firstResult.lng,
          address: formatAddress(firstResult.address, firstResult.city, firstResult.state)
        })
      } else {
        console.warn('❌ Nenhum resultado encontrado')
        // Limpar lista se não encontrar nada
        setNearbyAddresses([])
      }
    } catch (error) {
      console.error('❌ Erro na busca:', error)
    } finally {
      setIsSearching(false)
    }
  }


  // Função para obter a localização do usuário
  const getUserLocation = async () => {
    setIsLocating(true)
    
    // Localização padrão (São Paulo, SP) como fallback
    const defaultLat = -23.5505
    const defaultLng = -46.6333
    
    // Verificar se geolocalização está disponível
    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocalização não suportada pelo navegador')
      setMapCenter([defaultLat, defaultLng])
      setUserLocation({ lat: defaultLat, lng: defaultLng, address: 'São Paulo, SP (geolocalização não suportada)' })
      await getNearbyAddresses(defaultLat, defaultLng)
      setIsLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        console.log(`✅ Localização obtida: ${latitude}, ${longitude}`)
        
        setMapCenter([latitude, longitude])
        setUserLocation({ lat: latitude, lng: longitude, address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}` })
        
        await getNearbyAddresses(latitude, longitude)
        setIsLocating(false)
      },
      async (error) => {
        console.error('❌ Erro ao obter localização:', error.message)
        
        setMapCenter([defaultLat, defaultLng])
        setUserLocation({ lat: defaultLat, lng: defaultLng, address: 'São Paulo, SP (erro na localização)' })
        await getNearbyAddresses(defaultLat, defaultLng)
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    )
  }

  // Função para buscar endereços próximos usando dados mock
  const getNearbyAddresses = async (lat: number, lng: number) => {
    try {
      console.log(`🔍 Buscando endereços próximos a: ${lat}, ${lng}`)
      
      // Usar dados mock para desenvolvimento
      const nearbyResults: Location[] = [
        {
          lat: lat + 0.001,
          lng: lng + 0.001,
          address: 'Farmácia Droga Raia - Rua Augusta, 1234'
        },
        {
          lat: lat - 0.001,
          lng: lng + 0.002,
          address: 'Supermercado Pão de Açúcar - Av. Paulista, 567'
        },
        {
          lat: lat + 0.002,
          lng: lng - 0.001,
          address: 'Hospital das Clínicas - Rua Dr. Ovídio Pires de Campos, 225'
        },
        {
          lat: lat - 0.002,
          lng: lng - 0.001,
          address: 'Shopping Center Norte - Travessa Casalbuono, 120'
        },
        {
          lat: lat + 0.003,
          lng: lng + 0.001,
          address: 'Banco Itaú - Rua da Consolação, 789'
        },
        {
          lat: lat - 0.001,
          lng: lng - 0.002,
          address: 'Restaurante Família Mancini - Rua Avanhandava, 81'
        }
      ]
      
      console.log(`📍 ${nearbyResults.length} endereços carregados`)
      setNearbyAddresses(nearbyResults.slice(0, 6))
      
    } catch (error) {
      console.error('❌ Erro ao buscar endereços próximos:', error)
    }
  }

  // Efeito para obter localização quando o componente montar
  useEffect(() => {
    getUserLocation()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header com botão voltar */}
      <div className="bg-green-500 text-white p-4 relative">
        <button
          onClick={() => onScreenChange('home')}
          className="absolute left-4 top-4 text-white hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold">Selecionar Localização</h1>
        </div>
      </div>

      {/* Barra de busca por CEP/endereço */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}
            placeholder="Digite um CEP ou endereço (ex: 01310-100)"
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
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
          <MapPin className="w-3 h-3" />
          <span>
            {looksLikeCEP(searchInput) 
              ? 'CEP detectado - busca automática com coordenadas' 
              : 'Digite um CEP para busca mais precisa'
            }
          </span>
        </div>

      </div>
      
      {/* Map area */}
      <div className="h-96 relative">
        <MapContainer 
          center={mapCenter} 
          zoom={15} 
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Marcador da localização do usuário */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">Sua localização atual</p>
                  <p className="text-sm text-gray-600">{userLocation.address}</p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Marcadores dos endereços próximos */}
          {nearbyAddresses.map((location, index) => (
            <Marker 
              key={index} 
              position={[location.lat, location.lng]}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
              })}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">Endereço próximo</p>
                  <p className="text-sm text-gray-600">{location.address}</p>
                  <button
                    onClick={() => onLocationSelect(location.address, location.lat, location.lng)}
                    className="mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                  >
                    Selecionar
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Marcador da localização clicada */}
          {clickedLocation && (
            <Marker 
              position={[clickedLocation.lat, clickedLocation.lng]}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
              })}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">Local selecionado</p>
                  <p className="text-sm text-gray-600 mb-2">{clickedLocation.address}</p>
                  <button
                    onClick={() => onLocationSelect(clickedLocation.address, clickedLocation.lat, clickedLocation.lng)}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 mr-2"
                  >
                    Selecionar
                  </button>
                  <button
                    onClick={() => setClickedLocation(null)}
                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                  >
                    Remover
                  </button>
                </div>
              </Popup>
            </Marker>
          )}

          <MapClickHandler onMapClick={(lat, lng) => {
            console.log(`📍 Clique no mapa: ${lat}, ${lng}`)
            const address = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
            setClickedLocation({ lat, lng, address })
          }} />
        </MapContainer>
      </div>

      {/* Lista de endereços próximos */}
      <div className="p-4">
        <h3 className="font-semibold mb-4">
          {isLocating ? 'Buscando endereços próximos...' : 'Endereços próximos'}
        </h3>
        
        {isLocating ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {nearbyAddresses.map((location, index) => (
              <button
                key={index}
                onClick={() => onLocationSelect(location.address, location.lat, location.lng)}
                className="w-full flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-transparent hover:border-green-300 hover:bg-green-50"
              >
                <div className="text-green-500 mr-3">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="text-left flex-1">
                  <span className="block font-medium">{location.address.split(' - ')[0]}</span>
                  <span className="block text-sm text-gray-500">
                    📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LocationMap
