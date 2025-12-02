// URL base da sua API
export const API_BASE_URL = 'https://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net';

// URL do seu servidor WebSocket
export const WEBSOCKET_URL = 'wss://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net';

// Endpoints da API (movidos para cá para centralização)
export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/usuario/login`,
  REGISTER: `${API_BASE_URL}/usuario/register`,
  RECOVER_PASSWORD: `${API_BASE_URL}/usuario/recuperar-senha`,
  VERIFY_CODE: `${API_BASE_URL}/usuario/verificar-codigo`,
  RESET_PASSWORD: `${API_BASE_URL}/usuario/redefinir-senha`,
  PROFILE: `${API_BASE_URL}/usuario/perfil`,
  CONTRATANTE_REGISTER: `${API_BASE_URL}/contratante/register`,
  CONTRATANTE_BY_ID: (id: string) => `${API_BASE_URL}/contratante/${id}`,
  CATEGORIES: `${API_BASE_URL}/categoria`,
  SERVICES: `${API_BASE_URL}/servico`,
  SERVICE_BY_ID: (id: string) => `${API_BASE_URL}/servico/${id}`,
  SERVICE_FROM_CATEGORY: (categoryId: number) => `${API_BASE_URL}/servico/from-categoria/${categoryId}`,
  PRESTADORES: `${API_BASE_URL}/prestador`,
  // Endpoints de Carteira
  WALLET: `${API_BASE_URL}/carteira`,
  MY_WALLET: `${API_BASE_URL}/carteira/minha-carteira`,
  WALLET_RECHARGE: `${API_BASE_URL}/recarga/solicitar`,
  WALLET_TRANSACTIONS: (walletId: string) => `${API_BASE_URL}/transacao/carteira/${walletId}`,
  CREATE_TRANSACTION: `${API_BASE_URL}/transacao`,
  PAYMENT_WITH_WALLET: `${API_BASE_URL}/pagamento/pagar-com-carteira`,
  PAYMENT_WEBHOOK: `${API_BASE_URL}/pagamento/webhook/confirmar`,
  // PagBank (se ainda for usado)
  PAGBANK_PAYMENT: `${API_BASE_URL}/pagamento/pagbank`,
};
