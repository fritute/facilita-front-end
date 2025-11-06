// Serviço de busca de prestadores integrado com a API real

import { API_BASE_URL } from '../config/constants'

export interface Prestador {
  id: number
  id_usuario: number
  usuario: {
    id: number
    nome: string
    email: string
    telefone: string
    tipo_conta: string
    foto_perfil?: string
  }
  localizacao?: Array<{
    id: number
    logradouro: string
    numero: string
    bairro: string
    cidade: string
    cep: string
    latitude: string
    longitude: string
  }>
  documento?: Array<{
    id: number
    tipo_documento: string
    valor: string
    data_validade?: string
    arquivo_url?: string
  }>
  avaliacao?: number
  totalCorridas?: number
}

export interface PrestadorFormatado {
  id: number
  nome: string
  veiculo: string
  placa: string
  avaliacao: number
  foto: string
  tempoChegada: string
  distancia: string
  telefone: string
  totalCorridas: number
  anoExperiencia: number
  categoria: 'ECONOMICO' | 'CONFORTO' | 'PREMIUM'
  id_prestador: number
  latitude?: string
  longitude?: string
}

export interface ServicoAceito {
  id: number
  id_contratante: number
  id_prestador: number
  id_categoria: number
  descricao: string
  status: string
  valor: string
  data_solicitacao: string
}

/**
 * Busca todos os prestadores disponíveis na API
 */
export const buscarPrestadores = async (token: string): Promise<Prestador[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/prestador`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Erro ao buscar prestadores')
    }

    const data = await response.json()
    return data.data || data.prestadores || []
  } catch (error) {
    console.error('Erro ao buscar prestadores:', error)
    throw error
  }
}

/**
 * Busca um prestador específico por ID
 */
export const buscarPrestadorPorId = async (
  prestadorId: number,
  token: string
): Promise<Prestador> => {
  try {
    const response = await fetch(`${API_BASE_URL}/prestador/${prestadorId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Erro ao buscar prestador')
    }

    const data = await response.json()
    return data.data || data.prestador
  } catch (error) {
    console.error('Erro ao buscar prestador:', error)
    throw error
  }
}

/**
 * Formata os dados do prestador da API para o formato esperado pela UI
 */
export const formatarPrestador = (prestador: Prestador): PrestadorFormatado => {
  // Extrair informações do veículo dos documentos
  const tipoVeiculo = prestador.documento?.find(
    d => d.tipo_documento === 'TIPO_VEICULO'
  )?.valor || 'Veículo'
  
  const modeloVeiculo = prestador.documento?.find(
    d => d.tipo_documento === 'MODELO_VEICULO'
  )?.valor || ''
  
  const anoVeiculo = prestador.documento?.find(
    d => d.tipo_documento === 'ANO_VEICULO'
  )?.valor || ''

  const placa = prestador.documento?.find(
    d => d.tipo_documento === 'PLACA_VEICULO'
  )?.valor || 'N/A'

  // Determinar categoria baseado no tipo de veículo
  let categoria: 'ECONOMICO' | 'CONFORTO' | 'PREMIUM' = 'ECONOMICO'
  if (tipoVeiculo.includes('CARRO') || tipoVeiculo.includes('CAR')) {
    categoria = 'CONFORTO'
  } else if (tipoVeiculo.includes('PREMIUM') || tipoVeiculo.includes('LUXO')) {
    categoria = 'PREMIUM'
  }

  // Calcular distância simulada (em produção viria da geolocalização)
  const distancia = (Math.random() * 4 + 0.5).toFixed(1) + ' km'
  
  // Calcular tempo estimado baseado na distância
  const distanciaNum = parseFloat(distancia)
  const tempoMin = Math.ceil(distanciaNum * 2)
  const tempoMax = Math.ceil(distanciaNum * 3)
  const tempoChegada = `${tempoMin}-${tempoMax} min`

  // Calcular anos de experiência baseado na data de criação
  const anoExperiencia = Math.floor(Math.random() * 5) + 1

  return {
    id: prestador.id,
    nome: prestador.usuario.nome,
    veiculo: `${modeloVeiculo} ${anoVeiculo}`.trim() || tipoVeiculo,
    placa: placa,
    avaliacao: prestador.avaliacao || (4.5 + Math.random() * 0.4), // 4.5 a 4.9
    foto: prestador.usuario.foto_perfil || '/driver-avatar.png',
    tempoChegada: tempoChegada,
    distancia: distancia,
    telefone: prestador.usuario.telefone,
    totalCorridas: prestador.totalCorridas || Math.floor(Math.random() * 2000) + 100,
    anoExperiencia: anoExperiencia,
    categoria: categoria,
    id_prestador: prestador.id,
    latitude: prestador.localizacao?.[0]?.latitude,
    longitude: prestador.localizacao?.[0]?.longitude
  }
}

