// Constantes e configurações da aplicação

// API Base URL
export const API_BASE_URL = 'http://localhost:8080/v1/facilita'

// API Endpoints
export const API_ENDPOINTS = {
  // Autenticação
  LOGIN: `${API_BASE_URL}/usuario/login`,
  SIGNUP: `${API_BASE_URL}/usuario`,
  PROFILE: `${API_BASE_URL}/usuario/perfil`,
  CHANGE_PASSWORD: `${API_BASE_URL}/usuario/alterar-senha`,
  
  // Serviços
  SERVICES: `${API_BASE_URL}/servico`,
  SERVICE_BY_ID: (id: string) => `${API_BASE_URL}/servico/${id}`,
  
  // Avaliações
  RATINGS: `${API_BASE_URL}/avaliacao`,
  
  // Pagamentos
  PAYMENTS: `${API_BASE_URL}/pagamento`,
}

// OpenStreetMap
export const OSM_CONFIG = {
  NOMINATIM_URL: 'https://nominatim.openstreetmap.org',
  OVERPASS_URL: 'https://overpass-api.de/api/interpreter',
  USER_AGENT: 'FacilitaApp/1.0',
  SEARCH_RADIUS_KM: 5,
}

// ViaCEP
export const VIACEP_URL = 'https://viacep.com.br/ws'

// LocalStorage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  CURRENT_SERVICE_ID: 'currentServiceId',
  DARK_MODE: 'darkMode',
  ACTIVE_SERVICE: 'activeService',
}

// Validação
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MIN_NAME_LENGTH: 2,
  MIN_PHONE_LENGTH: 10,
  MAX_FILE_SIZE_MB: 5,
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
}

// Preços
export const PRICING = {
  BASE_PRICE: 5.0,
  PRICE_PER_KM: 2.5,
}

// Tipos de usuário
export const USER_TYPES = {
  CONTRATANTE: 'CONTRATANTE',
  PRESTADOR: 'PRESTADOR',
} as const

// Status de serviço
export const SERVICE_STATUS = {
  PENDENTE: 'PENDENTE',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  CONCLUIDO: 'CONCLUIDO',
  CANCELADO: 'CANCELADO',
} as const

// Categorias de estabelecimentos
export const ESTABLISHMENT_CATEGORIES = {
  FARMACIA: 'farmacia',
  MERCADO: 'mercado',
  RESTAURANTE: 'restaurante',
  POSTO: 'posto',
  BANCO: 'banco',
  HOSPITAL: 'hospital',
  SHOPPING: 'shopping',
  CORREIOS: 'correios',
} as const

// Mapeamento OSM
export const OSM_TAGS = {
  farmacia: 'amenity=pharmacy',
  mercado: 'shop=supermarket',
  restaurante: 'amenity=restaurant',
  posto: 'amenity=fuel',
  banco: 'amenity=bank',
  hospital: 'amenity=hospital',
  shopping: 'shop=mall',
  correios: 'amenity=post_office',
} as const

// Coordenadas padrão (São Paulo)
export const DEFAULT_LOCATION = {
  lat: -23.5505,
  lng: -46.6333,
  address: 'São Paulo, SP, Brasil',
}

// Mensagens de erro
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  INVALID_CREDENTIALS: 'Email ou senha incorretos.',
  USER_EXISTS: 'Este email já está cadastrado.',
  WEAK_PASSWORD: 'Senha muito fraca. Use letras, números e símbolos.',
  INVALID_CEP: 'CEP inválido. Use o formato 12345-678.',
  LOCATION_DENIED: 'Permissão de localização negada.',
  FILE_TOO_LARGE: 'Arquivo muito grande. Máximo 5MB.',
  INVALID_FILE_TYPE: 'Tipo de arquivo inválido. Use apenas imagens.',
}

// Mensagens de sucesso
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login realizado com sucesso!',
  SIGNUP_SUCCESS: 'Conta criada com sucesso!',
  PASSWORD_CHANGED: 'Senha alterada com sucesso!',
  SERVICE_CREATED: 'Serviço criado com sucesso!',
  RATING_SUBMITTED: 'Avaliação enviada com sucesso!',
  PROFILE_UPDATED: 'Perfil atualizado com sucesso!',
}
