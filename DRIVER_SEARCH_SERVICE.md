# Serviço de Busca de Motoristas

## Descrição

Este documento descreve o serviço de busca de motoristas com dados mockados implementado no projeto Facilita.

## Arquivos Criados

### 1. `src/services/driverSearch.service.ts`

Serviço principal que gerencia a busca de motoristas com dados mockados.

#### Interfaces

**Driver**
```typescript
interface Driver {
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
```

**DriverSearchOptions**
```typescript
interface DriverSearchOptions {
  categoria?: 'ECONOMICO' | 'CONFORTO' | 'PREMIUM'
  avaliacaoMinima?: number
  distanciaMaxima?: number // em km
  tempoMaximo?: number // em minutos
}
```

**DriverSearchResult**
```typescript
interface DriverSearchResult {
  driver: Driver
  tempoEspera: number // em segundos
}
```

#### Funções Disponíveis

##### `searchDriver(options?: DriverSearchOptions): Promise<DriverSearchResult>`

Busca um motorista disponível baseado nas opções fornecidas.

**Parâmetros:**
- `options` (opcional): Filtros para a busca
  - `categoria`: Filtra por categoria do veículo
  - `avaliacaoMinima`: Avaliação mínima do motorista
  - `distanciaMaxima`: Distância máxima em km
  - `tempoMaximo`: Tempo máximo de espera em minutos

**Retorno:**
- Promise com objeto contendo o motorista encontrado e tempo de espera

**Exemplo:**
```typescript
import { searchDriver } from './services/driverSearch.service'

const result = await searchDriver({
  avaliacaoMinima: 4.5,
  distanciaMaxima: 5.0,
  categoria: 'CONFORTO'
})

console.log('Motorista:', result.driver.nome)
console.log('Tempo de espera:', result.tempoEspera, 'segundos')
```

##### `searchMultipleDrivers(count?: number, options?: DriverSearchOptions): Promise<Driver[]>`

Busca múltiplos motoristas disponíveis.

**Parâmetros:**
- `count`: Quantidade de motoristas a buscar (padrão: 3)
- `options`: Filtros para a busca

**Retorno:**
- Promise com array de motoristas

**Exemplo:**
```typescript
const drivers = await searchMultipleDrivers(5, {
  avaliacaoMinima: 4.7
})
```

##### `getDriverById(driverId: number): Driver | undefined`

Obtém informações de um motorista específico pelo ID.

**Exemplo:**
```typescript
const driver = getDriverById(1)
if (driver) {
  console.log(driver.nome)
}
```

##### `acceptRide(driverId: number): Promise<boolean>`

Simula o aceite de uma corrida por um motorista.

**Exemplo:**
```typescript
try {
  await acceptRide(1)
  console.log('Corrida aceita!')
} catch (error) {
  console.error('Motorista não pode aceitar')
}
```

##### `cancelRide(driverId: number): Promise<boolean>`

Simula o cancelamento de uma corrida.

**Exemplo:**
```typescript
await cancelRide(1)
console.log('Corrida cancelada')
```

##### `getDriverLocation(driverId: number): Promise<{lat: number, lng: number}>`

Obtém a localização atual simulada do motorista.

**Exemplo:**
```typescript
const location = await getDriverLocation(1)
console.log(`Lat: ${location.lat}, Lng: ${location.lng}`)
```

## Motoristas Mockados

O serviço possui 8 motoristas mockados com diferentes características:

1. **João Silva** - Honda Civic Prata (CONFORTO) - 4.8⭐
2. **Maria Santos** - Toyota Corolla Preto (PREMIUM) - 4.9⭐
3. **Carlos Oliveira** - Chevrolet Onix Branco (ECONOMICO) - 4.7⭐
4. **Ana Paula Costa** - Hyundai HB20 Vermelho (ECONOMICO) - 4.6⭐
5. **Roberto Ferreira** - Volkswagen Jetta Azul (PREMIUM) - 4.9⭐
6. **Juliana Almeida** - Fiat Argo Cinza (ECONOMICO) - 4.5⭐
7. **Pedro Henrique** - Nissan Versa Prata (CONFORTO) - 4.8⭐
8. **Fernanda Lima** - Renault Sandero Branco (ECONOMICO) - 4.7⭐

## Integração no App.tsx

A função `startBackgroundDriverSearch` foi atualizada para usar o novo serviço:

```typescript
const startBackgroundDriverSearch = async (serviceData: any) => {
  console.log('🔍 Iniciando busca de motorista em background...')
  setIsSearchingDriverBackground(true)
  setBackgroundSearchStartTime(new Date())
  setSearchTimeElapsed(0)
  
  const searchInterval = setInterval(() => {
    setSearchTimeElapsed(prev => prev + 1)
  }, 1000)

  try {
    const searchOptions: DriverSearchOptions = {
      avaliacaoMinima: 4.5,
      distanciaMaxima: 5.0
    }

    const result = await searchDriver(searchOptions)
    
    console.log('✅ Motorista encontrado:', result.driver)
    setFoundDriver(result.driver)
    setShowDriverFoundModal(true)
    setIsSearchingDriverBackground(false)
    clearInterval(searchInterval)
  } catch (error) {
    console.error('❌ Erro ao buscar motorista:', error)
    setIsSearchingDriverBackground(false)
    clearInterval(searchInterval)
    alert('Não foi possível encontrar um motorista disponível no momento.')
  }
}
```

## Modal de Motorista Encontrado

O modal foi aprimorado para exibir:
- Avatar com gradiente
- Nome, veículo e placa
- Avaliação com estrela
- Badge de categoria (ECONOMICO/CONFORTO/PREMIUM)
- Tempo de chegada e distância
- Total de corridas realizadas
- Anos de experiência
- Botões de aceitar ou procurar outro motorista

## Comportamento da Busca

1. **Tempo de busca**: Entre 3 e 12 segundos (aleatório)
2. **Taxa de sucesso**: 90% de chance de encontrar motorista
3. **Filtros aplicáveis**: Categoria, avaliação mínima, distância máxima
4. **Seleção**: Motorista aleatório entre os que atendem aos critérios

## Como Testar

1. Navegue até a tela de criação de serviço
2. Preencha os dados do serviço
3. Confirme o serviço
4. A busca de motorista será iniciada automaticamente
5. Aguarde alguns segundos
6. O modal com o motorista encontrado será exibido
7. Você pode aceitar ou procurar outro motorista

## Próximos Passos

Para integração com API real:

1. Substituir `searchDriver` por chamada HTTP ao backend
2. Implementar WebSocket para atualizações em tempo real
3. Adicionar geolocalização real dos motoristas
4. Implementar sistema de notificações push
5. Adicionar histórico de corridas
6. Implementar sistema de chat com motorista

## Observações

- Os dados são totalmente mockados para desenvolvimento
- A localização dos motoristas é simulada próxima a São Paulo
- O tempo de busca é aleatório para simular condições reais
- 10% das buscas falham propositalmente para testar tratamento de erro
