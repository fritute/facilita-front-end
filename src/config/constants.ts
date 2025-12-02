// Constantes e configurações da aplicação

// API Base URL
export const API_BASE_URL = import.meta.env?.VITE_API_URL || 'https://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net/v1/facilita'

// WebSocket URLs
export const WEBSOCKET_URLS = {
  // Chat WebSocket - conforme documentação oficial
  CHAT_DEV: 'wss://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net', // Usar produção sempre
  CHAT_PROD: 'wss://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net', // Produção
  // Usar APENAS a URL de produção
  CHAT: 'wss://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net'
}

// API Endpoints
export const API_ENDPOINTS = {
  // Autenticação
  LOGIN: `${API_BASE_URL}/usuario/login`,
  SIGNUP: `${API_BASE_URL}/usuario`,
  REGISTER: `${API_BASE_URL}/usuario/register`,
  PROFILE: `${API_BASE_URL}/usuario/perfil`,
  UPDATE_USER: (id: string) => `${API_BASE_URL}/usuario/${id}`,
  UPDATE_PROFILE: `${API_BASE_URL}/usuario/perfil`, // Endpoint para atualizar perfil do usuário logado
  CHANGE_PASSWORD: `${API_BASE_URL}/usuario/alterar-senha`,
  RECOVER_PASSWORD: `${API_BASE_URL}/usuario/recuperar-senha`,
  VERIFY_CODE: `${API_BASE_URL}/usuario/verificar-codigo`,
  RESET_PASSWORD: `${API_BASE_URL}/usuario/redefinir-senha`,
  
  // Contratante
  CONTRATANTE_REGISTER: `${API_BASE_URL}/contratante/register`,
  CONTRATANTE_BY_ID: (id: string) => `${API_BASE_URL}/contratante/${id}`,
  CONTRATANTE_BY_USER_ID: (userId: string) => `${API_BASE_URL}/contratante?id_usuario=${userId}`,
  
  // Prestador
  PRESTADORES: `${API_BASE_URL}/prestador`,
  PRESTADOR_BY_ID: (id: string) => `${API_BASE_URL}/prestador/${id}`,
  
  // Localizações
  LOCATIONS: `${API_BASE_URL}/localizacao`,
  LOCATION_BY_ID: (id: string) => `${API_BASE_URL}/localizacao/${id}`,

  // Serviços
  SERVICES: `${API_BASE_URL}/servico`,
  SERVICE_BY_ID: (id: string) => `${API_BASE_URL}/servico/${id}`,
  SERVICE_FROM_CATEGORY: (categoryId: number) => `${API_BASE_URL}/servico/from-categoria/${categoryId}`,
  SERVICES_BY_CONTRATANTE: (contratanteId: string) => `${API_BASE_URL}/servico?id_contratante=${contratanteId}`,
  SERVICES_BY_STATUS_CONTRATANTE: (status: string, contratanteId: string) => `${API_BASE_URL}/servico/status/${status}?id_contratante=${contratanteId}`, // GET - Buscar serviços por status do contratante
  
  // Categorias
  CATEGORIES: `${API_BASE_URL}/categoria`,
  
  // Avaliações
  RATINGS: `${API_BASE_URL}/avaliacao`,
  
  // Pagamentos
  PAYMENTS: `${API_BASE_URL}/pagamento`,
  PAGBANK_PAYMENT: `${API_BASE_URL}/pagamento/pagbank`,
  
  // Carteira (conforme documentação oficial Apidog)
  WALLET: `${API_BASE_URL}/carteira`, // POST - Criar carteira
  WALLET_BY_ID: (id: string) => `${API_BASE_URL}/carteira/${id}`,
  MY_WALLET: `${API_BASE_URL}/carteira/minha-carteira`, // GET - Consultar carteira do usuário logado
  WALLET_RECHARGE: `${API_BASE_URL}/recarga/solicitar`, // POST - Solicitar recarga via PIX
  WALLET_TRANSACTIONS: (walletId: string) => `${API_BASE_URL}/transacao/${walletId}`, // GET - Listar transações (CORRIGIDO: singular)
  CREATE_TRANSACTION: `${API_BASE_URL}/transacoes/registrar`, // POST - Registrar transação manual
  PAYMENT_WEBHOOK: `${API_BASE_URL}/pagamento/webhook`, // POST - Webhook PagBank (CORRECTED)
  PAYMENT_WITH_WALLET: `${API_BASE_URL}/servico/pagar`, // POST - Pagar serviço com carteira
  
  // Serviços - Endpoints adicionais
  SERVICE_ACCEPT: (id: string) => `${API_BASE_URL}/servico/${id}/aceitar`, // POST - Prestador aceita serviço
  SERVICE_FINISH: (id: string) => `${API_BASE_URL}/servico/${id}/finalizar`, // POST - Prestador finaliza serviço
  SERVICE_CONFIRM: (id: string) => `${API_BASE_URL}/servico/${id}/confirmar`, // POST - Contratante confirma conclusão
  SERVICES_AVAILABLE: `${API_BASE_URL}/servico/disponiveis`, // GET - Prestador busca serviços disponíveis
  SERVICES_IN_PROGRESS: (prestadorId: string) => `${API_BASE_URL}/servico/em-andamento/${prestadorId}`, // GET - Serviços em andamento do prestador
  SERVICE_DETAILS: (id: string) => `${API_BASE_URL}/servico/${id}/detalhes`, // GET - Detalhes de um pedido
  
  // Notificações (conforme documentação oficial)
  NOTIFICATIONS: `${API_BASE_URL}/notificacao`, // GET - Buscar notificações do usuário logado
  NOTIFICATION_READ: (id: string) => `${API_BASE_URL}/notificacao/${id}/lida`, // PATCH - Marcar como lida
  NOTIFICATIONS_READ_ALL: `${API_BASE_URL}/notificacao/todas-lidas`, // PATCH - Marcar todas como lidas
  
  // Rastreamento
  TRACKING_START_MOVEMENT: `${API_BASE_URL}/rastreamento/iniciar-deslocamento`, // POST
  TRACKING_ARRIVED: `${API_BASE_URL}/rastreamento/chegou-local`, // POST
  TRACKING_START_SERVICE: `${API_BASE_URL}/rastreamento/iniciar-servico`, // POST
  TRACKING_FINISH_SERVICE: `${API_BASE_URL}/rastreamento/finalizar-servico`, // POST
  TRACKING_HISTORY: (serviceId: string) => `${API_BASE_URL}/rastreamento/historico/${serviceId}`, // GET
  TRACKING_LAST_STATUS: (serviceId: string) => `${API_BASE_URL}/rastreamento/ultimo-status/${serviceId}`, // GET
  
  // Avaliações
  RATING_CREATE: `${API_BASE_URL}/avaliacao`, // POST - Avaliar serviço
  RATING_BY_PROVIDER: (prestadorId: string) => `${API_BASE_URL}/avaliacao/prestador/${prestadorId}`, // GET - Ver avaliações do prestador
  RATING_BY_SERVICE: (serviceId: string) => `${API_BASE_URL}/avaliacao/servico/${serviceId}`, // GET - Ver avaliação do serviço
  
  // Chat - usando estrutura similar ao serviço
  CHAT_SEND_MESSAGE: (serviceId: string) => `${API_BASE_URL}/servico/${serviceId}/mensagem`, // POST - Enviar mensagem
  CHAT_GET_MESSAGES: (serviceId: string) => `${API_BASE_URL}/servico/${serviceId}/mensagens`, // GET - Buscar mensagens
  CHAT_MARK_READ: (serviceId: string) => `${API_BASE_URL}/servico/${serviceId}/mensagens/marcar-lidas`, // PATCH - Marcar como lidas
  
  // Videochamada - conforme documentação oficial
  VIDEO_CALL: `${API_BASE_URL}/chamada/video`, // POST - Criar videochamada
  VOICE_CALL: `${API_BASE_URL}/chamada/voz`, // POST - Criar chamada de voz
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

// WebSocket Events - conforme documentação oficial
export const WEBSOCKET_EVENTS = {
  // Eventos que o cliente EMITE
  USER_CONNECTED: 'user_connected',
  JOIN_SERVICO: 'join_servico', 
  SEND_MESSAGE: 'send_message',
  DISCONNECT: 'disconnect',
  
  // Eventos que o cliente RECEBE
  RECEIVE_MESSAGE: 'receive_message',
  MESSAGE_NOTIFICATION: 'message_notification',
  CONNECTION_ESTABLISHED: 'connection_established',
  JOINED_SERVICE: 'joined_service',
} as const
