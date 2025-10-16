// Utilitários de formatação

/**
 * Formata um CEP para o padrão brasileiro (12345-678)
 */
export const formatCEP = (cep: string): string => {
  const cleanCEP = cep.replace(/\D/g, '')
  if (cleanCEP.length !== 8) return cep
  return `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5)}`
}

/**
 * Formata um telefone para o padrão brasileiro (11) 98704-6715
 */
export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '')
  
  if (cleanPhone.length === 11) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`
  } else if (cleanPhone.length === 10) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`
  }
  
  return phone
}

/**
 * Formata um valor monetário para o padrão brasileiro
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

/**
 * Formata uma data para o padrão brasileiro
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj)
}

/**
 * Formata uma data e hora para o padrão brasileiro
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

/**
 * Formata distância em km
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`
  }
  return `${distanceKm.toFixed(2)}km`
}

/**
 * Trunca um texto com reticências
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Formata o status do serviço para exibição
 */
export const formatServiceStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PENDENTE': 'Pendente',
    'PENDING': 'Pendente',
    'EM_ANDAMENTO': 'Em Andamento',
    'IN_PROGRESS': 'Em Andamento',
    'CONCLUIDO': 'Concluído',
    'COMPLETED': 'Concluído',
    'CANCELADO': 'Cancelado',
    'CANCELLED': 'Cancelado'
  }
  
  return statusMap[status?.toUpperCase()] || status
}

/**
 * Retorna a cor do status do serviço
 */
export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'PENDENTE': 'bg-yellow-100 text-yellow-800',
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'EM_ANDAMENTO': 'bg-blue-100 text-blue-800',
    'IN_PROGRESS': 'bg-blue-100 text-blue-800',
    'CONCLUIDO': 'bg-green-100 text-green-800',
    'COMPLETED': 'bg-green-100 text-green-800',
    'CANCELADO': 'bg-red-100 text-red-800',
    'CANCELLED': 'bg-red-100 text-red-800'
  }
  
  return colorMap[status?.toUpperCase()] || 'bg-gray-100 text-gray-800'
}
