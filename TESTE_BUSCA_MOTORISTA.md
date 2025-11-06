# Como Testar a Busca de Motorista

## Método 1: Através da Interface

### Passo a Passo

1. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

2. **Faça login na aplicação**
   - Use suas credenciais de contratante

3. **Navegue até a criação de serviço**
   - Clique em "Novo Serviço" ou similar
   - Preencha os dados necessários

4. **Confirme o serviço**
   - A busca de motorista será iniciada automaticamente
   - Você verá um indicador no canto inferior direito mostrando "Procurando motorista..."

5. **Aguarde o resultado**
   - Em 3-12 segundos, um modal aparecerá com o motorista encontrado
   - O modal mostrará:
     - Nome do motorista
     - Veículo e placa
     - Avaliação (estrelas)
     - Categoria (ECONOMICO/CONFORTO/PREMIUM)
     - Tempo de chegada
     - Distância
     - Total de corridas
     - Anos de experiência

6. **Interaja com o resultado**
   - **Aceitar e Pagar**: Aceita o motorista e vai para tela de pagamento
   - **Procurar Outro**: Rejeita e busca outro motorista

## Método 2: Teste Direto no Console do Navegador

Você pode testar o serviço diretamente no console do navegador:

### Teste Básico

```javascript
// Importar o serviço (se estiver no contexto do React)
import { searchDriver } from './services/driverSearch.service'

// Buscar um motorista
const result = await searchDriver()
console.log('Motorista encontrado:', result.driver)
console.log('Tempo de espera:', result.tempoEspera, 'segundos')
```

### Teste com Filtros

```javascript
// Buscar motorista PREMIUM com avaliação mínima 4.8
const result = await searchDriver({
  categoria: 'PREMIUM',
  avaliacaoMinima: 4.8,
  distanciaMaxima: 3.0
})
console.log('Motorista Premium:', result.driver.nome)
```

### Buscar Múltiplos Motoristas

```javascript
import { searchMultipleDrivers } from './services/driverSearch.service'

const drivers = await searchMultipleDrivers(3, {
  avaliacaoMinima: 4.5
})
console.log('Motoristas encontrados:', drivers.length)
drivers.forEach(d => console.log(`- ${d.nome} (${d.avaliacao}⭐)`))
```

### Obter Motorista por ID

```javascript
import { getDriverById } from './services/driverSearch.service'

const driver = getDriverById(1)
console.log('Motorista #1:', driver.nome)
```

### Simular Aceite de Corrida

```javascript
import { acceptRide } from './services/driverSearch.service'

try {
  await acceptRide(1)
  console.log('✅ Corrida aceita!')
} catch (error) {
  console.error('❌ Erro:', error.message)
}
```

### Obter Localização do Motorista

```javascript
import { getDriverLocation } from './services/driverSearch.service'

const location = await getDriverLocation(1)
console.log(`📍 Localização: ${location.lat}, ${location.lng}`)
```

## Método 3: Teste Programático

Crie um componente de teste temporário:

```typescript
// TestDriverSearch.tsx
import React, { useState } from 'react'
import { searchDriver, type Driver } from './services/driverSearch.service'

export const TestDriverSearch: React.FC = () => {
  const [driver, setDriver] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await searchDriver({
        avaliacaoMinima: 4.5,
        distanciaMaxima: 5.0
      })
      setDriver(result.driver)
      console.log('Tempo de busca:', result.tempoEspera, 's')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Teste de Busca de Motorista</h2>
      
      <button
        onClick={handleSearch}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Buscando...' : 'Buscar Motorista'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {driver && (
        <div className="mt-4 p-4 bg-white border rounded shadow">
          <h3 className="font-bold text-lg">{driver.nome}</h3>
          <p className="text-gray-600">{driver.veiculo}</p>
          <p className="text-sm text-gray-500">Placa: {driver.placa}</p>
          <div className="mt-2">
            <span className="text-yellow-500">⭐ {driver.avaliacao}</span>
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {driver.categoria}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Chegada</p>
              <p className="font-semibold">{driver.tempoChegada}</p>
            </div>
            <div>
              <p className="text-gray-500">Distância</p>
              <p className="font-semibold">{driver.distancia}</p>
            </div>
            <div>
              <p className="text-gray-500">Corridas</p>
              <p className="font-semibold">{driver.totalCorridas}</p>
            </div>
            <div>
              <p className="text-gray-500">Experiência</p>
              <p className="font-semibold">{driver.anoExperiencia} anos</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

## Cenários de Teste

### ✅ Cenário 1: Busca Bem-Sucedida
- **Ação**: Iniciar busca de motorista
- **Resultado Esperado**: Motorista encontrado em 3-12 segundos
- **Probabilidade**: 90%

### ❌ Cenário 2: Nenhum Motorista Disponível
- **Ação**: Iniciar busca de motorista
- **Resultado Esperado**: Erro "Nenhum motorista disponível"
- **Probabilidade**: 10%

### 🔍 Cenário 3: Busca com Filtros Restritivos
- **Ação**: Buscar com `avaliacaoMinima: 5.0`
- **Resultado Esperado**: Erro (nenhum motorista tem 5.0)

### 🔄 Cenário 4: Rejeitar e Buscar Novamente
- **Ação**: Rejeitar motorista encontrado
- **Resultado Esperado**: Nova busca é iniciada automaticamente

### 📊 Cenário 5: Buscar Múltiplos Motoristas
- **Ação**: Chamar `searchMultipleDrivers(5)`
- **Resultado Esperado**: Array com até 5 motoristas

## Logs Esperados no Console

```
🔍 Iniciando busca de motorista em background...
✅ Motorista encontrado: {
  id: 2,
  nome: "Maria Santos",
  veiculo: "Toyota Corolla Preto",
  avaliacao: 4.9,
  categoria: "PREMIUM",
  ...
}
⏱️ Tempo de busca: 8s
```

## Troubleshooting

### Problema: Modal não aparece
- **Solução**: Verifique se `showDriverFoundModal` está sendo setado como `true`
- **Verificar**: Console do navegador para logs

### Problema: Busca demora muito
- **Causa**: Tempo aleatório entre 3-12 segundos
- **Solução**: Normal, aguarde ou ajuste o tempo no serviço

### Problema: Sempre retorna erro
- **Causa**: Filtros muito restritivos
- **Solução**: Relaxe os critérios de busca

### Problema: Mesmo motorista sempre
- **Causa**: Pool pequeno de motoristas mockados
- **Solução**: Adicione mais motoristas em `MOCK_DRIVERS`

## Dados de Teste

### IDs de Motoristas Disponíveis
- 1: João Silva (CONFORTO)
- 2: Maria Santos (PREMIUM)
- 3: Carlos Oliveira (ECONOMICO)
- 4: Ana Paula Costa (ECONOMICO)
- 5: Roberto Ferreira (PREMIUM)
- 6: Juliana Almeida (ECONOMICO)
- 7: Pedro Henrique (CONFORTO)
- 8: Fernanda Lima (ECONOMICO)

### Filtros Recomendados para Teste

**Teste 1: Econômico**
```javascript
{ categoria: 'ECONOMICO', avaliacaoMinima: 4.5 }
```

**Teste 2: Premium**
```javascript
{ categoria: 'PREMIUM', avaliacaoMinima: 4.8 }
```

**Teste 3: Próximo**
```javascript
{ distanciaMaxima: 1.5 }
```

**Teste 4: Experiente**
```javascript
{ avaliacaoMinima: 4.8 }
```
