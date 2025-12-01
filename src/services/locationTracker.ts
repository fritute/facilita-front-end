// Serviço para simular tracking de localização em tempo real
import websocketService from './websocketService'

interface LocationTrackerConfig {
  serviceId: number
  userId: number
  intervalMs?: number // Intervalo em milissegundos (padrão: 5 segundos)
  simulateMovement?: boolean // Se deve simular movimento
}

class LocationTracker {
  private intervalId: NodeJS.Timeout | null = null
  private isTracking = false
  private currentPosition = { lat: -23.5505, lng: -46.6333 } // São Paulo como padrão
  private config: LocationTrackerConfig | null = null

  // Iniciar tracking de localização
  startTracking(config: LocationTrackerConfig) {
    if (this.isTracking) {
      console.log('⚠️ Tracking já está ativo')
      return
    }

    this.config = config
    this.isTracking = true

    console.log('📍 Iniciando tracking de localização:', config)

    // Definir intervalo (padrão: 5 segundos)
    const interval = config.intervalMs || 5000

    // Obter localização inicial
    this.getCurrentLocation().then(position => {
      this.currentPosition = position
      this.sendLocationUpdate()
    })

    // Enviar localização periodicamente
    this.intervalId = setInterval(() => {
      if (config.simulateMovement) {
        this.simulateMovement()
      }
      this.sendLocationUpdate()
    }, interval)

    console.log(`✅ Tracking iniciado - enviando localização a cada ${interval/1000}s`)
  }

  // Parar tracking
  stopTracking() {
    if (!this.isTracking) {
      return
    }

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.isTracking = false
    this.config = null

    console.log('🛑 Tracking de localização parado')
  }

  // Obter localização atual (GPS ou simulada)
  private async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
          },
          (error) => {
            console.log('⚠️ Erro ao obter GPS, usando localização simulada:', error.message)
            // Usar localização simulada em São Paulo
            resolve({ lat: -23.5505, lng: -46.6333 })
          },
          { timeout: 5000, enableHighAccuracy: true }
        )
      } else {
        console.log('⚠️ Geolocalização não suportada, usando localização simulada')
        resolve({ lat: -23.5505, lng: -46.6333 })
      }
    })
  }

  // Simular movimento (para testes)
  private simulateMovement() {
    // Simular movimento pequeno (aproximadamente 50-100 metros)
    const deltaLat = (Math.random() - 0.5) * 0.001 // ~100m
    const deltaLng = (Math.random() - 0.5) * 0.001 // ~100m

    this.currentPosition.lat += deltaLat
    this.currentPosition.lng += deltaLng

    console.log('🚶 Simulando movimento para:', this.currentPosition)
  }

  // Enviar atualização de localização via WebSocket
  private sendLocationUpdate() {
    if (!this.config || !websocketService.getConnectionStatus()) {
      console.log('⚠️ WebSocket não conectado, pulando envio de localização')
      return
    }

    const locationData = {
      servicoId: this.config.serviceId,
      latitude: this.currentPosition.lat,
      longitude: this.currentPosition.lng,
      userId: this.config.userId
    }

    console.log('📍 Enviando localização:', locationData)
    websocketService.sendLocation(locationData)
  }

  // Verificar se está trackando
  isActive(): boolean {
    return this.isTracking
  }

  // Obter posição atual
  getCurrentPosition(): { lat: number; lng: number } {
    return { ...this.currentPosition }
  }

  // Atualizar posição manualmente
  updatePosition(lat: number, lng: number) {
    this.currentPosition = { lat, lng }
    if (this.isTracking) {
      this.sendLocationUpdate()
    }
  }
}

// Instância singleton
export const locationTracker = new LocationTracker()
export default locationTracker
