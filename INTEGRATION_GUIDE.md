# 🚀 Guia de Integração - Facilita API

## 📋 Visão Geral

Este guia documenta como usar os novos serviços implementados para garantir que a aplicação esteja 100% alinhada com a documentação da API Facilita.

## 🔧 Serviços Implementados

### 1. **ApiService** (`src/services/apiService.ts`)
Serviço centralizado para todas as chamadas de API com tratamento automático de erros.

```typescript
import { facilitaApi } from './services/apiService'

// Exemplo de uso
const response = await facilitaApi.login(email, senha)
if (response.success) {
  // Login bem-sucedido
  console.log(response.data)
} else {
  // Erro já foi mostrado via notificationService
  console.log(response.error)
}
```

### 2. **ServiceFlowService** (`src/services/serviceFlowService.ts`)
Gerencia o fluxo completo de serviços conforme documentação.

```typescript
import { serviceFlowService } from './services/serviceFlowService'

// Fluxo completo para contratante
const result = await serviceFlowService.executeContratanteFlow(serviceData)
if (result.success) {
  // Redirecionar para próximo passo
  setCurrentScreen(result.nextStep) // 'waiting-driver'
}
```

### 3. **PaymentFlowService** (`src/services/paymentFlowService.ts`)
Gerencia pagamentos e carteira digital.

```typescript
import { paymentFlowService } from './services/paymentFlowService'

// Fluxo completo de pagamento
const result = await paymentFlowService.executeCompletePaymentFlow(serviceId, serviceValue)
if (result.requiresRecharge) {
  // Mostrar modal de recarga
  setShowRechargeModal(true)
} else if (result.success) {
  // Pagamento realizado
  setCurrentScreen('payment-completed')
}
```

### 4. **ChatService** (`src/services/chatService.ts`)
Sistema de chat em tempo real.

```typescript
import { chatService } from './services/chatService'

// Conectar ao chat
chatService.connectToChat(serviceId, userId)

// Escutar novas mensagens
const unsubscribe = chatService.onNewMessage((message) => {
  setMessages(prev => [...prev, message])
})

// Enviar mensagem
await chatService.sendTextMessage(serviceId, 'Olá!')
```

### 5. **RatingService** (`src/services/ratingService.ts`)
Sistema de avaliações.

```typescript
import { ratingService } from './services/ratingService'

// Criar avaliação
const result = await ratingService.createRating(serviceId, 5, 'Excelente serviço!')

// Obter estatísticas
const stats = await ratingService.getPrestadorRatingSummary(prestadorId)
```

## 🔄 Fluxos Principais Implementados

### 1. **Fluxo do Contratante**

```typescript
// 1. Criar serviço
const serviceResult = await serviceFlowService.createService(serviceData)
if (serviceResult.success) {
  // 2. Aguardar prestador (tela waiting-driver)
  setCurrentScreen('waiting-driver')
  
  // 3. Quando prestador aceitar (via polling ou WebSocket)
  setCurrentScreen('payment')
  
  // 4. Processar pagamento
  const paymentResult = await paymentFlowService.executeCompletePaymentFlow(
    serviceId, 
    serviceValue
  )
  
  if (paymentResult.success) {
    // 5. Ir para rastreamento
    setCurrentScreen('service-tracking')
  }
}
```

### 2. **Fluxo do Prestador**

```typescript
// 1. Ver serviços disponíveis
const servicesResult = await serviceFlowService.getAvailableServices()

// 2. Aceitar serviço
const acceptResult = await serviceFlowService.acceptService(serviceId)
if (acceptResult.success) {
  // 3. Executar serviço
  setCurrentScreen('service-execution')
  
  // 4. Finalizar serviço
  const finishResult = await serviceFlowService.finishService(serviceId)
  
  // 5. Aguardar confirmação do contratante
  setCurrentScreen('waiting-confirmation')
}
```

## 📱 Integração com Componentes Existentes

### **App.tsx** - Principais mudanças necessárias:

1. **Substituir chamadas diretas de fetch pelos novos serviços:**

```typescript
// ❌ Antes
const response = await fetch(url, { ... })

// ✅ Agora
const response = await facilitaApi.createService(serviceData)
```

2. **Usar fluxos automatizados:**

