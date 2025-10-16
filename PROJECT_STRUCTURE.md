# 📁 Estrutura do Projeto Facilita

## 🏗️ Arquitetura Profissional

Este projeto segue uma arquitetura modular e escalável, separando responsabilidades de forma clara.

```
src/
├── components/          # Componentes reutilizáveis
│   ├── AddressSearch.tsx           # Busca de endereço com CEP/texto
│   ├── NotificationSidebar.tsx     # Sidebar de notificações
│   ├── ServiceCreateScreen.tsx     # (Legado - mover para screens)
│   └── ...
│
├── screens/            # Telas da aplicação
│   ├── index.ts                    # Exportação centralizada
│   ├── HomeScreen.tsx              # Tela inicial
│   ├── LoginScreen.tsx             # Tela de login
│   ├── SignupScreen.tsx            # Tela de cadastro
│   ├── ProfileScreen.tsx           # Tela de perfil
│   ├── ChangePasswordScreen.tsx    # Alterar senha
│   ├── OrdersScreen.tsx            # Lista de pedidos
│   └── ServiceCreateScreen.tsx     # Criar serviço
│
├── services/           # Serviços e integrações
│   └── geocoding.service.ts        # OpenStreetMap Nominatim
│
├── utils/              # Utilitários
│   ├── validation.ts               # Validações
│   ├── formatters.ts               # Formatadores
│   └── calculations.ts             # Cálculos
│
├── config/             # Configurações
│   └── constants.ts                # Constantes da aplicação
│
├── types/              # Tipos TypeScript
│   └── index.ts                    # Tipos compartilhados
│
└── App.tsx             # Componente principal

```

## 📦 Módulos Principais

### 🖼️ Screens (Telas)
Componentes de tela completos que representam páginas da aplicação.

- **HomeScreen**: Tela inicial com cards de serviços
- **LoginScreen**: Autenticação de usuários
- **SignupScreen**: Cadastro de novos usuários
- **ProfileScreen**: Perfil do usuário
- **ChangePasswordScreen**: Alteração de senha
- **OrdersScreen**: Histórico de pedidos
- **ServiceCreateScreen**: Criação de novo serviço

### 🧩 Components (Componentes)
Componentes reutilizáveis em múltiplas telas.

- **AddressSearch**: Busca de endereço por CEP ou texto livre
- **NotificationSidebar**: Painel lateral de notificações

### 🔧 Services (Serviços)
Integrações com APIs externas e lógica de negócio.

- **geocoding.service**: Integração com OpenStreetMap Nominatim
  - Busca por CEP
  - Busca por endereço
  - Geocoding reverso

### 🛠️ Utils (Utilitários)

#### validation.ts
- `isValidEmail()`: Valida formato de email
- `validatePassword()`: Valida força da senha
- `isValidCEP()`: Valida formato de CEP
- `isValidPhone()`: Valida telefone
- `isValidImageFile()`: Valida arquivos de imagem

#### formatters.ts
- `formatCEP()`: Formata CEP (12345-678)
- `formatPhone()`: Formata telefone ((11) 98704-6715)
- `formatCurrency()`: Formata valores monetários
- `formatDate()`: Formata datas
- `formatDateTime()`: Formata data e hora
- `formatDistance()`: Formata distâncias
- `formatServiceStatus()`: Formata status de serviço
- `getStatusColor()`: Retorna cor do status

#### calculations.ts
- `calculateDistance()`: Calcula distância entre coordenadas
- `calculateServicePrice()`: Calcula preço do serviço
- `calculateEstimatedTime()`: Estima tempo de entrega
- `calculateDiscount()`: Calcula desconto
- `calculateFinalPrice()`: Calcula preço final

### ⚙️ Config (Configurações)

#### constants.ts
- **API_BASE_URL**: URL base da API
- **API_ENDPOINTS**: Endpoints da API
- **OSM_CONFIG**: Configurações OpenStreetMap
- **STORAGE_KEYS**: Chaves do localStorage
- **VALIDATION**: Regras de validação
- **PRICING**: Configurações de preço
- **ERROR_MESSAGES**: Mensagens de erro
- **SUCCESS_MESSAGES**: Mensagens de sucesso

### 📝 Types (Tipos)

