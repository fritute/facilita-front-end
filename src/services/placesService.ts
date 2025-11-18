// Serviço para buscar estabelecimentos próximos usando OpenStreetMap
export interface PlaceData {
  id: string
  name: string
  type: string
  category: string
  address: string
  lat: number
  lng: number
  distance?: number
  phone?: string
  website?: string
  opening_hours?: string
  rating?: number
}

export interface OverpassResponse {
  elements: OverpassElement[]
}

export interface OverpassElement {
  type: string
  id: number
  lat?: number
  lon?: number
  tags?: {
    name?: string
    amenity?: string
    shop?: string
    tourism?: string
    leisure?: string
    'addr:street'?: string
    'addr:housenumber'?: string
    'addr:city'?: string
    phone?: string
    website?: string
    opening_hours?: string
    'contact:phone'?: string
    'contact:website'?: string
  }
}

class PlacesService {
  private readonly OVERPASS_BASE_URL = 'https://overpass-api.de/api/interpreter'

  /**
   * Categorias de estabelecimentos mais comuns
   */
  private readonly PLACE_CATEGORIES: { [key: string]: { icon: string, label: string, color: string } } = {
    // Alimentação
    restaurant: { icon: '🍽️', label: 'Restaurante', color: '#ff6b6b' },
    fast_food: { icon: '🍔', label: 'Fast Food', color: '#ff9f43' },
    cafe: { icon: '☕', label: 'Café', color: '#8b5a3c' },
    bar: { icon: '🍺', label: 'Bar', color: '#f39c12' },
    bakery: { icon: '🥖', label: 'Padaria', color: '#d4a574' },
    
    // Compras
    supermarket: { icon: '🛒', label: 'Supermercado', color: '#2ecc71' },
    pharmacy: { icon: '💊', label: 'Farmácia', color: '#e74c3c' },
    convenience: { icon: '🏪', label: 'Conveniência', color: '#3498db' },
    clothes: { icon: '👕', label: 'Roupas', color: '#9b59b6' },
    electronics: { icon: '📱', label: 'Eletrônicos', color: '#34495e' },
    
    // Serviços
    bank: { icon: '🏦', label: 'Banco', color: '#2c3e50' },
    atm: { icon: '💳', label: 'Caixa Eletrônico', color: '#7f8c8d' },
    hospital: { icon: '🏥', label: 'Hospital', color: '#e74c3c' },
    clinic: { icon: '🩺', label: 'Clínica', color: '#e67e22' },
    fuel: { icon: '⛽', label: 'Posto de Combustível', color: '#f1c40f' },
    
    // Entretenimento
    cinema: { icon: '🎬', label: 'Cinema', color: '#8e44ad' },
    gym: { icon: '💪', label: 'Academia', color: '#e74c3c' },
    park: { icon: '🌳', label: 'Parque', color: '#27ae60' },
    
    // Outros
    school: { icon: '🏫', label: 'Escola', color: '#3498db' },
    university: { icon: '🎓', label: 'Universidade', color: '#2980b9' },
    hotel: { icon: '🏨', label: 'Hotel', color: '#16a085' },
    default: { icon: '📍', label: 'Local', color: '#95a5a6' }
  }

