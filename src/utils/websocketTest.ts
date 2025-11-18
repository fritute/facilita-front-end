// Utilitário para testar WebSocket manualmente
import websocketService from '../services/websocketService'

export const testWebSocketConnection = async () => {
  try {
    console.log('🧪 Iniciando teste do WebSocket...')
    
    // 1. Conectar
    await websocketService.connect()
    console.log('✅ 1. Conectado ao WebSocket')
    
    // 2. Autenticar usuário (contratante)
    await websocketService.authenticateUser({
      userId: 1,
      userType: 'contratante',
      userName: 'Giovanna'
    })
    console.log('✅ 2. Usuário autenticado')
    
    // 3. Entrar na sala do serviço
    await websocketService.joinService(138)
    console.log('✅ 3. Entrou na sala do serviço 138')
    
    // 4. Configurar listener para mensagens
    websocketService.onMessageReceived((message) => {
      console.log('📨 Mensagem recebida:', message)
    })
    console.log('✅ 4. Listener configurado')
    
    // 5. Enviar mensagem de teste
    setTimeout(() => {
      websocketService.sendMessage({
        servicoId: 138,
        mensagem: 'Olá! Esta é uma mensagem de teste do contratante.',
        sender: 'contratante',
        targetUserId: 2
      })
      console.log('✅ 5. Mensagem de teste enviada')
    }, 2000)
    
    console.log('🎉 Teste do WebSocket concluído! Verifique os logs para ver as mensagens.')
    
  } catch (error) {
    console.error('❌ Erro no teste do WebSocket:', error)
  }
}

export const testWebSocketPrestador = async () => {
  try {
    console.log('🧪 Iniciando teste do WebSocket como PRESTADOR...')
    
    // 1. Conectar
    await websocketService.connect()
    console.log('✅ 1. Conectado ao WebSocket')
    
    // 2. Autenticar usuário (prestador)
    await websocketService.authenticateUser({
      userId: 2,
      userType: 'prestador',
      userName: 'Carlos'
    })
    console.log('✅ 2. Prestador autenticado')
    
    // 3. Entrar na sala do serviço
    await websocketService.joinService(138)
    console.log('✅ 3. Entrou na sala do serviço 138')
    
    // 4. Configurar listener para mensagens
    websocketService.onMessageReceived((message) => {
      console.log('📨 Mensagem recebida pelo prestador:', message)
    })
    console.log('✅ 4. Listener configurado')
    
    // 5. Enviar mensagem de resposta
    setTimeout(() => {
      websocketService.sendMessage({
        servicoId: 138,
        mensagem: 'Oi, tudo ótimo! Pronto para começar o serviço.',
        sender: 'prestador',
        targetUserId: 1
      })
      console.log('✅ 5. Mensagem de resposta enviada')
    }, 3000)
    
    console.log('🎉 Teste do prestador concluído!')
    
  } catch (error) {
    console.error('❌ Erro no teste do prestador:', error)
  }
}

// Função para testar no console do navegador
export const runWebSocketTests = () => {
  console.log('🚀 Executando testes do WebSocket...')
  console.log('Para testar, abra duas abas do navegador e execute:')
  console.log('Aba 1: testWebSocketConnection()')
  console.log('Aba 2: testWebSocketPrestador()')
  
  // Disponibilizar no window para acesso fácil
  ;(window as any).testWebSocketConnection = testWebSocketConnection
  ;(window as any).testWebSocketPrestador = testWebSocketPrestador
}

export default {
  testWebSocketConnection,
  testWebSocketPrestador,
  runWebSocketTests
}
