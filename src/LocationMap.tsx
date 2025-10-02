// LocationMap.tsx
import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

  // Função para obter a localização do usuário
  const getUserLocation = () => {
    setIsLocating(true)
    
    // Usar localização padrão (Carapicuíba, SP) diretamente
    const defaultLat = -23.5235
    const defaultLng = -46.8401
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setMapCenter([latitude, longitude])
          setUserLocation({ lat: latitude, lng: longitude, address: '' })
          
          await getAddressFromCoords(latitude, longitude)
          setIsLocating(false)
        },
        async (error) => {
          console.log('Usando localização padrão:', error.message)
          setMapCenter([defaultLat, defaultLng])
          setUserLocation({ lat: defaultLat, lng: defaultLng, address: 'Carapicuíba, SP' })
          await getAddressFromCoords(defaultLat, defaultLng)
          setIsLocating(false)
        }
      )
    } else {
      // Usar localização padrão se geolocalização não for suportada
      setMapCenter([defaultLat, defaultLng])
      setUserLocation({ lat: defaultLat, lng: defaultLng, address: 'Carapicuíba, SP' })
      getNearbyAddresses(defaultLat, defaultLng)
      setIsLocating(false)
    }
  }

  // Função para obter endereço a partir de coordenadas
  const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      
      if (response.ok) {
        const data = await response.json()
        const address = data.display_name || 'Endereço não encontrado'
        
        setUserLocation(prev => prev ? { ...prev, address } : { lat, lng, address })
        await getNearbyAddresses(lat, lng)
      }
    } catch (error) {
      console.error('Erro ao buscar endereço:', error)
    }
  }

  // Função para buscar endereços próximos
  const getNearbyAddresses = async (lat: number, lng: number) => {
    try {
      const mockNearbyAddresses: Location[] = [
        { lat: lat + 0.001, lng: lng + 0.001, address: 'Rua Vitória, cohab 2, Carapicuíba' },
        { lat: lat + 0.002, lng: lng - 0.001, address: 'Rua Manaus, cohab 2, Carapicuíba' },
        { lat: lat - 0.001, lng: lng + 0.002, address: 'Rua Belém, cohab 2, Carapicuíba' },
        { lat: lat - 0.002, lng: lng - 0.002, address: 'Rua Paraná, cohab 1, Carapicuíba' },
      ]
      
      setNearbyAddresses(mockNearbyAddresses)
    } catch (error) {
      console.error('Erro ao buscar endereços próximos:', error)
    }
  }

  // Função para buscar endereço por texto
  const searchAddress = async (query: string) => {
    if (!query.trim()) return
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      )
      
      if (response.ok) {
        const data = await response.json()
        const addresses: Location[] = data.map((item: any) => ({
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          address: item.display_name
        }))
        
        setNearbyAddresses(addresses)
        
        if (addresses.length > 0) {
          setMapCenter([addresses[0].lat, addresses[0].lng])
        }
      }
    } catch (error) {
      console.error('Erro ao buscar endereço:', error)
    }
  }

  // Efeito para obter localização quando o componente montar
  useEffect(() => {
    getUserLocation()
  }, [])

  // Ícones SVG inline (ou você pode importar de um arquivo separado)
  const MapPin = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )

  const Search = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )

  const FileText = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Map area */}
      <div className="h-96 relative">
        <MapContainer 
          center={mapCenter} 
          zoom={15} 
          style={{ height: '100%', width: '100%' }}
          className="z-0"
          preferCanvas={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            subdomains={['a', 'b', 'c']}
            crossOrigin={true}
            errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
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
          
          <MapClickHandler onMapClick={async (lat, lng) => {
            await getAddressFromCoords(lat, lng)
          }} />
        </MapContainer>
        
        {/* Overlay com informações */}
        <div className="absolute top-4 left-4 right-4 bg-white bg-opacity-90 p-4 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            {isLocating ? 'Obtendo sua localização...' : 'Escolha o endereço para receber o pedido'}
          </h2>
          {userLocation && !isLocating && (
            <p className="text-sm text-gray-600 truncate">
              📍 {userLocation.address}
            </p>
          )}
        </div>
        
        {/* Botão para recarregar localização */}
        <button
          onClick={getUserLocation}
          disabled={isLocating}
          className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50"
        >
          <MapPin />
        </button>
      </div>

      {/* Search and addresses */}
      <div className="p-4">
        <div className="relative mb-6">
          <Search />
          <input
            type="text"
            placeholder="Buscar endereço..."
            onChange={(e) => {
              const query = e.target.value
              if (query.length > 2) {
                searchAddress(query)
              }
            }}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
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
                  className="w-full flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-transparent hover:border-green-300"
                >
                  <MapPin />
                  <div className="text-left">
                    <span className="block font-medium">{location.address.split(',')[0]}</span>
                    <span className="block text-sm text-gray-500">
                      {location.address.split(',').slice(1).join(',').trim()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex justify-center space-x-8">
          <button className="flex flex-col items-center text-green-500">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-1">
              <MapPin />
            </div>
            <span className="text-xs font-medium">Mapa</span>
          </button>
          <button 
            onClick={() => onScreenChange('service-create')}
            className="flex flex-col items-center text-gray-400"
          >
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mb-1">
              <FileText />
            </div>
            <span className="text-xs">Serviço</span>
          </button>
          <button className="flex flex-col items-center text-gray-400">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mb-1">
              <span className="text-gray-600 font-bold">$</span>
            </div>
            <span className="text-xs">Pagamento</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default LocationMap