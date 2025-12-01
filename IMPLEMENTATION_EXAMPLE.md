# 🔧 Exemplo de Implementação - App.tsx

## 📝 Como Integrar os Novos Serviços

### 1. **Imports Necessários**

```typescript
// Adicionar no topo do App.tsx
import { facilitaApi } from './services/apiService'
import { serviceFlowService } from './services/serviceFlowService'
import { paymentFlowService } from './services/paymentFlowService'
import { chatService } from './services/chatService'
import { ratingService } from './services/ratingService'
```

### 2. **Substituir Função de Login**

```typescript
// ❌ Função antiga
const handleLogin = async (email: string, senha: string) => {
  try {
    setIsLoginLoading(true)
    
    const response = await fetch('https://servidor-facilita.onrender.com/v1/facilita/usuario/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    })
    
    if (response.ok) {
      const data = await response.json()
      // ... resto da lógica
    } else {
      console.error('Erro no login')
    }
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    setIsLoginLoading(false)
  }
}

// ✅ Nova função com serviço
const handleLogin = async (email: string, senha: string) => {
  try {
    setIsLoginLoading(true)
    
    const response = await facilitaApi.login(email, senha)
    
    if (response.success) {
      const userData = response.data
      
      // Salvar dados do usuário
      localStorage.setItem('authToken', userData.token)
      localStorage.setItem('userData', JSON.stringify(userData))
      
      setLoggedUser(userData)
      
      // Verificar tipo de conta
      if (userData.tipo_conta) {
        setCurrentScreen('home')
      } else {
        setCurrentScreen('account-type')
      }
      
      showSuccess('Login realizado', 'Bem-vindo de volta!')
    }
    // Erro já foi tratado automaticamente pelo ApiService
    
  } finally {
    setIsLoginLoading(false)
  }
}
```

### 3. **Substituir Criação de Serviço**

```typescript
// ❌ Função antiga
const handleServiceCreate = async () => {
  try {
    setIsLoading(true)
    
    const response = await fetch(API_ENDPOINTS.SERVICES, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(serviceData)
    })
    
    if (response.ok) {
      const data = await response.json()
      setCreatedServiceId(data.id)
      setCurrentScreen('waiting-driver')
    } else {
      console.error('Erro ao criar serviço')
    }
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    setIsLoading(false)
  }
}

// ✅ Nova função com fluxo automatizado
const handleServiceCreate = async () => {
  try {
    setIsLoading(true)
    
    const serviceData = {
      categoria_id: selectedCategoryId,
      descricao: serviceDescription,
      id_localizacao_origem: pickupLocation?.id_localizacao,
      id_localizacao_destino: deliveryLocation?.id_localizacao,
      pontos_parada: stopPoints.map(point => ({
        id_localizacao: point.id_localizacao,
        descricao: point.description
      }))
    }
    
    const result = await serviceFlowService.executeContratanteFlow(serviceData)
    
    if (result.success) {
      setCreatedServiceId(result.data.id)
      setCurrentScreen(result.nextStep) // 'waiting-driver'
      
      // Iniciar polling para verificar aceitação
      startPollingServiceStatus(result.data.id)
    }
    
  } finally {
    setIsLoading(false)
  }
}
```

### 4. **Implementar Fluxo de Pagamento**

```typescript
// ✅ Nova função de pagamento
const handlePaymentConfirmation = async () => {
  try {
    setIsLoading(true)
    
    const serviceValue = servicePrice || 119.99
    
    const result = await paymentFlowService.executeCompletePaymentFlow(
      createdServiceId,
      serviceValue
    )
    
    if (result.success) {
      // Pagamento realizado com sucesso
      setCurrentScreen('service-tracking')
      showSuccess('Pagamento realizado', 'Serviço pago com sucesso!')
      
    } else if (result.requiresRecharge) {
      // Saldo insuficiente - mostrar modal de recarga
      setShowRechargeModal(true)
      setRechargeAmount(result.data.missingAmount)
      
    } else if (result.nextStep === 'create-wallet') {
      // Precisa criar carteira
      setShowCreateWalletModal(true)
    }
    
  } finally {
    setIsLoading(false)
  }
}
```

### 5. **Integrar Chat em Tempo Real**

```typescript
// ✅ useEffect para chat
useEffect(() => {
  if (activeServiceId && loggedUser) {
    // Conectar ao chat em tempo real
    chatService.connectToChat(activeServiceId, loggedUser.id.toString())
    
    // Escutar novas mensagens
    const unsubscribeMessages = chatService.onNewMessage((message) => {
      setMessages(prev => [...prev, message])
      
      // Mostrar notificação se não estiver na tela de chat
      if (currentScreen !== 'chat') {
        showInfo('Nova mensagem', `${message.enviado_por}: ${message.mensagem}`)
      }
      
      // Tocar som de notificação
      playNotificationSound()
    })
    
    // Escutar mudanças de conexão
    const unsubscribeConnection = chatService.onConnectionChange((connected) => {
      if (!connected) {
        showWarning('Chat', 'Conexão do chat perdida. Tentando reconectar...')
      }
    })
    
    return () => {
      unsubscribeMessages()
      unsubscribeConnection()
      chatService.disconnectFromChat()
    }
  }
}, [activeServiceId, loggedUser, currentScreen])

// ✅ Função para enviar mensagem
const handleSendMessage = async (message: string) => {
  try {
    setIsSendingMessage(true)
    
    const result = await chatService.sendTextMessage(activeServiceId, message)
    
    if (result.success) {
      // Mensagem enviada - será recebida via WebSocket
      setNewMessage('')
    }
    
  } finally {
    setIsSendingMessage(false)
  }
}
```

