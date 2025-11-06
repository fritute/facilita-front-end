// Serviço de busca de motoristas com dados mockados

export interface Driver {
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
}

// Base de dados mockada de motoristas
const MOCK_DRIVERS: Driver[] = [
  {
    id: 1,
    nome: 'João Silva',
    veiculo: 'Honda Civic Prata',
    placa: 'ABC-1234',
    avaliacao: 4.8,
    foto: '/driver-avatar-1.png',
    tempoChegada: '5-8 min',
    distancia: '1.2 km',
    telefone: '(11) 98765-4321',
    totalCorridas: 1250,
    anoExperiencia: 5,
    categoria: 'CONFORTO'
  },
  {
    id: 2,
    nome: 'Maria Santos',
    veiculo: 'Toyota Corolla Preto',
    placa: 'DEF-5678',
    avaliacao: 4.9,
    foto: '/driver-avatar-2.png',
    tempoChegada: '3-6 min',
    distancia: '0.8 km',
    telefone: '(11) 97654-3210',
    totalCorridas: 2100,
    anoExperiencia: 7,
    categoria: 'PREMIUM'
  },
  {
    id: 3,
    nome: 'Carlos Oliveira',
    veiculo: 'Chevrolet Onix Branco',
    placa: 'GHI-9012',
    avaliacao: 4.7,
    foto: '/driver-avatar-3.png',
    tempoChegada: '7-10 min',
    distancia: '2.5 km',
    telefone: '(11) 96543-2109',
    totalCorridas: 890,
    anoExperiencia: 3,
    categoria: 'ECONOMICO'
  },
  {
    id: 4,
    nome: 'Ana Paula Costa',
    veiculo: 'Hyundai HB20 Vermelho',
    placa: 'JKL-3456',
    avaliacao: 4.6,
    foto: '/driver-avatar-4.png',
    tempoChegada: '6-9 min',
    distancia: '1.8 km',
    telefone: '(11) 95432-1098',
    totalCorridas: 650,
    anoExperiencia: 2,
    categoria: 'ECONOMICO'
  },
  {
    id: 5,
    nome: 'Roberto Ferreira',
    veiculo: 'Volkswagen Jetta Azul',
    placa: 'MNO-7890',
    avaliacao: 4.9,
    foto: '/driver-avatar-5.png',
    tempoChegada: '4-7 min',
    distancia: '1.0 km',
    telefone: '(11) 94321-0987',
    totalCorridas: 3200,
    anoExperiencia: 10,
    categoria: 'PREMIUM'
  },
  {
    id: 6,
    nome: 'Juliana Almeida',
    veiculo: 'Fiat Argo Cinza',
    placa: 'PQR-2345',
    avaliacao: 4.5,
    foto: '/driver-avatar-6.png',
    tempoChegada: '8-12 min',
    distancia: '3.2 km',
    telefone: '(11) 93210-9876',
    totalCorridas: 420,
    anoExperiencia: 1,
    categoria: 'ECONOMICO'
  },
  {
    id: 7,
    nome: 'Pedro Henrique',
    veiculo: 'Nissan Versa Prata',
    placa: 'STU-6789',
    avaliacao: 4.8,
    foto: '/driver-avatar-7.png',
    tempoChegada: '5-8 min',
    distancia: '1.5 km',
    telefone: '(11) 92109-8765',
    totalCorridas: 1800,
    anoExperiencia: 6,
    categoria: 'CONFORTO'
  },
  {
    id: 8,
    nome: 'Fernanda Lima',
    veiculo: 'Renault Sandero Branco',
    placa: 'VWX-0123',
    avaliacao: 4.7,
    foto: '/driver-avatar-8.png',
    tempoChegada: '6-10 min',
    distancia: '2.0 km',
    telefone: '(11) 91098-7654',
    totalCorridas: 980,
    anoExperiencia: 4,
    categoria: 'ECONOMICO'
  }
]

export interface DriverSearchOptions {
  categoria?: 'ECONOMICO' | 'CONFORTO' | 'PREMIUM'
  avaliacaoMinima?: number
  distanciaMaxima?: number // em km
  tempoMaximo?: number // em minutos
}

export interface DriverSearchResult {
  driver: Driver
  tempoEspera: number // em segundos
}

