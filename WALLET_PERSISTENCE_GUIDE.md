# 💰 Guia de Persistência da Carteira Digital

## 🎯 Problema Resolvido

**Antes**: O saldo da carteira sumia ao recarregar a página  
**Agora**: O saldo fica persistido no localStorage e funciona offline

## 🔧 Como Implementar no App.tsx

### 1. **Imports Necessários**

```typescript
import { paymentFlowService } from './services/paymentFlowService'
import { walletPersistenceService } from './services/walletPersistenceService'
```

### 2. **Inicialização da Carteira**

```typescript
// No useEffect inicial do App.tsx
useEffect(() => {
  const initializeWallet = async () => {
    if (loggedUser?.id) {
      try {
        // Migrar dados antigos se necessário
        paymentFlowService.migrateOldWalletData()
        
        // Verificar se tem carteira local
        const hasLocal = paymentFlowService.hasLocalWallet(loggedUser.id)
        
        if (hasLocal) {
          // Carregar dados locais
          const localBalance = paymentFlowService.getLocalBalance()
          setWalletBalance(localBalance)
          
          console.log('💰 Saldo carregado do localStorage:', localBalance)
          
          // Tentar sincronizar com servidor em background
          try {
            const walletResult = await paymentFlowService.getMyWallet(loggedUser.id)
            if (walletResult.success) {
              setWalletData(walletResult.data)
              setWalletBalance(walletResult.data.saldo)
              setHasWallet(true)
            }
          } catch (error) {
            console.log('📱 Usando dados locais (servidor indisponível)')
          }
        } else {
          // Buscar do servidor
          const walletResult = await paymentFlowService.getMyWallet(loggedUser.id)
          if (walletResult.success) {
            setWalletData(walletResult.data)
            setWalletBalance(walletResult.data.saldo)
            setHasWallet(true)
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar carteira:', error)
      }
    }
  }
  
  initializeWallet()
}, [loggedUser])
```

### 3. **Função de Criar Carteira Atualizada**

```typescript
const handleCreateWallet = async (chavePagbank: string) => {
  try {
    setLoadingWallet(true)
    
    const result = await paymentFlowService.createWallet(chavePagbank, 0)
    
    if (result.success) {
      const walletData = result.data
      
      // Dados já são salvos automaticamente pelo paymentFlowService
      setHasWallet(true)
      setWalletData(walletData)
      setWalletBalance(walletData.saldo)
      setShowCreateWalletModal(false)
      
      console.log('✅ Carteira criada e salva localmente')
    }
    
  } finally {
    setLoadingWallet(false)
  }
}
```

### 4. **Função de Recarga Atualizada**

```typescript
const handleRechargeConfirmation = async () => {
  try {
    setLoadingRecharge(true)
    
    // Simular confirmação de recarga (normalmente viria via webhook)
    const newBalance = walletBalance + rechargeAmount
    
    // Atualizar saldo local
    if (loggedUser?.id) {
      paymentFlowService.updateLocalBalance(loggedUser.id, newBalance)
      
      // Sincronizar com servidor
      await paymentFlowService.syncBalanceAfterTransaction(
        loggedUser.id,
        rechargeAmount,
        'ENTRADA'
      )
    }
    
    // Atualizar estado da aplicação
    setWalletBalance(newBalance)
    
    // Fechar modais e mostrar sucesso
    setShowRechargeModal(false)
    setRechargeAmount(0)
    
    showSuccess('Recarga confirmada', `R$ ${rechargeAmount.toFixed(2)} adicionado à sua carteira`)
    
  } finally {
    setLoadingRecharge(false)
  }
}
```

### 5. **Função de Pagamento Atualizada**

```typescript
const handlePaymentConfirmation = async () => {
  try {
    setIsLoading(true)
    
    const serviceValue = servicePrice || 119.99
    
    const result = await paymentFlowService.executeCompletePaymentFlow(
      createdServiceId,
      serviceValue
    )
    
    if (result.success) {
      // Saldo já foi atualizado automaticamente pelo paymentFlowService
      const newBalance = paymentFlowService.getLocalBalance()
      setWalletBalance(newBalance)
      
      setCurrentScreen('service-tracking')
      
    } else if (result.requiresRecharge) {
      setShowRechargeModal(true)
      setRechargeAmount(result.data.missingAmount)
    }
    
  } finally {
    setIsLoading(false)
  }
}
```

### 6. **Função de Logout Atualizada**