/**
 * Busca e formata prestadores disponíveis
 */
export const buscarPrestadoresDisponiveis = async (
  token: string
): Promise<PrestadorFormatado[]> => {
  try {
    const prestadores = await buscarPrestadores(token)
    return prestadores.map(formatarPrestador)
  } catch (error) {
    console.error('Erro ao buscar prestadores disponíveis:', error)
    throw error
  }
}

/**
 * Simula a busca de um prestador disponível (com delay para UX)
 */
export const buscarPrestadorDisponivel = async (
  token: string
): Promise<PrestadorFormatado> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Buscar prestadores disponíveis
      const prestadores = await buscarPrestadoresDisponiveis(token)

      if (prestadores.length === 0) {
        reject(new Error('Nenhum prestador disponível no momento'))
        return
      }

      // Simular tempo de busca (3-8 segundos)
      const tempoEspera = Math.random() * 5000 + 3000
      
      setTimeout(() => {
        // Selecionar prestador aleatório
        const prestadorSelecionado = prestadores[
          Math.floor(Math.random() * prestadores.length)
        ]
        
        resolve(prestadorSelecionado)
      }, tempoEspera)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Aceita um serviço como prestador
 */
export const aceitarServico = async (
  servicoId: number,
  token: string
): Promise<ServicoAceito> => {
  try {
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
      throw new Error(errorData.message || 'Erro ao aceitar serviço')
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Erro ao aceitar serviço:', error)
    throw error
  }
}

/**
 * Busca serviços pendentes (para prestadores)
 */
export const buscarServicosPendentes = async (
  token: string
): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/servico?status=PENDENTE`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Erro ao buscar serviços pendentes')
    }

    const data = await response.json()
    return data.data || data.servicos || []
  } catch (error) {
    console.error('Erro ao buscar serviços pendentes:', error)
    throw error
  }
}

/**
 * Simula a aceitação automática de um serviço por um prestador disponível
 * Esta função seria executada em um sistema real por um prestador real
 */
export const simularAceitacaoAutomatica = async (
  servicoId: number,
  token: string
): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Aguardar um tempo aleatório (5-15 segundos)
      const tempoEspera = Math.random() * 10000 + 5000
      
      setTimeout(async () => {
        try {
          await aceitarServico(servicoId, token)
          resolve(true)
        } catch (error) {
          reject(error)
        }
      }, tempoEspera)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Busca um serviço específico por ID
 */
export const buscarServicoPorId = async (
  servicoId: number,
  token: string
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/servico/${servicoId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Erro ao buscar serviço')
    }

    const data = await response.json()
    return data.data || data.servico
  } catch (error) {
    console.error('Erro ao buscar serviço:', error)
    throw error
  }
}

/**
 * Polling para verificar se um serviço foi aceito
 */
export const verificarServicoAceito = async (
  servicoId: number,
  token: string,
  callback: (prestador: PrestadorFormatado) => void,
  maxTentativas: number = 30
): Promise<void> => {
  let tentativas = 0
  
  const verificar = async () => {
    try {
      const servico = await buscarServicoPorId(servicoId, token)
      
      if (servico.status === 'EM_ANDAMENTO' && servico.id_prestador) {
        // Serviço foi aceito, buscar dados do prestador
        const prestador = await buscarPrestadorPorId(servico.id_prestador, token)
        const prestadorFormatado = formatarPrestador(prestador)
        callback(prestadorFormatado)
        return
      }
      
      tentativas++
      
      if (tentativas < maxTentativas) {
        // Verificar novamente em 2 segundos
        setTimeout(verificar, 2000)
      } else {
        throw new Error('Tempo limite excedido para encontrar prestador')
      }
    } catch (error) {
      console.error('Erro ao verificar serviço:', error)
      throw error
    }
  }
  
  verificar()
}