/**
 * Simula a busca de um motorista disponível
 * @param options Opções de filtro para a busca
 * @returns Promise com o motorista encontrado e tempo de espera
 */
export const searchDriver = async (
  options: DriverSearchOptions = {}
): Promise<DriverSearchResult> => {
  return new Promise((resolve, reject) => {
    // Simular tempo de busca entre 3 e 12 segundos
    const searchTime = Math.random() * 9000 + 3000

    setTimeout(() => {
      // Filtrar motoristas baseado nas opções
      let availableDrivers = [...MOCK_DRIVERS]

      if (options.categoria) {
        availableDrivers = availableDrivers.filter(
          d => d.categoria === options.categoria
        )
      }

      if (options.avaliacaoMinima) {
        availableDrivers = availableDrivers.filter(
          d => d.avaliacao >= options.avaliacaoMinima
        )
      }

      if (options.distanciaMaxima) {
        availableDrivers = availableDrivers.filter(d => {
          const distancia = parseFloat(d.distancia.replace(' km', ''))
          return distancia <= options.distanciaMaxima!
        })
      }

      // Simular chance de não encontrar motorista (10%)
      if (Math.random() < 0.1 || availableDrivers.length === 0) {
        reject(new Error('Nenhum motorista disponível no momento'))
        return
      }

      // Selecionar motorista aleatório dos disponíveis
      const randomIndex = Math.floor(Math.random() * availableDrivers.length)
      const selectedDriver = availableDrivers[randomIndex]

      resolve({
        driver: selectedDriver,
        tempoEspera: Math.floor(searchTime / 1000)
      })
    }, searchTime)
  })
}

/**
 * Busca múltiplos motoristas disponíveis
 * @param count Quantidade de motoristas a buscar
 * @param options Opções de filtro
 * @returns Promise com array de motoristas
 */
export const searchMultipleDrivers = async (
  count: number = 3,
  options: DriverSearchOptions = {}
): Promise<Driver[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let availableDrivers = [...MOCK_DRIVERS]

      if (options.categoria) {
        availableDrivers = availableDrivers.filter(
          d => d.categoria === options.categoria
        )
      }

      if (options.avaliacaoMinima) {
        availableDrivers = availableDrivers.filter(
          d => d.avaliacao >= options.avaliacaoMinima
        )
      }

      // Embaralhar e pegar os primeiros N motoristas
      const shuffled = availableDrivers.sort(() => Math.random() - 0.5)
      resolve(shuffled.slice(0, Math.min(count, shuffled.length)))
    }, 2000)
  })
}

/**
 * Obtém informações detalhadas de um motorista específico
 * @param driverId ID do motorista
 * @returns Driver ou undefined se não encontrado
 */
export const getDriverById = (driverId: number): Driver | undefined => {
  return MOCK_DRIVERS.find(d => d.id === driverId)
}

/**
 * Simula o aceite de uma corrida por um motorista
 * @param driverId ID do motorista
 * @returns Promise com sucesso ou erro
 */
export const acceptRide = async (driverId: number): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const driver = getDriverById(driverId)
      
      if (!driver) {
        reject(new Error('Motorista não encontrado'))
        return
      }

      // Simular 95% de chance de aceitar
      if (Math.random() < 0.95) {
        resolve(true)
      } else {
        reject(new Error('Motorista não pode aceitar a corrida no momento'))
      }
    }, 1500)
  })
}

/**
 * Simula o cancelamento de uma corrida
 * @param driverId ID do motorista
 * @returns Promise com sucesso
 */
export const cancelRide = async (driverId: number): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
    }, 500)
  })
}

/**
 * Obtém a localização atual simulada do motorista
 * @param driverId ID do motorista
 * @returns Promise com coordenadas
 */
export const getDriverLocation = async (
  driverId: number
): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    const driver = getDriverById(driverId)
    
    if (!driver) {
      reject(new Error('Motorista não encontrado'))
      return
    }

    // Simular localização próxima (São Paulo como referência)
    const baseLat = -23.5505
    const baseLng = -46.6333
    
    // Adicionar variação aleatória de até 0.05 graus (~5km)
    const lat = baseLat + (Math.random() - 0.5) * 0.05
    const lng = baseLng + (Math.random() - 0.5) * 0.05

    setTimeout(() => {
      resolve({ lat, lng })
    }, 500)
  })
}
