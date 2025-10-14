// LocationMap.tsx
import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Navigation, FileText, ArrowLeft } from 'lucide-react'

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

// Componente para controlar o mapa
function MapController({ center, map, setMap }: { center: [number, number], map: any, setMap: (map: any) => void }) {
  const mapInstance = useMapEvents({})
  
  React.useEffect(() => {
    if (mapInstance && !map) {
      setMap(mapInstance)
    }
  }, [mapInstance, map, setMap])
  
  React.useEffect(() => {
    if (mapInstance) {
      mapInstance.setView(center, mapInstance.getZoom())
    }
  }, [center, mapInstance])
  
  return null
}

const LocationMap: React.FC<LocationMapProps> = ({ onLocationSelect, onScreenChange }) => {
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-23.5505, -46.6333])
  const [nearbyAddresses, setNearbyAddresses] = useState<Location[]>([])
  const [isLocating, setIsLocating] = useState(false)
  const [clickedLocation, setClickedLocation] = useState<Location | null>(null)
  const [map, setMap] = useState<any>(null)

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

    console.log('🌍 Geolocalização disponível, verificando permissões...')
    
    // Verificar permissões primeiro (se disponível)
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        console.log(`🔐 Status da permissão: ${permission.state}`)
        
        if (permission.state === 'denied') {
          console.warn('❌ Permissão de localização negada pelo usuário')
          setMapCenter([defaultLat, defaultLng])
          setUserLocation({ lat: defaultLat, lng: defaultLng, address: 'São Paulo, SP (permissão negada)' })
          await getNearbyAddresses(defaultLat, defaultLng)
          setIsLocating(false)
          return
        }
      } catch (permError) {
        console.warn('⚠️ Erro ao verificar permissões:', permError)
      }
    }

    console.log('📡 Solicitando localização atual...')
    
    // Tentar obter localização
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy, timestamp } = position.coords
        console.log(`✅ Localização obtida com sucesso!`)
        console.log(`📍 Coordenadas: ${latitude}, ${longitude}`)
        console.log(`🎯 Precisão: ${accuracy}m`)
        console.log(`⏰ Timestamp: ${new Date(timestamp).toLocaleString()}`)
        
        setMapCenter([latitude, longitude])
        setUserLocation({ lat: latitude, lng: longitude, address: 'Obtendo endereço da sua localização...' })
        
        await getAddressFromCoords(latitude, longitude, true)
        setIsLocating(false)
      },
      async (error) => {
        console.error('❌ Erro ao obter localização:')
        console.error(`Código: ${error.code}`)
        console.error(`Mensagem: ${error.message}`)
        
        let errorMessage = 'São Paulo, SP'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += ' (permissão negada - clique no ícone de localização no navegador)'
            console.log('💡 Dica: Verifique se o site tem permissão para acessar localização')
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += ' (localização indisponível)'
            console.log('💡 Dica: Verifique sua conexão com internet e GPS')
            break
          case error.TIMEOUT:
            errorMessage += ' (tempo esgotado)'
            console.log('💡 Dica: Tente novamente, pode estar demorando para obter sinal GPS')
            break
          default:
            errorMessage += ' (erro desconhecido)'
            break
        }
        
        setMapCenter([defaultLat, defaultLng])
        setUserLocation({ lat: defaultLat, lng: defaultLng, address: errorMessage })
        await getNearbyAddresses(defaultLat, defaultLng)
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Aumentado para 15 segundos
        maximumAge: 60000 // Reduzido para 1 minuto para forçar nova leitura
      }
    )
  }

  // Função para obter endereço a partir de coordenadas
  const getAddressFromCoords = async (lat: number, lng: number, isUserLocation = true) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      
      if (response.ok) {
        const data = await response.json()
        const address = data.display_name || 'Endereço não encontrado'
        
        if (isUserLocation) {
          setUserLocation(prev => prev ? { ...prev, address } : { lat, lng, address })
          await getNearbyAddresses(lat, lng)
        } else {
          // Para cliques no mapa, criar um marcador temporário
          setClickedLocation({ lat, lng, address })
          console.log(`📍 Marcador adicionado em: ${address}`)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar endereço:', error)
    }
  }

  // Função para navegar até um local específico
  const navigateToLocation = (lat: number, lng: number, address: string) => {
    console.log(`🗺️ Navegando para: ${address}`)
    
    // Atualizar o centro do mapa
    setMapCenter([lat, lng])
    
    // Se o mapa estiver disponível, fazer pan suave
    if (map) {
      map.flyTo([lat, lng], 16, {
        animate: true,
        duration: 1.5
      })
    }
    
    // Definir como localização clicada para mostrar marcador
    setClickedLocation({ lat, lng, address })
    
    // Buscar endereços próximos da nova localização
    getNearbyAddresses(lat, lng)
  }

  // Função para buscar endereços próximos
  const getNearbyAddresses = async (lat: number, lng: number) => {
    try {
      console.log(`🔍 Buscando endereços próximos a: ${lat}, ${lng}`)
      
      // Buscar pontos de interesse próximos usando Overpass API
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"~"^(restaurant|cafe|pharmacy|hospital|bank|school|supermarket|gas_station)$"](around:2000,${lat},${lng});
          node["shop"~"^(supermarket|convenience|bakery|pharmacy)$"](around:2000,${lat},${lng});
          node["leisure"~"^(park|playground)$"](around:1000,${lat},${lng});
        );
        out geom;
      `
      
      try {
        const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: overpassQuery,
          headers: {
            'Content-Type': 'text/plain',
          },
        })
        
        if (overpassResponse.ok) {
          const overpassData = await overpassResponse.json()
          console.log('📍 Pontos encontrados via Overpass:', overpassData.elements?.length || 0)
          
          if (overpassData.elements && overpassData.elements.length > 0) {
            const nearbyPOIs = overpassData.elements
              .slice(0, 8) // Limitar a 8 resultados
              .map((element: any) => {
                const name = element.tags?.name || element.tags?.amenity || element.tags?.shop || 'Local próximo'
                const type = element.tags?.amenity || element.tags?.shop || element.tags?.leisure || 'local'
                return {
                  lat: element.lat,
                  lng: element.lon,
                  address: `${name} - ${type.charAt(0).toUpperCase() + type.slice(1)}`
                }
              })
            
            setNearbyAddresses(nearbyPOIs)
            return
          }
        }
      } catch (overpassError) {
        console.warn('⚠️ Erro na API Overpass, usando busca alternativa:', overpassError)
      }
      
      // Temporariamente desabilitado devido a problemas de CORS com Nominatim
      // Usando dados mock para desenvolvimento
      console.log('📍 Usando endereços mock para evitar problemas de CORS')
      
      const nearbyResults: Location[] = [
        {
          lat: lat + 0.001,
          lng: lng + 0.001,
          address: 'Farmácia Droga Raia - Rua Augusta, 1234, São Paulo'
        },
        {
          lat: lat - 0.001,
          lng: lng + 0.002,
          address: 'Supermercado Pão de Açúcar - Av. Paulista, 567, São Paulo'
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
          address: 'Banco Itaú - Rua da Consolação, 789, São Paulo'
        },
        {
          lat: lat - 0.001,
          lng: lng - 0.002,
          address: 'Restaurante Família Mancini - Rua Avanhandava, 81'
        }
      ]
      
      console.log(`📍 ${nearbyResults.length} endereços mock carregados`)
      setNearbyAddresses(nearbyResults.slice(0, 8))
      
    } catch (error) {
      console.error('❌ Erro ao buscar endereços próximos:', error)
      
      // Fallback final com endereços mock
      const mockNearbyAddresses: Location[] = [
        { lat: lat + 0.002, lng: lng + 0.001, address: 'Local próximo 1' },
        { lat: lat - 0.001, lng: lng + 0.002, address: 'Local próximo 2' },
        { lat: lat + 0.001, lng: lng - 0.001, address: 'Local próximo 3' },
        { lat: lat - 0.002, lng: lng - 0.001, address: 'Local próximo 4' },
      ]
      
      setNearbyAddresses(mockNearbyAddresses)
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

  // Função para forçar solicitação de localização
  const forceLocationRequest = async () => {
    console.log('🔄 Forçando nova solicitação de localização...')
    
    // Limpar cache de localização
    if ('geolocation' in navigator) {
      // Tentar com configurações mais agressivas
      setIsLocating(true)
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords
          console.log(`✅ Localização forçada obtida: ${latitude}, ${longitude} (${accuracy}m)`)
          
          setMapCenter([latitude, longitude])
          setUserLocation({ lat: latitude, lng: longitude, address: 'Obtendo endereço da sua localização...' })
          
          await getAddressFromCoords(latitude, longitude, true)
          setIsLocating(false)
        },
        async (error) => {
          console.error('❌ Falha na solicitação forçada:', error.message)
          
          // Mostrar instruções específicas baseadas no erro
          let instructions = ''
          switch (error.code) {
            case error.PERMISSION_DENIED:
              instructions = 'Clique no ícone 🔒 ou 📍 na barra de endereços do navegador e permita o acesso à localização'
              break
            case error.POSITION_UNAVAILABLE:
              instructions = 'Verifique se o GPS está ativado e você tem conexão com internet'
              break
            case error.TIMEOUT:
              instructions = 'Tente sair para um local com melhor sinal GPS'
              break
          }
          
          alert(`Não foi possível obter sua localização.\n\n${instructions}`)
          setIsLocating(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0 // Força nova leitura
        }
      )
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

          <MapClickHandler onMapClick={async (lat, lng) => {
            console.log(`📍 Clique no mapa: ${lat}, ${lng}`)
            await getAddressFromCoords(lat, lng, false)
          }} />
          
          <MapController center={mapCenter} map={map} setMap={setMap} />
        </MapContainer>
        
        {/* Overlay com informações */}
        <div className="absolute top-4 left-4 right-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            {isLocating ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2"></div>
                Obtendo sua localização...
              </div>
            ) : 'Escolha o endereço para receber o pedido'}
          </h2>
          {userLocation && !isLocating && (
            <div className="mb-1">
              <p className="text-sm text-gray-600 truncate">
                📍 {userLocation.address}
              </p>
              {(userLocation.address.includes('padrão') || userLocation.address.includes('negada') || userLocation.address.includes('indisponível')) && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                  <p className="text-xs text-orange-700 mb-2">
                    ⚠️ {userLocation.address.includes('negada') ? 'Permissão de localização negada' : 'Usando localização padrão'}
                  </p>
                  <button
                    onClick={forceLocationRequest}
                    className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 transition-colors"
                  >
                    🔄 Tentar Novamente
                  </button>
                </div>
              )}
            </div>
          )}
          {clickedLocation && (
            <p className="text-sm text-red-600 truncate">
              🎯 Local selecionado: {clickedLocation.address.split(',')[0]}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            💡 Clique no mapa para marcar um local ou nos endereços abaixo para selecioná-los
          </p>
        </div>
        
        {/* Botões de controle */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
          {/* Botão para limpar marcador */}
          {clickedLocation && (
            <button
              onClick={() => setClickedLocation(null)}
              className="bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors"
              title="Remover marcador"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {/* Botão para recarregar localização */}
          <button
            onClick={forceLocationRequest}
            disabled={isLocating}
            className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
            title="Obter minha localização atual"
          >
            <div className={isLocating ? 'animate-spin' : ''}>
              <MapPin />
            </div>
          </button>
        </div>
      </div>

      {/* Search and addresses */}
      <div className="p-4">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search />
          </div>
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
                  className="w-full flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-transparent hover:border-green-300 hover:bg-green-50"
                >
                  <div className="text-green-500 mr-3">
                    <MapPin />
                  </div>
                  <div className="text-left flex-1">
                    <span className="block font-medium">{location.address.split(',')[0]}</span>
                    <span className="block text-sm text-gray-500">
                      {location.address.split(',').slice(1).join(',').trim()}
                    </span>
                  </div>
                  <div className="text-green-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
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
            <span className="text-xs font-medium">Pedidos</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default LocationMap