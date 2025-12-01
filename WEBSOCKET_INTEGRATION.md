# 🔌 Integração WebSocket - Facilita Frontend

## 📋 Visão Geral

Esta implementação integra WebSocket para **tracking em tempo real** e **chat instantâneo** entre contratantes e prestadores de serviço.

## 🏗️ Arquitetura

### 📁 Estrutura de Arquivos

```
src/
├── services/
│   └── websocketService.ts          # Serviço principal WebSocket
├── hooks/
│   └── useWebSocket.ts              # Hook personalizado para WebSocket
├── components/
│   ├── ServiceTracking.tsx          # Tracking com WebSocket
│   ├── ChatModal.tsx                # Chat com WebSocket
│   └── WebSocketStatus.tsx          # Indicador de status
```

### 🔧 Componentes Principais

#### 1. **WebSocketService** (`websocketService.ts`)
- **Conexão**: Gerencia conexão com servidor Azure
- **Autenticação**: Autentica usuários no WebSocket
- **Salas**: Gerencia entrada/saída de salas de serviço
- **Eventos**: Envia/recebe localização e mensagens

#### 2. **useWebSocket Hook** (`useWebSocket.ts`)
- **Hook personalizado** para facilitar uso do WebSocket
- **Estados gerenciados**: conexão, localização, mensagens
- **Cleanup automático**: Remove listeners ao desmontar

#### 3. **WebSocketStatus** (`WebSocketStatus.tsx`)
- **Indicador visual** do status da conexão
- **Adaptável**: Funciona com temas claro/escuro
- **Responsivo**: Ícones e texto adaptativos

## 🚀 Como Usar

### 📍 Tracking em Tempo Real

```typescript
// No ServiceTracking.tsx
const { isConnected, onLocationUpdate } = useWebSocket({
  serviceId: '123',
  enableTracking: true,
  enableChat: false
})

// Escutar atualizações de localização
useEffect(() => {
  onLocationUpdate((locationData) => {
    setDriverPosition({
      lat: locationData.latitude,
      lng: locationData.longitude
    })
  })
}, [onLocationUpdate])
```

### 💬 Chat em Tempo Real

```typescript
// No ChatModal.tsx
const { 
  isConnected, 
  sendMessage,
  onMessageReceived 
} = useWebSocket({
  serviceId: '123',
  enableTracking: false,
  enableChat: true
})

// Enviar mensagem
const handleSendMessage = () => {
  sendMessage('Olá!', targetUserId)
}

// Escutar mensagens
useEffect(() => {
  onMessageReceived((message) => {
    setMessages(prev => [...prev, message])
  })
}, [onMessageReceived])
```

## 📡 Eventos WebSocket

### 🔐 Autenticação
```typescript
{
  "userId": 12,
  "userType": "contratante",
  "userName": "João"
}
```

### 🏠 Entrar na Sala
```typescript
"serviceId" // String ou número
```

### 📍 Enviar Localização
```typescript
{
  "servicoId": 5,
  "latitude": -23.55052,
  "longitude": -46.633308,
  "userId": 12
}
```

### 💬 Enviar Mensagem
```typescript
{
  "servicoId": 5,
  "mensagem": "Olá, tudo bem?",
  "sender": "contratante",
  "targetUserId": 2
}
```

## 🔄 Fluxo de Funcionamento

### 📍 Tracking
1. **Conexão**: Cliente conecta ao WebSocket
2. **Autenticação**: Envia dados do usuário
3. **Sala**: Entra na sala do serviço
4. **Localização**: Prestador envia localização periodicamente
5. **Atualização**: Contratante recebe atualizações em tempo real

### 💬 Chat
1. **Conexão**: Cliente conecta ao WebSocket
2. **Autenticação**: Envia dados do usuário
3. **Sala**: Entra na sala do serviço
4. **Mensagem**: Usuário envia mensagem
5. **Broadcast**: Servidor envia para todos na sala

## 🌐 Configuração de Servidor

### 📍 URLs
- **Produção**: `wss://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net`
- **Desenvolvimento**: `ws://localhost:8080`

### 🔧 Configuração
```typescript
const socket = io(WEBSOCKET_URL, {
  transports: ['websocket'],
  timeout: 10000,
  forceNew: true
})
```

## 🛠️ Funcionalidades

### ✅ Implementadas
- [x] Conexão WebSocket com Azure
- [x] Autenticação de usuários
- [x] Salas por serviço
- [x] Tracking em tempo real
- [x] Chat instantâneo
- [x] Indicador de status
- [x] Fallback para API REST
- [x] Cleanup automático
- [x] Reconexão automática

### 🔄 Fallbacks
- **WebSocket offline**: Usa polling da API REST
- **Conexão perdida**: Tenta reconectar automaticamente
- **Erro de autenticação**: Mostra status offline

## 🎯 Benefícios

### 🚀 Performance
- **Tempo real**: Atualizações instantâneas
- **Baixa latência**: Comunicação direta
- **Eficiência**: Menos requisições HTTP

### 👥 Experiência do Usuário
- **Feedback visual**: Status de conexão
- **Comunicação fluida**: Chat instantâneo
- **Tracking preciso**: Localização em tempo real

### 🔧 Desenvolvimento
- **Hook reutilizável**: Fácil implementação
- **Cleanup automático**: Sem vazamentos de memória
- **Tipagem TypeScript**: Desenvolvimento seguro

## 🐛 Debugging

### 📊 Logs
```typescript
console.log('🔌 Conectando WebSocket...')
console.log('✅ WebSocket conectado')
console.log('📍 Localização recebida:', data)
console.log('💬 Mensagem recebida:', message)
```

### 🔍 Status
- **Verde**: Conexão ativa
- **Laranja**: Modo offline/fallback
- **Vermelho**: Erro de conexão

## 📱 Compatibilidade

### ✅ Suportado
- **React 18+**
- **TypeScript**
- **Socket.IO Client**
- **Navegadores modernos**

### 🔧 Dependências
```json
{
  "socket.io-client": "^4.x.x",
  "react": "^18.x.x",
  "typescript": "^5.x.x"
}
```

## 🚀 Próximos Passos

1. **Testes**: Implementar testes unitários
2. **Otimização**: Reduzir uso de memória
3. **Monitoramento**: Métricas de conexão
4. **Escalabilidade**: Suporte a múltiplas salas

---

**🎉 Sistema WebSocket totalmente integrado e funcional!**
