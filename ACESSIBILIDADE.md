# 🌟 Melhorias de Acessibilidade - Facilita

## 📋 Recursos Implementados

### 1. **Leitor de Voz Aprimorado** 🔊
- ✅ Lê automaticamente QUALQUER texto ao passar o mouse
- ✅ Funciona em: botões, links, parágrafos, títulos, spans, divs, labels, listas, tabelas
- ✅ Suporta aria-label, title, alt, placeholder e textContent
- ✅ MutationObserver detecta elementos adicionados dinamicamente
- ✅ Configuração de voz em português (pt-BR)
- ✅ Controle de velocidade, volume e tom
- ✅ Cancela leitura anterior ao iniciar nova

**Como usar:**
1. Clique no ícone de acessibilidade (♿) no canto superior direito
2. Ative "Leitor de Voz"
3. Passe o mouse sobre QUALQUER texto na tela para ouvir
4. Funciona em textos estáticos e dinâmicos

### 2. **Letras Grandes** 📝
- ✅ Aumenta o tamanho da fonte em 120%
- ✅ Persiste a preferência no localStorage
- ✅ Aplica em toda a aplicação

**Como usar:**
1. Abra o menu de acessibilidade
2. Ative "Letras Grandes"
3. Todo o texto ficará 20% maior

### 3. **Detecção de Libras** 👋
- ✅ Usa MediaPipe Hands para detecção em tempo real
- ✅ Reconhece letras: A, B, D, I, U, V, W
- ✅ Forma palavras e frases
- ✅ Integração com VLibras

**Como usar:**
1. Abra o menu de acessibilidade
2. Ative "Libras"
3. Permita acesso à câmera
4. Mostre os sinais para a câmera

### 4. **Atributos ARIA** ♿
- ✅ Todos os botões têm aria-label descritivo
- ✅ Estados são comunicados (aria-pressed, aria-expanded)
- ✅ Roles apropriados (dialog, button, navigation)
- ✅ Navegação por teclado funcional

## 🎯 Próximas Melhorias Sugeridas

### Alto Contraste
```typescript
const [highContrastEnabled, setHighContrastEnabled] = useState(false)

const toggleHighContrast = () => {
  const newValue = !highContrastEnabled
  setHighContrastEnabled(newValue)
  localStorage.setItem('highContrastEnabled', JSON.stringify(newValue))
  
  if (newValue) {
    document.documentElement.classList.add('high-contrast')
  } else {
    document.documentElement.classList.remove('high-contrast')
  }
}
```

### Navegação por Teclado
- Tab para navegar entre elementos
- Enter/Space para ativar botões
- Esc para fechar modais
- Setas para navegação em listas

### Legendas e Transcrições
- Adicionar legendas em vídeos
- Transcrição de áudio para texto
- Descrição de imagens (alt text)

## 🔧 Configuração Técnica

### Dependências
```json
{
  "@mediapipe/hands": "^0.4.1646424915",
  "lucide-react": "latest"
}
```

### Estrutura de Arquivos
```
src/
├── components/
│   └── AccessibilityMenu.tsx    # Menu de acessibilidade
├── hooks/
│   └── useVoiceReader.ts        # Hook do leitor de voz
├── services/
│   ├── handDetectionService.ts  # Detecção de Libras
│   └── vlibrasService.ts        # Integração VLibras
```

## 📱 Compatibilidade

| Recurso | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Leitor de Voz | ✅ | ✅ | ✅ | ✅ |
| Letras Grandes | ✅ | ✅ | ✅ | ✅ |
| Libras (Câmera) | ✅ | ✅ | ⚠️ | ✅ |
| ARIA | ✅ | ✅ | ✅ | ✅ |

⚠️ Safari pode ter limitações com MediaPipe

## 🐛 Solução de Problemas

### Leitor de voz não funciona
1. Verifique se o navegador suporta Web Speech API
2. Teste em uma aba sem modo anônimo
3. Verifique o volume do sistema

### Câmera não inicia
1. Permita acesso à câmera no navegador
2. Verifique se outra aplicação está usando a câmera
3. Teste em HTTPS (necessário para getUserMedia)

### Texto não aumenta
1. Limpe o cache do navegador
2. Verifique o localStorage
3. Recarregue a página

## 📞 Suporte

Para reportar problemas ou sugerir melhorias:
- Abra uma issue no repositório
- Entre em contato com a equipe de desenvolvimento

---

**Última atualização:** 2024
**Versão:** 2.0