#### index.ts
- `User`: Dados do usuário
- `LocationCoordinates`: Coordenadas geográficas
- `Service`: Dados do serviço
- `Order`: Dados do pedido
- `Notification`: Notificação
- `ServiceCard`: Card de serviço
- `Establishment`: Estabelecimento
- `ScreenType`: Tipos de tela

## 🎯 Padrões de Código

### Nomenclatura
- **Componentes**: PascalCase (ex: `HomeScreen`, `AddressSearch`)
- **Funções**: camelCase (ex: `formatCEP`, `calculateDistance`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `API_BASE_URL`, `STORAGE_KEYS`)
- **Tipos**: PascalCase (ex: `User`, `Service`)

### Estrutura de Componentes
```typescript
// 1. Imports
import React from 'react'
import { Icon } from 'lucide-react'

// 2. Interface de Props
interface ComponentProps {
  prop1: string
  prop2: number
  onAction: () => void
}

// 3. Componente
const Component: React.FC<ComponentProps> = ({
  prop1,
  prop2,
  onAction
}) => {
  // 4. Estados e hooks
  
  // 5. Funções auxiliares
  
  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}

// 7. Export
export default Component
```

### Organização de Imports
```typescript
// 1. React e bibliotecas externas
import React, { useState, useEffect } from 'react'
import { Icon } from 'lucide-react'

// 2. Componentes
import Component from '../components/Component'

// 3. Services
import { service } from '../services/service'

// 4. Utils
import { formatCEP } from '../utils/formatters'

// 5. Types
import { User } from '../types'

// 6. Config
import { API_BASE_URL } from '../config/constants'
```

## 🔄 Fluxo de Dados

### Autenticação
1. Usuário faz login → `LoginScreen`
2. Token salvo no `localStorage` → `STORAGE_KEYS.AUTH_TOKEN`
3. Dados do usuário salvos → `STORAGE_KEYS.USER_DATA`
4. Redirecionamento para `HomeScreen`

### Criação de Serviço
1. Usuário clica em categoria → `HomeScreen`
2. Seleciona estabelecimento → `EstablishmentsListScreen`
3. Preenche detalhes → `ServiceCreateScreen`
4. Confirma serviço → API POST `/servico`
5. Redirecionamento → `ServiceConfirmedScreen`

### Busca de Endereço
1. Usuário digita CEP/endereço → `AddressSearch`
2. Debounce de 500ms
3. Detecta tipo (CEP ou texto)
4. Chama `geocodingService`
5. Exibe resultados
6. Usuário seleciona → Callback com coordenadas

## 🚀 Melhorias Futuras

### Próximos Passos
- [ ] Mover componentes legados para `/screens`
- [ ] Implementar testes unitários
- [ ] Adicionar Storybook para componentes
- [ ] Implementar cache de requisições
- [ ] Adicionar PWA support
- [ ] Implementar lazy loading de telas
- [ ] Adicionar analytics
- [ ] Implementar i18n (internacionalização)

### Otimizações
- [ ] Code splitting por rota
- [ ] Otimização de imagens
- [ ] Service Worker para offline
- [ ] Compressão de assets
- [ ] Tree shaking

## 📚 Documentação

### APIs Utilizadas
- **Backend**: `http://localhost:8080/v1/facilita`
- **OpenStreetMap Nominatim**: Geocoding
- **ViaCEP**: Busca de CEP

### Bibliotecas Principais
- **React**: Framework UI
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização
- **Lucide React**: Ícones
- **React Leaflet**: Mapas (futuro)

## 🤝 Contribuindo

### Adicionando Nova Tela
1. Criar arquivo em `/src/screens/NomeDaTela.tsx`
2. Seguir padrão de componente
3. Adicionar export em `/src/screens/index.ts`
4. Adicionar tipo em `/src/types/index.ts` (ScreenType)
5. Integrar no `App.tsx`

### Adicionando Novo Serviço
1. Criar arquivo em `/src/services/nome.service.ts`
2. Exportar classe ou funções
3. Adicionar configurações em `/src/config/constants.ts`
4. Documentar no README

### Adicionando Utilitário
1. Adicionar função em arquivo apropriado em `/src/utils/`
2. Exportar função
3. Adicionar testes (futuro)
4. Documentar uso

---

**Versão**: 1.0.0  
**Última atualização**: 2025-01-16
