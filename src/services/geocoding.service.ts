// Serviço de Geocoding usando OpenStreetMap Nominatim

import { notificationService } from './notificationService'

export interface GeocodingResult {
  display_name: string
  lat: string
  lon: string
  address: {
    road?: string
    suburb?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
  }
}

export interface LocationCoordinates {
  lat: number
  lng: number
  address: string
}

class GeocodingService {
  private baseUrl = 'https://nominatim.openstreetmap.org'
  
  /**
   * Busca endereço por CEP
   * @param cep CEP no formato 12345-678 ou 12345678
   * @returns Promise com coordenadas e endereço
   */
  async searchByCEP(cep: string): Promise<LocationCoordinates | null> {
    try {
      // Remove caracteres não numéricos
      const cleanCEP = cep.replace(/\D/g, '')
      
      if (cleanCEP.length !== 8) {
        throw new Error('CEP inválido')
      }

      // Busca no Nominatim com CEP brasileiro
      const response = await fetch(
        `${this.baseUrl}/search?` + new URLSearchParams({
          format: 'json',
          postalcode: cleanCEP,
          countrycodes: 'br',
          addressdetails: '1',
          limit: '1'
        }),
        {
          headers: {
            'User-Agent': 'FacilitaApp/1.0',
            'Accept-Language': 'pt-BR,pt;q=0.9'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao buscar CEP')
      }

      const data: GeocodingResult[] = await response.json()

      if (data.length === 0) {
        return null
      }

      const result = data[0]
      
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        address: result.display_name
      }
    } catch (error) {
      notificationService.showError('Erro de CEP', 'Não foi possível buscar o endereço do CEP informado.')
      return null
    }
  }

  /**
   * Busca endereço por texto livre
   * @param query Texto de busca (rua, bairro, cidade, etc)
   * @returns Promise com array de resultados
   */
  async searchByAddress(query: string): Promise<LocationCoordinates[]> {
    try {
      if (query.length < 3) {
        return []
      }

      const response = await fetch(
        `${this.baseUrl}/search?` + new URLSearchParams({
          format: 'json',
          q: query,
          countrycodes: 'br',
          addressdetails: '1',
          limit: '5'
        }),
        {
          headers: {
            'User-Agent': 'FacilitaApp/1.0',
            'Accept-Language': 'pt-BR,pt;q=0.9'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao buscar endereço')
      }

      const data: GeocodingResult[] = await response.json()

      return data.map(result => ({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        address: result.display_name
      }))
    } catch (error) {
      notificationService.showError('Busca de endereço', 'Não foi possível buscar endereços. Verifique sua conexão.')
      return []
    }
  }

  /**
   * Busca endereço reverso (coordenadas para endereço)
   * @param lat Latitude
   * @param lng Longitude
   * @returns Promise com endereço
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/reverse?` + new URLSearchParams({
          format: 'json',
          lat: lat.toString(),
          lon: lng.toString(),
          addressdetails: '1'
        }),
        {
          headers: {
            'User-Agent': 'FacilitaApp/1.0',
            'Accept-Language': 'pt-BR,pt;q=0.9'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao buscar endereço')
      }

      const data: GeocodingResult = await response.json()
      return data.display_name
    } catch (error) {
      notificationService.showWarning('Localização', 'Não foi possível obter o endereço da localização.')
      return null
    }
  }

  /**
   * Valida se um CEP é válido
   * @param cep CEP para validar
   * @returns true se válido
   */
  isValidCEP(cep: string): boolean {
    const cleanCEP = cep.replace(/\D/g, '')
    return cleanCEP.length === 8
  }

  /**
   * Formata CEP para exibição
   * @param cep CEP para formatar
   * @returns CEP formatado (12345-678)
   */
  formatCEP(cep: string): string {
    const cleanCEP = cep.replace(/\D/g, '')
    if (cleanCEP.length !== 8) return cep
    return `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5)}`
  }
}

export const geocodingService = new GeocodingService()
