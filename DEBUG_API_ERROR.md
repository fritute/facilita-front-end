# 🔍 Debug do Erro 500 na API

## Problema Identificado
Erro 500 ao tentar criar serviço com a mensagem: "Erro ao cadastrar serviço"

## Possíveis Causas do Erro 500

### 1. **Dados Inválidos Enviados**
- `id_contratante` pode estar incorreto ou não existir na base
- `id_prestador: 2` pode não existir na tabela de prestadores
- `id_categoria` ou `id_localizacao` podem estar inválidos

### 2. **Problemas de Validação no Backend**
- Campos obrigatórios faltando
- Tipos de dados incorretos
- Constraints de banco de dados violadas

### 3. **Problemas de Banco de Dados**
- Foreign keys inválidas
- Tabelas relacionadas com problemas

## 🛠️ Melhorias Implementadas

### **Validação Aprimorada**
```typescript
// Validar dados antes de enviar
if (!id_contratante || id_contratante <= 0) {
  console.error('❌ ID do contratante inválido:', id_contratante)
  alert('Erro: ID do contratante não foi obtido corretamente.')
  return false
}

if (!id_categoria || id_categoria <= 0) {
  console.error('❌ ID da categoria inválido:', id_categoria)
  alert('Erro: Categoria do serviço não foi identificada.')
  return false
}

// Garantir que são números
const serviceData = {
  id_contratante: Number(id_contratante),
  id_prestador: 2,
  id_categoria: Number(id_categoria),
  id_localizacao: Number(id_localizacao),
  descricao: descricaoServico.trim(),
  status: 'PENDENTE'
}
```

### **Tratamento de Erro Melhorado**
```typescript
try {
  const errorData = await response.json()
  console.error('Erro detalhado:', JSON.stringify(errorData, null, 2))
  
  if (response.status === 500) {
    errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.'
  }
  
} catch (parseError) {
  // Se não conseguir parsear JSON, tentar texto
  try {
    const errorText = await response.text()
    console.error('Resposta de erro (texto):', errorText)
    alert(`Erro ${response.status}: ${errorText}`)
  } catch (textError) {
    alert(`Erro ${response.status}: Erro desconhecido no servidor`)
  }
}
```

## 🧪 Como Debugar

### **1. Verificar Logs no Console**
Agora você verá logs detalhados:
```
=== CRIAÇÃO DE SERVIÇO ===
📤 Payload para API: {
  "id_contratante": 10,
  "id_prestador": 2,
  "id_categoria": 1,
  "id_localizacao": 1,
  "descricao": "Serviço de entrega personalizado",
  "status": "PENDENTE"
}
✅ Validação dos dados:
  - id_contratante válido: true
  - id_categoria válido: true
  - id_localizacao válido: true
  - descricao válida: true
```

### **2. Verificar Dados Específicos**
- **ID Contratante**: Deve ser o ID da tabela CONTRATANTE, não USUARIO
- **ID Prestador**: Verificar se ID 2 existe na base
- **ID Categoria**: Deve ser 1-6 baseado na descrição
- **ID Localização**: Deve ser 1 ou 2 baseado na geolocalização

### **3. Testar com Dados Mínimos**
Tente criar um serviço com dados básicos:
```json
{
  "id_contratante": 10,
  "id_prestador": 2,
  "id_categoria": 1,
  "id_localizacao": 1,
  "descricao": "Teste",
  "status": "PENDENTE"
}
```

## 🔧 Próximos Passos

### **1. Verificar Backend**
- Confirmar se `id_prestador: 2` existe
- Verificar constraints das foreign keys
- Validar se todos os campos obrigatórios estão sendo enviados

### **2. Testar com Postman/Insomnia**
Fazer requisição direta para a API:
```
POST https://servidor-facilita.onrender.com/v1/facilita/servico
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer SEU_TOKEN"
}
Body: {
  "id_contratante": 10,
  "id_prestador": 2,
  "id_categoria": 1,
  "id_localizacao": 1,
  "descricao": "Teste API",
  "status": "PENDENTE"
}
```

### **3. Verificar Logs do Servidor**
- Logs de erro no backend
- Queries SQL que estão falhando
- Validações que estão sendo rejeitadas

## 💡 Dicas de Solução

1. **Problema mais comum**: `id_prestador: 2` não existe na base
2. **Segunda causa**: `id_contratante` incorreto (usando ID do usuário em vez do contratante)
3. **Terceira causa**: Campos obrigatórios faltando no backend

## 🚀 Teste Agora

Com as melhorias implementadas, tente criar um serviço novamente e observe:
1. Os logs detalhados no console
2. A validação prévia dos dados
3. O tratamento de erro melhorado

Se ainda der erro 500, os logs agora mostrarão exatamente qual dado está causando o problema!