### 6. **Sistema de Avaliações**

```typescript
// ✅ Função para avaliar serviço
const handleServiceRating = async (rating: number, comment: string) => {
  try {
    setIsLoading(true)
    
    const result = await ratingService.createRating(
      completedServiceId,
      rating,
      comment
    )
    
    if (result.success) {
      setCurrentScreen('home')
      showSuccess('Avaliação enviada', 'Obrigado pelo seu feedback!')
    }
    
  } finally {
    setIsLoading(false)
  }
}
```

### 7. **Verificação de Status Automática**

```typescript
// ✅ Polling melhorado com novo serviço
const startPollingServiceStatus = (serviceId: string) => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
  }

  const interval = setInterval(async () => {
    const result = await serviceFlowService.getServiceStatus(serviceId)
    
    if (result.success) {
      const service = result.data
      const nextStep = serviceFlowService.getNextStepByStatus(
        service.status,
        loggedUser.tipo_conta
      )
      
      // Verificar mudanças de status
      if (service.status === 'EM_ANDAMENTO' && currentScreen === 'waiting-driver') {
        // Prestador aceitou
        clearInterval(interval)
        setPollingInterval(null)
        setCurrentScreen('payment')
        showSuccess('Prestador encontrado', 'Um prestador aceitou seu serviço!')
        
      } else if (service.status === 'FINALIZADO' && currentScreen === 'service-tracking') {
        // Serviço finalizado
        clearInterval(interval)
        setPollingInterval(null)
        setCurrentScreen('service-rating')
        showInfo('Serviço finalizado', 'Avalie o serviço prestado.')
      }
    }
  }, 3000)

  setPollingInterval(interval)
}
```

### 8. **Criação de Carteira Simplificada**

```typescript
// ✅ Função melhorada para criar carteira
const handleCreateWallet = async (chavePagbank: string) => {
  try {
    setLoadingWallet(true)
    
    const result = await paymentFlowService.createWallet(chavePagbank, 0)
    
    if (result.success) {
      setHasWallet(true)
      setWalletData(result.data)
      setShowCreateWalletModal(false)
      
      // Se estava tentando pagar, tentar novamente
      if (pendingPayment) {
        handlePaymentConfirmation()
      }
    }
    
  } finally {
    setLoadingWallet(false)
  }
}
```

### 9. **Recarga Automática**

```typescript
// ✅ Função para recarga
const handleRecharge = async (amount: number) => {
  try {
    setLoadingRecharge(true)
    
    const result = await paymentFlowService.requestRecharge(amount)
    
    if (result.success) {
      setRechargeQrCode(result.data.qr_code)
      setRechargeQrCodeUrl(result.data.qr_code_url)
      
      // Aguardar confirmação via webhook ou polling
      showInfo('QR Code gerado', 'Escaneie o código para fazer o pagamento via PIX.')
    }
    
  } finally {
    setLoadingRecharge(false)
  }
}
```

### 10. **Tratamento Global de Erros**

```typescript
// ✅ useEffect para tratar erros globais
useEffect(() => {
  // Interceptar erros de autenticação
  const handleAuthError = () => {
    setLoggedUser(null)
    setCurrentScreen('login')
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
  }
  
  // O ApiService já trata automaticamente, mas podemos escutar
  window.addEventListener('auth-error', handleAuthError)
  
  return () => {
    window.removeEventListener('auth-error', handleAuthError)
  }
}, [])
```

## 🔄 Resumo das Mudanças

### **Antes vs Depois**

| Aspecto | ❌ Antes | ✅ Depois |
|---------|----------|-----------|
| **API Calls** | fetch manual | facilitaApi.method() |
| **Error Handling** | console.error | Notificações automáticas |
| **Service Flow** | Lógica espalhada | serviceFlowService |
| **Payment** | Múltiplas funções | paymentFlowService |
| **Chat** | Polling manual | WebSocket em tempo real |
| **Ratings** | Implementação básica | Sistema completo |

### **Benefícios**

1. **🔒 Segurança**: Tratamento automático de tokens e erros
2. **🚀 Performance**: Menos código duplicado
3. **🎯 UX**: Notificações consistentes e informativas
4. **🔧 Manutenção**: Código mais limpo e organizados
5. **📱 Tempo Real**: Chat e notificações instantâneas
6. **✅ Conformidade**: 100% alinhado com a API

### **Próximos Passos**

1. Substituir as funções antigas pelas novas
2. Testar cada fluxo individualmente
3. Verificar integração com WebSocket
4. Validar com dados reais da API
5. Documentar componentes específicos

---

**🎉 Com essas mudanças, a aplicação estará completamente modernizada e alinhada com a documentação da API Facilita!**
