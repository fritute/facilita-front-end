// Serviço de geocodificação usando ViaCEP e OpenStreetMap
export interface LocationData {
  address: string
  lat: number
  lng: number
  city?: string
  state?: string
  zipCode?: string
}

export interface ViaCEPResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
  erro?: boolean
}

export interface NominatimResponse {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  display_name: string
  address: {
    house_number?: string
    road?: string
    neighbourhood?: string
    city?: string
    town?: string
    village?: string
    state?: string
    postcode?: string
    country?: string
  }
}

class GeocodingService {
  private readonly VIACEP_BASE_URL = 'https://viacep.com.br/ws'
  private readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'

  /**
   * Busca endereço por CEP usando ViaCEP
   */
  async getAddressByCEP(cep: string): Promise<ViaCEPResponse | null> {
    try {
      // Remove caracteres não numéricos do CEP
      const cleanCEP = cep.replace(/\D/g, '')
      
      if (cleanCEP.length !== 8) {
        throw new Error('CEP deve conter 8 dígitos')
      }

      console.log('🔍 Buscando endereço por CEP:', cleanCEP)
      
      const response = await fetch(`${this.VIACEP_BASE_URL}/${cleanCEP}/json/`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar CEP')
      }

      const data: ViaCEPResponse = await response.json()
      
      if (data.erro) {
        throw new Error('CEP não encontrado')
      }

      console.log('✅ Endereço encontrado:', data)
      return data
    } catch (error) {
      console.error('❌ Erro ao buscar CEP:', error)
      return null
    }
  }

  /**
   * Busca coordenadas por endereço usando Nominatim (OpenStreetMap)
   */
  async getCoordinatesByAddress(address: string): Promise<LocationData | null> {
    try {
      console.log('🌍 Buscando coordenadas para:', address)
      
      // Adicionar "Brasil" ao final da busca para melhor precisão
      const searchQuery = `${address}, Brasil`
      
      const response = await fetch(
        `${this.NOMINATIM_BASE_URL}/search?` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=1&` +
        `countrycodes=br`
      )
      
      if (!response.ok) {
        throw new Error('Erro ao buscar coordenadas')
      }

      const data: NominatimResponse[] = await response.json()
      
      if (!data || data.length === 0) {
        throw new Error('Endereço não encontrado')
      }

      const result = data[0]
      const locationData: LocationData = {
        address: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        city: result.address.city || result.address.neighbourhood,
        state: result.address.state,
        zipCode: result.address.postcode
      }

      console.log('✅ Coordenadas encontradas:', locationData)
      return locationData
    } catch (error) {
      console.error('❌ Erro ao buscar coordenadas:', error)
      return null
    }
  }

  /**
   * Busca múltiplas opções de endereços para o usuário escolher
   */
  async getMultipleAddressOptions(address: string, limit: number = 5): Promise<LocationData[]> {
    try {
      console.log('🌍 Buscando múltiplas opções para:', address)
      
      // Adicionar "Brasil" ao final da busca para melhor precisão
      const searchQuery = `${address}, Brasil`
      
      const response = await fetch(
        `${this.NOMINATIM_BASE_URL}/search?` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=${limit}&` +
        `countrycodes=br`
      )
      
      if (!response.ok) {
        throw new Error('Erro ao buscar endereços')
      }

      const data: NominatimResponse[] = await response.json()
      
      if (!data || data.length === 0) {
        return []
      }

      const locations: LocationData[] = data.map(result => ({
        address: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        city: result.address.city || result.address.neighbourhood || result.address.town || result.address.village,
        state: result.address.state,
        zipCode: result.address.postcode
      }))

      console.log(`✅ ${locations.length} opções encontradas:`, locations)
      return locations
    } catch (error) {
      console.error('❌ Erro ao buscar múltiplas opções:', error)
      return []
    }
  }

  /**
   * Busca completa: CEP -> Endereço -> Coordenadas
   */
  async getLocationByCEP(cep: string): Promise<LocationData | null> {
    try {
      // 1. Buscar endereço pelo CEP
      const addressData = await this.getAddressByCEP(cep)
      if (!addressData) {
        return null
      }

      // 2. Montar endereço completo
      const fullAddress = [
        addressData.logradouro,
        addressData.bairro,
        addressData.localidade,
        addressData.uf
      ].filter(Boolean).join(', ')

      // 3. Buscar coordenadas pelo endereço
      const locationData = await this.getCoordinatesByAddress(fullAddress)
      if (!locationData) {
        return null
      }

      // 4. Retornar dados completos
      return {
        ...locationData,
        address: fullAddress,
        city: addressData.localidade,
        state: addressData.uf,
        zipCode: addressData.cep
      }
    } catch (error) {
      console.error('❌ Erro na busca completa por CEP:', error)
      return null
    }
  }

  /**
   * Detecta se o input é um CEP e faz a busca apropriada
   */
  async searchLocation(input: string): Promise<LocationData | null> {
    try {
      const cleanInput = input.trim()
      
      // Verificar se é um CEP (8 dígitos com ou sem formatação)
      const cepPattern = /^\d{5}-?\d{3}$/
      if (cepPattern.test(cleanInput.replace(/\D/g, ''))) {
        console.log('🔍 Input detectado como CEP')
        return await this.getLocationByCEP(cleanInput)
      }
      
      // Se não for CEP, buscar como endereço
      console.log('🔍 Input detectado como endereço')
      return await this.getCoordinatesByAddress(cleanInput)
    } catch (error) {
      console.error('❌ Erro na busca de localização:', error)
      return null
    }
  }

  /**
   * Busca múltiplas opções de localização para o usuário escolher
   */
  async searchMultipleLocations(input: string, limit: number = 5): Promise<LocationData[]> {
    try {
      const cleanInput = input.trim()
      
      // Verificar se é um CEP (8 dígitos com ou sem formatação)
      const cepPattern = /^\d{5}-?\d{3}$/
      if (cepPattern.test(cleanInput.replace(/\D/g, ''))) {
        console.log('🔍 Input detectado como CEP - buscando endereço único')
        const singleResult = await this.getLocationByCEP(cleanInput)
        return singleResult ? [singleResult] : []
      }
      
      // Se não for CEP, buscar múltiplas opções de endereço
      console.log('🔍 Input detectado como endereço - buscando múltiplas opções')
      return await this.getMultipleAddressOptions(cleanInput, limit)
    } catch (error) {
      console.error('❌ Erro na busca de múltiplas localizações:', error)
      return []
    }
  }

  /**
   * Valida se um CEP está no formato correto
   */
  isValidCEP(cep: string): boolean {
    const cleanCEP = cep.replace(/\D/g, '')
    return cleanCEP.length === 8
  }

  /**
   * Formata CEP para exibição (12345-678)
   */
  formatCEP(cep: string): string {
    const cleanCEP = cep.replace(/\D/g, '')
    if (cleanCEP.length === 8) {
      return `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5)}`
    }
    return cep
  }
}

export const geocodingService = new GeocodingService()
