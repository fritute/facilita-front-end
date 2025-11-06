// Leitor de voz melhorado
let isEnabled = false
let currentElement: HTMLElement | null = null
let readingTimeout: NodeJS.Timeout | null = null

export const enableVoiceReader = () => {
  isEnabled = true
  document.body.classList.add('voice-reader-active')
  speak('Leitor de voz ativado. Passe o mouse sobre qualquer texto para ouvir. Pressione Escape para parar.')
}

export const disableVoiceReader = () => {
  isEnabled = false
  window.speechSynthesis.cancel()
  document.body.classList.remove('voice-reader-active')
  if (currentElement) {
    currentElement.classList.remove('voice-reader-hover')
    currentElement = null
  }
  speak('Leitor de voz desativado')
}

export const speak = (text: string, interrupt = true) => {
  if (!text?.trim()) return
  if (interrupt) window.speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text.trim())
  utterance.lang = 'pt-BR'
  utterance.rate = 0.95
  utterance.volume = 1.0
  utterance.pitch = 1.0
  
  window.speechSynthesis.speak(utterance)
}

// Parar leitura com ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isEnabled) {
    window.speechSynthesis.cancel()
    speak('Leitura interrompida', false)
  }
})

// Listener global melhorado
document.addEventListener('mouseover', (e) => {
  if (!isEnabled) return
  
  const target = e.target as HTMLElement
  if (!target || target === currentElement) return
  
  // Limpar timeout anterior
  if (readingTimeout) clearTimeout(readingTimeout)
  
  // Remover highlight anterior
  if (currentElement) {
    currentElement.classList.remove('voice-reader-hover')
  }
  
  currentElement = target
  target.classList.add('voice-reader-hover')
  
  // Delay para evitar leitura excessiva
  readingTimeout = setTimeout(() => {
    const text = getElementText(target)
    if (text && text.length > 0 && text.length < 500) {
      speak(text)
    }
  }, 200)
}, true)

document.addEventListener('mouseout', (e) => {
  if (!isEnabled) return
  const target = e.target as HTMLElement
  if (target === currentElement) {
    target?.classList.remove('voice-reader-hover')
    currentElement = null
  }
}, true)

// Função para extrair texto do elemento
function getElementText(element: HTMLElement): string {
  // Prioridade de leitura
  return element.getAttribute('aria-label') ||
         element.getAttribute('data-tooltip') ||
         element.getAttribute('title') ||
         element.getAttribute('alt') ||
         element.getAttribute('placeholder') ||
         (element.tagName === 'INPUT' ? (element as HTMLInputElement).value : '') ||
         (element.tagName === 'BUTTON' ? element.textContent?.trim() : '') ||
         element.innerText?.trim() ||
         element.textContent?.trim() || ''
}
