import { geocodingService, LocationData } from '../services/geocodingService'

/**
 * Utilitários para trabalhar com localização
 */

/**
 * Busca coordenadas por endereço ou CEP
 */
export async function searchLocationWithFeedback(
  input: string,
  onLoading?: (loading: boolean) => void,
  onError?: (error: string) => void
): Promise<LocationData | null> {
  try {
    onLoading?.(true)
    
    if (!input.trim()) {
      onError?.('Digite um endereço ou CEP para buscar')
      return null
    }

    const result = await geocodingService.searchLocation(input.trim())
    
    if (!result) {
      onError?.('Não foi possível encontrar a localização. Verifique o endereço ou CEP.')
      return null
    }

    return result
  } catch (error: any) {
    console.error('❌ Erro ao buscar localização:', error)
    onError?.('Erro ao buscar localização. Tente novamente.')
    return null
  } finally {
    onLoading?.(false)
  }
}

/**
 * Valida se um texto parece ser um CEP
 */
export function looksLikeCEP(input: string): boolean {
  const cleaned = input.replace(/\D/g, '')
  return cleaned.length === 8 && /^\d{8}$/.test(cleaned)
}

/**
 * Formata um endereço para exibição
 */
export function formatAddress(location: LocationData): string {
  const parts = []
  
  if (location.address) {
    parts.push(location.address)
  }
  
  if (location.city && location.state) {
    parts.push(`${location.city}, ${location.state}`)
  }
  
  if (location.zipCode) {
    parts.push(`CEP: ${location.zipCode}`)
  }
  
  return parts.join(' - ')
}

/**
 * Cria um objeto de coordenadas compatível com o app
 */
export function createCoordinates(location: LocationData): { lat: number, lng: number } {
  return {
    lat: location.lat,
    lng: location.lng
  }
}

/**
 * Valida se as coordenadas são válidas para o Brasil
 */
export function isValidBrazilianCoordinates(lat: number, lng: number): boolean {
  // Brasil está aproximadamente entre:
  // Latitude: -33.75 a 5.27
  // Longitude: -73.98 a -28.84
  return (
    lat >= -33.75 && lat <= 5.27 &&
    lng >= -73.98 && lng <= -28.84
  )
}

/**
 * Calcula a distância aproximada entre duas coordenadas (em km)
 */
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371 // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Exemplo de uso das funções
 */
export const locationExamples = {
  // CEPs de exemplo para teste
  ceps: [
    '01310-100', // Av. Paulista, São Paulo
    '20040-020', // Centro, Rio de Janeiro
    '70040-010', // Brasília, DF
    '80010-000', // Centro, Curitiba
    '90010-150'  // Centro, Porto Alegre
  ],
  
  // Endereços de exemplo para teste
  addresses: [
    'Avenida Paulista, 1000, São Paulo, SP',
    'Copacabana, Rio de Janeiro, RJ',
    'Setor Comercial Sul, Brasília, DF',
    'Centro, Curitiba, PR',
    'Centro Histórico, Porto Alegre, RS'
  ]
}