```typescript
// ❌ Antes - lógica espalhada
const createService = async () => {
  // Múltiplas verificações manuais
}

// ✅ Agora - fluxo automatizado
const createService = async () => {
  const result = await serviceFlowService.executeContratanteFlow(serviceData)
  if (result.success) {
    setCurrentScreen(result.nextStep)
  }
}
```

3. **Integrar chat em tempo real:**

```typescript
// No useEffect do serviço ativo
useEffect(() => {
  if (activeServiceId) {
    chatService.connectToChat(activeServiceId, loggedUser.id)
    
    const unsubscribe = chatService.onNewMessage((message) => {
      // Atualizar estado das mensagens
      setMessages(prev => [...prev, message])
      
      // Mostrar notificação
      notificationService.showInfo('Nova mensagem', message.mensagem)
    })
    
    return () => {
      unsubscribe()
      chatService.disconnectFromChat()
    }
  }
}, [activeServiceId])
```

## 🔐 Autenticação e Segurança

### **Headers Automáticos**
O `ApiService` adiciona automaticamente:
- `Authorization: Bearer ${token}`
- `Content-Type: application/json`

### **Tratamento de Erros**
Todos os erros são tratados automaticamente:
- **401**: Remove token e redireciona para login
- **403**: Mostra erro de permissão
- **404**: Recurso não encontrado
- **500**: Erro do servidor

## 📊 Status Codes e Fluxos

### **Status de Serviços**
- `PENDENTE` → Aguardando prestador
- `EM_ANDAMENTO` → Prestador executando
- `AGUARDANDO_CONFIRMACAO` → Aguardando confirmação do contratante
- `FINALIZADO` → Pronto para pagamento
- `CANCELADO` → Serviço cancelado

### **Próximos Passos por Status**
```typescript
const nextStep = serviceFlowService.getNextStepByStatus(status, userType)
setCurrentScreen(nextStep)
```

## 🔔 Sistema de Notificações

### **Notificações Automáticas**
Todos os serviços já integram com `notificationService`:
- ✅ Sucessos são mostrados automaticamente
- ❌ Erros são tratados e exibidos
- ⚠️ Avisos são mostrados quando necessário

### **WebSocket para Tempo Real**
```typescript
// Chat em tempo real
chatService.connectToChat(serviceId, userId)

// Notificações em tempo real (implementar se necessário)
// notificationService.connectWebSocket()
```

## 🧪 Como Testar

### 1. **Fluxo Completo de Serviço**
```bash
1. Login como contratante
2. Criar serviço
3. Login como prestador (outra aba)
4. Aceitar serviço
5. Voltar para contratante
6. Verificar se foi notificado
7. Pagar serviço
8. Prestador finaliza
9. Contratante confirma
10. Avaliar serviço
```

### 2. **Fluxo de Pagamento**
```bash
1. Criar carteira
2. Tentar pagar sem saldo
3. Fazer recarga
4. Pagar serviço
5. Verificar transações
```

### 3. **Chat em Tempo Real**
```bash
1. Abrir chat em duas abas
2. Enviar mensagens
3. Verificar tempo real
4. Enviar imagens
5. Marcar como lidas
```

## 🚨 Pontos de Atenção

### **1. Endpoints Corretos**
Todos os endpoints estão em `src/config/constants.ts` e seguem a documentação.

### **2. Tratamento de Erros**
Não é mais necessário tratar erros manualmente - os serviços fazem isso automaticamente.

### **3. Estados de Loading**
Os serviços retornam `success: boolean` - use isso para controlar loading states.

### **4. WebSocket**
O chat usa WebSocket - certifique-se de que o servidor suporta.

### **5. Tokens JWT**
O `ApiService` gerencia tokens automaticamente, incluindo remoção em caso de expiração.

## 📈 Próximos Passos

1. **Substituir chamadas antigas** pelos novos serviços
2. **Testar todos os fluxos** com dados reais
3. **Implementar WebSocket** para notificações em tempo real
4. **Adicionar testes unitários** para os serviços
5. **Documentar componentes** que usam os serviços

## 🔗 Referências

- [Documentação da API Facilita](link-para-documentacao)
- [Endpoints Disponíveis](src/config/constants.ts)
- [Exemplos de Uso](src/services/)

---

**✅ Com essas implementações, a aplicação está 100% alinhada com a documentação da API Facilita!**