  /**
   * Busca estabelecimentos próximos usando Overpass API
   */
  async getNearbyPlaces(lat: number, lng: number, radiusKm: number = 1): Promise<PlaceData[]> {
    try {
      console.log(`🔍 Buscando estabelecimentos próximos a ${lat}, ${lng} (raio: ${radiusKm}km)`)
      
      // Query Overpass para buscar estabelecimentos
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"~"^(restaurant|fast_food|cafe|bar|bank|atm|hospital|pharmacy|fuel|school|university|cinema|gym)$"](around:${radiusKm * 1000},${lat},${lng});
          node["shop"~"^(supermarket|convenience|bakery|clothes|electronics)$"](around:${radiusKm * 1000},${lat},${lng});
          node["tourism"~"^(hotel|attraction)$"](around:${radiusKm * 1000},${lat},${lng});
          node["leisure"~"^(park|fitness_centre)$"](around:${radiusKm * 1000},${lat},${lng});
        );
        out body;
      `

      const response = await fetch(this.OVERPASS_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar estabelecimentos')
      }

      const data: OverpassResponse = await response.json()
      
      if (!data.elements || data.elements.length === 0) {
        console.log('⚠️ Nenhum estabelecimento encontrado na região')
        return []
      }

      // Processar resultados
      const places: PlaceData[] = data.elements
        .filter(element => element.lat && element.lon && element.tags?.name)
        .map(element => this.processOverpassElement(element, lat, lng))
        .filter(place => place.name && place.name.trim().length > 0)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 50) // Limitar a 50 resultados

      console.log(`✅ ${places.length} estabelecimentos encontrados`)
      return places
    } catch (error) {
      console.error('❌ Erro ao buscar estabelecimentos:', error)
      return []
    }
  }

  /**
   * Processa um elemento do Overpass para PlaceData
   */
  private processOverpassElement(element: OverpassElement, centerLat: number, centerLng: number): PlaceData {
    const tags = element.tags || {}
    const lat = element.lat!
    const lng = element.lon!
    
    // Determinar categoria
    const category = this.determineCategory(tags)
    const categoryInfo = this.PLACE_CATEGORIES[category] || this.PLACE_CATEGORIES.default
    
    // Montar endereço
    const address = this.buildAddress(tags)
    
    // Calcular distância
    const distance = this.calculateDistance(centerLat, centerLng, lat, lng)
    
    return {
      id: `osm-${element.id}`,
      name: tags.name || 'Local sem nome',
      type: categoryInfo.label,
      category: category,
      address: address,
      lat: lat,
      lng: lng,
      distance: distance,
      phone: tags.phone || tags['contact:phone'],
      website: tags.website || tags['contact:website'],
      opening_hours: tags.opening_hours
    }
  }

  /**
   * Determina a categoria do estabelecimento
   */
  private determineCategory(tags: any): string {
    // Verificar amenity primeiro
    if (tags.amenity) {
      if (this.PLACE_CATEGORIES[tags.amenity]) {
        return tags.amenity
      }
    }
    
    // Verificar shop
    if (tags.shop) {
      if (this.PLACE_CATEGORIES[tags.shop]) {
        return tags.shop
      }
    }
    
    // Verificar tourism
    if (tags.tourism === 'hotel') {
      return 'hotel'
    }
    
    // Verificar leisure
    if (tags.leisure === 'fitness_centre') {
      return 'gym'
    }
    if (tags.leisure === 'park') {
      return 'park'
    }
    
    return 'default'
  }

  /**
   * Monta o endereço a partir das tags
   */
  private buildAddress(tags: any): string {
    const parts = []
    
    if (tags['addr:street']) {
      let street = tags['addr:street']
      if (tags['addr:housenumber']) {
        street += `, ${tags['addr:housenumber']}`
      }
      parts.push(street)
    }
    
    if (tags['addr:city']) {
      parts.push(tags['addr:city'])
    }
    
    return parts.length > 0 ? parts.join(' - ') : 'Endereço não disponível'
  }

  /**
   * Calcula distância entre dois pontos em km
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return Math.round(R * c * 1000) / 1000 // Arredondar para 3 casas decimais
  }

  /**
   * Busca estabelecimentos por categoria específica
   */
  async getPlacesByCategory(lat: number, lng: number, category: string, radiusKm: number = 2): Promise<PlaceData[]> {
    try {
      console.log(`🔍 Buscando ${category} próximos a ${lat}, ${lng}`)
      
      let amenityFilter = ''
      let shopFilter = ''
      
      switch (category) {
        case 'food':
          amenityFilter = 'restaurant|fast_food|cafe|bar'
          shopFilter = 'bakery'
          break
        case 'shopping':
          shopFilter = 'supermarket|convenience|clothes|electronics'
          break
        case 'health':
          amenityFilter = 'hospital|pharmacy|clinic'
          break
        case 'services':
          amenityFilter = 'bank|atm|fuel'
          break
        default:
          return this.getNearbyPlaces(lat, lng, radiusKm)
      }
      
      const overpassQuery = `
        [out:json][timeout:25];
        (
          ${amenityFilter ? `node["amenity"~"^(${amenityFilter})$"](around:${radiusKm * 1000},${lat},${lng});` : ''}
          ${shopFilter ? `node["shop"~"^(${shopFilter})$"](around:${radiusKm * 1000},${lat},${lng});` : ''}
        );
        out body;
      `

      const response = await fetch(this.OVERPASS_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar estabelecimentos por categoria')
      }

      const data: OverpassResponse = await response.json()
      
      const places: PlaceData[] = data.elements
        .filter(element => element.lat && element.lon && element.tags?.name)
        .map(element => this.processOverpassElement(element, lat, lng))
        .filter(place => place.name && place.name.trim().length > 0)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 30)

      console.log(`✅ ${places.length} estabelecimentos de ${category} encontrados`)
      return places
    } catch (error) {
      console.error(`❌ Erro ao buscar ${category}:`, error)
      return []
    }
  }

  /**
   * Obtém informações da categoria
   */
  getCategoryInfo(category: string) {
    return this.PLACE_CATEGORIES[category] || this.PLACE_CATEGORIES.default
  }

  /**
   * Lista todas as categorias disponíveis
   */
  getAvailableCategories() {
    return Object.keys(this.PLACE_CATEGORIES).filter(key => key !== 'default')
  }
}

export const placesService = new PlacesService()
