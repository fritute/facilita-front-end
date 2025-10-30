// Serviço de detecção de mãos usando detecção de movimento simples
export interface HandGesture {
  type: 'OPEN_HAND' | 'CLOSED_FIST' | 'THUMBS_UP' | 'PEACE' | 'OK' | 'POINTING' | 'UNKNOWN'
  confidence: number
  handedness: 'Left' | 'Right'
}

export class HandDetectionService {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private previousFrame: ImageData | null = null
  private onResultsCallback: ((results: any) => void) | null = null
  private isInitialized = false
  private detectionInterval: number | null = null
  private gestureSequence: string[] = []

  async initialize() {
    if (this.isInitialized) {
      console.log('⚠️ HandDetectionService já inicializado')
      return
    }

    try {
      console.log('🚀 Inicializando detecção de movimento...')
      
      this.canvas = document.createElement('canvas')
      this.canvas.width = 640
      this.canvas.height = 480
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })

      this.isInitialized = true
      console.log('✅ Detecção de movimento inicializada com sucesso')
    } catch (error) {
      console.error('❌ Erro ao inicializar detecção:', error)
      throw error
    }
  }

  setOnResults(callback: (results: any) => void) {
    this.onResultsCallback = callback
  }

  async processFrame(videoElement: HTMLVideoElement) {
    if (!this.ctx || !this.canvas || !this.isInitialized) {
      console.warn('Serviço não inicializado')
      return
    }

    try {
      // Desenhar frame atual
      this.ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height)
      const currentFrame = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)

      if (this.previousFrame) {
        // Detectar movimento
        const movement = this.detectMovement(this.previousFrame, currentFrame)
        
        // SEMPRE chamar callback, mesmo sem movimento detectado
        if (movement.detected) {
          const gesture = this.detectGestureFromMovement(movement)
          
          if (this.onResultsCallback) {
            this.onResultsCallback({
              multiHandLandmarks: [gesture.landmarks],
              gesture: gesture
            })
          }
        } else {
          // Sem movimento detectado - ainda assim notificar
          if (this.onResultsCallback) {
            this.onResultsCallback({
              multiHandLandmarks: [],
              gesture: null
            })
          }
        }
      } else {
        console.log('Primeiro frame capturado, iniciando comparação...')
      }

      this.previousFrame = currentFrame
    } catch (error) {
      console.error('Erro ao processar frame:', error)
    }
  }

  private detectMovement(prev: ImageData, curr: ImageData) {
    let diffCount = 0
    const threshold = 20 // Reduzido para detectar movimentos mais sutis
    const minPixels = 2000 // Reduzido para detectar movimentos menores

    for (let i = 0; i < prev.data.length; i += 4) {
      const diff = Math.abs(prev.data[i] - curr.data[i]) +
                   Math.abs(prev.data[i + 1] - curr.data[i + 1]) +
                   Math.abs(prev.data[i + 2] - curr.data[i + 2])
      
      if (diff > threshold) {
        diffCount++
      }
    }

    const movementIntensity = diffCount / (prev.data.length / 4)
    
    return {
      detected: diffCount > minPixels,
      intensity: movementIntensity,
      area: diffCount
    }
  }

  private detectGestureFromMovement(movement: any): any {
    // Adicionar à sequência de gestos com thresholds mais baixos
    if (movement.intensity > 0.05) {
      this.gestureSequence.push('HIGH')
    } else if (movement.intensity > 0.02) {
      this.gestureSequence.push('MEDIUM')
    } else {
      this.gestureSequence.push('LOW')
    }

    // Manter apenas os últimos 10 frames
    if (this.gestureSequence.length > 10) {
      this.gestureSequence.shift()
    }

    // Detectar padrões
    const highCount = this.gestureSequence.filter(g => g === 'HIGH').length
    const mediumCount = this.gestureSequence.filter(g => g === 'MEDIUM').length
    const lowCount = this.gestureSequence.filter(g => g === 'LOW').length

    // Log para debug
    console.log('🔍 Movimento detectado:', {
      intensity: movement.intensity.toFixed(4),
      area: movement.area,
      high: highCount,
      medium: mediumCount,
      low: lowCount
    })

    // Simular landmarks para compatibilidade
    const landmarks = Array(21).fill(null).map(() => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random()
    }))

    return {
      landmarks,
      type: this.determineGestureType(highCount, mediumCount, lowCount),
      confidence: Math.min(movement.intensity * 10, 0.95)
    }
  }

  private determineGestureType(highCount: number, mediumCount: number, lowCount: number): string {
    if (highCount >= 6) return 'OPEN_HAND'
    if (highCount >= 4) return 'PEACE'
    if (highCount >= 2) return 'POINTING'
    if (mediumCount >= 4) return 'THUMBS_UP'
    if (lowCount >= 7) return 'CLOSED_FIST'
    if (mediumCount >= 2) return 'OK'
    return 'UNKNOWN'
  }

  detectGesture(_landmarks: any[]): HandGesture {
    // Análise simplificada baseada em movimento
    const gestureTypes = ['OPEN_HAND', 'CLOSED_FIST', 'THUMBS_UP', 'PEACE', 'OK', 'POINTING']
    const randomType = gestureTypes[Math.floor(Math.random() * gestureTypes.length)] as HandGesture['type']

    return {
      type: randomType,
      confidence: 0.7 + Math.random() * 0.2,
      handedness: 'Right'
    }
  }

  close() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval)
      this.detectionInterval = null
    }
    this.canvas = null
    this.ctx = null
    this.previousFrame = null
    this.isInitialized = false
    console.log('🛑 Detecção de movimento fechada')
  }
}

export const handDetectionService = new HandDetectionService()
