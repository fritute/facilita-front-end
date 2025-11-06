// Serviço para integração com VLibras
export class VLibrasService {
  private widget: any = null

  initialize() {
    if (typeof window !== 'undefined' && (window as any).VLibras) {
      this.widget = new (window as any).VLibras.Widget('https://vlibras.gov.br/app')
      console.log('✅ VLibras inicializado')
    }
  }

  translateText(text: string) {
    if (!text) return
    
    // VLibras traduz automaticamente texto na página
    // Criar elemento temporário com o texto
    const tempDiv = document.createElement('div')
    tempDiv.setAttribute('vw', '')
    tempDiv.textContent = text
    tempDiv.style.position = 'fixed'
    tempDiv.style.top = '-9999px'
    document.body.appendChild(tempDiv)
    
    // Disparar evento para VLibras processar
    setTimeout(() => {
      if ((window as any).VLibras) {
        (window as any).VLibras.Widget.translate()
      }
      setTimeout(() => document.body.removeChild(tempDiv), 1000)
    }, 100)
    
    console.log('🔊 Traduzindo para LIBRAS:', text)
  }

  speak(text: string) {
    this.translateText(text)
  }
}

export const vlibrasService = new VLibrasService()
