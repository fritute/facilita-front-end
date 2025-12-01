import { useState, useEffect } from 'react'
import { enableVoiceReader, disableVoiceReader } from '../utils/voiceReader'

export const useAccessibility = () => {
  const [largeFontEnabled, setLargeFontEnabled] = useState(false)
  const [voiceReaderEnabled, setVoiceReaderEnabled] = useState(false)
  const [highContrastEnabled, setHighContrastEnabled] = useState(false)
  const [focusIndicatorEnabled, setFocusIndicatorEnabled] = useState(false)
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false)

  // Carregar preferências salvas
  useEffect(() => {
    const saved = localStorage.getItem('accessibility-preferences')
    if (saved) {
      const prefs = JSON.parse(saved)
      if (prefs.largeFont) toggleLargeFont()
      if (prefs.voiceReader) toggleVoiceReader()
      if (prefs.highContrast) toggleHighContrast()
      if (prefs.focusIndicator) toggleFocusIndicator()
      if (prefs.reducedMotion) toggleReducedMotion()
    }
  }, [])

  // Salvar preferências
  const savePreferences = () => {
    localStorage.setItem('accessibility-preferences', JSON.stringify({
      largeFont: largeFontEnabled,
      voiceReader: voiceReaderEnabled,
      highContrast: highContrastEnabled,
      focusIndicator: focusIndicatorEnabled,
      reducedMotion: reducedMotionEnabled
    }))
  }

  const toggleLargeFont = () => {
    setLargeFontEnabled(prev => {
      const newValue = !prev
      document.body.classList.toggle('large-font', newValue)
      savePreferences()
      return newValue
    })
  }

  const toggleVoiceReader = () => {
    setVoiceReaderEnabled(prev => {
      const newValue = !prev
      newValue ? enableVoiceReader() : disableVoiceReader()
      savePreferences()
      return newValue
    })
  }

  const toggleHighContrast = () => {
    setHighContrastEnabled(prev => {
      const newValue = !prev
      document.body.classList.toggle('high-contrast', newValue)
      savePreferences()
      return newValue
    })
  }

  const toggleFocusIndicator = () => {
    setFocusIndicatorEnabled(prev => {
      const newValue = !prev
      document.body.classList.toggle('enhanced-focus', newValue)
      savePreferences()
      return newValue
    })
  }

  const toggleReducedMotion = () => {
    setReducedMotionEnabled(prev => {
      const newValue = !prev
      document.body.classList.toggle('reduced-motion', newValue)
      savePreferences()
      return newValue
    })
  }

  return {
    largeFontEnabled,
    voiceReaderEnabled,
    highContrastEnabled,
    focusIndicatorEnabled,
    reducedMotionEnabled,
    toggleLargeFont,
    toggleVoiceReader,
    toggleHighContrast,
    toggleFocusIndicator,
    toggleReducedMotion
  }
}
