// Serviço para simular aceitação automática de serviços por prestadores mockados

import { API_BASE_URL } from '../config/constants'

/**
 * Simula um prestador mockado aceitando automaticamente um serviço
 * após um delay aleatório (similar ao comportamento real)
 */
export const simularAceitacaoAutomatica = async (
  servicoId: number,
  token: string,
  delayMin: number = 5000,
  delayMax: number = 15000
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Tempo aleatório entre delayMin e delayMax
    const delay = Math.random() * (delayMax - delayMin) + delayMin
    
    console.log(`🤖 [MOCK] Prestador mockado irá aceitar serviço ${servicoId} em ${Math.round(delay/1000)}s...`)
    
    setTimeout(async () => {
      try {
        console.log(`🤖 [MOCK] Tentando aceitar serviço ${servicoId}...`)
        
        const response = await fetch(
          `${API_BASE_URL}/servico/${servicoId}/aceitar`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          console.error('❌ [MOCK] Erro ao aceitar serviço:', errorData)
          reject(new Error(errorData.message || 'Erro ao aceitar serviço'))
          return
        }

        const data = await response.json()
        console.log('✅ [MOCK] Serviço aceito com sucesso!', data)
        resolve()
      } catch (error) {
        console.error('❌ [MOCK] Erro na requisição:', error)
        reject(error)
      }
    }, delay)
  })
}

/**
 * Inicia simulação de múltiplos prestadores tentando aceitar o serviço
 * (simula competição entre prestadores)
 */
export const simularCompetidoresPrestadores = async (
  servicoId: number,
  tokens: string[],
  quantidade: number = 3
): Promise<void> => {
  console.log(`🤖 [MOCK] Iniciando simulação de ${quantidade} prestadores competindo pelo serviço ${servicoId}`)
  
  const promessas = tokens.slice(0, quantidade).map((token, index) => {
    // Cada prestador tenta aceitar em um tempo diferente
    const delay = Math.random() * 10000 + 5000 // 5-15 segundos
    
    return simularAceitacaoAutomatica(servicoId, token, delay, delay + 1000)
      .then(() => {
        console.log(`✅ [MOCK] Prestador ${index + 1} conseguiu aceitar o serviço!`)
        return true
      })
      .catch((error) => {
        console.log(`⚠️ [MOCK] Prestador ${index + 1} não conseguiu aceitar:`, error.message)
        return false
      })
  })

  // Aguardar até que pelo menos um aceite
  await Promise.race(promessas)
}

/**
 * Busca um token de prestador disponível para usar no mock
 */
