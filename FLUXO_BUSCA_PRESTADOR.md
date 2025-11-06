# Fluxo de Busca de Prestador - Integração com API Real

## Visão Geral

O sistema agora está integrado com a API real do backend para buscar prestadores disponíveis e aceitar serviços. O fluxo funciona da seguinte forma:

## Fluxo Completo

### 1. Criação do Serviço
- Usuário preenche os dados do serviço (origem, destino, descrição)
- Sistema calcula distância e preço
- Serviço é criado no banco de dados via API
- Sistema recebe o ID do serviço criado

### 2. Aguardando Prestador (waiting-provider)
- Após criar o serviço, usuário é direcionado para tela "Aguardando Prestador"
- Sistema inicia **polling automático** a cada 3 segundos
- Polling verifica se algum prestador aceitou o serviço

### 3. Prestador Aceita o Serviço
- Quando um prestador aceita via API: `PATCH /servico/{id}/aceitar`
- O status do serviço muda para `EM_ANDAMENTO`
- O campo `id_prestador` é preenchido

### 4. Sistema Detecta Aceitação
- Polling detecta que `status === 'EM_ANDAMENTO'` e `id_prestador` existe
- Sistema busca dados completos do prestador via API
- Dados são formatados para exibição

### 5. Modal de Prestador Encontrado
- Modal aparece automaticamente mostrando:
  - Nome do prestador
  - Veículo e placa
  - Avaliação (estrelas)
  - Categoria (ECONOMICO/CONFORTO/PREMIUM)
  - Tempo estimado de chegada
  - Distância
  - Total de corridas
  - Anos de experiência
- Notificação sonora é tocada
- Toast de notificação aparece

### 6. Usuário Aceita
- Usuário clica em "Aceitar e Pagar"
- Sistema redireciona para tela de pagamento

## Arquivos Modificados

### 1. `src/services/prestadorSearch.service.ts` (NOVO)
Serviço completo para integração com API:

**Funções principais:**
- `buscarPrestadores(token)` - Lista todos prestadores
- `buscarPrestadorPorId(id, token)` - Busca prestador específico
- `formatarPrestador(prestador)` - Formata dados para UI
- `buscarPrestadoresDisponiveis(token)` - Lista e formata prestadores
- `buscarPrestadorDisponivel(token)` - Busca um prestador (com delay)
- `aceitarServico(servicoId, token)` - Aceita serviço (usado pelo prestador)
- `buscarServicosPendentes(token)` - Lista serviços pendentes
- `buscarServicoPorId(id, token)` - Busca serviço específico
- `verificarServicoAceito(id, token, callback)` - Polling para verificar aceitação

### 2. `src/App.tsx` (MODIFICADO)
Atualizado para usar o novo serviço:

**Mudanças:**
- Import do serviço de prestadores
- Função `startPollingServiceStatus` atualizada para:
  - Verificar status a cada 3 segundos (antes era 5)
  - Buscar dados do prestador quando aceito
  - Mostrar modal com informações completas
  - Tocar notificação sonora
  - Mostrar toast de notificação

## Como Testar

### Cenário 1: Teste com Prestador Real

1. **Criar conta de prestador:**
   ```
   POST /v1/facilita/usuario/register
   {
     "nome": "João Motorista",
     "email": "joao@teste.com",
     "senha": "senha123",
     "telefone": "+5511999999999",
     "tipo_conta": "PRESTADOR"
   }
   ```

2. **Criar conta de contratante:**
   ```
   POST /v1/facilita/usuario/register
   {
     "nome": "Maria Cliente",
     "email": "maria@teste.com",
     "senha": "senha123",
     "telefone": "+5511988888888",
     "tipo_conta": "CONTRATANTE"
   }
   ```

3. **Como contratante:**
   - Fazer login
   - Criar um novo serviço
   - Aguardar na tela "Aguardando Prestador"

4. **Como prestador (em outra aba/navegador):**
   - Fazer login
   - Buscar serviços pendentes
   - Aceitar o serviço via API ou interface

5. **Resultado esperado:**
   - Modal aparece automaticamente para o contratante
   - Mostra dados do prestador que aceitou
   - Notificação sonora toca
   - Toast aparece no canto da tela

### Cenário 2: Teste com Postman/Insomnia

1. **Criar serviço como contratante:**
   ```
   POST /v1/facilita/servico
   Headers: Authorization: Bearer {token_contratante}
   Body: {
     "id_categoria": 1,
     "descricao": "Buscar encomenda",
     "valor": 25.00
   }
   ```

