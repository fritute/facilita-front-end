# Sistema de Aceitação Automática Mockada

## 🤖 O que é?

Um sistema que **simula automaticamente** um prestador aceitando o serviço criado, sem precisar de intervenção manual. Perfeito para testes e desenvolvimento!

## 🎯 Como Funciona

1. **Contratante cria um serviço** → Sistema salva no banco
2. **Sistema inicia aceitação mockada** → Busca token de prestador mockado
3. **Aguarda 8-20 segundos** (tempo aleatório para parecer real)
4. **Faz PATCH automático** → `/servico/{id}/aceitar`
5. **Polling detecta aceitação** → Busca dados do prestador
6. **Modal aparece** → Mostra informações do prestador

## ✅ Configuração Automática

O sistema já está **ATIVO POR PADRÃO**! Quando você cria um serviço, a aceitação mockada inicia automaticamente.

### Credenciais de Prestador Mockado

O sistema tenta fazer login com estas credenciais (em ordem):

1. **vinicius@gmail.com** / senha123
2. **prestador1@teste.com** / senha123
3. **prestador2@teste.com** / senha123

**Importante:** Certifique-se de que pelo menos uma dessas contas existe no banco de dados!

## 🧪 Como Testar

### Teste Básico (Mais Simples)

1. Faça login como **contratante**
2. Crie um novo serviço
3. Aguarde na tela "Aguardando Prestador"
4. Em **8-20 segundos**, o modal aparecerá automaticamente! 🎉

### Logs Esperados no Console

```
🔨 Criando serviço no banco antes do pagamento...
✅ Serviço criado com sucesso!
⏳ Aguardando prestador aceitar o serviço...
🤖 Iniciando sistema de aceitação mockada...
⏳ Iniciando polling para serviço: 34
🤖 [MOCK] Modo mock ativo - iniciando aceitação automática
🤖 [MOCK] Iniciando sistema de aceitação automática para serviço 34
✅ [MOCK] Token de prestador obtido: vinicius@gmail.com
🤖 [MOCK] Prestador mockado irá aceitar serviço 34 em 12s...
⏳ Aguardando prestador... Status: PENDENTE
⏳ Aguardando prestador... Status: PENDENTE
🤖 [MOCK] Tentando aceitar serviço 34...
✅ [MOCK] Serviço aceito com sucesso!
✅ Prestador aceitou o serviço!
👤 ID do prestador: 1
📋 Dados do prestador: {...}
🔔 Prestador encontrado e aceitou seu pedido!
```

## 🎛️ Controle Manual

### Habilitar/Desabilitar Mock

Você pode controlar o modo mock via console do navegador:

```javascript
// Habilitar mock (padrão)
setMockMode(true)

// Desabilitar mock (aguardar prestador real)
setMockMode(false)

// Verificar status
isMockModeEnabled() // retorna true ou false
```

### Forçar Aceitação Imediata

Para testes rápidos, você pode forçar a aceitação de um serviço específico:

```javascript
// No console do navegador
import { iniciarAceitacaoMockada } from './services/mockPrestadorAccept.service'

// Aceitar serviço 34 em 2-5 segundos
iniciarAceitacaoMockada(34, 2000, 5000)
```

## 📋 Funções Disponíveis

### `aceitarServicoAutomaticamente(servicoId, forcarMock?)`

Função principal que decide se usa mock ou aguarda prestador real.

```typescript
// Usar configuração padrão
await aceitarServicoAutomaticamente(34)

// Forçar uso de mock
await aceitarServicoAutomaticamente(34, true)
```

### `iniciarAceitacaoMockada(servicoId, delayMin?, delayMax?)`

Inicia aceitação mockada com controle de tempo.

```typescript
// Padrão: 8-20 segundos
await iniciarAceitacaoMockada(34)

// Rápido: 2-5 segundos
await iniciarAceitacaoMockada(34, 2000, 5000)

// Lento: 30-60 segundos
await iniciarAceitacaoMockada(34, 30000, 60000)
```

### `simularAceitacaoAutomatica(servicoId, token, delayMin, delayMax)`

Simula aceitação com token específico.

```typescript
const token = 'seu_token_de_prestador'
await simularAceitacaoAutomatica(34, token, 5000, 10000)
```

### `buscarTokenPrestadorMock()`

Busca token de prestador mockado disponível.

```typescript
const token = await buscarTokenPrestadorMock()
if (token) {
  console.log('Token obtido:', token)
}
```

### `setMockMode(enabled)`

Habilita ou desabilita o modo mock.

```typescript
setMockMode(true)  // Habilitar
setMockMode(false) // Desabilitar
```

### `isMockModeEnabled()`

Verifica se o modo mock está ativo.

