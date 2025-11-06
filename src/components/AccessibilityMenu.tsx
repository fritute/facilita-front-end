import React from 'react'
import { Volume2, VolumeX, Type, Eye, Hand, X, Contrast, Focus, Keyboard, Zap } from 'lucide-react'

interface AccessibilityMenuProps {
  isOpen: boolean
  onClose: () => void
  largeFontEnabled: boolean
  voiceReaderEnabled: boolean
  isLibrasActive: boolean
  highContrastEnabled?: boolean
  focusIndicatorEnabled?: boolean
  reducedMotionEnabled?: boolean
  onToggleLargeFont: () => void
  onToggleVoiceReader: () => void
  onToggleLibras: () => void
  onToggleHighContrast?: () => void
  onToggleFocusIndicator?: () => void
  onToggleReducedMotion?: () => void
  isDarkMode: boolean
}

export const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({
  isOpen,
  onClose,
  largeFontEnabled,
  voiceReaderEnabled,
  isLibrasActive,
  highContrastEnabled = false,
  focusIndicatorEnabled = false,
  reducedMotionEnabled = false,
  onToggleLargeFont,
  onToggleVoiceReader,
  onToggleLibras,
  onToggleHighContrast,
  onToggleFocusIndicator,
  onToggleReducedMotion,
  isDarkMode
}) => {
  if (!isOpen) return null

  const bgColor = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const textColor = isDarkMode ? 'text-white' : 'text-gray-800'
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200'

  return (
    <div 
      className="accessibility-menu fixed right-4 top-20 z-50 w-80 rounded-lg shadow-2xl border"
      style={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}
      role="dialog"
      aria-label="Menu de Acessibilidade"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${textColor}`} aria-label="Opções de Acessibilidade">
            Acessibilidade
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Fechar menu de acessibilidade"
          >
            <X size={20} className={textColor} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Letras Grandes */}
          <button
            onClick={onToggleLargeFont}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
              largeFontEnabled 
                ? 'bg-green-500 text-white' 
                : `${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} hover:bg-gray-200 dark:hover:bg-gray-600`
            }`}
            aria-label={`Letras grandes ${largeFontEnabled ? 'ativado' : 'desativado'}. Clique para ${largeFontEnabled ? 'desativar' : 'ativar'}`}
            aria-pressed={largeFontEnabled}
          >
            <div className="flex items-center gap-3">
              <Type size={24} />
              <div className="text-left">
                <div className="font-semibold">Letras Grandes</div>
                <div className="text-sm opacity-80">Aumenta o tamanho do texto</div>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${largeFontEnabled ? 'bg-green-600' : 'bg-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${largeFontEnabled ? 'translate-x-6' : 'translate-x-1'} mt-0.5`} />
            </div>
          </button>

          {/* Leitor de Voz */}
          <button
            onClick={onToggleVoiceReader}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
              voiceReaderEnabled 
                ? 'bg-blue-500 text-white' 
                : `${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} hover:bg-gray-200 dark:hover:bg-gray-600`
            }`}
            aria-label={`Leitor de voz ${voiceReaderEnabled ? 'ativado' : 'desativado'}. Clique para ${voiceReaderEnabled ? 'desativar' : 'ativar'}`}
            aria-pressed={voiceReaderEnabled}
          >
            <div className="flex items-center gap-3">
              {voiceReaderEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
              <div className="text-left">
                <div className="font-semibold">Leitor de Voz</div>
                <div className="text-sm opacity-80">Lê textos ao passar o mouse</div>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${voiceReaderEnabled ? 'bg-blue-600' : 'bg-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${voiceReaderEnabled ? 'translate-x-6' : 'translate-x-1'} mt-0.5`} />
            </div>
          </button>

          {/* Libras */}
          <button
            onClick={onToggleLibras}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
              isLibrasActive 
                ? 'bg-purple-500 text-white' 
                : `${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} hover:bg-gray-200 dark:hover:bg-gray-600`
            }`}
            aria-label={`Libras ${isLibrasActive ? 'ativado' : 'desativado'}. Clique para ${isLibrasActive ? 'desativar' : 'ativar'}`}
            aria-pressed={isLibrasActive}
          >
            <div className="flex items-center gap-3">
              <Hand size={24} />
              <div className="text-left">
                <div className="font-semibold">Libras</div>
                <div className="text-sm opacity-80">Detecção de sinais em Libras</div>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${isLibrasActive ? 'bg-purple-600' : 'bg-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isLibrasActive ? 'translate-x-6' : 'translate-x-1'} mt-0.5`} />
            </div>
          </button>

          {/* Alto Contraste */}
          {onToggleHighContrast && (
            <button
              onClick={onToggleHighContrast}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                highContrastEnabled 
                  ? 'bg-yellow-500 text-black' 
                  : `${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} hover:bg-gray-200 dark:hover:bg-gray-600`
              }`}
              aria-label={`Alto contraste ${highContrastEnabled ? 'ativado' : 'desativado'}`}
              aria-pressed={highContrastEnabled}
            >
              <div className="flex items-center gap-3">
                <Contrast size={24} />
                <div className="text-left">
                  <div className="font-semibold">Alto Contraste</div>
                  <div className="text-sm opacity-80">Aumenta contraste visual</div>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${highContrastEnabled ? 'bg-yellow-600' : 'bg-gray-400'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${highContrastEnabled ? 'translate-x-6' : 'translate-x-1'} mt-0.5`} />
              </div>
            </button>
          )}

          {/* Indicador de Foco */}
          {onToggleFocusIndicator && (
            <button
              onClick={onToggleFocusIndicator}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                focusIndicatorEnabled 
                  ? 'bg-orange-500 text-white' 
                  : `${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} hover:bg-gray-200 dark:hover:bg-gray-600`
              }`}
              aria-label={`Indicador de foco ${focusIndicatorEnabled ? 'ativado' : 'desativado'}`}
              aria-pressed={focusIndicatorEnabled}
            >
              <div className="flex items-center gap-3">
                <Focus size={24} />
                <div className="text-left">
                  <div className="font-semibold">Foco Melhorado</div>
                  <div className="text-sm opacity-80">Destaca elemento focado</div>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${focusIndicatorEnabled ? 'bg-orange-600' : 'bg-gray-400'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${focusIndicatorEnabled ? 'translate-x-6' : 'translate-x-1'} mt-0.5`} />
              </div>
            </button>
          )}

          {/* Movimento Reduzido */}
          {onToggleReducedMotion && (
            <button
              onClick={onToggleReducedMotion}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                reducedMotionEnabled 
                  ? 'bg-red-500 text-white' 
                  : `${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} hover:bg-gray-200 dark:hover:bg-gray-600`
              }`}
              aria-label={`Movimento reduzido ${reducedMotionEnabled ? 'ativado' : 'desativado'}`}
              aria-pressed={reducedMotionEnabled}
            >
              <div className="flex items-center gap-3">
                <Zap size={24} />
                <div className="text-left">
                  <div className="font-semibold">Movimento Reduzido</div>
                  <div className="text-sm opacity-80">Remove animações</div>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${reducedMotionEnabled ? 'bg-red-600' : 'bg-gray-400'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${reducedMotionEnabled ? 'translate-x-6' : 'translate-x-1'} mt-0.5`} />
              </div>
            </button>
          )}
        </div>

        <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-blue-800'}`}>
            💡 <strong>Atalhos:</strong><br/>
            • ESC: Parar leitura de voz<br/>
            • Alt+1: Ir para conteúdo principal<br/>
            • Alt+H: Anunciar títulos da página
          </p>
        </div>
      </div>
    </div>
  )
}