2. **Anotar o ID do serviço retornado**

3. **Na interface do contratante:**
   - Estar na tela "Aguardando Prestador"
   - Polling está ativo

4. **Aceitar serviço via API:**
   ```
   PATCH /v1/facilita/servico/{id}/aceitar
   Headers: Authorization: Bearer {token_prestador}
   ```

5. **Resultado:**
   - Em até 3 segundos, modal aparece
   - Dados do prestador são exibidos

### Cenário 3: Teste de Timeout

1. Criar serviço
2. Aguardar na tela "Aguardando Prestador"
3. Não ter nenhum prestador aceitando
4. Após 60 tentativas (3 minutos), sistema mostra erro

## Logs para Debug

O sistema gera logs detalhados no console:

```
🔍 Iniciando busca de prestador em background...
📦 Dados do serviço: {...}
🔄 Iniciando polling para serviço: 34
⏳ Aguardando prestador... Status: PENDENTE
⏳ Aguardando prestador... Status: PENDENTE
✅ Prestador aceitou o serviço!
👤 ID do prestador: 2
📋 Dados do prestador: {...}
🔔 Prestador encontrado e aceitou seu pedido!
```

## Endpoints da API Utilizados

### Buscar Prestadores
```
GET /v1/facilita/prestador
Headers: Authorization: Bearer {token}
Response: Array de prestadores
```

### Buscar Prestador por ID
```
GET /v1/facilita/prestador/{id}
Headers: Authorization: Bearer {token}
Response: Dados completos do prestador
```

### Buscar Serviço por ID
```
GET /v1/facilita/servico/{id}
Headers: Authorization: Bearer {token}
Response: Dados do serviço incluindo id_prestador
```

### Aceitar Serviço (Prestador)
```
PATCH /v1/facilita/servico/{id}/aceitar
Headers: Authorization: Bearer {token_prestador}
Response: Serviço atualizado com status EM_ANDAMENTO
```

## Estrutura de Dados

### Prestador da API
```typescript
{
  id: number
  id_usuario: number
  usuario: {
    id: number
    nome: string
    email: string
    telefone: string
    foto_perfil?: string
  }
  localizacao?: Array<{...}>
  documento?: Array<{
    tipo_documento: string
    valor: string
  }>
}
```

### Prestador Formatado (UI)
```typescript
{
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

## Tratamento de Erros

### Erro: Token não encontrado
```
❌ Erro: Token de autenticação não encontrado
```
**Solução:** Fazer login novamente

### Erro: Prestador não encontrado
```
❌ Erro ao buscar prestador
```
**Solução:** Verificar se o ID do prestador existe

### Erro: Timeout no polling
```
❌ Não foi possível encontrar um prestador disponível no momento
```
**Solução:** Tentar criar o serviço novamente

### Erro: Falha na API
```
❌ Erro ao buscar dados do prestador
```
**Solução:** Verificar conexão com backend

## Configurações

### Intervalo de Polling
Definido em `startPollingServiceStatus`:
```typescript
setInterval(async () => {
  // Verificar status
}, 3000) // 3 segundos
```

### Máximo de Tentativas
Definido em `verificarServicoAceito`:
```typescript
maxTentativas: number = 60 // 60 x 3s = 3 minutos
```

### Tempo de Busca Simulado
Para busca direta (fallback):
```typescript
const tempoEspera = Math.random() * 5000 + 3000 // 3-8 segundos
```

## Próximas Melhorias

1. **WebSocket** - Substituir polling por WebSocket para notificação em tempo real
2. **Geolocalização Real** - Calcular distância real entre prestador e origem
3. **Filtros Avançados** - Permitir filtrar por categoria, avaliação, etc.
4. **Chat** - Adicionar chat entre contratante e prestador
5. **Histórico** - Mostrar histórico de serviços do prestador
6. **Cancelamento** - Permitir cancelar busca antes de aceitar

## Troubleshooting

### Modal não aparece
- Verificar se polling está ativo (logs no console)
- Verificar se serviço foi aceito na API
- Verificar se token é válido

### Dados do prestador incorretos
- Verificar formato dos documentos na API
- Verificar se campos obrigatórios existem
- Ver logs de formatação no console

### Polling não para
- Verificar se `clearInterval` está sendo chamado
- Verificar condições de parada no código
- Recarregar página se necessário

## Suporte

Para problemas ou dúvidas:
1. Verificar logs no console do navegador
2. Verificar logs no backend
3. Verificar se API está respondendo corretamente
4. Verificar se dados do prestador estão completos no banco