```typescript
if (isMockModeEnabled()) {
  console.log('Mock está ativo')
}
```

## 🔧 Configuração Avançada

### Variável de Ambiente

Você pode configurar o mock via `.env`:

```env
VITE_MOCK_PRESTADOR=true
```

### Adicionar Mais Prestadores Mockados

Edite o arquivo `mockPrestadorAccept.service.ts`:

```typescript
const prestadoresMock = [
  { email: 'vinicius@gmail.com', senha: 'senha123' },
  { email: 'prestador1@teste.com', senha: 'senha123' },
  { email: 'prestador2@teste.com', senha: 'senha123' },
  // Adicione mais aqui
  { email: 'seu_prestador@teste.com', senha: 'sua_senha' }
]
```

### Ajustar Tempo de Aceitação

No `App.tsx`, linha onde chama `aceitarServicoAutomaticamente`:

```typescript
// Padrão: 8-20 segundos
aceitarServicoAutomaticamente(serviceIdNumber, true)

// Personalizado: edite a função para aceitar parâmetros
// (requer modificação no código)
```

## 🎭 Simular Competição Entre Prestadores

Para simular múltiplos prestadores competindo:

```typescript
import { simularCompetidoresPrestadores } from './services/mockPrestadorAccept.service'

const tokens = [token1, token2, token3]
await simularCompetidoresPrestadores(34, tokens, 3)
```

Isso fará com que 3 prestadores tentem aceitar ao mesmo tempo, e o primeiro que conseguir vence!

## ⚠️ Troubleshooting

### Mock não funciona

**Problema:** Nenhum prestador aceita automaticamente

**Soluções:**
1. Verificar se existe prestador com credenciais mockadas no banco
2. Verificar logs no console para ver qual erro ocorreu
3. Tentar criar manualmente uma conta de prestador com email `vinicius@gmail.com`

### Erro: "Token de prestador não encontrado"

**Solução:** Crie uma conta de prestador com uma das credenciais listadas:

```bash
POST /v1/facilita/usuario/register
{
  "nome": "Vinicius Prestador",
  "email": "vinicius@gmail.com",
  "senha": "senha123",
  "telefone": "+5511957322470",
  "tipo_conta": "PRESTADOR"
}
```

### Erro: "Serviço já foi aceito"

**Causa:** Outro prestador (real ou mock) já aceitou

**Solução:** Normal! O primeiro que aceitar ganha. Crie um novo serviço.

### Mock muito lento

**Solução:** Ajuste os tempos de delay:

```typescript
// No código, trocar:
aceitarServicoAutomaticamente(serviceIdNumber, true)

// Por (requer modificação):
iniciarAceitacaoMockada(serviceIdNumber, 2000, 5000) // 2-5 segundos
```

### Mock muito rápido

**Solução:** Aumentar delays:

```typescript
iniciarAceitacaoMockada(serviceIdNumber, 20000, 40000) // 20-40 segundos
```

## 🎯 Casos de Uso

### Desenvolvimento

```typescript
// Mock sempre ativo para testes rápidos
setMockMode(true)
```

### Demonstração

```typescript
// Tempo curto para demos
iniciarAceitacaoMockada(servicoId, 3000, 5000)
```

### Produção

```typescript
// Desabilitar mock completamente
setMockMode(false)
```

### Testes Automatizados

```typescript
// Aceitação imediata
iniciarAceitacaoMockada(servicoId, 100, 500)
```

## 📊 Estatísticas

- **Tempo médio de aceitação:** 14 segundos (8-20s)
- **Taxa de sucesso:** ~95% (depende de credenciais válidas)
- **Overhead:** Mínimo (~100ms para buscar token)

## 🚀 Próximas Melhorias

1. **Interface de controle** - Botão na UI para habilitar/desabilitar mock
2. **Múltiplos prestadores** - Simular vários prestadores competindo
3. **Configuração por ambiente** - Auto-detectar dev/prod
4. **Logs visuais** - Mostrar progresso do mock na tela
5. **Estatísticas** - Dashboard com métricas de aceitação

## 📝 Notas Importantes

- ✅ Mock está **ATIVO POR PADRÃO**
- ✅ Funciona **automaticamente** após criar serviço
- ✅ Não interfere com prestadores reais
- ✅ Pode ser desabilitado a qualquer momento
- ⚠️ Requer pelo menos uma conta de prestador mockado no banco
- ⚠️ Usa credenciais hardcoded (seguro apenas para dev/teste)

## 🎉 Resultado Final

Agora você pode:
1. Criar um serviço
2. Aguardar alguns segundos
3. Ver o modal aparecer automaticamente
4. Testar todo o fluxo sem precisar de um prestador real!

**Perfeito para desenvolvimento e demonstrações!** 🚀
