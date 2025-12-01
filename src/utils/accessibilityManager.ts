// Gerenciador central de acessibilidade
export class AccessibilityManager {
  private static instance: AccessibilityManager
  private features = {
    voiceReader: false,
    largeFont: false,
    highContrast: false,
    focusIndicator: false,
    keyboardNav: false,
    reducedMotion: false
  }

  static getInstance() {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager()
    }
    return AccessibilityManager.instance
  }

  // Leitor de voz melhorado
  enableVoiceReader() {
    this.features.voiceReader = true
    document.body.classList.add('voice-reader-active')
    this.speak('Leitor de voz ativado')
  }

  disableVoiceReader() {
    this.features.voiceReader = false
    window.speechSynthesis.cancel()
    document.body.classList.remove('voice-reader-active')
    this.speak('Leitor de voz desativado')
  }

  speak(text: string, interrupt = true) {
    if (!text?.trim()) return
    if (interrupt) window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text.trim())
    utterance.lang = 'pt-BR'
    utterance.rate = 0.9
    utterance.volume = 1.0
    window.speechSynthesis.speak(utterance)
  }

  // Alto contraste
  enableHighContrast() {
    this.features.highContrast = true
    document.body.classList.add('high-contrast')
    this.speak('Alto contraste ativado')
  }

  disableHighContrast() {
    this.features.highContrast = false
    document.body.classList.remove('high-contrast')
    this.speak('Alto contraste desativado')
  }

  // Indicador de foco melhorado
  enableFocusIndicator() {
    this.features.focusIndicator = true
    document.body.classList.add('enhanced-focus')
    this.speak('Indicador de foco melhorado ativado')
  }

  disableFocusIndicator() {
    this.features.focusIndicator = false
    document.body.classList.remove('enhanced-focus')
  }

  // Navegação por teclado
  enableKeyboardNav() {
    this.features.keyboardNav = true
    document.addEventListener('keydown', this.handleKeyboardNav)
    this.speak('Navegação por teclado ativada. Use Tab, setas e Enter')
  }

  disableKeyboardNav() {
    this.features.keyboardNav = false
    document.removeEventListener('keydown', this.handleKeyboardNav)
  }

  private handleKeyboardNav = (e: KeyboardEvent) => {
    // Atalhos de teclado
    if (e.altKey) {
      switch(e.key) {
        case '1': this.skipToMain(); break
        case '2': this.skipToNav(); break
        case 'h': this.announceHeadings(); break
        case 'l': this.announceLinks(); break
      }
    }
  }

  // Movimento reduzido
  enableReducedMotion() {
    this.features.reducedMotion = true
    document.body.classList.add('reduced-motion')
    this.speak('Movimento reduzido ativado')
  }

  disableReducedMotion() {
    this.features.reducedMotion = false
    document.body.classList.remove('reduced-motion')
  }

  // Utilitários
  private skipToMain() {
    const main = document.querySelector('main') || document.querySelector('[role="main"]')
    if (main) {
      (main as HTMLElement).focus()
      this.speak('Pulando para conteúdo principal')
    }
  }

  private skipToNav() {
    const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]')
    if (nav) {
      (nav as HTMLElement).focus()
      this.speak('Pulando para navegação')
    }
  }

  private announceHeadings() {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    const text = headings.map(h => h.textContent).join(', ')
    this.speak(`Títulos na página: ${text}`)
  }

  private announceLinks() {
    const links = Array.from(document.querySelectorAll('a'))
    this.speak(`${links.length} links encontrados na página`)
  }

  getFeatures() {
    return { ...this.features }
  }
}

export const accessibilityManager = AccessibilityManager.getInstance()
