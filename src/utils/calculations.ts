// Utilitários de cálculos

import { PRICING } from '../config/constants'

/**
 * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
 * @param lat1 Latitude do ponto 1
 * @param lng1 Longitude do ponto 1
 * @param lat2 Latitude do ponto 2
 * @param lng2 Longitude do ponto 2
 * @returns Distância em quilômetros
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371 // Raio da Terra em km
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lng2 - lng1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Converte graus para radianos
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180)
}

/**
 * Calcula o preço do serviço baseado na distância
 * @param distanceKm Distância em quilômetros
 * @returns Preço em reais
 */
export const calculateServicePrice = (distanceKm: number): number => {
  return PRICING.BASE_PRICE + distanceKm * PRICING.PRICE_PER_KM
}

/**
 * Calcula o tempo estimado de entrega baseado na distância
 * @param distanceKm Distância em quilômetros
 * @returns Tempo em minutos
 */
export const calculateEstimatedTime = (distanceKm: number): number => {
  // Assume velocidade média de 30 km/h no trânsito urbano
  const averageSpeedKmH = 30
  const timeInHours = distanceKm / averageSpeedKmH
  return Math.ceil(timeInHours * 60) // Converte para minutos e arredonda para cima
}

/**
 * Calcula a porcentagem de desconto
 */
export const calculateDiscount = (originalPrice: number, discountPercent: number): number => {
  return originalPrice * (discountPercent / 100)
}

/**
 * Calcula o preço final com desconto
 */
export const calculateFinalPrice = (originalPrice: number, discountPercent: number): number => {
  const discount = calculateDiscount(originalPrice, discountPercent)
  return originalPrice - discount
}
