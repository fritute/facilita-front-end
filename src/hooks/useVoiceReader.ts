import { useEffect, useCallback } from 'react'

export const useVoiceReader = (enabled: boolean) => {
  const speakText = useCallback((text: string) => {
    if (!enabled || !text) return
    
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.9
    utterance.volume = 1.0
    utterance.pitch = 1.0
    
    window.speechSynthesis.speak(utterance)
    console.log('🔊 Lendo:', text.substring(0, 50))
  }, [enabled])

  const handleMouseEnter = useCallback((e: MouseEvent) => {
    if (!enabled) return
    
    const element = e.currentTarget as HTMLElement
    
    const text = element.getAttribute('aria-label') || 
                 element.getAttribute('title') || 
                 element.getAttribute('alt') ||
                 element.getAttribute('placeholder') ||
                 element.textContent?.trim()
    
    if (text && text.length > 0 && text.length < 300) {
      speakText(text)
    }
  }, [enabled, speakText])

  useEffect(() => {
    if (!enabled) {
      window.speechSynthesis.cancel()
      return
    }

    const addListeners = () => {
      const elements = document.querySelectorAll(
        'button, a, input, textarea, select, [role="button"], [aria-label], h1, h2, h3, h4, h5, h6, p, span, div, label, li, td, th'
      )

      elements.forEach(element => {
        element.addEventListener('mouseenter', handleMouseEnter as EventListener)
      })
    }

    addListeners()

    const observer = new MutationObserver(() => {
      addListeners()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      observer.disconnect()
      const elements = document.querySelectorAll(
        'button, a, input, textarea, select, [role="button"], [aria-label], h1, h2, h3, h4, h5, h6, p, span, div, label, li, td, th'
      )
      elements.forEach(element => {
        element.removeEventListener('mouseenter', handleMouseEnter as EventListener)
      })
      window.speechSynthesis.cancel()
    }
  }, [enabled, handleMouseEnter])

  return { speakText }
}
