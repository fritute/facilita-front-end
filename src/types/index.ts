// Tipos compartilhados da aplicação

export interface User {
  id: string
  nome: string
  email: string
  telefone?: string
  tipo_usuario: 'CONTRATANTE' | 'PRESTADOR'
  foto?: string
  endereco?: string
  id_contratante?: string
  id_prestador?: string
}

export interface LocationCoordinates {
  lat: number
  lng: number
  address: string
}

export interface Service {
  id: string
  descricao: string
  tipo_servico: string
  preco: number
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO'
  origem?: LocationCoordinates
  destino?: LocationCoordinates
  id_contratante: string
  id_prestador?: string
  createdAt: string
  updatedAt?: string
}

export interface Order {
  id: string
  descricao: string
  status: string
  preco: number
  createdAt: string
  origem?: string
  destino?: string
  id_contratante?: string
}

export interface Notification {
  id: string
  title: string
  message: string
  timestamp: Date
  read: boolean
  type: 'info' | 'success' | 'warning' | 'error'
}

export interface ServiceCard {
  id: string
  name: string
  icon: string
  image: JSX.Element
  color: string
}

export interface Establishment {
  id: string
  name: string
  address: string
  rating: number
  distance: number
  phone?: string
  isOpen: boolean
  lat: number
  lng: number
}

export type ScreenType = 
  | 'login' 
  | 'signup' 
  | 'home' 
  | 'profile' 
  | 'profile-setup'
  | 'change-password'
  | 'orders'
  | 'service-create'
  | 'service-tracking'
  | 'service-rating'
  | 'service-confirmed'
  | 'establishments-list'
  | 'location-picker'
  | 'payment'