export const buscarTokenPrestadorMock = async (): Promise<string | null> => {
  try {
    // Tentar fazer login com credenciais de prestador mockado
    const prestadoresMock = [
      { email: 'vinicius@gmail.com', senha: 'senha123' },
      { email: 'prestador1@teste.com', senha: 'senha123' },
      { email: 'prestador2@teste.com', senha: 'senha123' }
    ]

    for (const prestador of prestadoresMock) {
      try {
        const response = await fetch(`${API_BASE_URL}/usuario/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: prestador.email,
            senha_hash: prestador.senha // API espera senha_hash
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`🔍 [MOCK] Resposta do login:`, data)
          
          // Verificar se é prestador
          if (data.token) {
            const tipoConta = data.usuario?.tipo_conta || data.prestador?.usuario?.tipo_conta
            if (tipoConta === 'PRESTADOR') {
              console.log(`✅ [MOCK] Token de prestador obtido: ${prestador.email}`)
              return data.token
            } else {
              console.log(`⚠️ [MOCK] ${prestador.email} não é prestador (tipo: ${tipoConta})`)
            }
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.log(`⚠️ [MOCK] Falha no login de ${prestador.email}:`, errorData.message || response.statusText)
        }
      } catch (error) {
        console.log(`⚠️ [MOCK] Erro ao tentar login de ${prestador.email}:`, error)
      }
    }

    console.warn('⚠️ [MOCK] Nenhum prestador mockado disponível')
    return null
  } catch (error) {
    console.error('❌ [MOCK] Erro ao buscar token de prestador:', error)
    return null
  }
}

/**
 * Cria um prestador temporário para testes
 */
const criarPrestadorTemporario = async (): Promise<string | null> => {
  try {
    const randomId = Math.floor(Math.random() * 10000)
    const email = `prestador_temp_${randomId}@teste.com`
    const senha = 'senha123'
    
    console.log(`🤖 [MOCK] Criando prestador temporário: ${email}`)
    
    // Criar usuário prestador
    const response = await fetch(`${API_BASE_URL}/usuario/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: `Prestador Temp ${randomId}`,
        email: email,
        senha_hash: senha,
        telefone: `+55119${String(randomId).padStart(8, '0')}`,
        tipo_conta: 'PRESTADOR'
      })
    })

    if (response.ok) {
      await response.json() // Consumir resposta
      console.log(`✅ [MOCK] Prestador temporário criado com sucesso`)
      
      // Fazer login para obter token
      const loginResponse = await fetch(`${API_BASE_URL}/usuario/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          senha_hash: senha
        })
      })

      if (loginResponse.ok) {
        const loginData = await loginResponse.json()
        return loginData.token
      }
    }
    
    return null
  } catch (error) {
    console.error('❌ [MOCK] Erro ao criar prestador temporário:', error)
    return null
  }
}

/**
 * Inicia aceitação automática usando prestador mockado
 * Esta é a função principal que deve ser chamada após criar um serviço
 */
export const iniciarAceitacaoMockada = async (
  servicoId: number,
  delayMin: number = 8000,
  delayMax: number = 20000
): Promise<void> => {
  console.log(`🤖 [MOCK] Iniciando sistema de aceitação automática para serviço ${servicoId}`)
  
  try {
    // Buscar token de prestador mockado
    let tokenPrestador = await buscarTokenPrestadorMock()
    
    // Se não encontrou prestador mockado, tentar criar um temporário
    if (!tokenPrestador) {
      console.log('🤖 [MOCK] Tentando criar prestador temporário...')
      tokenPrestador = await criarPrestadorTemporario()
    }
    
    if (!tokenPrestador) {
      console.warn('⚠️ [MOCK] Não foi possível obter token de prestador. Aceitação mockada desabilitada.')
      console.warn('💡 [MOCK] Dica: Crie manualmente uma conta de prestador com email "vinicius@gmail.com" e senha "senha123"')
      return
    }

    // Simular aceitação após delay
    await simularAceitacaoAutomatica(servicoId, tokenPrestador, delayMin, delayMax)
    
    console.log('✅ [MOCK] Sistema de aceitação automática concluído!')
  } catch (error) {
    console.error('❌ [MOCK] Erro no sistema de aceitação automática:', error)
    throw error
  }
}

/**
 * Verifica se o modo mock está habilitado
 */
export const isMockModeEnabled = (): boolean => {
  // Verificar localStorage ou variável de ambiente
  const mockEnabled = localStorage.getItem('mockPrestadorEnabled')
  return mockEnabled === 'true' || import.meta.env.VITE_MOCK_PRESTADOR === 'true'
}

/**
 * Habilita ou desabilita o modo mock
 */
export const setMockMode = (enabled: boolean): void => {
  localStorage.setItem('mockPrestadorEnabled', enabled.toString())
  console.log(`🤖 [MOCK] Modo mock ${enabled ? 'HABILITADO' : 'DESABILITADO'}`)
}

/**
 * Wrapper inteligente que decide se deve usar mock ou não
 */
export const aceitarServicoAutomaticamente = async (
  servicoId: number,
  forcarMock: boolean = false
): Promise<void> => {
  const usarMock = forcarMock || isMockModeEnabled()
  
  if (usarMock) {
    console.log('🤖 [MOCK] Modo mock ativo - iniciando aceitação automática')
    await iniciarAceitacaoMockada(servicoId)
  } else {
    console.log('ℹ️ Modo mock desabilitado - aguardando prestador real')
  }
}