```typescript
const handleLogout = () => {
  // Limpar dados da sessão
  setLoggedUser(null)
  setWalletData(null)
  setWalletBalance(0)
  setHasWallet(false)
  
  // Limpar tokens
  localStorage.removeItem('authToken')
  localStorage.removeItem('userData')
  
  // NÃO limpar dados da carteira - eles devem persistir
  // paymentFlowService.clearLocalWallet() // ❌ NÃO fazer isso
  
  setCurrentScreen('landing')
  
  showInfo('Logout realizado', 'Você foi desconectado com sucesso')
}
```

### 7. **Verificação de Saldo em Tempo Real**

```typescript
// useEffect para verificar saldo periodicamente
useEffect(() => {
  if (hasWallet && loggedUser?.id) {
    const checkBalance = () => {
      const localBalance = paymentFlowService.getLocalBalance()
      if (localBalance !== walletBalance) {
        setWalletBalance(localBalance)
        console.log('💰 Saldo atualizado:', localBalance)
      }
    }
    
    // Verificar a cada 5 segundos
    const interval = setInterval(checkBalance, 5000)
    
    return () => clearInterval(interval)
  }
}, [hasWallet, loggedUser, walletBalance])
```

### 8. **Componente de Debug (Opcional)**

```typescript
// Adicionar no JSX para debug (remover em produção)
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-4 left-4 bg-black text-white p-2 rounded text-xs">
    <div>💰 Saldo Local: R$ {paymentFlowService.getLocalBalance().toFixed(2)}</div>
    <div>📱 Tem Carteira: {paymentFlowService.hasLocalWallet(loggedUser?.id) ? 'Sim' : 'Não'}</div>
    <div>👤 Usuário: {loggedUser?.id || 'N/A'}</div>
    <button 
      onClick={() => {
        const summary = paymentFlowService.getWalletSummary()
        console.log('📊 Resumo da Carteira:', summary)
      }}
      className="bg-blue-500 px-2 py-1 rounded mt-1"
    >
      Ver Resumo
    </button>
  </div>
)}
```

## 🔄 Fluxo de Sincronização

### **Cenário 1: Usuário Online**
1. Carregar dados do localStorage (instantâneo)
2. Sincronizar com servidor em background
3. Atualizar se servidor tem dados mais recentes

### **Cenário 2: Usuário Offline**
1. Carregar dados do localStorage
2. Funcionar normalmente com dados locais
3. Sincronizar quando voltar online

### **Cenário 3: Primeiro Acesso**
1. Buscar dados do servidor
2. Salvar no localStorage
3. Usar dados locais nas próximas sessões

## 🛡️ Segurança e Validação

### **Dados Protegidos**
- ✅ Saldo da carteira
- ✅ ID da carteira
- ✅ Chave PagBank (criptografada)
- ✅ Timestamp da última atualização

### **Validações Automáticas**
- ✅ Verificação de usuário correto
- ✅ Sincronização com servidor
- ✅ Migração de dados antigos
- ✅ Tratamento de erros de rede

## 📊 Benefícios Implementados

| **Aspecto** | **Antes** | **Depois** |
|-------------|-----------|------------|
| **Persistência** | ❌ Sumia ao recarregar | ✅ Mantém sempre |
| **Offline** | ❌ Não funcionava | ✅ Funciona offline |
| **Performance** | ❌ Sempre busca servidor | ✅ Cache local |
| **UX** | ❌ Carregamento lento | ✅ Instantâneo |
| **Confiabilidade** | ❌ Dependia da rede | ✅ Sempre disponível |

## 🧪 Como Testar

### **Teste 1: Persistência Básica**
1. Fazer login
2. Adicionar saldo à carteira
3. Recarregar a página
4. ✅ Verificar se saldo permanece

### **Teste 2: Múltiplos Usuários**
1. Login com usuário A
2. Adicionar saldo
3. Logout
4. Login com usuário B
5. ✅ Verificar se cada usuário tem seu saldo

### **Teste 3: Modo Offline**
1. Desconectar internet
2. Recarregar página
3. ✅ Verificar se carteira ainda funciona

### **Teste 4: Sincronização**
1. Fazer transação offline
2. Reconectar internet
3. ✅ Verificar se sincroniza com servidor

## 🚀 Resultado Final

**✅ PROBLEMA RESOLVIDO**: O saldo da carteira agora persiste permanentemente, funcionando online e offline, com sincronização automática e suporte a múltiplos usuários!
