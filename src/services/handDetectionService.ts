import { Hands, Results } from '@mediapipe/hands'
import { vlibrasService } from './vlibrasService'
import { notificationService } from './notificationService'

export class HandDetectionService {
  private hands: Hands | null = null
  private onResultsCallback: ((results: any) => void) | null = null
  private currentWord = ''
  private sentence = '' 
  private lastLetter = ''
  private lastTime = 0

  async initialize() {
    try {
      console.log('🚀 Carregando MediaPipe Hands...')
      
      this.hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      })

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
      })

      this.hands.onResults((results: Results) => this.onResults(results))
      
      console.log('✅ MediaPipe Hands carregado!')
    } catch (error) {
      notificationService.showError('Detecção de gestos', 'Não foi possível inicializar o sistema de detecção de gestos.')
    }
  }

  setOnResults(callback: (results: any) => void) {
    this.onResultsCallback = callback
  }

  async processFrame(video: HTMLVideoElement) {
    if (!this.hands || !video) return
    try {
      await this.hands.send({ image: video })
    } catch (e) {}
  }

  private onResults(results: Results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0]
      const letter = this.detectLetter(landmarks)
      
      if (letter && letter !== this.lastLetter) {
        const now = Date.now()
        if (now - this.lastTime > 1500) {
          this.currentWord += letter
          this.lastLetter = letter
          this.lastTime = now
          console.log('✅', letter, '→', this.currentWord)
        }
      }

      if (this.onResultsCallback) {
        this.onResultsCallback({
          detected: true,
          letter: letter,
          word: this.currentWord,
          sentence: this.sentence
        })
      }
    } else {
      if (this.onResultsCallback) {
        this.onResultsCallback({
          detected: false,
          letter: null,
          word: this.currentWord,
          sentence: this.sentence
        })
      }
    }
  }

  private detectLetter(landmarks: any[]): string | null {
    const tips = [8, 12, 16, 20]
    const bases = [5, 9, 13, 17]
    
    const extended = tips.map((tip, i) => 
      landmarks[tip].y < landmarks[bases[i]].y - 0.05
    )

    const count = extended.filter(Boolean).length

    if (count === 0) return 'A'
    if (count === 1 && extended[0]) return 'D'
    if (count === 1 && extended[3]) return 'I'
    if (count === 2 && extended[0] && extended[1]) {
      const dist = Math.abs(landmarks[8].x - landmarks[12].x)
      return dist > 0.05 ? 'V' : 'U'
    }
    if (count === 3 && extended[0] && extended[1] && extended[2]) return 'W'
    if (count === 4) return 'B'
    
    return null
  }

  addLetter(letter: string) {
    this.currentWord += letter
    this.updateUI()
  }

  finishWord() {
    if (this.currentWord) {
      this.sentence += (this.sentence ? ' ' : '') + this.currentWord
      vlibrasService.speak(this.currentWord)
      this.currentWord = ''
      this.lastLetter = ''
      this.updateUI()
    }
  }

  clearWord() {
    this.currentWord = ''
    this.lastLetter = ''
    this.updateUI()
  }

  clearSentence() {
    this.sentence = ''
    this.currentWord = ''
    this.lastLetter = ''
    this.updateUI()
  }

  private updateUI() {
    if (this.onResultsCallback) {
      this.onResultsCallback({
        detected: false,
        letter: null,
        word: this.currentWord,
        sentence: this.sentence
      })
    }
  }

  close() {
    if (this.hands) {
      this.hands.close()
    }
  }
}

export const handDetectionService = new HandDetectionService()
