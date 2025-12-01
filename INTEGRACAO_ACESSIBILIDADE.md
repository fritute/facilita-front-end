# 🔧 Guia de Integração - Acessibilidade

## Como adicionar o leitor de voz ao App.tsx

### 1. Importar o hook e componente

```typescript
import { useVoiceReader } from './hooks/useVoiceReader'
import { AccessibilityMenu } from './components/AccessibilityMenu'
```

### 2. Adicionar no componente App

```typescript
function App() {
  // ... estados existentes ...
  
  // Hook do leitor de voz
  const { speakText } = useVoiceReader(voiceReaderEnabled)
  
  // Função para alternar Libras
  const toggleLibras = () => {
    if (isLibrasActive) {
      stopLibrasCamera()
    } else {
      startLibrasCamera()
    }
  }
  
  return (
    <div className="app">
      {/* Botão de acessibilidade */}
      <button
        onClick={() => setShowAccessibilityMenu(!showAccessibilityMenu)}
        className="fixed bottom-4 right-4 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all"
        aria-label="Abrir menu de acessibilidade"
      >
        ♿
      </button>
      
      {/* Menu de acessibilidade */}
      <AccessibilityMenu
        isOpen={showAccessibilityMenu}
        onClose={() => setShowAccessibilityMenu(false)}
        largeFontEnabled={largeFontEnabled}
        voiceReaderEnabled={voiceReaderEnabled}
        isLibrasActive={isLibrasActive}
        onToggleLargeFont={toggleLargeFont}
        onToggleVoiceReader={toggleVoiceReader}
        onToggleLibras={toggleLibras}
        isDarkMode={isDarkMode}
      />
      
      {/* Resto da aplicação */}
    </div>
  )
}
```

### 3. Adicionar aria-labels em todos os elementos interativos

#### Botões
```typescript
<button
  onClick={handleLogin}
  aria-label="Fazer login na plataforma"
  className="btn-primary"
>
  Entrar
</button>
```

#### Inputs
```typescript
<input
  type="email"
  placeholder="Digite seu e-mail"
  aria-label="Campo de e-mail para login"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

#### Links
```typescript
<a
  href="/perfil"
  aria-label="Ir para página de perfil do usuário"
>
  Meu Perfil
</a>
```

#### Imagens
```typescript
<img
  src="/logo.png"
  alt="Logo da Facilita - Plataforma de serviços"
  aria-label="Logo da Facilita"
/>
```

### 4. Adicionar suporte a navegação por teclado

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    handleAction()
  }
}

<div
  role="button"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  onClick={handleAction}
  aria-label="Selecionar serviço de entrega"
>
  Entrega
</div>
```

### 5. Modais acessíveis

```typescript
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Confirmar Pedido</h2>
  <p id="modal-description">
    Você está prestes a confirmar um pedido de R$ 50,00
  </p>
  
  <button
    onClick={handleConfirm}
    aria-label="Confirmar pedido de cinquenta reais"
  >
    Confirmar
  </button>
  
  <button
    onClick={handleCancel}
    aria-label="Cancelar pedido e voltar"
  >
    Cancelar
  </button>
</div>
```

### 6. Formulários acessíveis

```typescript
<form onSubmit={handleSubmit} aria-label="Formulário de cadastro">
  <label htmlFor="nome">
    Nome Completo
  </label>
  <input
    id="nome"
    type="text"
    aria-label="Digite seu nome completo"
    aria-required="true"
    aria-invalid={errors.nome ? 'true' : 'false'}
    aria-describedby={errors.nome ? 'nome-error' : undefined}
  />
  {errors.nome && (
    <span id="nome-error" role="alert" className="error">
      {errors.nome}
    </span>
  )}
</form>
```

### 7. Listas acessíveis

```typescript
<ul role="list" aria-label="Lista de serviços disponíveis">
  {services.map((service, index) => (
    <li
      key={service.id}
      role="listitem"
      aria-label={`Serviço ${index + 1}: ${service.name}, preço ${service.price} reais`}
    >
      <button
        onClick={() => selectService(service)}
        aria-label={`Selecionar ${service.name}`}
      >
        {service.name}
      </button>
    </li>
  ))}
</ul>
```

### 8. Estados de loading acessíveis

```typescript
{isLoading && (
  <div
    role="status"
    aria-live="polite"
    aria-label="Carregando informações, por favor aguarde"
  >
    <LoadingSpinner />
    <span className="sr-only">Carregando...</span>
  </div>
)}
```

### 9. Notificações acessíveis

```typescript
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
  className="notification"
>
  {notification.message}
</div>
```

### 10. CSS para leitores de tela

```css
/* Classe para texto visível apenas para leitores de tela */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Alto contraste */
.high-contrast {
  filter: contrast(1.5);
}

.high-contrast button {
  border: 2px solid #000 !important;
}
```

## ✅ Checklist de Acessibilidade

- [ ] Todos os botões têm aria-label
- [ ] Todos os inputs têm labels associados
- [ ] Todas as imagens têm alt text
- [ ] Modais têm role="dialog" e aria-modal
- [ ] Formulários têm validação acessível
- [ ] Navegação por teclado funciona
- [ ] Estados de loading são anunciados
- [ ] Erros são anunciados com role="alert"
- [ ] Cores têm contraste adequado (WCAG AA)
- [ ] Fonte pode ser aumentada sem quebrar layout

## 🎯 Testes Recomendados

1. **Teste com leitor de tela**
   - NVDA (Windows)
   - JAWS (Windows)
   - VoiceOver (Mac/iOS)
   - TalkBack (Android)

2. **Teste de navegação por teclado**
   - Tab para navegar
   - Enter/Space para ativar
   - Esc para fechar

3. **Teste de contraste**
   - Use ferramentas como WAVE ou axe DevTools
   - Verifique WCAG AA (4.5:1 para texto normal)

4. **Teste com zoom**
   - Aumente para 200%
   - Verifique se nada quebra

## 📚 Recursos Adicionais

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM](https://webaim.org/)
