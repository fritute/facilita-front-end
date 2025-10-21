import React, { useState, useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowLeft, Camera, MapPin, Search, Star, Clock, CreditCard, Copy, Home, FileText, MessageSquare, User as UserIconLucide, ShoppingCart, Truck, Package, Users, Sun, Moon, Bell, Menu } from 'lucide-react'
import QRCode from 'qrcode'
import LocationMap from './LocationMap'
import ServiceTracking from './components/ServiceTracking'
import ServiceRating from './components/ServiceRating'
import CompleteProfileModal from './components/CompleteProfileModal'
import LoadingSpinner from './components/LoadingSpinner'
import NotificationSidebar from './components/NotificationSidebar'
import ServiceCreateScreen from './components/ServiceCreateScreen'
import HomeScreen from './screens/HomeScreen'
import WalletScreen from './screens/WalletScreen'
import ProfileScreen from './screens/ProfileScreen'
import { ServiceTrackingManager } from './utils/serviceTrackingUtils'
import { API_ENDPOINTS } from './config/constants'
//TELAS PARA TESTES E PARA MOVER
type Screen = "landing" | "login" | "cadastro" | "success" | "recovery" | "location-select" | "service-tracking" | "supermarket-list" | "establishments-list" | "service-rating" | "verification" | "account-type" | "service-provider" | "profile-setup" | "home" | "service-create" | "waiting-driver" | "payment" | "service-confirmed" | "tracking" | "profile" | "orders" | "change-password" | "wallet"

// Adicione esta interface antes da função App
interface ServiceTrackingProps {
  onBack: () => void
  entregador: EntregadorData
  destination: {
    lat: number
    lng: number
  }
}

interface EntregadorData {
  id?: number
  nome: string
  telefone: string
  veiculo: string
  placa: string
  rating: number
  tempoEstimado: string
  distancia: string
}

interface ValidationErrors {
  nome?: string
  email?: string
  confirmarEmail?: string
  senha?: string
  confirmarSenha?: string
  telefone?: string
  loginEmail?: string
  loginSenha?: string
  recoveryContact?: string
  verificationCode?: string
}

interface UserData {
  nome: string
  email: string
  confirmarEmail: string
  senha: string
  confirmarSenha: string
  telefone: string
  foto_perfil?: string // URL base64 ou URL da foto
}

interface RegisterData {
  nome: string
  senha_hash: string
  email: string
  telefone: string
  tipo_conta: 'CONTRATANTE' | 'PRESTADOR'
}

interface LoggedUser {
  id?: number // ID do usuário na tabela usuario
  id_contratante?: number // ID na tabela contratante (se for CONTRATANTE)
  id_localizacao?: number // ID da localização do usuário
  nome: string
  email: string
  telefone: string
  tipo_conta: 'CONTRATANTE' | 'PRESTADOR'
  foto?: string
}

function App() {
//PARA MUDAR A TELA PARA TESTES
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing')

  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [recoveryContact, setRecoveryContact] = useState('')
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', ''])
  const [countdown, setCountdown] = useState(27)
  const [selectedAccountType, setSelectedAccountType] = useState<'CONTRATANTE' | 'PRESTADOR' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [loggedUser, setLoggedUser] = useState<LoggedUser | null>(null)
  const [profileData, setProfileData] = useState({
    cpf: '',
    necessidade: '', // Campo que vai para a API
    endereco: '', // Para capturar endereço e gerar id_localizacao
    foto: null as File | null
  })
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [selectedOriginLocation, setSelectedOriginLocation] = useState<string>('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [selectedServiceType, setSelectedServiceType] = useState<string>('')
  const [isSelectingOrigin, setIsSelectingOrigin] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [pixCode, setPixCode] = useState<string>('')
  const [selectedAddress, setSelectedAddress] = useState<any>(null)
  const [pickupLocation, setPickupLocation] = useState<{address: string, lat: number, lng: number} | null>(null)
  const [deliveryLocation, setDeliveryLocation] = useState<{address: string, lat: number, lng: number} | null>(null)
  const [servicePrice, setServicePrice] = useState<number>(0)
  const [driverOrigin, setDriverOrigin] = useState<{lat: number, lng: number} | null>(null)
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false)
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [createdServiceId, setCreatedServiceId] = useState<string | null>(null)
  const [userOrders, setUserOrders] = useState<any[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersInitialized, setOrdersInitialized] = useState(false)
  const [serviceRating, setServiceRating] = useState<number>(0)
  const [serviceComment, setServiceComment] = useState<string>('')
  const [serviceCompletionTime, setServiceCompletionTime] = useState<Date | null>(new Date())
  const [selectedEstablishmentType, setSelectedEstablishmentType] = useState<string>('')
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('notificationsEnabled')
    return saved ? JSON.parse(saved) : true
  })
  
  // Estados para alteração de senha
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [changePasswordError, setChangePasswordError] = useState('')
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null)
  const [serviceStartTime, setServiceStartTime] = useState<Date | null>(null)
  const [orderFilter, setOrderFilter] = useState<'TODOS' | 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO'>('TODOS')
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [walletData, setWalletData] = useState<any>(null)
  const [hasWallet, setHasWallet] = useState<boolean>(false)
  const [loadingWallet, setLoadingWallet] = useState<boolean>(false)
  const [showCreateWalletModal, setShowCreateWalletModal] = useState(false)
  const [walletFormData, setWalletFormData] = useState({ chave_pagbank: '', saldo: 0 })
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState<number>(0)
  const [loadingRecharge, setLoadingRecharge] = useState(false)
  const [rechargeQrCode, setRechargeQrCode] = useState<string>('')
  const [rechargeQrCodeUrl, setRechargeQrCodeUrl] = useState<string>('')
  const [rechargeData, setRechargeData] = useState<any>(null)
  const [walletTransactions, setWalletTransactions] = useState<any[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [showNotificationToast, setShowNotificationToast] = useState(false)
  const [notificationToastMessage, setNotificationToastMessage] = useState('')
  
  // Estados para categorias de serviço
  const [serviceCategories, setServiceCategories] = useState<any[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  
  // Estados para notificações
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'success' as const,
      title: 'Serviço concluído',
      message: 'Seu pedido foi entregue com sucesso!',
      time: 'Há 2 horas',
      read: false
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'Novo prestador disponível',
      message: 'Um prestador aceitou seu pedido',
      time: 'Há 5 horas',
      read: false
    }
  ])

  // Função para buscar estabelecimentos por tipo com integração OpenStreetMap
  const getEstablishmentsByType = (type: string) => {
    const establishments = {
      'farmacia': [
        {
          id: 1,
          name: 'Drogasil',
          address: 'Rua Augusta, 1234 - São Paulo - SP',
          rating: 4.5,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-drogasil-photo',
          distance: '0.2 km',
          isOpen: true
        },
        {
          id: 2,
          name: 'Droga Raia',
          address: 'Av. Paulista, 567 - São Paulo - SP', 
          rating: 4.3,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-drogaraia-photo',
          distance: '0.5 km',
          isOpen: true
        },
        {
          id: 3,
          name: 'Farmácia São João',
          address: 'Rua da Consolação, 890 - São Paulo - SP',
          rating: 4.7,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-farmacia-photo',
          distance: '0.8 km',
          isOpen: false
        }
      ],
      'mercado': [
        {
          id: 1,
          name: 'Carrefour',
          address: 'Washington Luís, 1415 - São Paulo - SP',
          rating: 4.7,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-carrefour-photo',
          distance: '0.3 km',
          isOpen: true
        },
        {
          id: 2,
          name: 'Atacadão',
          address: 'Avenida Alzira Soares, 400',
          rating: 4.7,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-atacadao-photo',
          distance: '0.6 km',
          isOpen: true
        },
        {
          id: 3,
          name: 'Mercado Extra',
          address: 'Rua São Fernando, 1135 — Jardim do Golf I',
          rating: 4.7,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-extra-photo',
          distance: '1.2 km',
          isOpen: true
        }
      ],
      'restaurante': [
        {
          id: 1,
          name: 'McDonald\'s',
          address: 'Av. Paulista, 1000 - São Paulo - SP',
          rating: 4.2,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-mcdonalds-photo',
          distance: '0.4 km',
          isOpen: true
        },
        {
          id: 2,
          name: 'Outback Steakhouse',
          address: 'Shopping Eldorado - São Paulo - SP',
          rating: 4.6,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-outback-photo',
          distance: '0.7 km',
          isOpen: true
        },
        {
          id: 3,
          name: 'Famiglia Mancini',
          address: 'Rua Avanhandava, 81 - São Paulo - SP',
          rating: 4.8,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-mancini-photo',
          distance: '1.1 km',
          isOpen: true
        }
      ],
      'posto': [
        {
          id: 1,
          name: 'Posto Shell',
          address: 'Av. Faria Lima, 2000 - São Paulo - SP',
          rating: 4.3,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-shell-photo',
          distance: '0.6 km',
          isOpen: true
        },
        {
          id: 2,
          name: 'Posto Ipiranga',
          address: 'Rua Augusta, 500 - São Paulo - SP',
          rating: 4.1,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-ipiranga-photo',
          distance: '0.9 km',
          isOpen: true
        },
        {
          id: 3,
          name: 'Posto BR',
          address: 'Av. Rebouças, 1500 - São Paulo - SP',
          rating: 4.0,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-br-photo',
          distance: '1.3 km',
          isOpen: true
        }
      ],
      'banco': [
        {
          id: 1,
          name: 'Banco do Brasil',
          address: 'Av. Paulista, 800 - São Paulo - SP',
          rating: 3.8,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-bb-photo',
          distance: '0.3 km',
          isOpen: true
        },
        {
          id: 2,
          name: 'Itaú Unibanco',
          address: 'Rua Augusta, 300 - São Paulo - SP',
          rating: 4.0,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-itau-photo',
          distance: '0.5 km',
          isOpen: true
        },
        {
          id: 3,
          name: 'Santander',
          address: 'Av. Faria Lima, 1000 - São Paulo - SP',
          rating: 3.9,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-santander-photo',
          distance: '0.8 km',
          isOpen: false
        }
      ],
      'hospital': [
        {
          id: 1,
          name: 'Hospital das Clínicas',
          address: 'Av. Dr. Enéas de Carvalho Aguiar, 255 - São Paulo - SP',
          rating: 4.2,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-hc-photo',
          distance: '2.1 km',
          isOpen: true
        },
        {
          id: 2,
          name: 'Hospital Sírio-Libanês',
          address: 'Rua Dona Adma Jafet, 91 - São Paulo - SP',
          rating: 4.7,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-sirio-photo',
          distance: '1.8 km',
          isOpen: true
        },
        {
          id: 3,
          name: 'Hospital Albert Einstein',
          address: 'Av. Albert Einstein, 627 - São Paulo - SP',
          rating: 4.8,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-einstein-photo',
          distance: '3.2 km',
          isOpen: true
        }
      ],
      'shopping': [
        {
          id: 1,
          name: 'Shopping Eldorado',
          address: 'Av. Rebouças, 3970 - São Paulo - SP',
          rating: 4.4,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-eldorado-photo',
          distance: '1.5 km',
          isOpen: true
        },
        {
          id: 2,
          name: 'Shopping Iguatemi',
          address: 'Av. Brigadeiro Faria Lima, 2232 - São Paulo - SP',
          rating: 4.6,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-iguatemi-photo',
          distance: '2.0 km',
          isOpen: true
        },
        {
          id: 3,
          name: 'Shopping Center Norte',
          address: 'Travessa Casalbuono, 120 - São Paulo - SP',
          rating: 4.3,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-centernorte-photo',
          distance: '4.2 km',
          isOpen: true
        }
      ],
      'correios': [
        {
          id: 1,
          name: 'Correios - Agência Central',
          address: 'Praça do Correio, 1 - São Paulo - SP',
          rating: 3.5,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-correios-photo',
          distance: '0.8 km',
          isOpen: true
        },
        {
          id: 2,
          name: 'Correios - Paulista',
          address: 'Av. Paulista, 1500 - São Paulo - SP',
          rating: 3.7,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-correios2-photo',
          distance: '0.4 km',
          isOpen: true
        },
        {
          id: 3,
          name: 'Correios - Vila Madalena',
          address: 'Rua Harmonia, 200 - São Paulo - SP',
          rating: 3.6,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-correios3-photo',
          distance: '2.3 km',
          isOpen: false
        }
      ]
    }
    
    return establishments[type as keyof typeof establishments] || []
  }

  // Função para alternar tema
  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    localStorage.setItem('darkMode', JSON.stringify(newTheme))
  }

  // Classes de tema
  const themeClasses = {
    bg: isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100',
    bgCard: isDarkMode ? 'bg-gray-800' : 'bg-white',
    bgPrimary: isDarkMode ? 'bg-gray-800' : 'bg-green-500',
    text: isDarkMode ? 'text-white' : 'text-gray-800',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    input: isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
  }
  
  const handleAddressSelection = (address: any) => {
    setSelectedAddress(address)
    console.log("Endereço selecionado:", address)
  }
  const [selectedDestination, setSelectedDestination] = useState<{address: string, lat: number, lng: number} | null>(null)

  const handleStartTracking = (destination: {address: string, lat: number, lng: number}) => {
    setSelectedDestination(destination)
    
    // Define origem do prestador próxima para teste rápido
    const originPosition = driverOrigin || 
      (pickupLocation ? { lat: pickupLocation.lat, lng: pickupLocation.lng } : 
       { lat: -23.5505, lng: -46.6333 }) // Centro de São Paulo para teste rápido
    
    if (!driverOrigin) {
      setDriverOrigin(originPosition)
    }
    
    // Criar novo serviço ativo
    const serviceId = ServiceTrackingManager.generateServiceId()
    const serviceState = {
      serviceId,
      driverPosition: originPosition,
      progress: 0,
      routeCoordinates: [],
      currentRouteIndex: 0,
      estimatedTime: 0,
      serviceStartTime: new Date().toISOString(),
      isServiceCompleted: false,
      destination,
      entregador: entregadorData,
      originalOrigin: originPosition // Salvar origem original para referência
    }
    
    ServiceTrackingManager.saveActiveService(serviceState)
    setActiveServiceId(serviceId)
    setServiceStartTime(new Date())
    
    handleScreenTransition('service-tracking')
  }

  // Função chamada quando o serviço é concluído automaticamente
  const handleServiceCompleted = () => {
    setServiceCompletionTime(new Date())
    
    // Finalizar serviço ativo no gerenciador
    ServiceTrackingManager.completeActiveService()
    
    // Limpar estado local
    setActiveServiceId(null)
    setServiceStartTime(null)
    
    // Redirecionar para avaliação
    setTimeout(() => {
      handleScreenTransition('service-rating')
    }, 500)
  }

  // Função para limpar serviços antigos na inicialização
  const cleanupOldServices = () => {
    const activeService = ServiceTrackingManager.loadActiveService()
    if (activeService) {
      // Se o serviço está marcado como concluído, limpar
      if (activeService.isServiceCompleted) {
        ServiceTrackingManager.clearActiveService()
      }
    }
  }

  
  const [entregadorData, setEntregadorData] = useState({
    id: 2, // ID do prestador
    nome: 'José Silva',
    telefone: '(11) 98704-6715',
    veiculo: 'Moto Honda CG 160',
    placa: 'ABC1D23',
    rating: 4.9,
    tempoEstimado: '15',
    distancia: '2.5 km'
  })

  const [loginData, setLoginData] = useState({
    login: '', // Pode ser email ou telefone
    senha: ''
  })

  const [userData, setUserData] = useState<UserData>({
    nome: 'Katiê Bueno',
    email: 'seuemeil@gmail.com',
    confirmarEmail: 'seuemeil@gmail.com',
    senha: '',
    confirmarSenha: '',
    telefone: '(11) 90000-1234'
  })

  // Mock data for recent addresses
  const recentAddresses = [
    'Rua Vitória, cohab 2, Carapicuíba',
    'Rua Manaus, cohab 2, Carapicuíba',
    'Rua Belém, cohab 2, Carapicuíba',
    'Rua Paraná, cohab 1, Carapicuíba'
  ]

  // Estado para localização do usuário
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number, address: string} | null>(null)
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([])
  const [loadingPlaces, setLoadingPlaces] = useState(false)

  // Função para buscar CEP usando ViaCEP
  const fetchAddressFromCEP = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      
      if (!data.erro) {
        return {
          address: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`,
          city: data.localidade,
          state: data.uf,
          neighborhood: data.bairro
        }
      }
      return null
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      return null
    }
  }

  // Função para buscar lugares próximos usando OpenStreetMap Nominatim
  const searchNearbyPlaces = async (lat: number, lng: number, category: string) => {
    setLoadingPlaces(true)
    try {
      // Mapear categorias para tags do OpenStreetMap
      const categoryMap: {[key: string]: string} = {
        'farmacia': 'amenity=pharmacy',
        'mercado': 'shop=supermarket',
        'restaurante': 'amenity=restaurant',
        'posto': 'amenity=fuel',
        'banco': 'amenity=bank',
        'hospital': 'amenity=hospital',
        'shopping': 'shop=mall',
        'correios': 'amenity=post_office'
      }

      const tag = categoryMap[category] || 'amenity=*'
      const radius = 5000 // 5km de raio
      
      // Usar Overpass API para buscar lugares próximos
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node[${tag}](around:${radius},${lat},${lng});
          way[${tag}](around:${radius},${lat},${lng});
          relation[${tag}](around:${radius},${lat},${lng});
        );
        out center meta;
      `
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `data=${encodeURIComponent(overpassQuery)}`
      })
      
      const data = await response.json()
      
      // Processar resultados
      const places = data.elements.map((element: any) => {
        const lat = element.lat || element.center?.lat
        const lon = element.lon || element.center?.lon
        const name = element.tags?.name || element.tags?.brand || 'Estabelecimento'
        const address = `${element.tags?.['addr:street'] || ''} ${element.tags?.['addr:housenumber'] || ''}`.trim() || 'Endereço não disponível'
        
        return {
          id: element.id,
          name,
          address,
          lat,
          lon,
          rating: Math.random() * 2 + 3, // Rating simulado entre 3-5
          distance: calculateDistance(userLocation?.lat || 0, userLocation?.lng || 0, lat, lon).toFixed(1),
          isOpen: Math.random() > 0.2, // 80% chance de estar aberto
          phone: element.tags?.phone || '',
          website: element.tags?.website || ''
        }
      }).slice(0, 10) // Limitar a 10 resultados
      
      setNearbyPlaces(places)
    } catch (error) {
      console.error('Erro ao buscar lugares próximos:', error)
      // Fallback para dados mock se a API falhar
      setNearbyPlaces(getEstablishmentsByType(category))
    } finally {
      setLoadingPlaces(false)
    }
  }

  // Função para obter localização do usuário
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          
          // Buscar endereço usando geocoding reverso
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
            )
            const data = await response.json()
            const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            
            setUserLocation({ lat, lng, address })
          } catch (error) {
            console.error('Erro ao buscar endereço:', error)
            setUserLocation({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
          }
        },
        (error) => {
          console.error('Erro ao obter localização:', error)
          // Localização padrão (São Paulo)
          setUserLocation({
            lat: -23.5505,
            lng: -46.6333,
            address: 'São Paulo, SP'
          })
        }
      )
    } else {
      // Localização padrão se geolocalização não estiver disponível
      setUserLocation({
        lat: -23.5505,
        lng: -46.6333,
        address: 'São Paulo, SP'
      })
    }
  }

  // Service cards with Undraw-inspired icons
  const serviceCards = [
    { 
      id: 'farmacia', 
      name: 'Farmácia', 
      image: (
        <div className="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-12 h-12">
            {/* Undraw-inspired pharmacy icon */}
            <circle cx="50" cy="30" r="12" fill="#6C63FF"/>
            <rect x="44" y="45" width="12" height="25" rx="6" fill="#6C63FF"/>
            <rect x="35" y="20" width="30" height="20" rx="10" fill="#4CAF50"/>
            <rect x="47" y="25" width="6" height="10" fill="#FFF"/>
            <rect x="42" y="28" width="16" height="4" fill="#FFF"/>
            <circle cx="25" cy="75" r="8" fill="#FF6B6B"/>
            <circle cx="75" cy="75" r="8" fill="#4ECDC4"/>
            <rect x="20" y="80" width="60" height="4" fill="#6C63FF"/>
          </svg>
        </div>
      )
    },
    { 
      id: 'mercado', 
      name: 'Mercado', 
      image: (
        <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-12 h-12">
            {/* Undraw-inspired supermarket icon */}
            <rect x="20" y="35" width="40" height="30" fill="#6C63FF" rx="5"/>
            <rect x="15" y="30" width="50" height="8" fill="#4ECDC4"/>
            <circle cx="25" cy="75" r="5" fill="#333"/>
            <circle cx="55" cy="75" r="5" fill="#333"/>
            <rect x="10" y="25" width="6" height="25" fill="#FF6B6B"/>
            <path d="M65 30 Q75 25 75 35 Q75 45 65 40" fill="none" stroke="#333" strokeWidth="2"/>
            
            {/* Products in cart */}
            <rect x="25" y="40" width="8" height="6" fill="#4CAF50"/>
            <rect x="35" y="38" width="6" height="8" fill="#FF9800"/>
            <circle cx="48" cy="45" r="4" fill="#E91E63"/>
            <rect x="45" y="52" width="10" height="4" fill="#2196F3"/>
          </svg>
        </div>
      )
    },
    { 
      id: 'restaurante', 
      name: 'Restaurante', 
      image: (
        <div className="w-16 h-16 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-12 h-12">
            {/* Undraw-inspired restaurant icon */}
            <circle cx="50" cy="40" r="20" fill="#FF6B6B"/>
            <rect x="45" y="60" width="10" height="15" fill="#6C63FF"/>
            <path d="M30 35 Q50 25 70 35" fill="none" stroke="#FFF" strokeWidth="3"/>
            <circle cx="40" cy="40" r="3" fill="#FFF"/>
            <circle cx="50" cy="38" r="3" fill="#FFF"/>
            <circle cx="60" cy="40" r="3" fill="#FFF"/>
            <rect x="25" y="75" width="50" height="4" fill="#4ECDC4"/>
            <path d="M35 30 L40 25 L45 30" fill="#4CAF50"/>
            <path d="M55 30 L60 25 L65 30" fill="#4CAF50"/>
          </svg>
        </div>
      )
    },
    { 
      id: 'posto', 
      name: 'Posto', 
      image: (
        <div className="w-16 h-16 mx-auto mb-3 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-12 h-12">
            {/* Undraw-inspired gas station icon */}
            <rect x="25" y="45" width="30" height="35" fill="#6C63FF"/>
            <rect x="20" y="40" width="40" height="8" fill="#4ECDC4"/>
            <circle cx="40" cy="30" r="8" fill="#FF6B6B"/>
            <rect x="60" y="35" width="8" height="25" fill="#FFD93D"/>
            <circle cx="64" cy="32" r="3" fill="#4CAF50"/>
            <path d="M68 35 Q75 30 80 35 Q75 40 68 35" fill="#333"/>
            <rect x="30" y="50" width="20" height="4" fill="#FFF"/>
            <rect x="30" y="60" width="15" height="4" fill="#FFF"/>
            <rect x="30" y="70" width="18" height="4" fill="#FFF"/>
          </svg>
        </div>
      )
    },
    { 
      id: 'banco', 
      name: 'Banco', 
      image: (
        <div className="w-16 h-16 mx-auto mb-3 bg-indigo-100 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-12 h-12">
            {/* Undraw-inspired bank icon */}
            <rect x="20" y="50" width="60" height="30" fill="#6C63FF"/>
            <polygon points="50,25 15,45 85,45" fill="#4ECDC4"/>
            <rect x="30" y="55" width="6" height="20" fill="#FFF"/>
            <rect x="40" y="55" width="6" height="20" fill="#FFF"/>
            <rect x="50" y="55" width="6" height="20" fill="#FFF"/>
            <rect x="60" y="55" width="6" height="20" fill="#FFF"/>
            <rect x="15" y="80" width="70" height="6" fill="#333"/>
            <circle cx="50" cy="35" r="4" fill="#FFD93D"/>
            <text x="50" y="38" textAnchor="middle" fontSize="6" fill="#333">$</text>
          </svg>
        </div>
      )
    },
    { 
      id: 'hospital', 
      name: 'Hospital', 
      image: (
        <div className="w-16 h-16 mx-auto mb-3 bg-pink-100 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-12 h-12">
            {/* Undraw-inspired hospital icon */}
            <rect x="25" y="35" width="50" height="45" fill="#6C63FF"/>
            <rect x="20" y="30" width="60" height="8" fill="#4ECDC4"/>
            <rect x="45" y="15" width="10" height="20" fill="#FF6B6B"/>
            <rect x="40" y="20" width="20" height="10" fill="#FF6B6B"/>
            <rect x="35" y="45" width="8" height="8" fill="#FFF"/>
            <rect x="47" y="45" width="8" height="8" fill="#FFF"/>
            <rect x="59" y="45" width="8" height="8" fill="#FFF"/>
            <rect x="35" y="60" width="8" height="8" fill="#FFF"/>
            <rect x="47" y="60" width="8" height="8" fill="#FFF"/>
            <rect x="59" y="60" width="8" height="8" fill="#FFF"/>
          </svg>
        </div>
      )
    },
    { 
      id: 'shopping', 
      name: 'Shopping', 
      image: (
        <div className="w-16 h-16 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-12 h-12">
            {/* Undraw-inspired shopping mall icon */}
            <rect x="15" y="40" width="70" height="40" fill="#6C63FF"/>
            <rect x="10" y="35" width="80" height="8" fill="#4ECDC4"/>
            <rect x="25" y="50" width="15" height="15" fill="#FF6B6B"/>
            <rect x="45" y="50" width="15" height="15" fill="#4CAF50"/>
            <rect x="65" y="50" width="15" height="15" fill="#FFD93D"/>
            <circle cx="32" cy="57" r="2" fill="#FFF"/>
            <circle cx="52" cy="57" r="2" fill="#FFF"/>
            <circle cx="72" cy="57" r="2" fill="#FFF"/>
            <rect x="40" y="25" width="20" height="15" fill="#FF6B6B"/>
            <polygon points="50,20 45,30 55,30" fill="#4ECDC4"/>
          </svg>
        </div>
      )
    },
    { 
      id: 'correios', 
      name: 'Correios', 
      image: (
        <div className="w-16 h-16 mx-auto mb-3 bg-orange-100 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-12 h-12">
            {/* Undraw-inspired post office icon */}
            <rect x="25" y="40" width="50" height="35" fill="#FFD93D"/>
            <rect x="20" y="35" width="60" height="8" fill="#FF6B6B"/>
            <rect x="35" y="50" width="30" height="20" fill="#6C63FF"/>
            <rect x="40" y="55" width="20" height="3" fill="#FFF"/>
            <rect x="40" y="60" width="15" height="3" fill="#FFF"/>
            <rect x="40" y="65" width="18" height="3" fill="#FFF"/>
            <circle cx="30" cy="78" r="3" fill="#4ECDC4"/>
            <circle cx="70" cy="78" r="3" fill="#4ECDC4"/>
            <rect x="45" y="25" width="10" height="15" fill="#4CAF50"/>
            <polygon points="50,20 47,30 53,30" fill="#4CAF50"/>
          </svg>
        </div>
      )
    }
  ]

  // Predefined service options
  const predefinedServices = [
    { id: 'ir-mercado', text: 'Ir ao mercado', category: 'Compras' },
    { id: 'buscar-remedios', text: 'Buscar remédios na farmácia', category: 'Saúde' },
    { id: 'acompanhar-consulta', text: 'Acompanhar em consultas médicas', category: 'Saúde' }
  ]

  // Função para calcular distância entre dois pontos (fórmula de Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c
    return distance
  }

  // Função para calcular preço baseado na distância
  const calculatePrice = (distance: number): number => {
    const basePrice = 10 // Preço base R$ 10
    const pricePerKm = 3.5 // R$ 3,50 por km
    const total = basePrice + (distance * pricePerKm)
    return parseFloat(total.toFixed(2))
  }

  // Função para buscar categorias de serviço da API
  const fetchServiceCategories = async () => {
    setLoadingCategories(true)
    console.log('🔍 Buscando categorias de serviço...')
    console.log('🌐 URL:', API_ENDPOINTS.CATEGORIES)
    
    try {
      const response = await fetch(API_ENDPOINTS.CATEGORIES)
      console.log('📥 Resposta recebida - Status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Categorias recebidas:', data)
        console.log('📊 Quantidade de categorias:', Array.isArray(data) ? data.length : 'Não é array')
        
        // A API pode retornar { data: [...] } ou diretamente [...]
        const categories = Array.isArray(data) ? data : (data.data || [])
        console.log('📋 Categorias processadas:', categories)
        
        setServiceCategories(categories)
      } else {
        console.error('❌ Erro ao buscar categorias:', response.status)
        const errorText = await response.text()
        console.error('❌ Detalhes do erro:', errorText)
      }
    } catch (error) {
      console.error('❌ Erro na requisição de categorias:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  // Função para criar serviço a partir de uma categoria
  const createServiceFromCategory = async (categoryId: number) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        alert('Você precisa estar logado para criar um serviço')
        handleScreenTransition('login')
        return
      }

      // Buscar id_localizacao do contratante
      const contratanteId = loggedUser?.id_contratante || loggedUser?.id
      if (!contratanteId) {
        alert('Erro ao identificar o contratante')
        return
      }

      // Buscar dados do contratante para pegar id_localizacao
      const contratanteResponse = await fetch(API_ENDPOINTS.CONTRATANTE_BY_ID(contratanteId.toString()), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!contratanteResponse.ok) {
        alert('Erro ao buscar dados do contratante')
        return
      }

      const contratanteData = await contratanteResponse.json()
      const idLocalizacao = contratanteData.id_localizacao

      if (!idLocalizacao) {
        alert('Você precisa ter um endereço cadastrado para criar um serviço')
        return
      }

      // Criar o serviço a partir da categoria
      const serviceData = {
        descricao_personalizada: serviceDescription || 'Serviço solicitado',
        id_localizacao: idLocalizacao,
        valor_personalizado: servicePrice || 25.00
      }

      const response = await fetch(API_ENDPOINTS.SERVICE_FROM_CATEGORY(categoryId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(serviceData)
      })

      if (response.ok) {
        const createdService = await response.json()
        setCreatedServiceId(createdService.id || createdService.id_servico)
        alert('Serviço criado com sucesso!')
        handleScreenTransition('payment')
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(`Erro ao criar serviço: ${errorData.message || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao criar serviço:', error)
      alert('Erro ao criar serviço. Tente novamente.')
    }
  }

  const generateQRCode = async (pixKey: string, amount: number) => {
    try {
      const pixString = `00020126580014BR.GOV.BCB.PIX0136${pixKey}520400005303986540${amount.toFixed(2)}5802BR5925FACILITA SERVICOS LTDA6009SAO PAULO62070503***6304`
      const qrCodeDataUrl = await QRCode.toDataURL(pixString)
      setQrCodeUrl(qrCodeDataUrl)
      setPixCode(pixString)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  // Função para gerar pagamento via PagBank
  const generatePagBankPayment = async (amount: number) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(API_ENDPOINTS.PAGBANK_PAYMENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          amount: amount,
          description: 'Pagamento de serviço Facilita'
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Resposta PagBank:', data)
        
        // Se o backend retornar o QR code
        if (data.qr_code) {
          setPixCode(data.qr_code)
          // Gerar imagem do QR code
          const qrCodeDataUrl = await QRCode.toDataURL(data.qr_code)
          setQrCodeUrl(qrCodeDataUrl)
        } else if (data.qr_code_base64) {
          setQrCodeUrl(data.qr_code_base64)
          setPixCode(data.qr_code_text || '')
        }
        
        return data
      } else {
        console.error('Erro ao gerar pagamento PagBank')
        // Fallback para o método antigo
        await generateQRCode('facilita@pagbank.com', amount)
      }
    } catch (error) {
      console.error('Erro na requisição PagBank:', error)
      // Fallback para o método antigo
      await generateQRCode('facilita@pagbank.com', amount)
    }
  }

  // Funções de Carteira Digital
  const fetchWallet = async () => {
    try {
      setLoadingWallet(true)
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        console.warn('⚠️ Token não encontrado para buscar carteira')
        setHasWallet(false)
        return
      }

      console.log('🔍 Buscando carteira do usuário...')
      const response = await fetch(API_ENDPOINTS.MY_WALLET, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📥 Status da resposta:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Dados da carteira recebidos:', data)
        const wallet = data.data || data
        
        setWalletData(wallet)
        const balance = parseFloat(wallet.saldo) || 0
        setWalletBalance(balance)
        setHasWallet(true)
        
        // Salvar no localStorage
        localStorage.setItem('walletData', JSON.stringify(wallet))
        localStorage.setItem('walletBalance', balance.toString())
        console.log('✅ Carteira carregada com sucesso! Saldo:', wallet.saldo)
        console.log('💾 Dados salvos no localStorage')
      } else if (response.status === 404) {
        // Usuário não tem carteira ainda
        console.log('⚠️ Usuário não possui carteira (404)')
        setHasWallet(false)
        setWalletBalance(0)
        setWalletData(null)
      } else if (response.status === 500) {
        console.warn('⚠️ Erro 500 ao buscar carteira - servidor indisponível')
        setHasWallet(false)
      } else if (response.status === 401 || response.status === 403) {
        console.warn('⚠️ Token inválido ao buscar carteira')
        setHasWallet(false)
      } else {
        console.warn('⚠️ Erro desconhecido ao buscar carteira:', response.status)
        setHasWallet(false)
      }
    } catch (error) {
      console.warn('⚠️ Erro ao buscar carteira:', error)
      setHasWallet(false)
    } finally {
      setLoadingWallet(false)
    }
  }

  const createWallet = async () => {
    try {
      setLoadingWallet(true)
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        alert('Você precisa estar logado para criar uma carteira')
        handleScreenTransition('login')
        return
      }

      if (!walletFormData.chave_pagbank) {
        alert('Por favor, informe sua chave PagBank')
        return
      }

      const response = await fetch(API_ENDPOINTS.WALLET, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chave_pagbank: walletFormData.chave_pagbank,
          saldo: walletFormData.saldo || 0
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Carteira criada com sucesso:', data)
        
        setShowCreateWalletModal(false)
        setWalletFormData({ chave_pagbank: '', saldo: 0 })
        
        alert('✅ Carteira criada com sucesso!')
        
        // Buscar carteira atualizada do servidor
        await fetchWallet()
      } else if (response.status === 400) {
        const errorData = await response.json()
        alert(`Erro ao criar carteira: ${errorData.message || 'Dados inválidos'}`)
      } else if (response.status === 409) {
        alert('Você já possui uma carteira cadastrada')
        setShowCreateWalletModal(false)
        setWalletFormData({ chave_pagbank: '', saldo: 0 })
        // Buscar carteira existente
        await fetchWallet()
      } else if (response.status === 500) {
        alert('Erro no servidor. Tente novamente mais tarde.')
      } else {
        alert('Erro ao criar carteira. Tente novamente.')
      }
    } catch (error) {
      console.error('❌ Erro ao criar carteira:', error)
      alert('Erro ao criar carteira. Verifique sua conexão.')
    } finally {
      setLoadingWallet(false)
    }
  }

  // Função para buscar transações da carteira
  const fetchWalletTransactions = async () => {
    try {
      if (!walletData?.id) {
        console.warn('⚠️ ID da carteira não disponível')
        return
      }

      setLoadingTransactions(true)
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        console.warn('⚠️ Token não encontrado para buscar transações')
        return
      }

      const response = await fetch(API_ENDPOINTS.WALLET_TRANSACTIONS(walletData.id.toString()), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const transactions = data.data || data
        setWalletTransactions(Array.isArray(transactions) ? transactions : [])
      } else if (response.status === 500) {
        console.warn('⚠️ Erro 500 ao buscar transações - servidor indisponível')
      } else if (response.status === 401 || response.status === 403) {
        console.warn('⚠️ Token inválido ao buscar transações')
      }
    } catch (error) {
      console.warn('⚠️ Erro ao buscar transações:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  // Função para solicitar recarga (modo sandbox - sem API)
  const requestRecharge = async () => {
    try {
      if (rechargeAmount <= 0) {
        alert('Por favor, informe um valor válido para recarga')
        return
      }

      setLoadingRecharge(true)
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        alert('Você precisa estar logado para fazer uma recarga')
        handleScreenTransition('login')
        return
      }

      console.log('💰 Gerando recarga sandbox...')
      console.log('💵 Valor:', rechargeAmount)

      // Simular dados de recarga para sandbox
      const mockRechargeData = {
        message: 'Recarga solicitada com sucesso. Aguardando pagamento.',
        recarga: {
          id: Math.floor(Math.random() * 1000),
          status: 'PENDENTE',
          valor: rechargeAmount,
          metodo: 'PIX'
        },
        pedido: {
          id: `ORDE_${Date.now()}`,
          reference_id: `recarga-sandbox-${Date.now()}`
        }
      }

      // Gerar QR Code fictício localmente
      const pixCode = `00020126580014br.gov.bcb.pix0136${mockRechargeData.pedido.id}520400005303986540${rechargeAmount.toFixed(2)}5802BR5913Facilita App6009SAO PAULO62070503***6304`
      
      console.log('📱 Gerando QR Code...')
      const QRCode = (await import('qrcode')).default
      const qrCodeDataUrl = await QRCode.toDataURL(pixCode)
      
      setRechargeData(mockRechargeData)
      setRechargeQrCode(pixCode)
      setRechargeQrCodeUrl(qrCodeDataUrl)
      
      console.log('✅ Recarga gerada com sucesso (modo sandbox)')
      
    } catch (error) {
      console.error('❌ Erro ao gerar recarga:', error)
      alert('Erro ao gerar recarga. Tente novamente.')
    } finally {
      setLoadingRecharge(false)
    }
  }

  // Função para simular confirmação de pagamento (sandbox)
  const confirmSandboxPayment = async () => {
    try {
      setLoadingRecharge(true)
      
      console.log('💳 Simulando pagamento...')
      console.log('💰 Valor a creditar:', rechargeAmount)
      
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        alert('Você precisa estar logado')
        return
      }

      if (!walletData?.id) {
        alert('Carteira não encontrada')
        return
      }

      // 1. Criar transação de ENTRADA no banco
      console.log('📝 Criando transação no banco...')
      const transactionPayload = {
        id_carteira: walletData.id,
        tipo: 'ENTRADA',
        valor: rechargeAmount,
        descricao: `Recarga via PIX - R$ ${rechargeAmount.toFixed(2)}`
      }

      const transactionResponse = await fetch(API_ENDPOINTS.CREATE_TRANSACTION, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionPayload)
      })

      if (!transactionResponse.ok) {
        console.error('❌ Erro ao criar transação:', transactionResponse.status)
        const errorText = await transactionResponse.text().catch(() => '')
        console.error('Detalhes do erro:', errorText)
        // Continuar mesmo se falhar - modo sandbox
      } else {
        const transactionData = await transactionResponse.json()
        console.log('✅ Transação criada no banco:', transactionData)
      }

      // 2. Calcular novo saldo (o backend calcula automaticamente baseado nas transações)
      console.log('💰 Calculando novo saldo...')
      const newBalance = walletBalance + rechargeAmount
      console.log('💵 Saldo atual:', walletBalance)
      console.log('💵 Valor da recarga:', rechargeAmount)
      console.log('💵 Novo saldo calculado:', newBalance)
      console.log('ℹ️ O saldo será atualizado automaticamente pelo backend baseado nas transações')

      // 3. Atualizar estado local e persistir
      setWalletBalance(newBalance)
      if (walletData) {
        const updatedWalletData = {
          ...walletData,
          saldo: newBalance.toString()
        }
        setWalletData(updatedWalletData)
        
        // Persistir no localStorage
        localStorage.setItem('walletData', JSON.stringify(updatedWalletData))
        localStorage.setItem('walletBalance', newBalance.toString())
        console.log('💾 Saldo persistido no localStorage')
      }
      
      console.log('✅ Pagamento confirmado! Novo saldo:', newBalance)
      
      // 4. Tocar som de notificação
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eafTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Yk2CBlou+3mn00QDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBAC')
        audio.volume = 0.5
        audio.play().catch(e => console.log('Não foi possível tocar o som:', e))
      } catch (e) {
        console.log('Erro ao tocar som:', e)
      }

      // 5. Mostrar notificação
      const notificationMessage = `💰 Recarga confirmada! R$ ${rechargeAmount.toFixed(2)} creditado na sua carteira.`
      setNotificationToastMessage(notificationMessage)
      setShowNotificationToast(true)
      
      // Adicionar notificação à lista
      const newNotification = {
        id: Date.now().toString(),
        type: 'success' as const,
        title: 'Recarga Confirmada',
        message: `R$ ${rechargeAmount.toFixed(2)} foi creditado na sua carteira`,
        time: 'Agora',
        read: false
      }
      setNotifications(prev => [newNotification, ...prev])
      
      // Ocultar toast após 5 segundos
      setTimeout(() => {
        setShowNotificationToast(false)
      }, 5000)
      
      // 6. Fechar modal e limpar estados
      setShowRechargeModal(false)
      setRechargeAmount(0)
      setRechargeQrCode('')
      setRechargeQrCodeUrl('')
      setRechargeData(null)
      
      // 7. Atualizar apenas transações do servidor (não buscar carteira para não sobrescrever saldo)
      console.log('🔄 Atualizando lista de transações...')
      if (walletData?.id) {
        await fetchWalletTransactions()
      }
      console.log('ℹ️ Saldo mantido localmente (backend não calcula automaticamente)')
      
    } catch (error) {
      console.error('❌ Erro ao confirmar pagamento:', error)
      alert('Erro ao confirmar pagamento. Tente novamente.')
    } finally {
      setLoadingRecharge(false)
    }
  }

  // Função para pagar serviço com carteira digital
  const payServiceWithWallet = async (serviceId: number) => {
    try {
      setIsLoading(true)
      
      const token = localStorage.getItem('authToken')
      if (!token) {
        alert('Você precisa estar logado')
        return false
      }

      const serviceValue = servicePrice > 0 ? servicePrice : 119.99

      // Verificar saldo suficiente
      if (walletBalance < serviceValue) {
        alert(`Saldo insuficiente! Você possui R$ ${walletBalance.toFixed(2)} e o serviço custa R$ ${serviceValue.toFixed(2)}`)
        return false
      }

      console.log('💳 Pagando serviço com carteira digital...')
      console.log('🆔 ID do serviço:', serviceId)
      console.log('🔍 Tipo do ID:', typeof serviceId)
      console.log('🔍 ID é válido?', serviceId !== null && serviceId !== undefined && !isNaN(serviceId))
      console.log('💰 Valor:', serviceValue)
      console.log('💵 Saldo atual:', walletBalance)

      // Validar ID antes de enviar
      if (!serviceId || isNaN(serviceId) || serviceId <= 0) {
        console.error('❌ ID do serviço inválido:', serviceId)
        alert('Erro: ID do serviço inválido. Tente criar o serviço novamente.')
        return false
      }

      // Tentar diferentes formatos de payload
      const payload = {
        id_servico: serviceId,  // Tentar com id_servico primeiro
        servico_id: serviceId   // Manter servico_id como fallback
      }
      console.log('📤 Payload a ser enviado:', JSON.stringify(payload, null, 2))

      // Chamar API de pagamento
      const response = await fetch('https://servidor-facilita.onrender.com/v1/facilita/servico/pagar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      console.log('📥 Status da resposta:', response.status)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        console.error('❌ Erro ao pagar serviço:', errorText)
        
        // Se erro 500, usar dados mockados (modo sandbox)
        if (response.status === 500) {
          console.warn('⚠️ Erro 500 - Usando dados mockados (sandbox)')
          
          // Simular pagamento com sucesso
          const newBalance = walletBalance - serviceValue
          setWalletBalance(newBalance)
          
          if (walletData) {
            const updatedWalletData = {
              ...walletData,
              saldo: newBalance.toString()
            }
            setWalletData(updatedWalletData)
            localStorage.setItem('walletData', JSON.stringify(updatedWalletData))
            localStorage.setItem('walletBalance', newBalance.toString())
          }

          // Tocar som
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eafTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Yk2CBlou+3mn00QDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBAC')
            audio.volume = 0.5
            audio.play().catch(e => console.log('Som:', e))
          } catch (e) {}

          // Notificação
          const notificationMessage = `✅ Serviço pago! R$ ${serviceValue.toFixed(2)} debitado (modo sandbox).`
          setNotificationToastMessage(notificationMessage)
          setShowNotificationToast(true)
          
          const newNotification = {
            id: Date.now().toString(),
            type: 'success' as const,
            title: 'Pagamento Confirmado (Sandbox)',
            message: `Serviço pago com sucesso! R$ ${serviceValue.toFixed(2)} debitado`,
            time: 'Agora',
            read: false
          }
          setNotifications(prev => [newNotification, ...prev])
          
          setTimeout(() => {
            setShowNotificationToast(false)
          }, 5000)

          if (walletData?.id) {
            await fetchWalletTransactions()
          }

          console.log('✅ Pagamento simulado com sucesso! Novo saldo:', newBalance)
          return true
        }
        
        // Outros erros
        let errorMessage = 'Erro ao processar pagamento.'
        try {
          const errorData = JSON.parse(errorText)
          if (response.status === 400) {
            errorMessage = errorData.message || 'Dados inválidos.'
          } else if (response.status === 404) {
            errorMessage = 'Serviço não encontrado.'
          } else {
            errorMessage = errorData.message || 'Erro ao processar pagamento.'
          }
        } catch (e) {}
        
        alert(errorMessage)
        return false
      }

      const responseData = await response.json()
      console.log('✅ Pagamento realizado com sucesso:', responseData)

      // Atualizar saldo local
      const newBalance = responseData.data.saldo_contratante
      setWalletBalance(newBalance)
      
      if (walletData) {
        const updatedWalletData = {
          ...walletData,
          saldo: newBalance.toString()
        }
        setWalletData(updatedWalletData)
        localStorage.setItem('walletData', JSON.stringify(updatedWalletData))
        localStorage.setItem('walletBalance', newBalance.toString())
      }

      // Tocar som de notificação
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eafTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Yk2CBlou+3mn00QDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBAC')
        audio.volume = 0.5
        audio.play().catch(e => console.log('Não foi possível tocar o som:', e))
      } catch (e) {
        console.log('Erro ao tocar som:', e)
      }

      // Mostrar notificação
      const notificationMessage = `✅ Serviço pago! R$ ${serviceValue.toFixed(2)} debitado da sua carteira.`
      setNotificationToastMessage(notificationMessage)
      setShowNotificationToast(true)
      
      // Adicionar notificação à lista
      const newNotification = {
        id: Date.now().toString(),
        type: 'success' as const,
        title: 'Pagamento Confirmado',
        message: `Serviço pago com sucesso! R$ ${serviceValue.toFixed(2)} debitado`,
        time: 'Agora',
        read: false
      }
      setNotifications(prev => [newNotification, ...prev])
      
      setTimeout(() => {
        setShowNotificationToast(false)
      }, 5000)

      // Buscar transações atualizadas
      if (walletData?.id) {
        await fetchWalletTransactions()
      }

      console.log('✅ Novo saldo:', newBalance)
      return true

    } catch (error) {
      console.error('❌ Erro ao pagar serviço:', error)
      alert('Erro ao processar pagamento. Tente novamente.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar saldo do localStorage na inicialização
  useEffect(() => {
    const savedBalance = localStorage.getItem('walletBalance')
    const savedWalletData = localStorage.getItem('walletData')
    
    if (savedBalance) {
      const balance = parseFloat(savedBalance)
      console.log('💾 Saldo carregado do localStorage:', balance)
      setWalletBalance(balance)
    }
    
    if (savedWalletData) {
      try {
        const walletData = JSON.parse(savedWalletData)
        console.log('💾 Dados da carteira carregados do localStorage:', walletData)
        setWalletData(walletData)
        setHasWallet(true)
      } catch (e) {
        console.error('Erro ao parsear walletData do localStorage:', e)
      }
    }
  }, [])

  // Buscar carteira quando usuário acessar a tela de carteira
  useEffect(() => {
    if (currentScreen === 'wallet' && loggedUser) {
      console.log('🔄 Tela de carteira aberta, buscando dados...')
      
      // Verificar se tem saldo salvo no localStorage
      const savedBalance = localStorage.getItem('walletBalance')
      
      if (!savedBalance || savedBalance === '0') {
        // Se não tem saldo salvo, buscar do servidor
        console.log('📡 Buscando carteira do servidor (primeira vez)...')
        fetchWallet()
      } else {
        // Se já tem saldo salvo, apenas buscar transações
        console.log('💾 Usando saldo do localStorage, buscando apenas transações...')
        if (walletData?.id) {
          fetchWalletTransactions()
        }
      }
    }
  }, [currentScreen, loggedUser])

  // Buscar transações quando carteira for carregada
  useEffect(() => {
    if (currentScreen === 'wallet' && walletData?.id) {
      console.log('🔄 Carteira carregada, buscando transações...')
      fetchWalletTransactions()
    }
  }, [currentScreen, walletData])

  // Removido: useEffect de waiting-driver (agora criamos o serviço antes de ir para pagamento)

  // Generate PIX QR Code when payment screen loads
  useEffect(() => {
    if (currentScreen === 'payment') {
      const amount = servicePrice > 0 ? servicePrice : 119.99
      generatePagBankPayment(amount)
    }
  }, [currentScreen])

  

  // Recuperar usuário logado e verificar serviço ativo ao carregar a página
  useEffect(() => {
    // Limpar serviços antigos primeiro
    cleanupOldServices()
    
    const storedUser = localStorage.getItem('loggedUser')
    const storedToken = localStorage.getItem('authToken')
    
    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser)
        setLoggedUser(user)
        console.log('👤 Usuário recuperado do localStorage:', user)
        console.log('🆔 ID recuperado:', user.id, 'Tipo:', typeof user.id)
        console.log('🔑 Token recuperado:', storedToken)
        console.log('📸 Foto recuperada:', user.foto ? 'Sim' : 'Não')
        console.log('📸 Tamanho da foto recuperada:', user.foto?.length || 0, 'caracteres')
        
        // Se não tem foto, buscar do perfil
        if (!user.foto) {
          fetch(API_ENDPOINTS.PROFILE, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            }
          })
          .then(async res => {
            if (!res.ok) {
              // Tratar erros específicos
              if (res.status === 500) {
                console.warn('⚠️ Erro 500 ao buscar perfil - servidor indisponível')
                return null
              } else if (res.status === 401 || res.status === 403) {
                console.warn('⚠️ Token inválido ou expirado')
                return null
              }
              throw new Error(`Erro ${res.status}: ${res.statusText}`)
            }
            return res.json()
          })
          .then(perfilData => {
            if (perfilData?.foto_perfil) {
              const updatedUser = { ...user, foto: perfilData.foto_perfil }
              setLoggedUser(updatedUser)
              localStorage.setItem('loggedUser', JSON.stringify(updatedUser))
            }
          })
          .catch(err => {
            // Erro silencioso - não atrapalha o fluxo do usuário
            console.warn('⚠️ Não foi possível carregar foto do perfil:', err.message)
          })
        }
        
        // Redirecionar para Home se usuário está logado e não há serviço ativo
        if (currentScreen === 'login') {
          console.log('🔄 Redirecionando usuário logado para Home')
          setCurrentScreen('home')
          
          // Para contratantes, resetar verificação de perfil
          if (user.tipo_conta === 'CONTRATANTE') {
            setHasCheckedProfile(false)
          }
        }
      } catch (error) {
        console.error('❌ Erro ao recuperar usuário:', error)
        localStorage.removeItem('loggedUser')
        localStorage.removeItem('authToken')
      }
    }
    
    // Obter localização do usuário ao carregar a página
    if (!userLocation) {
      getUserLocation()
    }
  }, [currentScreen])

  // useEffect para buscar lugares próximos quando necessário
  useEffect(() => {
    if (currentScreen === 'establishments-list' && userLocation && selectedEstablishmentType) {
      searchNearbyPlaces(userLocation.lat, userLocation.lng, selectedEstablishmentType)
    }
  }, [currentScreen, userLocation, selectedEstablishmentType])

  // useEffect para buscar categorias quando entrar na tela de criação de serviço
  useEffect(() => {
    if (currentScreen === 'service-create' && serviceCategories.length === 0) {
      fetchServiceCategories()
    }
  }, [currentScreen])


  // Função helper para fazer requisições autenticadas
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken')
    
    // Validar se o token existe
    if (!token) {
      console.error('❌ Token não encontrado')
      throw new Error('Token não encontrado')
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    }

    console.log('🌐 Fazendo requisição para:', url)
    console.log('🔑 Com token:', token ? 'Sim' : 'Não')
    console.log('🔑 Token (primeiros 20 chars):', token.substring(0, 20) + '...')

    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Interceptar erros de autenticação
    if (response.status === 401) {
      console.error('❌ ERRO 401 - Token inválido ou expirado na URL:', url)
      console.error('🔑 Token usado:', token.substring(0, 20) + '...')
      throw new Error('Token inválido ou expirado')
    }

    if (response.status === 403) {
      console.error('❌ ERRO 403 - Acesso negado na URL:', url)
      console.error('🔑 Token usado:', token.substring(0, 20) + '...')
      
      // Tentar ler o corpo da resposta para mais detalhes
      try {
        const errorBody = await response.clone().json()
        console.error('📋 Detalhes do erro 403:', errorBody)
        
        // Verificar se é token expirado/inválido
        if (errorBody.message && 
            (errorBody.message.toLowerCase().includes('token') || 
             errorBody.message.toLowerCase().includes('expirado') ||
             errorBody.message.toLowerCase().includes('inválido'))) {
          console.error('🔐 Token expirado detectado! Redirecionando para login...')
          // Limpar dados de autenticação
          localStorage.removeItem('authToken')
          localStorage.removeItem('loggedUser')
          throw new Error('Sua sessão expirou. Por favor, faça login novamente.')
        }
        
        throw new Error(`Acesso negado: ${errorBody.message || 'Permissões insuficientes'}`)
      } catch (e) {
        if (e instanceof Error && e.message.includes('sessão expirou')) {
          throw e // Re-throw para manter a mensagem de sessão expirada
        }
        throw new Error('Acesso negado - permissões insuficientes')
      }
    }

    return response
  }

  // Função para validar email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Função para alterar senha
  const handleChangePassword = async () => {
    setChangePasswordError('')
    setChangePasswordSuccess('')

    // Validações
    if (!changePasswordData.currentPassword) {
      setChangePasswordError('Digite sua senha atual')
      return
    }

    if (!changePasswordData.newPassword) {
      setChangePasswordError('Digite a nova senha')
      return
    }

    if (!changePasswordData.confirmPassword) {
      setChangePasswordError('Confirme a nova senha')
      return
    }

    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setChangePasswordError('As senhas não coincidem')
      return
    }

    // Validar senha forte
    const passwordValidation = validatePassword(changePasswordData.newPassword)
    if (!passwordValidation.isValid) {
      const errorMessages = Object.values(passwordValidation.errors).filter(msg => msg !== '')
      setChangePasswordError(errorMessages.join(', '))
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setChangePasswordError('Sessão expirada. Faça login novamente.')
        return
      }

      const response = await fetch('http://localhost:8080/v1/facilita/usuario/alterar-senha', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          senha_atual: changePasswordData.currentPassword,
          nova_senha: changePasswordData.newPassword
        })
      })

      if (response.ok) {
        setChangePasswordSuccess('Senha alterada com sucesso!')
        setChangePasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        
        // Voltar para o perfil após 2 segundos
        setTimeout(() => {
          handleScreenTransition('profile')
        }, 2000)
      } else {
        const errorData = await response.json()
        if (response.status === 400) {
          setChangePasswordError('Senha atual incorreta')
        } else if (response.status === 401) {
          setChangePasswordError('Sessão expirada. Faça login novamente.')
        } else {
          setChangePasswordError(errorData.message || 'Erro ao alterar senha')
        }
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      setChangePasswordError('Erro de conexão. Tente novamente.')
    }
  }

  // Função para atualizar perfil
  const handleUpdateProfile = async (name: string, email: string) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Sessão expirada')
      }

      // Buscar ID do usuário logado
      const userId = loggedUser?.id
      if (!userId) {
        throw new Error('ID do usuário não encontrado')
      }

      console.log('📤 Atualizando perfil do usuário')
      console.log('👤 Usuário logado:', loggedUser)
      console.log('🆔 ID do usuário:', userId)
      console.log('📦 Dados a enviar:', { nome: name, email: email })
      console.log('🌐 Endpoint:', API_ENDPOINTS.UPDATE_PROFILE)

      // Tentar atualizar usando endpoint /usuario/perfil (PUT)
      let response = await fetch(API_ENDPOINTS.UPDATE_PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: name,
          email: email
        })
      })

      console.log('📥 Status da resposta (PUT /usuario/perfil):', response.status)

      // Se falhar, tentar com PATCH
      if (!response.ok && response.status !== 401 && response.status !== 403) {
        console.log('⚠️ PUT falhou, tentando PATCH...')
        response = await fetch(API_ENDPOINTS.UPDATE_PROFILE, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            nome: name,
            email: email
          })
        })
        console.log('📥 Status da resposta (PATCH /usuario/perfil):', response.status)
      }

      // Se ainda falhar, tentar endpoint com ID
      if (!response.ok && response.status !== 401 && response.status !== 403) {
        console.log('⚠️ PATCH falhou, tentando PUT com ID...')
        response = await fetch(API_ENDPOINTS.UPDATE_USER(userId.toString()), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            nome: name,
            email: email
          })
        })
        console.log('📥 Status da resposta (PUT /usuario/{id}):', response.status)
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Sessão expirada. Faça login novamente.')
        }
        const errorText = await response.text()
        console.error('❌ Erro na resposta (texto):', errorText)
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        
        console.error('❌ Erro na resposta (parsed):', errorData)
        throw new Error(errorData.message || `Erro ao atualizar perfil (${response.status})`)
      }

      const responseData = await response.json()
      console.log('✅ Perfil atualizado com sucesso:', responseData)

      // Atualizar dados do usuário logado no estado
      const updatedUser = {
        ...loggedUser!,
        nome: name,
        email: email
      }
      
      setLoggedUser(updatedUser)
      
      // Atualizar também no localStorage para persistir
      localStorage.setItem('userData', JSON.stringify(updatedUser))
      
      console.log('✅ Estado local atualizado:', updatedUser)
      
      // Mostrar notificação de sucesso
      const notificationMessage = '✅ Perfil atualizado com sucesso!'
      setNotificationToastMessage(notificationMessage)
      setShowNotificationToast(true)
      
      setTimeout(() => {
        setShowNotificationToast(false)
      }, 3000)
      
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error)
      throw error
    }
  }

  // Função para validar senha forte
  const validatePassword = (password: string) => {
    // Senha deve ter pelo menos 6 caracteres, 1 maiúscula, 1 número e 1 símbolo
    const minLength = password.length >= 6
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    return {
      isValid: minLength && hasUpperCase && hasNumber && hasSymbol,
      errors: {
        minLength: !minLength ? 'Mínimo 6 caracteres' : '',
        hasUpperCase: !hasUpperCase ? 'Pelo menos 1 letra maiúscula' : '',
        hasNumber: !hasNumber ? 'Pelo menos 1 número' : '',
        hasSymbol: !hasSymbol ? 'Pelo menos 1 símbolo (!@#$%^&*)' : ''
      }
    }
  }

  // Função para formatar telefone
  const formatPhone = (phone: string): string => {
    // Remove todos os caracteres não numéricos
    const numbers = phone.replace(/\D/g, '')
    
    // Formatar para o padrão brasileiro (11 dígitos)
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    } else if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    
    return numbers
  }

  // Função para validar nome (não pode conter números)
  const validateName = (name: string): boolean => {
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/
    return nameRegex.test(name) && name.trim().length > 0
  }

  // Função para validar telefone
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/
    return phoneRegex.test(phone)
  }

  // Função para formatar CPF
  const formatCPF = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11)
    
    // Aplica a formatação XXX.XXX.XXX-XX
    if (limited.length <= 3) {
      return limited
    } else if (limited.length <= 6) {
      return `${limited.slice(0, 3)}.${limited.slice(3)}`
    } else if (limited.length <= 9) {
      return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`
    } else {
      return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`
    }
  }

  // Função para validar CPF
  const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '')
    return numbers.length === 11
  }

  // Handler para mudança do CPF
  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value)
    setProfileData({...profileData, cpf: formatted})
  }

  // Handler para upload de foto
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.')
        return
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.')
        return
      }
      
      // Comprimir imagem antes de salvar
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // Redimensionar para máximo 800x800 mantendo proporção
          let width = img.width
          let height = img.height
          const maxSize = 800
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
          
          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)
          
          // Converter para blob com qualidade reduzida
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, { type: 'image/jpeg' })
              console.log('📸 Imagem original:', (file.size / 1024).toFixed(2), 'KB')
              console.log('📸 Imagem comprimida:', (compressedFile.size / 1024).toFixed(2), 'KB')
              setProfileData({...profileData, foto: compressedFile})
            }
          }, 'image/jpeg', 0.7) // 70% de qualidade
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }


  // Função para limpar erro específico
  const clearError = (field: keyof ValidationErrors) => {
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }))
  }

  const handleScreenTransition = (newScreen: Screen) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentScreen(newScreen)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 50)
    }, 300)
  }

  const handleLogin = async () => {
    const newErrors: ValidationErrors = {}

    // Validar login (email ou telefone)
    if (!loginData.login.trim()) {
      newErrors.loginEmail = 'Email ou telefone é obrigatório'
    } else if (loginData.login.includes('@') && !validateEmail(loginData.login)) {
      newErrors.loginEmail = 'Endereço de e-mail inválido'
    }

    // Validar senha
    if (!loginData.senha) {
      newErrors.loginSenha = 'Senha incorreta'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (!termsAccepted) {
      setShowTermsModal(true)
      return
    }

    setErrors({})
    setIsLoginLoading(true)

    try {
      // Preparar payload do login - backend espera 'login' e 'senha'
      const loginPayload = {
        login: loginData.login.trim(), // Campo 'login' pode ser email ou telefone
        senha: loginData.senha
      }
      
      console.log('📤 Enviando login:', { login: loginPayload.login, senha: '***' })
      
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload)
      })

      console.log('📥 Status da resposta:', response.status)

      if (response.ok) {
        const data = await response.json()
        
        console.log('✅ Resposta do login:', data)
        
        // Armazenar token no localStorage
        if (data.token) {
          localStorage.setItem('authToken', data.token)
          console.log('🔑 Token armazenado:', data.token)
        }
        
        // Armazenar dados do usuário vindos do banco
        if (data.usuario) {
          console.log('📋 Dados brutos do usuário da API:', data.usuario)
          console.log('🆔 ID do usuário recebido:', data.usuario.id, 'Tipo:', typeof data.usuario.id)
          
          let user: LoggedUser = {
            id: data.usuario.id,
            nome: data.usuario.nome,
            email: data.usuario.email,
            telefone: data.usuario.telefone,
            tipo_conta: data.usuario.tipo_conta,
            foto: data.usuario.foto_perfil || data.usuario.foto // Carregar foto do backend
          }
          
          // Buscar foto do perfil do usuário (endpoint /usuario/perfil)
          // para garantir que temos a foto mais atualizada
          if (data.token) {
            try {
              const perfilResponse = await fetch(API_ENDPOINTS.PROFILE, {
                headers: {
                  'Authorization': `Bearer ${data.token}`,
                  'Content-Type': 'application/json'
                }
              })
              
              if (perfilResponse.ok) {
                const perfilData = await perfilResponse.json()
                if (perfilData?.foto_perfil) {
                  user.foto = perfilData.foto_perfil
                }
              } else if (perfilResponse.status === 500) {
                console.warn('⚠️ Erro 500 ao buscar perfil - servidor indisponível')
              } else if (perfilResponse.status === 401 || perfilResponse.status === 403) {
                console.warn('⚠️ Token inválido ao buscar perfil')
              }
            } catch (fotoError) {
              console.warn('⚠️ Não foi possível carregar foto do perfil:', fotoError)
            }
          }
          
          // Armazenar usuário no localStorage também
          localStorage.setItem('loggedUser', JSON.stringify(user))
          
          setLoggedUser(user)
          console.log('👤 Usuário logado:', user)
          console.log('🆔 ID armazenado no state:', user.id)
          console.log('📸 Foto no usuário:', user.foto ? 'Sim' : 'Não')
          
          // Redirecionar baseado no tipo de conta
          if (user.tipo_conta === 'CONTRATANTE') {
            // Para contratantes, sempre vai para home primeiro
            // O modal de completar perfil será mostrado se necessário
            setHasCheckedProfile(false) // Reset para verificar perfil
            handleScreenTransition('home')
          } else {
            handleScreenTransition('home')
          }
        } else {
          alert('Erro: Dados do usuário não retornados pela API')
        }
      } else {
        // Tentar ler a resposta de erro
        let errorMessage = 'Email ou senha incorretos'
        try {
          const errorData = await response.json()
          console.error('❌ Erro do backend:', errorData)
          errorMessage = errorData.message || errorData.error || errorMessage
          
          // Se o erro for sobre campos faltando, mostrar detalhes
          if (errorData.details) {
            console.error('Detalhes do erro:', errorData.details)
          }
        } catch (e) {
          console.error('❌ Não foi possível ler o erro do backend')
        }
        
        alert(`Erro no login: ${errorMessage}`)
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error)
      alert('Erro de conexão. Verifique se o servidor está rodando.')
    } finally {
      setIsLoginLoading(false)
    }
  }

  const handleTermsAccept = () => {
    setTermsAccepted(true)
    setShowTermsModal(false)
  }

  const handleCadastro = () => {
    const newErrors: ValidationErrors = {}

    // Validar nome
    if (!validateName(userData.nome)) {
      newErrors.nome = 'Nome inexistente'
    }

    // Validar email
    if (!validateEmail(userData.email)) {
      newErrors.email = 'Email inválido'
    }

    // Validar confirmação de email
    if (userData.email !== userData.confirmarEmail) {
      newErrors.confirmarEmail = 'Os e-mails não coincidem'
    }

    // Validar senha
    const passwordValidation = validatePassword(userData.senha)
    if (!passwordValidation.isValid) {
      const errorMessages = Object.values(passwordValidation.errors).filter(msg => msg !== '')
      newErrors.senha = errorMessages.join(', ')
    }

    // Validar confirmação de senha
    if (userData.senha !== userData.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem'
    }

    // Validar telefone
    if (!validatePhone(userData.telefone)) {
      newErrors.telefone = 'Telefone inválido'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Validações básicas
    if (userData.email !== userData.confirmarEmail) {
      alert('Os e-mails não coincidem')
      return
    }
    if (userData.senha !== userData.confirmarSenha) {
      alert('As senhas não coincidem')
      return
    }
    if (!userData.nome || !userData.email || !userData.senha || !userData.telefone) {
      alert('Todos os campos são obrigatórios')
      return
    }

    // Foto de perfil será enviada na tela de completar perfil

    setErrors({})
    handleScreenTransition('account-type')
  }

  const handleAccountTypeSubmit = async () => {
    if (!selectedAccountType) {
      alert('Selecione um tipo de conta')
      return
    }

    // Validações adicionais antes de enviar
    if (!userData.nome || userData.nome.trim().length < 2) {
      alert('Nome deve ter pelo menos 2 caracteres')
      return
    }

    if (!userData.email || !validateEmail(userData.email)) {
      alert('Email inválido')
      return
    }

    if (!userData.senha || userData.senha.length < 6) {
      alert('Senha deve ter pelo menos 6 caracteres')
      return
    }

    const telefoneNumeros = userData.telefone.replace(/\D/g, '')
    if (!telefoneNumeros || telefoneNumeros.length < 10) {
      alert('Telefone inválido')
      return
    }

    setIsLoading(true)

    const registerData = {
      nome: userData.nome.trim(),
      email: userData.email.trim().toLowerCase(),
      telefone: telefoneNumeros,
      senha_hash: userData.senha,
      tipo_conta: selectedAccountType
    }

    console.log('📤 Enviando cadastro:', { ...registerData, senha_hash: '***', tipo_conta: selectedAccountType })

    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData)
      })

      console.log('📥 Status do cadastro:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Cadastro bem-sucedido:', data)
        
        // Se a API retornar token diretamente no cadastro, usar
        if (data.token) {
          localStorage.setItem('authToken', data.token)
          console.log('🔑 Token do cadastro armazenado:', data.token)
          console.log('📝 Dados do usuário retornados no cadastro:', data.usuario)
          
          // Armazenar dados do usuário
          const user: LoggedUser = {
            id: data.usuario?.id,
            nome: userData.nome,
            email: userData.email,
            telefone: userData.telefone,
            tipo_conta: selectedAccountType,
            foto: data.usuario?.foto_perfil || data.usuario?.foto // Carregar foto do backend
          }
          
          localStorage.setItem('loggedUser', JSON.stringify(user))
          setLoggedUser(user)
          console.log('👤 Usuário cadastrado e logado:', user)
          console.log('🆔 ID do usuário cadastrado:', user.id)
          
          // Redirecionar conforme tipo de conta
          if (selectedAccountType === 'CONTRATANTE') {
            handleScreenTransition('profile-setup')
          } else {
            handleScreenTransition('home')
          }
        } else {
          // Se não retornar token, fazer login automático
          console.log('🔄 Token não retornado no cadastro, fazendo login automático...')
          
          try {
            const loginResponse = await fetch(API_ENDPOINTS.LOGIN, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                login: userData.email,
                senha: userData.senha
              })
            })
            
            if (loginResponse.ok) {
              const loginData = await loginResponse.json()
              console.log('✅ Login automático bem-sucedido:', loginData)
              
              // Armazenar token
              if (loginData.token) {
                localStorage.setItem('authToken', loginData.token)
                console.log('🔑 Token do login armazenado:', loginData.token)
              }
              
              // Armazenar dados do usuário
              console.log('📝 Dados do usuário no login automático:', loginData.usuario)
              const user: LoggedUser = {
                id: loginData.usuario?.id,
                nome: userData.nome,
                email: userData.email,
                telefone: userData.telefone,
                tipo_conta: selectedAccountType,
                foto: loginData.usuario?.foto_perfil || loginData.usuario?.foto // Carregar foto do backend
              }
              
              localStorage.setItem('loggedUser', JSON.stringify(user))
              setLoggedUser(user)
              console.log('👤 Usuário logado:', user)
              console.log('🆔 ID do usuário no login automático:', user.id)
              
              // Redirecionar conforme tipo de conta
              if (selectedAccountType === 'CONTRATANTE') {
                handleScreenTransition('profile-setup')
              } else {
                handleScreenTransition('home')
              }
            } else {
              console.error('❌ Erro no login automático')
              alert('Cadastro realizado! Faça login para continuar.')
              handleScreenTransition('login')
            }
          } catch (loginError) {
            console.error('❌ Erro no login automático:', loginError)
            alert('Cadastro realizado! Faça login para continuar.')
            handleScreenTransition('login')
          }
        }
      } else {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { message: 'Erro no servidor - resposta inválida' }
        }
        
        console.error('❌ Erro no cadastro:')
        console.error('Status:', response.status)
        console.error('Dados enviados:', { ...registerData, senha_hash: '***' })
        console.error('Resposta do servidor:', errorData)
        
        let errorMessage = 'Erro desconhecido'
        if (response.status === 500) {
          errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.'
        } else if (response.status === 400) {
          errorMessage = errorData.message || 'Dados inválidos. Verifique as informações.'
        } else if (response.status === 409) {
          errorMessage = 'Email ou telefone já cadastrado. Tente fazer login.'
        } else {
          errorMessage = errorData.message || errorMessage
        }
        
        alert(`Erro no cadastro: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Erro na requisição:', error)
      if (error instanceof Error && error.message === 'Failed to fetch') {
        alert('Erro de conexão: Não foi possível conectar ao servidor. Verifique se o backend está rodando')
      } else {
        alert('Erro de conexão. Verifique se o servidor está rodando.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleServiceProviderSubmit = async () => {
    setIsLoading(true)

    const registerData: RegisterData = {
      nome: userData.nome,
      senha_hash: userData.senha,
      email: userData.email,
      telefone: userData.telefone.replace(/\D/g, ''),
      tipo_conta: 'PRESTADOR'
    }

    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData)
      })

      if (response.ok) {
        handleScreenTransition('success')
        setTimeout(() => {
          handleScreenTransition('login')
        }, 2000)
      } else {
        const errorData = await response.json()
        alert(`Erro no cadastro: ${errorData.message || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro na requisição:', error)
      if (error instanceof Error && error.message === 'Failed to fetch') {
        alert('Erro de conexão: Não foi possível conectar ao servidor. Verifique se o backend está rodando')
      } else {
        alert('Erro de conexão. Verifique se o servidor está rodando.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Função para normalizar número de telefone
  const normalizePhoneNumber = (phone: string): string => {
    // Remove todos os caracteres não numéricos
    const numbersOnly = phone.replace(/\D/g, '')
    
    // Se começa com 55 (código do Brasil), remove
    if (numbersOnly.startsWith('55') && numbersOnly.length === 13) {
      return numbersOnly.substring(2)
    }
    
    // Se começa com 0, remove (formato antigo)
    if (numbersOnly.startsWith('0') && numbersOnly.length === 12) {
      return numbersOnly.substring(1)
    }
    
    return numbersOnly
  }

  // Função para validar se é um telefone válido
  const isValidPhone = (phone: string): boolean => {
    const normalized = normalizePhoneNumber(phone)
    // Telefone brasileiro: 11 dígitos (DDD + número)
    // DDD: 11-99, Número: 8 ou 9 dígitos
    return /^[1-9]{2}[0-9]{8,9}$/.test(normalized)
  }

  const handleRecoverySubmit = async () => {
    const newErrors: ValidationErrors = {}

    if (!recoveryContact.trim()) {
      newErrors.recoveryContact = 'Digite um e-mail ou telefone'
      setErrors(newErrors)
      return
    }

    // Validar se é email ou telefone
    const isEmail = recoveryContact.includes('@')
    const isPhone = !isEmail && isValidPhone(recoveryContact)

    if (!isEmail && !isPhone) {
      newErrors.recoveryContact = 'Digite um e-mail válido ou telefone (11 dígitos)'
      setErrors(newErrors)
      return
    }

    if (isEmail && !validateEmail(recoveryContact)) {
      newErrors.recoveryContact = 'Endereço de e-mail inválido'
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const payload = isEmail 
        ? { email: recoveryContact.trim() }
        : { telefone: normalizePhoneNumber(recoveryContact) }

      console.log('Enviando requisição de recuperação:', payload)
      console.log('Telefone normalizado:', isEmail ? 'N/A' : normalizePhoneNumber(recoveryContact))
      
      const response = await fetch(API_ENDPOINTS.RECOVER_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      console.log('Status da resposta:', response.status)

      if (response.ok) {
        // Código enviado com sucesso
        alert('Código enviado com sucesso! Verifique seu email/SMS.')
        handleScreenTransition('verification')
        // Iniciar countdown
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              return 27
            }
            return prev - 1
          })
        }, 1000)
      } else if (response.status === 401) {
        console.error('❌ Erro 401: A rota de recuperação de senha não deveria exigir autenticação')
        alert('Erro no servidor: A rota de recuperação de senha está protegida incorretamente. Entre em contato com o suporte.')
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
        console.error('❌ Erro na recuperação:')
        console.error('Status:', response.status)
        console.error('Dados do erro:', JSON.stringify(errorData, null, 2))
        
        let errorMessage = errorData.message || errorData.error || 'Não foi possível enviar o código'
        
        if (response.status === 500) {
          errorMessage = `Erro no servidor: ${errorData.error || errorData.message}. Verifique se o email está cadastrado ou entre em contato com o suporte.`
        } else if (response.status === 404) {
          errorMessage = 'Email não encontrado. Verifique se está cadastrado.'
        }
        
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Erro no login:', error)
      alert('Erro de conexão. Verifique se o servidor está rodando.')
    } finally {
      setIsLoginLoading(false)
      setErrors({})
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...verificationCode]
      newCode[index] = value
      setVerificationCode(newCode)
      
      // Auto focus next input
      if (value && index < 4) {
        const nextInput = document.getElementById(`code-${index + 1}`)
        nextInput?.focus()
      }
    }
  }

  const handleVerification = async () => {
    const code = verificationCode.join('')
    
    if (code.length !== 5 || !/^\d{5}$/.test(code)) {
      setErrors({ verificationCode: 'Código inválido' })
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      // Aqui você pode adicionar a lógica para verificar o código com o backend
      // Por enquanto, vamos apenas redirecionar para redefinir senha
      
      // Simular verificação bem-sucedida
      // Em produção, você deve validar o código com o backend primeiro
      
      // Redirecionar para tela de redefinir senha (você pode criar uma nova tela)
      // Por enquanto, vamos voltar ao login
      handleScreenTransition('login')
      alert('Código verificado! Você pode redefinir sua senha.')
      
    } catch (error) {
      console.error('Erro na verificação:', error)
      alert('Erro ao verificar código.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (newPassword: string) => {
    const code = verificationCode.join('')
    
    try {
      const isEmail = recoveryContact.includes('@')
      const payload = {
        codigo: code,
        nova_senha: newPassword,
        ...(isEmail 
          ? { email: recoveryContact.trim() }
          : { telefone: normalizePhoneNumber(recoveryContact) }
        )
      }

      const response = await fetch(API_ENDPOINTS.RESET_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        alert('Senha redefinida com sucesso!')
        handleScreenTransition('login')
      } else {
        const errorData = await response.json()
        alert(`Erro: ${errorData.message || 'Não foi possível redefinir a senha'}`)
      }
    } catch (error) {
      console.error('Erro na requisição:', error)
      alert('Erro de conexão. Verifique se o servidor está rodando.')
    }
  }

  const handleProfileSetup = async () => {
    if (!profileData.cpf || !profileData.necessidade) {
      alert('Preencha todos os campos obrigatórios')
      return
    }
    
    if (!validateCPF(profileData.cpf)) {
      alert('CPF inválido. Digite os 11 dígitos.')
      return
    }

    if (!loggedUser?.id) {
      alert('Erro: ID do usuário não encontrado. Faça login novamente.')
      return
    }

    try {
      // Converter foto para base64 se existir
      let fotoBase64 = ''
      if (profileData.foto) {
        fotoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(profileData.foto!)
        })
        console.log('📸 Foto convertida para base64')
      }

      // Criar ou obter localização
      let idLocalizacao = 1 // Fallback padrão (Av. Paulista)
      
      // Se o usuário selecionou um endereço, criar nova localização
      if (profileData.endereco && addressSuggestions.length > 0) {
        const selectedAddress = addressSuggestions.find(s => s.display_name === profileData.endereco)
        
        if (selectedAddress) {
          console.log('📍 Criando nova localização:', selectedAddress.display_name)
          
          try {
            // Extrair dados do endereço
            const address = selectedAddress.address || {}
            const localizacaoPayload = {
              logradouro: address.road || address.street || 'Não informado',
              numero: address.house_number || 'S/N',
              bairro: address.suburb || address.neighbourhood || address.district || 'Não informado',
              cidade: address.city || address.town || address.village || 'São Paulo',
              cep: address.postcode || '00000-000',
              latitude: selectedAddress.lat,
              longitude: selectedAddress.lon
            }
            
            console.log('📦 Payload da localização:', localizacaoPayload)
            
            // Criar localização na API
            const localizacaoResponse = await fetchWithAuth(`${API_ENDPOINTS.PROFILE.replace('/usuario/perfil', '')}/localizacao`, {
              method: 'POST',
              body: JSON.stringify(localizacaoPayload)
            })
            
            if (localizacaoResponse.ok) {
              const localizacaoData = await localizacaoResponse.json()
              idLocalizacao = localizacaoData.id || localizacaoData.data?.id || 1
              console.log('✅ Localização criada com ID:', idLocalizacao)
            } else {
              console.warn('⚠️ Erro ao criar localização, usando padrão')
            }
          } catch (error) {
            console.warn('⚠️ Erro ao criar localização:', error)
          }
        }
      }
      
      // Monta payload - o backend pode pegar id_usuario do token JWT
      // Mas vamos enviar explicitamente também para garantir
      // NOTA: foto_perfil NÃO vai aqui, será atualizada separadamente na tabela usuario
      const payload = {
        id_usuario: loggedUser.id, // ID do usuário logado
        id_localizacao: idLocalizacao, // ID da localização criada ou padrão
        necessidade: profileData.necessidade.toUpperCase(),
        cpf: profileData.cpf.replace(/\D/g, '')
      }
      
      // Payload alternativo sem id_usuario (caso o backend pegue do token)
      const payloadSemId = {
        id_localizacao: idLocalizacao,
        necessidade: profileData.necessidade.toUpperCase(),
        cpf: profileData.cpf.replace(/\D/g, '')
      }

      console.log('📤 Enviando dados do contratante:', payload)
      console.log('🔑 Token disponível:', localStorage.getItem('authToken') ? 'Sim' : 'Não')
      console.log('🔑 Token completo:', localStorage.getItem('authToken'))
      console.log('👤 Usuário logado:', loggedUser)
      console.log('👤 ID do usuário:', loggedUser?.id)

      console.log('🌐 Fazendo requisição para:', 'https://servidor-facilita.onrender.com/v1/facilita/contratante/register')
      console.log('📦 Payload COM id_usuario:', JSON.stringify(payload, null, 2))
      console.log('📦 Payload SEM id_usuario (alternativo):', JSON.stringify(payloadSemId, null, 2))
      
      // Tentar primeiro com id_usuario
      let response = await fetchWithAuth(API_ENDPOINTS.CONTRATANTE_REGISTER, {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      console.log('📥 Status da resposta (tentativa 1 - COM id_usuario):', response.status)
      console.log('📥 Response OK?:', response.ok)

      // Se falhar com erro 400, tentar sem id_usuario (backend pode pegar do token)
      if (!response.ok && response.status === 400) {
        console.log('⚠️ Erro 400 com id_usuario, tentando SEM id_usuario...')
        const errorData = await response.json().catch(() => ({}))
        console.log('📋 Erro da primeira tentativa:', errorData)
        
        // Tentar novamente sem id_usuario
        response = await fetchWithAuth(API_ENDPOINTS.CONTRATANTE_REGISTER, {
          method: 'POST',
          body: JSON.stringify(payloadSemId)
        })
        
        console.log('📥 Status da resposta (tentativa 2 - SEM id_usuario):', response.status)
        console.log('📥 Response OK?:', response.ok)
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Erro ao registrar contratante (ambas tentativas):')
        console.error('Status:', response.status)
        console.error('Dados do erro:', JSON.stringify(errorData, null, 2))
        console.error('Payload COM id enviado:', JSON.stringify(payload, null, 2))
        console.error('Payload SEM id enviado:', JSON.stringify(payloadSemId, null, 2))
        
        let errorMessage = errorData.message || errorData.error || 'Erro desconhecido'
        
        if (response.status === 500) {
          errorMessage = `Erro no servidor (500): ${errorMessage}. Verifique se todos os campos estão corretos e se o backend está funcionando.`
        } else if (response.status === 400) {
          errorMessage = `Erro 400 (Bad Request): ${errorMessage}. Campos esperados pelo backend podem estar incorretos.`
        } else if (response.status === 401) {
          errorMessage = `Erro 401 (Não autorizado): Token inválido ou expirado. Faça login novamente.`
        } else if (response.status === 409) {
          errorMessage = `Erro 409 (Conflito): ${errorMessage}. Contratante já pode estar cadastrado.`
        }
        
        alert(`Falha ao completar perfil de contratante: ${errorMessage}`)
        return
      }

      const successData = await response.json()
      console.log('✅ Perfil de contratante salvo com sucesso!')
      console.log('✅ Resposta completa do backend:', JSON.stringify(successData, null, 2))
      
      // IMPORTANTE: Atualizar o token se o backend retornar um novo
      if (successData.token) {
        localStorage.setItem('authToken', successData.token)
        console.log('🔑 NOVO TOKEN recebido e salvo após completar perfil!')
        console.log('🔑 Novo token:', successData.token.substring(0, 50) + '...')
      }
      
      // Se tem foto, atualizar o perfil do usuário com a foto
      if (fotoBase64) {
        console.log('📸 Atualizando foto do usuário...')
        console.log('📸 Tamanho da foto base64:', fotoBase64.length, 'caracteres')
        console.log('📸 Primeiros 100 caracteres:', fotoBase64.substring(0, 100))
        
        try {
          // Tentar com todos os dados do usuário (alguns backends exigem isso)
          const photoPayload = {
            nome: loggedUser.nome,
            email: loggedUser.email,
            telefone: loggedUser.telefone,
            foto_perfil: fotoBase64
          }
          
          console.log('📤 Enviando atualização de foto para:', API_ENDPOINTS.UPDATE_PROFILE)
          console.log('📦 Payload (sem foto):', {
            nome: photoPayload.nome,
            email: photoPayload.email,
            telefone: photoPayload.telefone,
            foto_perfil: '(base64 omitido)'
          })
          
          const updatePhotoResponse = await fetchWithAuth(API_ENDPOINTS.UPDATE_PROFILE, {
            method: 'PUT',
            body: JSON.stringify(photoPayload)
          })
          
          console.log('📥 Status da atualização de foto:', updatePhotoResponse.status)
          
          if (updatePhotoResponse.ok) {
            const photoData = await updatePhotoResponse.json()
            console.log('✅ Foto atualizada com sucesso!')
            console.log('✅ Resposta da atualização:', photoData)
            
            // IMPORTANTE: Salvar foto no loggedUser imediatamente
            if (loggedUser) {
              const updatedUser = {
                ...loggedUser,
                foto: fotoBase64
              }
              setLoggedUser(updatedUser)
              localStorage.setItem('loggedUser', JSON.stringify(updatedUser))
              console.log('✅ Foto salva no loggedUser!')
            }
          } else {
            const errorData = await updatePhotoResponse.json().catch(() => ({}))
            console.error('❌ Erro ao atualizar foto:', errorData)
            console.warn('⚠️ Status:', updatePhotoResponse.status)
            
            // Se falhar, tentar apenas com foto_perfil
            console.log('🔄 Tentando novamente apenas com foto_perfil...')
            const simplePayload = { foto_perfil: fotoBase64 }
            const retryResponse = await fetchWithAuth(API_ENDPOINTS.UPDATE_PROFILE, {
              method: 'PUT',
              body: JSON.stringify(simplePayload)
            })
            
            if (retryResponse.ok) {
              console.log('✅ Foto atualizada na segunda tentativa!')
            } else {
              console.error('❌ Falhou também na segunda tentativa')
            }
          }
        } catch (photoError) {
          console.error('❌ Exceção ao atualizar foto:', photoError)
        }
      } else {
        console.log('⚠️ Nenhuma foto para atualizar (fotoBase64 está vazio)')
      }
      
      // Extrair o ID do contratante da resposta (pode vir em vários lugares)
      const idContratante = successData.id || 
                           successData.contratante?.id || 
                           successData.usuario?.contratante?.id
      console.log('✅ ID do contratante criado:', idContratante)
      
      // Extrair dados completos do usuário se disponíveis
      const usuarioCompleto = successData.usuario || successData.contratante?.usuario
      
      // Atualizar o usuário logado com TODOS os dados
      if (loggedUser) {
        const updatedUser: LoggedUser = {
          id: usuarioCompleto?.id || loggedUser.id,
          id_contratante: idContratante,
          nome: usuarioCompleto?.nome || loggedUser.nome,
          email: usuarioCompleto?.email || loggedUser.email,
          telefone: usuarioCompleto?.telefone || loggedUser.telefone,
          tipo_conta: usuarioCompleto?.tipo_conta || loggedUser.tipo_conta,
          foto: fotoBase64 || usuarioCompleto?.foto_perfil || loggedUser.foto // Salvar foto
        }
        
        setLoggedUser(updatedUser)
        localStorage.setItem('loggedUser', JSON.stringify(updatedUser))
        console.log('✅ Usuário atualizado com dados completos:', updatedUser)
        console.log('✅ ID do usuário:', updatedUser.id)
        console.log('✅ ID do contratante:', updatedUser.id_contratante)
        console.log('📸 Foto salva:', updatedUser.foto ? 'Sim (base64)' : 'Não')
        console.log('📸 Tamanho da foto:', updatedUser.foto?.length || 0, 'caracteres')
      } else {
        console.warn('⚠️ loggedUser não disponível para atualização')
      }
      
      // Resetar flag de verificação para forçar nova checagem
      setHasCheckedProfile(false)
      setShowCompleteProfileModal(false)
      
      alert('✅ Perfil de contratante salvo com sucesso!\n🔑 Token de autenticação atualizado.')
      handleScreenTransition('home')
    } catch (e) {
      console.error('Erro ao registrar contratante:', e)
      alert('Erro de conexão ao salvar perfil de contratante.')
    }
  }

  const handleServiceRequest = () => {
    handleScreenTransition('location-select')
  }

  // Função para fazer logout
  const handleLogout = () => {
    console.log('🚪 Fazendo logout do usuário')
    localStorage.removeItem('authToken')
    localStorage.removeItem('loggedUser')
    setLoggedUser(null)
    setHasCheckedProfile(false)
    setShowCompleteProfileModal(false)
    handleScreenTransition('login')
  }

  // Verificar se contratante tem perfil completo
  const checkContratanteProfile = async () => {
    if (!loggedUser || loggedUser.tipo_conta !== 'CONTRATANTE' || hasCheckedProfile) {
      console.log('🔍 Pulando verificação:', { 
        loggedUser: !!loggedUser, 
        tipo: loggedUser?.tipo_conta, 
        hasChecked: hasCheckedProfile 
      })
      return
    }

    console.log('🔍 Verificando perfil do contratante...')

    // Usar id_contratante se disponível, senão usar id do usuário
    const idParaBuscar = loggedUser.id_contratante || loggedUser.id
    
    if (!idParaBuscar) {
      console.error('❌ ID do usuário/contratante não disponível')
      setShowCompleteProfileModal(true)
      setHasCheckedProfile(true)
      return
    }

    try {
      // Usar o ID do contratante (ou usuário como fallback) para buscar dados
      console.log('🔍 Fazendo requisição para /contratante com ID:', idParaBuscar)
      console.log('🔍 Usando:', loggedUser.id_contratante ? 'id_contratante' : 'id_usuario')
      
      // Se temos id_contratante, usar direto. Senão, usar query param com id_usuario
      const url = loggedUser.id_contratante 
        ? `https://servidor-facilita.onrender.com/v1/facilita/contratante/${idParaBuscar}`
        : `https://servidor-facilita.onrender.com/v1/facilita/contratante?id_usuario=${idParaBuscar}`
      
      console.log('🔍 URL completa:', url)
      const response = await fetchWithAuth(url)
      
      console.log('📥 Resposta da API /contratante/{id}:', {
        status: response.status,
        ok: response.ok,
        url: response.url
      })
      
      if (response.status === 404) {
        // Contratante não tem perfil completo
        console.log('❌ Contratante sem perfil completo, mostrando modal')
        setShowCompleteProfileModal(true)
      } else if (response.ok) {
        // Contratante já tem perfil completo
        const data = await response.json()
        console.log('✅ Resposta da verificação de perfil:', JSON.stringify(data, null, 2))
        
        // A API pode retornar um array ou um objeto
        const contratanteData = Array.isArray(data) ? data[0] : data
        
        // Quando busca por query param id_usuario, retorna dados do CONTRATANTE
        // { id: 10, id_usuario: 32, ... }
        const idContratante = contratanteData?.id
        
        console.log('🔍 Extraindo ID do contratante da verificação:')
        console.log('  - contratanteData.id (id_contratante):', contratanteData?.id)
        console.log('  - contratanteData.id_usuario:', contratanteData?.id_usuario)
        console.log('  - ID extraído:', idContratante)
        
        // Se não temos id_contratante salvo ainda, salvar agora
        if (idContratante && !loggedUser.id_contratante) {
          const updatedUser = {
            ...loggedUser,
            id_contratante: idContratante
          }
          setLoggedUser(updatedUser)
          localStorage.setItem('loggedUser', JSON.stringify(updatedUser))
          console.log('✅ ID do contratante salvo no usuário (da verificação):', idContratante)
        }
        
        // IMPORTANTE: Buscar foto do usuário diretamente do endpoint /usuario/perfil
        // porque o endpoint /contratante pode não retornar a foto atualizada
        if (!loggedUser.foto || contratanteData?.usuario?.foto_perfil === null) {
          try {
            const perfilResponse = await fetchWithAuth(API_ENDPOINTS.PROFILE)
            if (perfilResponse.ok) {
              const perfilData = await perfilResponse.json()
              if (perfilData?.foto_perfil) {
                const updatedUser = {
                  ...loggedUser,
                  id_contratante: idContratante || loggedUser.id_contratante,
                  foto: perfilData.foto_perfil
                }
                setLoggedUser(updatedUser)
                localStorage.setItem('loggedUser', JSON.stringify(updatedUser))
              }
            } else if (perfilResponse.status === 500) {
              console.warn('⚠️ Erro 500 ao buscar perfil - servidor indisponível')
            } else if (perfilResponse.status === 401 || perfilResponse.status === 403) {
              console.warn('⚠️ Token inválido ao buscar perfil')
            }
          } catch (fotoError) {
            console.warn('⚠️ Não foi possível carregar foto do perfil:', fotoError)
          }
        }
      } else {
        // Outro erro - assumir que não tem perfil
        console.log('⚠️ Status inesperado, assumindo sem perfil. Status:', response.status)
        setShowCompleteProfileModal(true)
      }
      
      setHasCheckedProfile(true)
    } catch (error) {
      console.error('❌ Erro ao verificar perfil do contratante:', error)
      // Em caso de erro, assumir que não tem perfil
      console.log('⚠️ Erro na requisição, mostrando modal por segurança')
      setShowCompleteProfileModal(true)
      setHasCheckedProfile(true)
    }
  }

  // Verificar perfil quando entrar na home
  useEffect(() => {
    console.log('🔍 useEffect verificar perfil:', {
      currentScreen,
      loggedUser: loggedUser?.nome,
      tipo_conta: loggedUser?.tipo_conta,
      shouldCheck: currentScreen === 'home' && loggedUser && loggedUser.tipo_conta === 'CONTRATANTE'
    })
    
    if (currentScreen === 'home' && loggedUser && loggedUser.tipo_conta === 'CONTRATANTE') {
      console.log('🚀 Executando checkContratanteProfile...')
      checkContratanteProfile()
    }
  }, [currentScreen, loggedUser])

  // useEffect para buscar pedidos quando a tela de pedidos for aberta
  React.useEffect(() => {
    if (currentScreen === 'orders') {
      console.log('🔄 Entrando na tela de pedidos')
      console.log('👤 loggedUser:', loggedUser ? 'Existe' : 'Não existe')
      console.log('🔑 Token:', localStorage.getItem('authToken') ? 'Existe' : 'Não existe')
      
      if (!loggedUser) {
        console.log('❌ Usuário não logado na tela de pedidos')
        setUserOrders([])
        return
      }

      // Verificar se há token antes de tentar buscar pedidos
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.log('❌ Token não encontrado - não carregando pedidos')
        setUserOrders([])
        return
      }

      if (!ordersInitialized) {
        console.log('📋 Inicializando tela de pedidos...')
        setOrdersInitialized(true)
        
        // Carregar pedidos reais do contratante
        console.log('🔄 Carregando pedidos do contratante...')
        fetchUserOrders()
      }
    } else {
      // Reset quando sair da tela de pedidos
      setOrdersInitialized(false)
    }
  }, [currentScreen, loggedUser, ordersInitialized])

  // useEffect para preencher automaticamente o endereço de entrega com o endereço do perfil
  React.useEffect(() => {
    if (currentScreen === 'service-create' && profileData.endereco) {
      console.log('📍 Preenchendo endereço de entrega automaticamente com endereço do perfil')
      console.log('🏠 Endereço do perfil:', profileData.endereco)
      
      // Usar o endereço do perfil como endereço de entrega padrão
      setSelectedLocation(profileData.endereco)
      
      // Definir também o deliveryLocation com coordenadas padrão de São Paulo
      // Essas coordenadas serão atualizadas quando o usuário confirmar ou alterar o endereço
      if (!deliveryLocation || deliveryLocation.address !== profileData.endereco) {
        setDeliveryLocation({
          address: profileData.endereco,
          lat: -23.5505, // Coordenadas padrão de São Paulo
          lng: -46.6333
        })
      }
    }
  }, [currentScreen, profileData.endereco])

  // Funções para manipular notificações
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const handleClearAllNotifications = () => {
    setNotifications([])
  }

  const handleToggleNotifications = () => {
    setIsNotificationOpen(prev => !prev)
  }

  // Função para tocar som de notificação
  const playNotificationSound = () => {
    if (notificationsEnabled) {
      try {
        const audio = new Audio('/notification.mp3')
        audio.volume = 0.5
        audio.play().catch(err => console.log('Erro ao tocar som:', err))
      } catch (error) {
        console.log('Som de notificação não disponível')
      }
    }
  }

  // Função para mostrar toast de notificação
  const showNewNotificationToast = (message: string) => {
    if (notificationsEnabled) {
      setNotificationToastMessage(message)
      setShowNotificationToast(true)
      playNotificationSound()
      
      setTimeout(() => {
        setShowNotificationToast(false)
      }, 4000)
    }
  }

  // Tela de loading durante o login
  if (isLoginLoading) {
    return (
      <>
        <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <LoadingSpinner size="lg" color="white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Entrando...</h2>
            <p className="text-gray-400">Verificando suas credenciais</p>
          </div>
          
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
      
      <NotificationSidebar
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onClearAll={handleClearAllNotifications}
      />
      </>
    )
  }

  // Tela de loading durante criação de serviço
  if (isLoading && currentScreen === 'service-create') {
    return (
      <>
        <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <LoadingSpinner size="lg" color="white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Criando serviço...</h2>
            <p className="text-gray-400">Aguarde enquanto processamos sua solicitação</p>
          </div>
          
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
      
      <NotificationSidebar
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onClearAll={handleClearAllNotifications}
      />
      </>
    )
  }

const handleLocationSelect = (address: string, lat: number, lng: number) => {
  if (isSelectingOrigin) {
    // Selecionando origem (de onde buscar)
    setSelectedOriginLocation(address)
    setPickupLocation({ address, lat, lng })
    console.log('Local de origem definido:', { address, lat, lng })
    setIsSelectingOrigin(false)
  } else {
    // Selecionando destino (onde entregar)
    setSelectedLocation(address)
    setDeliveryLocation({ address, lat, lng })
    console.log('Local de entrega definido:', { address, lat, lng })
  }
  handleScreenTransition('service-create')
}


const handleServiceCreate = async () => {
  console.log('🚀 Iniciando criação de serviço...')
  
  // Validações básicas
  if (!serviceDescription && !selectedServiceType) {
    console.error('❌ Erro: Nenhum serviço selecionado')
    alert('Selecione um serviço ou descreva o que precisa')
    return
  }
  
  // Verificar se origem e destino foram selecionados
  if (!pickupLocation) {
    console.error('❌ Erro: Local de origem não selecionado')
    alert('Selecione o local de origem (de onde buscar)')
    return
  }
  
  if (!deliveryLocation) {
    console.error('❌ Erro: Local de destino não selecionado')
    alert('Selecione o local de entrega (para onde levar)')
    return
  }

  // Verificar se usuário está logado
  if (!loggedUser) {
    console.error('❌ Erro: Usuário não está logado')
    alert('Você precisa estar logado para criar um serviço')
    return
  }

  console.log('✅ Validações básicas passaram')
  console.log('📋 Dados do serviço:', {
    serviceDescription,
    selectedServiceType,
    pickupLocation,
    deliveryLocation,
    loggedUser: loggedUser?.email
  })
  
  // Calcular distância e preço entre origem e destino escolhidos
  const distance = calculateDistance(
    pickupLocation.lat,
    pickupLocation.lng,
    deliveryLocation.lat,
    deliveryLocation.lng
  )
  const price = calculatePrice(distance)
  setServicePrice(price)
  
  console.log('=== CÁLCULO DE PREÇO ===')
  console.log(`Origem: ${pickupLocation.address}`)
  console.log(`Destino: ${deliveryLocation.address}`)
  console.log(`Distância: ${distance.toFixed(2)} km`)
  console.log(`Preço: R$ ${price.toFixed(2)}`)
  console.log('========================')
  
  // Definir destino para o tracking
  setSelectedDestination(deliveryLocation)
  // Definir origem do prestador (usa a origem selecionada como base para a primeira perna)
  if (pickupLocation) {
    setDriverOrigin({ lat: pickupLocation.lat, lng: pickupLocation.lng })
  }
  
  // NOVO FLUXO: Criar serviço no banco primeiro
  setIsLoading(true)
  console.log('🔨 Criando serviço no banco antes do pagamento...')
  
  try {
    const serviceCreated = await createService()
    setIsLoading(false)
    
    if (serviceCreated) {
      console.log('✅ Serviço criado com sucesso! Redirecionando...')
      // Definir serviço como ativo
      setActiveServiceId(createdServiceId)
      setServiceStartTime(new Date())
      // Ir para tela de pagamento após criar o serviço
      handleScreenTransition('payment')
    } else {
      console.error('❌ Falha ao criar serviço')
      alert('Não foi possível criar o serviço. Verifique os dados e tente novamente.')
    }
  } catch (error) {
    setIsLoading(false)
    console.error('❌ Erro inesperado ao criar serviço:', error)
    alert('Erro inesperado ao criar serviço. Tente novamente.')
  }
}

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode)
    alert('Código PIX copiado!')
  }

  // Função para obter localização atual do usuário
  const getCurrentLocationId = async () => {
    try {
      // Priorizar id_localizacao do perfil do usuário
      if (loggedUser?.id_localizacao) {
        console.log('✅ Usando id_localizacao do perfil:', loggedUser.id_localizacao)
        return loggedUser.id_localizacao
      }
      
      // Se não tiver no perfil, buscar dos dados do contratante
      console.log('⚠️ id_localizacao não disponível no perfil, buscando...')
      
      // Tentar buscar dados do contratante que incluem id_localizacao
      if (loggedUser?.id) {
        const response = await fetchWithAuth(`https://servidor-facilita.onrender.com/v1/facilita/contratante?id_usuario=${loggedUser.id}`)
        
        if (response.ok) {
          const data = await response.json()
          const contratanteData = Array.isArray(data) ? data[0] : data
          const idLocalizacao = contratanteData?.id_localizacao
          
          if (idLocalizacao) {
            console.log('✅ id_localizacao obtido da API:', idLocalizacao)
            
            // Salvar no loggedUser para próximas vezes
            const updatedUser = {
              ...loggedUser,
              id_localizacao: idLocalizacao
            }
            setLoggedUser(updatedUser)
            localStorage.setItem('loggedUser', JSON.stringify(updatedUser))
            
            return idLocalizacao
          }
        }
      }
      
      // Fallback: usar ID padrão
      console.warn('⚠️ Não foi possível obter id_localizacao, usando padrão: 1')
      return 1
    } catch (error) {
      console.warn('⚠️ Erro ao obter id_localizacao:', error)
      return 1 // ID fixo como fallback
    }
  }

  // Função para obter ID do contratante
  const getContratanteId = async () => {
    try {
      // Priorizar id_contratante se disponível
      if (loggedUser?.id_contratante) {
        console.log('✅ Usando id_contratante salvo:', loggedUser.id_contratante)
        return loggedUser.id_contratante
      }
      
      // Fallback: buscar pelo id_usuario na API
      if (loggedUser?.id) {
        console.log('⚠️ id_contratante não disponível, buscando na API usando id_usuario:', loggedUser.id)
        
        // Tentar buscar usando endpoint que aceita id_usuario como query param ou path
        // Primeiro tentar: /contratante?id_usuario=32
        console.log('🔍 Tentativa 1: Buscar por id_usuario via query param')
        console.log('🔍 URL:', `https://servidor-facilita.onrender.com/v1/facilita/contratante?id_usuario=${loggedUser.id}`)
        
        let response = await fetchWithAuth(`https://servidor-facilita.onrender.com/v1/facilita/contratante?id_usuario=${loggedUser.id}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Resposta da API recebida')
          console.log('📋 Resposta completa:', JSON.stringify(data, null, 2))
          
          // A API pode retornar um array ou um objeto
          const contratanteData = Array.isArray(data) ? data[0] : data
          console.log('📋 Dados do contratante:', contratanteData)
          
          // Quando busca por id_usuario, retorna dados do CONTRATANTE diretamente
          // { id: 10, id_usuario: 32, necessidade: "...", id_localizacao: 1, usuario: {...} }
          // O campo "id" aqui JÁ É o id_contratante!
          const idContratante = contratanteData?.id
          const idUsuario = contratanteData?.id_usuario || contratanteData?.usuario?.id
          const idLocalizacao = contratanteData?.id_localizacao
          
          console.log('🔍 Extraindo IDs da resposta:')
          console.log('  - contratanteData.id (id_contratante):', contratanteData?.id)
          console.log('  - contratanteData.id_usuario:', contratanteData?.id_usuario)
          console.log('  - contratanteData.id_localizacao:', contratanteData?.id_localizacao)
          console.log('  - contratanteData.usuario.id:', contratanteData?.usuario?.id)
          console.log('  - ID do contratante extraído:', idContratante)
          console.log('  - ID da localização extraído:', idLocalizacao)
          
          if (!idContratante) {
            console.error('❌ ERRO: ID do contratante não encontrado na resposta!')
            console.error('Resposta completa:', JSON.stringify(data, null, 2))
            throw new Error('ID do contratante não retornado pela API')
          }
          
          // Validar que estamos usando o ID correto
          if (idContratante === idUsuario) {
            console.warn('⚠️ AVISO: id_contratante é igual a id_usuario. Isso pode indicar um problema!')
            console.warn('Verifique se a API está retornando os dados corretos.')
          }
          
          // Salvar o id_contratante e id_localizacao para uso futuro
          const updatedUser = {
            ...loggedUser,
            id_contratante: idContratante,
            id_localizacao: idLocalizacao
          }
          setLoggedUser(updatedUser)
          localStorage.setItem('loggedUser', JSON.stringify(updatedUser))
          console.log('✅ ID do contratante salvo:', idContratante)
          console.log('✅ ID da localização salvo:', idLocalizacao)
          console.log('⚠️ IMPORTANTE: Retornando', idContratante, '(id da tabela contratante), NÃO', loggedUser.id, '(id_usuario)')
          
          return idContratante
        } else if (response.status === 404) {
          console.error('❌ Contratante não encontrado no banco')
          console.error('❌ Isso significa que o perfil não foi completado ainda')
          throw new Error('Perfil de contratante não encontrado. Complete seu cadastro.')
        } else {
          console.error('❌ Erro ao buscar contratante. Status:', response.status)
          throw new Error(`Erro ao buscar contratante: ${response.status}`)
        }
      }
      
      console.error('❌ ID do usuário não disponível')
      throw new Error('ID do contratante não encontrado')
    } catch (error) {
      console.error('❌ Erro ao obter ID do contratante:', error)
      throw error
    }
  }

  // Função para obter um prestador válido
  const getValidPrestadorId = async (): Promise<number> => {
    try {
      console.log('🔍 Buscando prestadores disponíveis...')
      const response = await fetchWithAuth(API_ENDPOINTS.PRESTADORES)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📋 Prestadores disponíveis:', data)
        
        // A API pode retornar um array ou um objeto com data
        const prestadores = Array.isArray(data) ? data : (data.data || [])
        
        if (prestadores.length > 0) {
          // Pegar o primeiro prestador disponível
          const prestadorId = prestadores[0].id
          console.log('✅ Prestador selecionado:', prestadorId)
          return prestadorId
        } else {
          console.warn('⚠️ Nenhum prestador encontrado, usando ID padrão 1')
          return 1
        }
      } else {
        console.warn('⚠️ Erro ao buscar prestadores, usando ID padrão 1')
        return 1
      }
    } catch (error) {
      console.error('❌ Erro ao buscar prestadores:', error)
      console.warn('⚠️ Usando ID padrão 1')
      return 1
    }
  }

  // Função para obter nome da categoria pelo ID (da API)
  const getCategoryName = (id: number | null) => {
    if (!id) return 'Sem categoria'
    
    // Buscar nome da categoria nas categorias carregadas da API
    const category = serviceCategories.find(cat => cat.id === id)
    return category?.nome || `Categoria ${id}`
  }

  // Função para filtrar e ordenar pedidos
  const getFilteredAndSortedOrders = (orders: any[]) => {
    // Primeiro filtrar por status
    let filtered = orders
    if (orderFilter !== 'TODOS') {
      filtered = orders.filter(order => order.status === orderFilter)
    }
    
    // Depois ordenar: pedidos ativos primeiro, depois por data
    const sorted = filtered.sort((a, b) => {
      // Prioridade 1: Pedidos em andamento ficam no topo
      const aActive = a.status === 'EM_ANDAMENTO' || a.status === 'PENDENTE'
      const bActive = b.status === 'EM_ANDAMENTO' || b.status === 'PENDENTE'
      
      if (aActive && !bActive) return -1
      if (!aActive && bActive) return 1
      
      // Prioridade 2: Mais recentes primeiro
      const aDate = new Date(a.createdAt || a.data_criacao || 0)
      const bDate = new Date(b.createdAt || b.data_criacao || 0)
      return bDate.getTime() - aDate.getTime()
    })
    
    return sorted
  }

  // Função para contar pedidos por status
  const getOrderCounts = (orders: any[]) => {
    return {
      total: orders.length,
      em_andamento: orders.filter(o => o.status === 'EM_ANDAMENTO').length,
      entregue: orders.filter(o => o.status === 'ENTREGUE').length,
      cancelado: orders.filter(o => o.status === 'CANCELADO').length,
      pendente: orders.filter(o => o.status === 'PENDENTE').length
    }
  }

  // Função para buscar pedidos do contratante
  const fetchUserOrders = async () => {
    if (!loggedUser) {
      setUserOrders([])
      return
    }

    // Verificar se é um contratante
    if (loggedUser.tipo_conta !== 'CONTRATANTE') {
      setUserOrders([])
      return
    }

    setOrdersLoading(true)
    
    try {
      // Buscar pedidos do contratante usando a rota específica
      let contratanteId = ''
      
      // Priorizar id_contratante, depois id, depois outros campos possíveis
      if (loggedUser.id_contratante) {
        contratanteId = loggedUser.id_contratante.toString()
      } else if (loggedUser.id) {
        contratanteId = loggedUser.id.toString()
      } else if ((loggedUser as any).userId) {
        contratanteId = (loggedUser as any).userId.toString()
      } else if ((loggedUser as any).contratante_id) {
        contratanteId = (loggedUser as any).contratante_id.toString()
      } else {
        console.error('❌ ID do contratante não encontrado no objeto loggedUser:', loggedUser)
        console.error('❌ Campos disponíveis:', Object.keys(loggedUser))
        setUserOrders([])
        setOrdersLoading(false)
        return
      }
      
      // Tentar diferentes formatos de URL para buscar TODOS os pedidos
      const possibleUrls = [
        // URLs específicas para listar todos os pedidos do contratante
        `https://servidor-facilita.onrender.com/v1/facilita/servico?id_contratante=${contratanteId}`,
        `https://servidor-facilita.onrender.com/v1/facilita/servico/contratante/${contratanteId}`,
        `https://servidor-facilita.onrender.com/v1/facilita/servico/contratante/${contratanteId}/todos`,
        `https://servidor-facilita.onrender.com/v1/facilita/servico/contratante/${contratanteId}/pedidos`,
        `https://servidor-facilita.onrender.com/v1/facilita/servico/contratante/pedidos?id_contratante=${contratanteId}`,
        `https://servidor-facilita.onrender.com/v1/facilita/servico/pedidos?contratante=${contratanteId}`,
        `https://servidor-facilita.onrender.com/v1/facilita/servico/lista?contratante_id=${contratanteId}`,
        // Tentar também com POST se GET não funcionar
        `https://servidor-facilita.onrender.com/v1/facilita/servico/contratante/pedidos`
      ]
      
      console.log('👤 Usuário logado completo:', loggedUser)
      console.log('🔍 ID do contratante extraído:', contratanteId)
      
      let response: Response | null = null
      let successUrl = ''
      
      // Tentar cada URL até encontrar uma que funcione
      for (let i = 0; i < possibleUrls.length; i++) {
        const url = possibleUrls[i]
        console.log('🌐 Tentando URL:', url)
        
        try {
          // Para a última URL, tentar POST também
          const isLastUrl = i === possibleUrls.length - 1
          
          if (isLastUrl) {
            // Tentar GET primeiro, depois POST
            console.log('🔄 Tentando GET na última URL...')
            response = await fetchWithAuth(url, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            })
            
            if (!response.ok) {
              console.log('🔄 GET falhou, tentando POST com body...')
              response = await fetchWithAuth(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  id_contratante: parseInt(contratanteId)
                })
              })
            }
          } else {
            // Para outras URLs, usar apenas GET
            response = await fetchWithAuth(url, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            })
          }
          
          if (response.ok) {
            successUrl = url
            console.log('✅ URL funcionou:', url)
            break
          } else {
            console.log('❌ URL falhou:', url, 'Status:', response.status)
          }
        } catch (error) {
          console.log('❌ Erro na URL:', url, error)
        }
      }
      
      if (!response) {
        console.error('❌ Nenhuma URL funcionou')
        setUserOrders([])
        setOrdersLoading(false)
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Resposta da API recebida:', data)
        console.log('🔍 Tipo da resposta:', typeof data)
        console.log('📊 É array?', Array.isArray(data))
        
        // Se a resposta for um array, usar diretamente
        // Se for um objeto com propriedade 'servicos' ou similar, extrair
        const orders = Array.isArray(data) ? data : (data.servicos || data.services || data.data || data.pedidos || data.orders || [])
        console.log('📋 Pedidos extraídos:', orders)
        console.log('📊 Quantidade de pedidos encontrados:', orders.length)
        
        // Log detalhado de cada pedido
        if (orders.length > 0) {
          console.log('📝 Detalhes dos pedidos:')
          orders.forEach((order: any, index: number) => {
            console.log(`   ${index + 1}. ID: ${order.id || order.id_servico}, Descrição: ${order.descricao}, Status: ${order.status}`)
          })
        } else {
          console.log('⚠️ Nenhum pedido encontrado na resposta da API')
          console.log('🔍 Propriedades disponíveis no objeto:', Object.keys(data))
        }
        
        // Mapear os dados para o formato esperado pelo componente
        const mappedOrders = orders.map((order: any) => ({
          id: order.id || order.id_servico,
          descricao: order.descricao || 'Serviço',
          status: order.status || 'PENDENTE',
          preco: order.valor || order.preco || 0,
          createdAt: order.createdAt || order.data_criacao || new Date().toISOString(),
          id_categoria: order.id_categoria,
          id_localizacao: order.id_localizacao,
          id_contratante: order.id_contratante,
          id_prestador: order.id_prestador
        }))
        
        console.log('🔄 Pedidos mapeados:', mappedOrders)
        console.log('📊 Total de pedidos que serão definidos:', mappedOrders.length)
        
        // Verificar se já temos pedidos e se estamos adicionando ou substituindo
        if (userOrders.length > 0) {
          console.log('⚠️ Já existiam pedidos:', userOrders.length)
          console.log('🔄 Substituindo por novos pedidos da API')
        }
        
        setUserOrders(mappedOrders)
        
        // Verificar se a atualização funcionou
        setTimeout(() => {
          console.log('✅ Verificação pós-atualização - Pedidos no estado:', userOrders.length)
        }, 100)
        
      } else {
        console.error('❌ Erro na requisição:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          contratanteId: contratanteId
        })
        
        // Tentar ler a mensagem de erro
        try {
          const errorData = await response.json()
          console.error('❌ Dados do erro:', errorData)
          
          if (response.status === 403) {
            alert('Acesso negado ao buscar pedidos. Verifique suas permissões.')
          } else if (response.status === 404) {
            console.log('ℹ️ Erro 404 - Nenhum pedido encontrado para este contratante')
            // Definir array vazio em vez de mostrar erro
            setUserOrders([])
          } else {
            console.error('❌ Erro ao buscar pedidos:', response.status, errorData)
            alert(`Erro ao buscar pedidos: ${errorData.message || 'Erro desconhecido'}`)
          }
        } catch (e) {
          console.error('❌ Erro ao fazer parse da resposta de erro:', e)
          alert('Erro ao buscar pedidos. Tente novamente.')
        }
        
        // Não usar fallback de localStorage quando usuário está logado
        // Manter array vazio para mostrar mensagem "Nenhum pedido encontrado"
        setUserOrders([])
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar pedidos:', error)
      
      // Se o erro foi de autenticação, mostrar mensagem e manter na tela
      if (error.message?.includes('Token') || error.message?.includes('autenticação')) {
        console.log('⚠️ Erro de autenticação - mantendo usuário na tela de pedidos')
        setUserOrders([])
        setOrdersLoading(false)
        return
      }
      
      // Não usar fallback de localStorage quando usuário está logado
      // Manter array vazio para mostrar mensagem "Nenhum pedido encontrado"
      console.log('⚠️ Erro ao buscar pedidos - mantendo lista vazia')
      setUserOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  // Função para formatar status do pedido
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800'
      case 'EM_ANDAMENTO':
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'CONCLUIDO':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELADO':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Função para formatar status em português
  const formatStatus = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDENTE':
      case 'PENDING':
        return 'Pendente'
      case 'EM_ANDAMENTO':
      case 'IN_PROGRESS':
        return 'Em Andamento'
      case 'CONCLUIDO':
      case 'COMPLETED':
        return 'Concluído'
      case 'CANCELADO':
      case 'CANCELLED':
        return 'Cancelado'
      default:
        return status || 'Desconhecido'
    }
  }

  // Função para criar serviço via API
  const createService = async () => {
    console.log('🔧 Iniciando createService()...')
    
    // Validações detalhadas
    if (!pickupLocation) {
      console.error('❌ pickupLocation não definido')
      alert('Erro: Local de origem não foi selecionado')
      return false
    }
    
    if (!deliveryLocation) {
      console.error('❌ deliveryLocation não definido')
      alert('Erro: Local de destino não foi selecionado')
      return false
    }
    
    if (!loggedUser) {
      console.error('❌ loggedUser não definido')
      alert('Erro: Usuário não está logado')
      return false
    }
    
    console.log('✅ Validações iniciais passaram')

    // Verificar se o usuário é contratante e tem perfil completo
    if (loggedUser.tipo_conta === 'CONTRATANTE') {
      if (!loggedUser.id) {
        console.error('❌ ID do usuário não disponível')
        alert('Erro: ID do usuário não encontrado. Faça login novamente.')
        return false
      }
      
      try {
        // Usar id_contratante se disponível, senão id_usuario
        const idParaVerificar = loggedUser.id_contratante || loggedUser.id
        console.log('🔍 Verificando perfil antes de criar serviço. ID:', idParaVerificar)
        console.log('🔍 Usando:', loggedUser.id_contratante ? 'id_contratante' : 'id_usuario')
        
        // Se temos id_contratante, usar direto. Senão, usar query param com id_usuario
        const url = loggedUser.id_contratante 
          ? `https://servidor-facilita.onrender.com/v1/facilita/contratante/${idParaVerificar}`
          : `https://servidor-facilita.onrender.com/v1/facilita/contratante?id_usuario=${idParaVerificar}`
        
        console.log('🔍 URL verificação perfil:', url)
        const profileCheck = await fetchWithAuth(url)
        
        if (!profileCheck.ok) {
          // Tentar ler detalhes do erro
          const errorDetails = await profileCheck.json().catch(() => ({}))
          console.error('❌ Perfil de contratante incompleto')
          console.error('Status:', profileCheck.status)
          console.error('Detalhes:', errorDetails)
          
          if (profileCheck.status === 404) {
            console.log('📋 Perfil não encontrado - mostrando modal para completar cadastro')
            setShowCompleteProfileModal(true)
            // Não mostrar alert, apenas abrir o modal
          } else if (profileCheck.status === 400) {
            alert(`Erro ao verificar perfil: ${errorDetails.message || 'Dados inválidos'}. Por favor, complete seu perfil novamente.`)
            setShowCompleteProfileModal(true)
          } else {
            alert('Por favor, complete seu perfil antes de criar um serviço.')
            setShowCompleteProfileModal(true)
          }
          
          return false
        }
        
        // Perfil OK - logar dados para debug
        const profileData = await profileCheck.json()
        console.log('✅ Perfil do contratante verificado:', JSON.stringify(profileData, null, 2))
        
        // A API pode retornar um array ou um objeto
        const contratanteData = Array.isArray(profileData) ? profileData[0] : profileData
        
        // Quando busca por query param id_usuario, retorna dados do CONTRATANTE
        // { id: 10, id_usuario: 32, ... }
        const idContratante = contratanteData?.id
        
        console.log('🔍 Extraindo ID antes de criar serviço:')
        console.log('  - contratanteData.id (id_contratante):', contratanteData?.id)
        console.log('  - contratanteData.id_usuario:', contratanteData?.id_usuario)
        console.log('  - ID extraído:', idContratante)
        
        // Salvar id_contratante se ainda não temos
        if (idContratante && !loggedUser.id_contratante) {
          const updatedUser = {
            ...loggedUser,
            id_contratante: idContratante
          }
          setLoggedUser(updatedUser)
          localStorage.setItem('loggedUser', JSON.stringify(updatedUser))
          console.log('✅ ID do contratante salvo (da verificação antes de criar serviço):', idContratante)
        }
        
      } catch (error) {
        console.error('❌ Erro ao verificar perfil:', error)
        alert('Erro ao verificar perfil. Complete seu cadastro antes de continuar.')
        setShowCompleteProfileModal(true)
        return false
      }
    }

    try {
      // VERIFICAÇÃO CRÍTICA: Tipo de conta do usuário
      console.log('=== VERIFICAÇÃO DE PERMISSÕES ===')
      console.log('👤 Usuário logado:', loggedUser?.email)
      console.log('🔑 Tipo de conta:', loggedUser?.tipo_conta)
      console.log('🆔 ID do usuário:', loggedUser?.id)
      console.log('🆔 ID do contratante:', loggedUser?.id_contratante)
      
      // Verificar se é CONTRATANTE
      if (loggedUser?.tipo_conta !== 'CONTRATANTE') {
        console.error('❌ ERRO: Usuário não é CONTRATANTE!')
        console.error('Tipo de conta atual:', loggedUser?.tipo_conta)
        alert('Erro: Apenas contratantes podem criar serviços. Sua conta é do tipo: ' + (loggedUser?.tipo_conta || 'desconhecido'))
        return false
      }
      
      console.log('✅ Usuário é CONTRATANTE - pode criar serviços')
      console.log('==================================')
      
      // Obter IDs necessários
      console.log('🔍 Obtendo ID do contratante...')
      console.log('🔍 loggedUser.id (usuario):', loggedUser?.id)
      console.log('🔍 loggedUser.id_contratante:', loggedUser?.id_contratante)
      
      const id_contratante = await getContratanteId()
      console.log('✅ ID do contratante obtido:', id_contratante)
      
      // Validar ID do contratante
      if (!id_contratante || id_contratante <= 0) {
        console.error('❌ ID do contratante inválido:', id_contratante)
        alert('Erro: ID do contratante não foi obtido corretamente. Tente fazer login novamente.')
        return false
      }
      
      const descricaoServico = serviceDescription || selectedServiceType || 'Serviço de entrega personalizado'
      
      // Validar descrição
      if (!descricaoServico || descricaoServico.trim().length < 3) {
        console.error('❌ Descrição do serviço inválida:', descricaoServico)
        alert('Erro: Descrição do serviço deve ter pelo menos 3 caracteres.')
        return false
      }

      // Validar localizações
      if (!pickupLocation || !deliveryLocation) {
        console.error('❌ Localizações inválidas:', { pickupLocation, deliveryLocation })
        alert('Erro: Selecione origem e destino do serviço.')
        return false
      }

      // Usar APENAS categoria selecionada pelo usuário (não detectar automaticamente)
      const id_categoria = selectedCategoryId
      
      // Calcular valor adicional baseado no preço do serviço
      let valorAdicional = servicePrice || 0
      if (!valorAdicional || valorAdicional <= 0) {
        // Se usuário não definiu valor, calcular automaticamente
        if (pickupLocation && deliveryLocation) {
          const distance = calculateDistance(
            pickupLocation.lat,
            pickupLocation.lng,
            deliveryLocation.lat,
            deliveryLocation.lng
          )
          valorAdicional = Math.max(10, Math.round(distance * 2.5)) // Mínimo 10, 2.5 por km
        } else {
          valorAdicional = 10 // Valor padrão
        }
      }

      console.log('=== CRIAÇÃO DE SERVIÇO ===')
      console.log('📊 Informações do usuário:', {
        id_usuario: loggedUser?.id,
        id_contratante: id_contratante,
        email: loggedUser?.email
      })
      console.log('🗺 Localizações:', {
        origem: pickupLocation,
        destino: deliveryLocation
      })
      console.log('🏷️ Categoria selecionada:', {
        id_categoria: id_categoria || 'Nenhuma',
        descricao: descricaoServico
      })
      console.log('💰 Valor adicional:', valorAdicional)
      console.log('==========================')

      let endpoint: string
      let payload: any
      
      // IMPORTANTE: Endpoint de categoria pode estar bloqueado para contratantes
      // Vamos tentar sempre usar o endpoint sem categoria primeiro
      console.log('⚠️ ATENÇÃO: Endpoint /from-categoria pode estar bloqueado')
      console.log('⚠️ Tentando usar endpoint /servico com id_categoria no payload')
      
      // Obter id_localizacao
      const id_localizacao = await getCurrentLocationId()
      console.log('📍 ID da localização obtido:', id_localizacao)
      
      if (!id_localizacao || id_localizacao <= 0) {
        console.error('❌ ID da localização inválido:', id_localizacao)
        alert('Erro: Localização não foi obtida.')
        return false
      }
      
      // SEMPRE usar endpoint /servico (sem categoria na URL)
      endpoint = API_ENDPOINTS.SERVICES
      
      // Se tem categoria, incluir no payload
      if (id_categoria && id_categoria > 0) {
        payload = {
          id_categoria: Number(id_categoria),
          descricao: descricaoServico.trim(),
          valor_adicional: Number(valorAdicional),
          origem_lat: Number(pickupLocation.lat),
          origem_lng: Number(pickupLocation.lng),
          destino_lat: Number(deliveryLocation.lat),
          destino_lng: Number(deliveryLocation.lng)
        }
        
        console.log('🎯 Criando serviço COM CATEGORIA (via endpoint /servico)')
        console.log('🏷️ ID da categoria:', id_categoria)
      } else {
        payload = {
          descricao: descricaoServico.trim(),
          valor_adicional: Number(valorAdicional),
          origem_lat: Number(pickupLocation.lat),
          origem_lng: Number(pickupLocation.lng),
          destino_lat: Number(deliveryLocation.lat),
          destino_lng: Number(deliveryLocation.lng)
        }
        
        console.log('🎯 Criando serviço SEM CATEGORIA')
      }
      
      console.log('🌐 Endpoint:', endpoint)
      console.log('📤 Payload:', JSON.stringify(payload, null, 2))
      
      console.log('📤 Enviando requisição para API...')
      console.log('🌐 Endpoint completo:', endpoint)
      console.log('📋 Payload JSON:', JSON.stringify(payload, null, 2))
      console.log('🔑 Token disponível:', !!localStorage.getItem('authToken'))
      console.log('👤 Tipo de conta do usuário:', loggedUser?.tipo_conta)
      
      const response = await fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      console.log('📥 Resposta recebida:')
      console.log('  - Status:', response.status)
      console.log('  - Status Text:', response.statusText)
      console.log('  - OK:', response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Serviço criado com sucesso!')
        console.log('📋 Resposta completa:', JSON.stringify(data, null, 2))
        
        // A API retorna: { status_code: 201, message: "...", data: { servico: { id: ... } } }
        // Extrair ID do serviço de vários formatos possíveis
        let serviceId = data.id || 
                       data.servico_id || 
                       data.service_id ||
                       data.data?.id ||
                       data.data?.servico?.id ||  // Novo formato: data.servico.id
                       data.data?.servico_id
        
        // Se a resposta for um objeto com propriedade 'servico' ou 'service'
        if (!serviceId && data.servico) {
          serviceId = data.servico.id
        }
        if (!serviceId && data.service) {
          serviceId = data.service.id
        }
        
        console.log('🔍 Tentando extrair ID do serviço:')
        console.log('  - data.id:', data.id)
        console.log('  - data.data?.id:', data.data?.id)
        console.log('  - data.data?.servico?.id:', data.data?.servico?.id)
        console.log('  - data.servico?.id:', data.servico?.id)
        console.log('  - ID extraído:', serviceId)
        
        if (!serviceId) {
          console.error('❌ ID do serviço não encontrado na resposta:', data)
          alert('Erro: Serviço criado mas ID não foi retornado. Entre em contato com o suporte.')
          return false
        }
        
        console.log('🆔 ID do serviço criado:', serviceId)
        console.log('🔍 Tipo do ID:', typeof serviceId)
        console.log('💾 Salvando createdServiceId no estado...')
        setCreatedServiceId(serviceId)
        console.log('✅ createdServiceId salvo:', serviceId)
        
        // Extrair informações do serviço da resposta
        const servicoData = data.data?.servico || data.servico || data
        const categoriaData = data.data?.categoria || null
        const detalhesCalculo = data.data?.detalhes_calculo || null
        
        // Salvar dados do serviço no localStorage para referência
        const serviceInfo = {
          id: serviceId,
          id_categoria: servicoData.id_categoria || id_categoria,
          id_contratante: servicoData.id_contratante || id_contratante,
          descricao: servicoData.descricao || descricaoServico,
          valor: servicoData.valor || detalhesCalculo?.valor_total || valorAdicional,
          status: servicoData.status || 'PENDENTE',
          origem: pickupLocation,
          destino: deliveryLocation,
          categoria: categoriaData,
          detalhes_calculo: detalhesCalculo,
          createdAt: new Date().toISOString(),
          userId: loggedUser?.email
        }
        localStorage.setItem('currentService', JSON.stringify(serviceInfo))
        
        console.log('💾 Serviço salvo no localStorage:', serviceInfo)
        
        return true
      } else {
        console.error('❌ Erro na resposta da API')
        console.error('  - Status:', response.status)
        console.error('  - Status Text:', response.statusText)
        
        try {
          const errorData = await response.json()
          console.error('  - Erro detalhado:', JSON.stringify(errorData, null, 2))
          
          // Mensagens de erro específicas baseadas no status
          let errorMessage = 'Erro desconhecido'
          if (response.status === 400) {
            errorMessage = `Dados inválidos: ${errorData.message || 'Verifique os dados enviados'}`
          } else if (response.status === 401) {
            errorMessage = 'Não autorizado. Faça login novamente.'
          } else if (response.status === 403) {
            errorMessage = 'Acesso negado. Verifique suas permissões.'
          } else if (response.status === 404) {
            errorMessage = 'Serviço não encontrado na API.'
          } else if (response.status === 500) {
            // Erro 500 pode ser causado por:
            // 1. id_prestador inexistente no banco
            // 2. id_localizacao inválido
            // 3. Constraint de foreign key
            console.error('⚠️ POSSÍVEIS CAUSAS DO ERRO 500:')
            console.error('  1. id_prestador não existe na tabela PRESTADOR')
            console.error('  2. id_localizacao não existe na tabela LOCALIZACAO')
            console.error('  3. id_categoria não existe na tabela CATEGORIA')
            console.error('  4. id_contratante não existe na tabela CONTRATANTE')
            console.error('  5. Violação de constraint no banco de dados')
            console.error('📋 Dados enviados:', payload)
            
            errorMessage = `Erro interno do servidor (500).\n\nPossíveis causas:\n- ID do prestador inválido\n- ID da localização inválido\n- Dados inconsistentes no banco\n\nDetalhes: ${errorData.message || 'Sem detalhes adicionais'}`
          } else {
            errorMessage = errorData.message || `Erro ${response.status}: ${response.statusText}`
          }
          
          alert(`Erro ao criar serviço: ${errorMessage}`)
          console.error('💡 SUGESTÃO: Verifique se todos os IDs de referência existem no banco de dados')
        } catch (parseError) {
          console.error('❌ Erro ao parsear resposta de erro:', parseError)
          
          // Tentar obter texto da resposta se JSON falhou
          try {
            const errorText = await response.text()
            console.error('❌ Resposta de erro (texto):', errorText)
            alert(`Erro ${response.status}: ${errorText || 'Erro desconhecido no servidor'}`)
          } catch (textError) {
            console.error('❌ Erro ao obter texto da resposta:', textError)
            alert(`Erro ${response.status}: Erro desconhecido no servidor. Verifique sua conexão e tente novamente.`)
          }
        }
        
        return false
      }
    } catch (error) {
      console.error('❌ Erro na requisição de criação de serviço:', error)
      
      // Verificar se é erro de sessão expirada
      if (error instanceof Error && error.message.includes('sessão expirou')) {
        alert(error.message)
        // Redirecionar para login
        setCurrentScreen('login')
        return false
      }
      
      // Verificar se é erro de token inválido
      if (error instanceof Error && (
          error.message.includes('Token inválido') || 
          error.message.includes('Token não encontrado') ||
          error.message.includes('Acesso negado: Token')
      )) {
        alert('Sua sessão expirou. Por favor, faça login novamente.')
        localStorage.removeItem('authToken')
        localStorage.removeItem('loggedUser')
        setLoggedUser(null)
        setCurrentScreen('login')
        return false
      }
      
      // Verificar se é erro de perfil incompleto
      if (error instanceof Error && error.message.includes('ID do contratante não encontrado')) {
        alert('Complete seu perfil de contratante antes de criar serviços.')
        setShowCompleteProfileModal(true)
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('Erro de conexão: Verifique sua internet e tente novamente.')
      } else if (error instanceof Error) {
        alert(`Erro: ${error.message}`)
      } else {
        alert('Erro inesperado ao criar serviço. Verifique sua conexão e tente novamente.')
      }
      
      return false
    }
  }

  // Função para confirmar pagamento (serviço já foi criado)
  const handlePaymentConfirmation = async () => {
    console.log('🔍 handlePaymentConfirmation chamado')
    console.log('🆔 createdServiceId:', createdServiceId)
    console.log('💰 servicePrice:', servicePrice)
    console.log('💵 walletBalance:', walletBalance)
    
    if (!createdServiceId) {
      console.error('❌ ID do serviço não encontrado!')
      alert('Erro: ID do serviço não encontrado. Tente criar o serviço novamente.')
      return
    }

    const serviceValue = servicePrice > 0 ? servicePrice : 119.99
    console.log('💵 Valor do serviço:', serviceValue)

    // Verificar saldo suficiente
    if (walletBalance < serviceValue) {
      console.warn('⚠️ Saldo insuficiente')
      alert(`Saldo insuficiente!\n\nVocê possui: R$ ${walletBalance.toFixed(2)}\nValor do serviço: R$ ${serviceValue.toFixed(2)}\n\nPor favor, recarregue sua carteira.`)
      return
    }
    
    // Pagar serviço com carteira digital
    const serviceId = typeof createdServiceId === 'string' ? parseInt(createdServiceId) : createdServiceId
    console.log('🔢 ID do serviço convertido:', serviceId, '(tipo:', typeof serviceId, ')')
    
    const paymentSuccess = await payServiceWithWallet(serviceId)
    
    if (paymentSuccess) {
      console.log('✅ Pagamento bem-sucedido, redirecionando...')
      // Redirecionar para tela de confirmação
      handleScreenTransition('service-confirmed')
    } else {
      console.error('❌ Pagamento falhou')
    }
  }

  // Função antiga de pagamento (comentada para referência)
  const handlePaymentConfirmationOld = async () => {
    if (!createdServiceId) {
      alert('Erro: ID do serviço não encontrado. Tente criar o serviço novamente.')
      return
    }
    
    setIsLoading(true)
    
    try {
      console.log('💳 Iniciando processo de confirmação de pagamento...')
      
      // Converter preço de reais para centavos
      const valorEmCentavos = Math.round((servicePrice > 0 ? servicePrice : 119.99) * 100)
      
      const paymentData = {
        id_servico: createdServiceId,
        valor: valorEmCentavos,
        metodo: 'PIX'
      }
      
      console.log('📤 Enviando confirmação de pagamento:', paymentData)
      
      const response = await fetchWithAuth(API_ENDPOINTS.PAYMENTS, {
        method: 'POST',
        body: JSON.stringify(paymentData)
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Pagamento confirmado:', data)
        
        // Ir para tela de confirmação
        handleScreenTransition('service-confirmed')
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Erro ao confirmar pagamento:', errorData)
        alert(`Erro ao confirmar pagamento: ${errorData.message || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('❌ Erro no processo de confirmação:', error)
      alert('Erro no processo de pagamento. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const FacilitaLogo = ({ className = '' }: { className?: string }) => (
    <div className={`flex items-start justify-start ${className}`}>
      <img 
        src="/logotcc 1.png" 
        alt="Facilita Logo" 
        className="w-64 md:w-80 h-auto"
      />
    </div>
  )

  const UserIcon = () => (
    <div className="w-24 h-24 bg-green-200 rounded-full flex items-center justify-center mb-4">
      <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center">
        <User className="w-8 h-8 text-green-800" />
      </div>
    </div>
  )

  // Service Tracking Screen
  if (currentScreen === 'service-tracking') {
    return (
      <ServiceTracking
        onBack={() => handleScreenTransition('home')}
        onServiceCompleted={handleServiceCompleted}
        entregador={entregadorData}
        destination={selectedDestination || {
          address: selectedLocation || 'Endereço não especificado',
          lat: -23.55052, 
          lng: -46.63330
        }}
        driverOrigin={(driverOrigin || pickupLocation) ? {
          lat: (driverOrigin?.lat ?? pickupLocation!.lat),
          lng: (driverOrigin?.lng ?? pickupLocation!.lng)
        } : { lat: -23.5324859, lng: -46.7916801 }} 
      />
    )
  }

  // Service Rating Screen
  if (currentScreen === 'service-rating') {
    // Obter ID do serviço atual
    const currentServiceId = parseInt(localStorage.getItem('currentServiceId') || '4')
    
    return (
      <ServiceRating
        onBack={() => handleScreenTransition('service-tracking')}
        onFinish={() => handleScreenTransition('home')}
        entregador={entregadorData}
        serviceCompletionTime={serviceCompletionTime || new Date()}
        serviceStartTime={serviceStartTime || new Date(Date.now() - 300000)} // 5 min atrás como exemplo
        serviceId={currentServiceId}
      />
    )
  }

  // Payment Screen
  if (currentScreen === 'payment') {
    return (
      <div className={`min-h-screen bg-gray-100 transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        <div className="bg-green-500 text-white p-4 relative">
          <button
          //TALVEZ SEJA ESSA
            onClick={() => handleScreenTransition('home')}
            className="absolute left-4 top-4 text-white hover:text-gray-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">Você está quase lá...!</h1>
          </div>
          <button className="absolute right-4 top-4 text-white">
            Voltar
          </button>
        </div>

        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Left side - Service details */}
          <div className="flex-1 p-6">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold">Detalhes do serviço</h3>
              </div>

              <div className="border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-600">Modalidade: Carro - Personalizado</p>
                    <div className="flex items-center mt-2">
                      <img src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" alt="Driver" className="w-8 h-8 rounded-full mr-2" />
                      <div>
                        <p className="font-semibold text-sm">RV9G33</p>
                        <p className="text-xs text-blue-500">Entregador • Katiê Bueno</p>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs ml-1">4.7</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">R$ {(servicePrice > 0 ? servicePrice : 291.76).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold">Pagamento</h3>
              </div>

              <div className="flex items-center mb-4">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                <CreditCard className="w-4 h-4 mr-2" />
                <span className="text-sm">Carteira digital</span>
              </div>

              {/* Saldo da Carteira */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-80">Saldo disponível</span>
                  <CreditCard className="w-5 h-5 opacity-80" />
                </div>
                <div className="text-3xl font-bold mb-1">
                  R$ {walletBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs opacity-80">
                  {walletBalance >= (servicePrice > 0 ? servicePrice : 119.99) 
                    ? '✓ Saldo suficiente para pagamento'
                    : '⚠ Saldo insuficiente - Recarregue sua carteira'
                  }
                </div>
              </div>

              <div className="text-xs text-gray-600 space-y-2 bg-blue-50 p-4 rounded-lg">
                <p className="font-semibold text-blue-800">ℹ️ Como funciona:</p>
                <p>• O valor será debitado da sua carteira digital</p>
                <p>• O pagamento é instantâneo e seguro</p>
                <p>• Você receberá uma notificação de confirmação</p>
                <p>• O prestador será notificado imediatamente</p>
              </div>
            </div>
          </div>

          {/* Right side - Payment summary */}
          <div className="lg:w-96 bg-white p-6 shadow-lg">
            <h3 className="font-semibold mb-4">Detalhes</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Valor</span>
                <span className="font-semibold">R$ {(servicePrice > 0 ? servicePrice : 119.99).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxas</span>
                <span className="text-green-500">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Descontos</span>
                <span>R$ 0</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>R$ {(servicePrice > 0 ? servicePrice : 119.99).toFixed(2)}</span>
              </div>
              {pickupLocation && deliveryLocation && (
                <div className="text-xs text-gray-500 mt-2">
                  <p><strong>Origem:</strong> {pickupLocation.address.substring(0, 50)}{pickupLocation.address.length > 50 ? '...' : ''}</p>
                  <p><strong>Entrega:</strong> {deliveryLocation.address.substring(0, 50)}{deliveryLocation.address.length > 50 ? '...' : ''}</p>
                  <p className="mt-1"><strong>Distância:</strong> {pickupLocation && deliveryLocation ? calculateDistance(pickupLocation.lat, pickupLocation.lng, deliveryLocation.lat, deliveryLocation.lng).toFixed(2) : '0'} km</p>
                </div>
              )}
            </div>

            <button
              onClick={handlePaymentConfirmation}
              disabled={isLoading || walletBalance < (servicePrice > 0 ? servicePrice : 119.99)}
              className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl ${
                isLoading || walletBalance < (servicePrice > 0 ? servicePrice : 119.99)
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed transform-none' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isLoading 
                ? 'Processando...' 
                : walletBalance < (servicePrice > 0 ? servicePrice : 119.99)
                  ? 'Saldo Insuficiente'
                  : 'Confirmar Pagamento'
              }
            </button>
          </div>
        </div>
      </div>
    )
  }
  if (currentScreen === 'service-confirmed') {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Lado esquerdo verde com check */}
      <div className="w-1/3 bg-green-500 flex items-center justify-center rounded-r-3xl">
        <div className="w-32 h-32 flex items-center justify-center rounded-full border-8 border-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-20 w-20 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Conteúdo à direita */}
      <div className="flex-1 flex flex-col items-center justify-center p-10">
        <button
          onClick={() => handleScreenTransition('home')}
          className="absolute top-6 left-6 text-green-500 hover:underline"
        >
          ← Voltar
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">Serviço Confirmado</h2>
        <p className="text-gray-600 mb-2">Obrigado por escolher a Facilita</p>
        {createdServiceId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 w-full max-w-md">
            <p className="text-sm text-green-700 font-medium mb-2">✅ Serviço criado com sucesso!</p>
            <p className="text-xs text-gray-600">Seu pedido foi confirmado e está sendo processado.</p>
          </div>
        )}

        <div className="bg-white border rounded-lg shadow-md p-6 w-full max-w-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Modalidade: Carro - Personalizado</p>
              <div className="flex items-center mt-2">
                <img
                  src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg"
                  alt="Driver"
                  className="w-10 h-10 rounded-full mr-2"
                />
                <div>
                  <p className="font-semibold text-sm">RVJ9G33</p>
                  <p className="text-xs text-blue-500">Entregador • {entregadorData?.nome || 'Aguardando prestador'}</p>
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs ml-1">{entregadorData?.rating || 5.0}</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="font-bold text-lg">R$ {(servicePrice > 0 ? servicePrice : 119.99).toFixed(2)}</p>
          </div>
        </div>

        {/* Detalhes */}
        <div className="mt-6 w-full max-w-md text-sm text-gray-600 space-y-2">
          <div className="flex justify-between">
            <span>Nome</span>
            <span className="font-medium">{entregadorData?.nome || 'Aguardando prestador'}</span>
          </div>
          <div className="flex justify-between">
            <span>Data</span>
            <span className="font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex justify-between">
            <span>Hora</span>
            <span className="font-medium">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {pickupLocation && deliveryLocation ? (
            <>
              <div className="flex justify-between">
                <span>Origem</span>
                <span className="font-medium text-xs">{pickupLocation.address.substring(0, 30)}...</span>
              </div>
              <div className="flex justify-between">
                <span>Destino</span>
                <span className="font-medium text-xs">{deliveryLocation.address.substring(0, 30)}...</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <span>Localizações</span>
              <span className="font-medium text-xs">Não especificadas</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Pagamento</span>
            <span className="font-medium text-green-600">Confirmado</span>
          </div>
        </div>

        {/* Botões */}
        <div className="mt-8 space-y-3 w-full max-w-md">
          <button
            onClick={() => handleScreenTransition('service-tracking')}
            className="w-full px-6 py-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
          >
            Acompanhar Pedido
          </button>
          
          <button
            onClick={() => handleScreenTransition('home')}
            className="w-full px-6 py-3 rounded-lg bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  )
}

  // Waiting Driver Screen
  if (currentScreen === 'waiting-driver') {
    return (
      <div className={`min-h-screen bg-gray-100 flex items-center justify-center transition-all duration-300 ${
        isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}>
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Search className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Procurando motorista...</h2>
          <p className="text-gray-600 mb-6">Aguarde enquanto encontramos o melhor prestador para você</p>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  // Service Create Screen
  if (currentScreen === 'service-create') {
    return (
      <ServiceCreateScreen
        userAddress={profileData.endereco}
        selectedOriginLocation={selectedOriginLocation}
        selectedLocation={selectedLocation}
        serviceDescription={serviceDescription}
        selectedServiceType={selectedServiceType}
        pickupLocation={pickupLocation}
        deliveryLocation={deliveryLocation}
        predefinedServices={predefinedServices}
        serviceCategories={serviceCategories}
        loadingCategories={loadingCategories}
        selectedCategoryId={selectedCategoryId}
        servicePrice={servicePrice}
        onBack={() => handleScreenTransition('home')}
        onSelectOrigin={() => {
          setIsSelectingOrigin(true)
          handleScreenTransition('location-select')
        }}
        onSelectDestination={() => {
          setIsSelectingOrigin(false)
          handleScreenTransition('location-select')
        }}
        onDescriptionChange={setServiceDescription}
        onServiceTypeChange={setSelectedServiceType}
        onCategorySelect={(categoryId: number) => {
          setSelectedCategoryId(categoryId)
          console.log('✅ Categoria selecionada pelo usuário:')
          console.log('  - ID:', categoryId)
          console.log('  - Tipo:', typeof categoryId)
          
          // Buscar dados completos da categoria
          const selectedCategory = serviceCategories.find(cat => cat.id === categoryId)
          if (selectedCategory) {
            console.log('  - Nome:', selectedCategory.nome)
            console.log('  - Descrição:', selectedCategory.descricao)
            console.log('  - Preço base:', selectedCategory.preco_base)
            console.log('  - Tempo médio:', selectedCategory.tempo_medio, 'min')
          }
        }}
        onPriceChange={setServicePrice}
        onConfirmService={handleServiceCreate}
        calculateDistance={calculateDistance}
        calculatePrice={calculatePrice}
      />
    )
  }


  
  if (currentScreen === 'location-select') {
    return (
      <div
        className={`min-h-screen bg-gray-100 transition-all duration-300 ${
          isTransitioning
            ? 'opacity-0 translate-x-full'
            : 'opacity-100 translate-x-0'
        }`}
      >
        <LocationMap
          onLocationSelect={handleLocationSelect}
          onScreenChange={handleScreenTransition}
        />
      </div>
    )
  }

  // Orders Screen
  if (currentScreen === 'orders') {
    // Usar apenas pedidos reais do usuário logado
    const rawOrders = userOrders;

    // Aplicar filtros e ordenação
    const displayOrders = getFilteredAndSortedOrders(rawOrders);
    const orderCounts = getOrderCounts(rawOrders);

    console.log('📊 Exibindo pedidos:', {
      userOrdersCount: userOrders.length,
      rawOrdersCount: rawOrders.length,
      displayOrdersCount: displayOrders.length,
      currentFilter: orderFilter,
      counts: orderCounts
    });

    return (
      <div className={`min-h-screen ${themeClasses.bg} transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        {/* Header */}
        <div className="bg-green-500 text-white p-4 relative">
          <button
            onClick={() => handleScreenTransition('home')}
            className="absolute left-4 top-4 text-white hover:text-gray-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">Meus Pedidos</h1>
          </div>
          <button
            onClick={async () => {
              console.log('🔄 Botão de atualizar pedidos clicado')
              try {
                await fetchUserOrders()
              } catch (error) {
                console.error('❌ Erro ao atualizar pedidos:', error)
              }
            }}
            className="absolute right-4 top-4 text-white hover:text-gray-200 transition-colors"
            disabled={ordersLoading}
            title="Atualizar pedidos"
          >
            {ordersLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>

        {/* Filtros */}
        <div className={`${themeClasses.bgCard} border-b ${themeClasses.border} p-4`}>
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'TODOS', label: 'Todos', count: orderCounts.total },
                  { key: 'EM_ANDAMENTO', label: 'Em Andamento', count: orderCounts.em_andamento },
                  { key: 'PENDENTE', label: 'Pendente', count: orderCounts.pendente },
                  { key: 'ENTREGUE', label: 'Entregue', count: orderCounts.entregue },
                  { key: 'CANCELADO', label: 'Cancelado', count: orderCounts.cancelado }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setOrderFilter(filter.key as any)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      orderFilter === filter.key
                        ? 'bg-green-500 text-white shadow-lg'
                        : `${themeClasses.bg} ${themeClasses.text} border ${themeClasses.border} hover:bg-green-50 hover:border-green-300`
                    }`}
                  >
                    {filter.label} {filter.count > 0 && `(${filter.count})`}
                  </button>
                ))}
              </div>
              
              {/* Indicador de pedidos ativos */}
              {orderCounts.em_andamento > 0 && (
                <div className="flex items-center space-x-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span>{orderCounts.em_andamento} pedido(s) ativo(s)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto p-6">
          {ordersLoading ? (
            /* Loading State */
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando seus pedidos...</p>
              </div>
            </div>
          ) : displayOrders.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <div className={`w-24 h-24 ${themeClasses.bgCard} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <FileText className={`w-12 h-12 ${themeClasses.textSecondary}`} />
              </div>
              <h3 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>Nenhum pedido encontrado</h3>
              <p className={`${themeClasses.textSecondary} mb-6`}>Você ainda não fez nenhum pedido. Que tal começar agora?</p>
              <button
                onClick={() => handleScreenTransition('home')}
                className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
              >
                Fazer Primeiro Pedido
              </button>
            </div>
          ) : (
            /* Orders List */
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${themeClasses.text}`}>Histórico de Pedidos</h2>
                </div>
                <span className={`text-sm ${themeClasses.textSecondary}`}>{displayOrders.length} pedido(s)</span>
              </div>

              {displayOrders.map((order, index) => {
                const isActive = order.status === 'EM_ANDAMENTO' || order.status === 'PENDENTE'
                
                return (
                <div key={order.id || index} className={`${themeClasses.bgCard} rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border ${themeClasses.border} ${
                  isActive ? 'ring-2 ring-orange-200 bg-gradient-to-r from-orange-50 to-transparent' : ''
                } relative`}>
                  {/* Indicador de pedido ativo */}
                  {isActive && (
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                      {order.status === 'EM_ANDAMENTO' ? '🚚 A CAMINHO' : '⏳ PENDENTE'}
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className={`text-lg font-semibold ${themeClasses.text} mr-3`}>
                          {order.descricao || 'Serviço'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          getStatusColor(order.status || 'PENDENTE')
                        }`}>
                          {formatStatus(order.status || 'PENDENTE')}
                        </span>
                      </div>
                      
                      {order.id && (
                        <p className={`text-sm ${themeClasses.textSecondary} mb-2`}>ID: {order.id}</p>
                      )}
                      
                      {order.createdAt && (
                        <p className={`text-sm ${themeClasses.textSecondary} mb-2`}>
                          Data: {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                      
                      {(order.origem || order.destino) && (
                        <div className="text-sm text-gray-600 space-y-1">
                          {order.origem && (
                            <p><strong>Origem:</strong> {order.origem.address || order.origem.endereco || 'Não informado'}</p>
                          )}
                          {order.destino && (
                            <p><strong>Destino:</strong> {order.destino.address || order.destino.endereco || 'Não informado'}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      {order.preco && (
                        <p className="text-2xl font-bold text-green-600 mb-2">
                          R$ {typeof order.preco === 'number' ? order.preco.toFixed(2) : order.preco}
                        </p>
                      )}
                      
                      {order.id_categoria && (
                        <p className="text-sm text-gray-500">
                          {getCategoryName(order.id_categoria)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Ações do pedido */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      {(order.status === 'PENDENTE' || order.status === 'EM_ANDAMENTO') && (
                        <button 
                          onClick={() => {
                            // Implementar rastreamento se necessário
                            handleScreenTransition('service-tracking')
                          }}
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          Rastrear
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {order.id_contratante && (
                        <span>Contratante: {order.id_contratante}</span>
                      )}
                      {order.id_prestador && (
                        <span>Prestador: {order.id_prestador}</span>
                      )}
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Change Password Screen
  if (currentScreen === 'change-password') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={() => handleScreenTransition('profile')}
              className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Perfil</h1>
          </div>

          {/* Profile Photo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                {loggedUser?.foto ? (
                  <img 
                    src={loggedUser.foto} 
                    alt="Perfil" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {loggedUser?.nome?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors">
                <span className="text-lg">+</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 text-center mb-6">Alterar senha</h2>
            
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digite a senha atual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={changePasswordData.currentPassword}
                  onChange={(e) => setChangePasswordData(prev => ({
                    ...prev,
                    currentPassword: e.target.value
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Digite a senha atual"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={changePasswordData.newPassword}
                  onChange={(e) => setChangePasswordData(prev => ({
                    ...prev,
                    newPassword: e.target.value
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Nova Senha"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar nova senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  value={changePasswordData.confirmPassword}
                  onChange={(e) => setChangePasswordData(prev => ({
                    ...prev,
                    confirmPassword: e.target.value
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Confirmar nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {changePasswordError && (
              <div className="text-center text-red-600 text-sm">
                {changePasswordError}
              </div>
            )}

            {/* Success Message */}
            {changePasswordSuccess && (
              <div className="text-center text-green-600 text-sm">
                {changePasswordSuccess}
              </div>
            )}

            {/* Password Requirements */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>A senha deve conter:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Mínimo de 6 caracteres</li>
                <li>Pelo menos 1 letra maiúscula</li>
                <li>Pelo menos 1 número</li>
                <li>Pelo menos 1 símbolo (!@#$%^&*)</li>
              </ul>
            </div>

            {/* Save Button */}
            <button
              onClick={handleChangePassword}
              disabled={!changePasswordData.currentPassword || !changePasswordData.newPassword || !changePasswordData.confirmPassword}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              Salvar
            </button>
          </div>

          {/* Footer vazio */}
          <div className="mt-12 mb-8">
          </div>
        </div>
      </div>
    )
  }

  // Wallet Screen
  if (currentScreen === 'wallet') {
    return (
      <>
        <WalletScreen
          balance={walletBalance}
          onBack={() => handleScreenTransition('home')}
          onNotificationClick={() => setIsNotificationOpen(true)}
          onProfileClick={() => handleScreenTransition('profile')}
          hasUnreadNotifications={notifications.some(n => !n.read)}
          profilePhoto={profilePhoto || loggedUser?.foto || null}
          userName={loggedUser?.nome || 'Usuário'}
          hasWallet={hasWallet}
          onCreateWallet={() => setShowCreateWalletModal(true)}
          walletData={walletData}
          onRecharge={() => setShowRechargeModal(true)}
          transactions={walletTransactions}
          loadingTransactions={loadingTransactions}
        />

        {/* Modal de Criação de Carteira */}
        {showCreateWalletModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Criar Carteira Digital</h2>
              
              <p className="text-gray-600 mb-6">
                Informe sua chave PagBank para integrar sua carteira digital e começar a receber pagamentos.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave PagBank *
                  </label>
                  <input
                    type="text"
                    value={walletFormData.chave_pagbank}
                    onChange={(e) => setWalletFormData({ ...walletFormData, chave_pagbank: e.target.value })}
                    placeholder="Digite sua chave PagBank"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Sua chave de integração com o PagBank
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Saldo Inicial (opcional)
                  </label>
                  <input
                    type="number"
                    value={walletFormData.saldo}
                    onChange={(e) => setWalletFormData({ ...walletFormData, saldo: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valor inicial da carteira (padrão: R$ 0,00)
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateWalletModal(false)
                    setWalletFormData({ chave_pagbank: '', saldo: 0 })
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  disabled={loadingWallet}
                >
                  Cancelar
                </button>
                <button
                  onClick={createWallet}
                  disabled={loadingWallet || !walletFormData.chave_pagbank}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loadingWallet ? 'Criando...' : 'Criar Carteira'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Recarga */}
        {showRechargeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Adicionar Saldo</h2>
              
              {!rechargeQrCode ? (
                <>
                  <p className="text-gray-600 mb-6">
                    Informe o valor que deseja adicionar à sua carteira. Você receberá um QR Code PIX para pagamento.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor da Recarga (R$) *
                      </label>
                      <input
                        type="number"
                        value={rechargeAmount || ''}
                        onChange={(e) => setRechargeAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-semibold"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Valor mínimo: R$ 0,01
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">Como funciona?</p>
                          <p className="text-xs text-blue-700 mt-1">
                            Após confirmar, você receberá um QR Code PIX. Pague usando seu banco e o saldo será creditado automaticamente.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setShowRechargeModal(false)
                        setRechargeAmount(0)
                        setRechargeQrCode('')
                        setRechargeQrCodeUrl('')
                        setRechargeData(null)
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      disabled={loadingRecharge}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={requestRecharge}
                      disabled={loadingRecharge || rechargeAmount <= 0}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {loadingRecharge ? 'Gerando...' : 'Gerar QR Code'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Recarga Solicitada!</h3>
                    <p className="text-gray-600 mb-6">
                      Escaneie o QR Code abaixo para pagar R$ {rechargeAmount.toFixed(2)}
                    </p>
                  </div>

                  {rechargeQrCodeUrl && (
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 mb-4">
                      <img 
                        src={rechargeQrCodeUrl} 
                        alt="QR Code PIX" 
                        className="w-full max-w-xs mx-auto"
                      />
                    </div>
                  )}

                  {rechargeQrCode && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código PIX Copia e Cola
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={rechargeQrCode}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs bg-gray-50"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(rechargeQrCode)
                            alert('Código copiado!')
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">Modo Sandbox (Teste)</p>
                        <p className="text-xs text-blue-700 mt-1">
                          Este é um ambiente de testes. Clique no botão abaixo para simular o pagamento e creditar o valor na sua carteira.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={confirmSandboxPayment}
                      disabled={loadingRecharge}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loadingRecharge ? (
                        'Processando...'
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Simular Pagamento (Sandbox)
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setShowRechargeModal(false)
                        setRechargeAmount(0)
                        setRechargeQrCode('')
                        setRechargeQrCodeUrl('')
                        setRechargeData(null)
                      }}
                      disabled={loadingRecharge}
                      className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </>
    )
  }

  // Profile Screen
  if (currentScreen === 'profile') {
    return (
      <ProfileScreen
        key={`profile-${loggedUser?.nome}-${loggedUser?.email}`}
        userName={loggedUser?.nome || 'Usuário'}
        userEmail={loggedUser?.email || ''}
        userPhone={loggedUser?.telefone || ''}
        userAddress=""
        profilePhoto={profilePhoto || loggedUser?.foto || null}
        notificationsEnabled={notificationsEnabled}
        onBack={() => handleScreenTransition('home')}
        onPhotoChange={(file) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            setProfilePhoto(e.target?.result as string)
          }
          reader.readAsDataURL(file)
        }}
        onChangePassword={() => handleScreenTransition('change-password')}
        onLogout={() => {
          localStorage.removeItem('authToken')
          localStorage.removeItem('userData')
          setLoggedUser(null)
          handleScreenTransition('login')
        }}
        onUpdateProfile={handleUpdateProfile}
        onToggleNotifications={(enabled) => {
          setNotificationsEnabled(enabled)
          localStorage.setItem('notificationsEnabled', JSON.stringify(enabled))
        }}
      />
    )
  }

  // OLD Profile Screen (commented for reference)
  if (false && currentScreen === 'profile') {
    return (
      <>
      <div className={`min-h-screen bg-gray-100 transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        {/* Header */}
        <div className="bg-green-500 text-white p-4 relative">
          <button
            onClick={() => handleScreenTransition('home')}
            className="absolute left-4 top-4 text-white hover:text-gray-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">Perfil</h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-lg p-8 backdrop-blur-sm border border-gray-100">
            <div className="flex flex-col items-center text-center">
              {/* Profile Photo */}
              <div className="relative mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt="Foto do perfil" 
                      className="w-full h-full object-cover"
                    />
                  ) : loggedUser?.foto ? (
                    <img 
                      src={loggedUser.foto} 
                      alt="Foto do perfil" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <button 
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (e) => {
                          setProfilePhoto(e.target?.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }
                    input.click()
                  }}
                  className="absolute bottom-2 right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors shadow-lg"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-1">{loggedUser?.nome || 'Usuário'}</h2>
              <p className="text-gray-600 mb-4">{loggedUser?.email}</p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações do Perfil</h3>
            
            <div className="space-y-4">
              {/* Nome */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-800">Nome Completo</p>
                    <p className="text-gray-600 text-sm">{loggedUser?.nome || 'Não informado'}</p>
                  </div>
                </div>
                <button className="text-green-500 hover:text-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-800">Email</p>
                    <p className="text-gray-600 text-sm">{loggedUser?.email || 'Não informado'}</p>
                  </div>
                </div>
                <button className="text-green-500 hover:text-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>

              {/* Telefone */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-800">Telefone</p>
                    <p className="text-gray-600 text-sm">{loggedUser?.telefone || 'Não informado'}</p>
                  </div>
                </div>
                <button className="text-green-500 hover:text-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Other Configurations */}
          <div className="bg-white rounded-xl shadow-lg p-6 backdrop-blur-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Outras Configurações</h3>
            
            <div className="space-y-4">
              {/* Notificações */}
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <Bell className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 block">Notificações</span>
                    <span className="text-xs text-gray-500">Receber alertas e avisos</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newValue = !notificationsEnabled
                    setNotificationsEnabled(newValue)
                    localStorage.setItem('notificationsEnabled', JSON.stringify(newValue))
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationsEnabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <button 
                onClick={() => handleScreenTransition('change-password')}
                className="w-full flex items-center justify-between py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Lock className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-800">Alterar Senha</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Botão Sair */}
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-between py-3 px-4 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 transform hover:scale-[1.01] hover:shadow-md"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <ArrowLeft className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="font-medium text-red-800">Sair</span>
                </div>
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <NotificationSidebar
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onClearAll={handleClearAllNotifications}
      />
      </>
    )
  }

  // Home Screen
  if (currentScreen === 'home') {
    return (
      <>
      <div className={`min-h-screen ${themeClasses.bg} flex transition-all duration-300 overflow-x-hidden ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        {/* Sidebar - escondida em mobile */}
        <div className="hidden md:block w-64 bg-gradient-to-b from-green-500 via-green-600 to-green-700 text-white p-4 animate-slideInLeft shadow-2xl backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
              {profilePhoto ? (
                <img src={profilePhoto} alt="User" className="w-full h-full object-cover" />
              ) : loggedUser?.foto ? (
                <img src={loggedUser.foto} alt="User" className="w-full h-full object-cover" />
              ) : (
                <img src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" alt="User" className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <p className="font-semibold">Olá, {loggedUser?.nome?.split(' ')[0] || 'Lara'}</p>
              <p className="text-green-200 text-sm">Boa tarde! 16:30</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button className="w-full flex items-center p-3 bg-white bg-opacity-20 rounded-lg">
              <Home className="w-5 h-5 mr-3" />
              <span>Home</span>
            </button>
            <button 
              onClick={() => handleScreenTransition('wallet')}
              className="w-full flex items-center p-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <CreditCard className="w-5 h-5 mr-3" />
              <span>Carteira</span>
            </button>
            <button 
              onClick={() => handleScreenTransition('orders')}
              className="w-full flex items-center p-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <FileText className="w-5 h-5 mr-3" />
              <span>Pedidos</span>
            </button>
            <button 
              onClick={() => handleScreenTransition('profile')}
              className="w-full flex items-center p-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <UserIconLucide className="w-5 h-5 mr-3" />
              <span>Perfil</span>
            </button>
          </nav>
          
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 md:p-6 animate-slideInRight backdrop-blur-sm overflow-x-hidden">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            {/* Menu mobile - visível apenas em mobile */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-lg ${themeClasses.bgCard} shadow-md`}
              >
                <Menu className={`w-6 h-6 ${themeClasses.text}`} />
              </button>
            </div>
            <div className="hidden md:block"></div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Toggle de tema */}
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl ${
                  isDarkMode ? 'bg-yellow-500 text-white hover:bg-yellow-400' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title={isDarkMode ? 'Modo claro' : 'Modo escuro'}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <ShoppingCart className={`w-6 h-6 ${themeClasses.textSecondary}`} />
              <Mail className={`w-6 h-6 ${themeClasses.textSecondary}`} />
              <button
                onClick={handleToggleNotifications}
                className="relative hover:scale-110 transition-transform"
              >
                <Bell className={`w-6 h-6 ${themeClasses.textSecondary}`} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </button>
            </div>
          </div>

          {/* Menu mobile dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden mb-4 bg-white rounded-lg shadow-lg p-4 animate-slideDown">
              <nav className="space-y-2">
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center p-3 bg-green-100 text-green-700 rounded-lg font-medium"
                >
                  <Home className="w-5 h-5 mr-3" />
                  <span>Home</span>
                </button>
                <button 
                  onClick={() => {
                    handleScreenTransition('wallet')
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center p-3 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <CreditCard className="w-5 h-5 mr-3" />
                  <span>Carteira</span>
                </button>
                <button 
                  onClick={() => {
                    handleScreenTransition('orders')
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center p-3 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FileText className="w-5 h-5 mr-3" />
                  <span>Pedidos</span>
                </button>
                <button 
                  onClick={() => {
                    handleScreenTransition('profile')
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center p-3 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <UserIconLucide className="w-5 h-5 mr-3" />
                  <span>Perfil</span>
                </button>
              </nav>
            </div>
          )}

          {/* Aba de serviço ativo */}
          {activeServiceId && (
            <div className={`${themeClasses.bgCard} ${themeClasses.border} border rounded-lg p-4 mb-6 shadow-lg animate-slideDown`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <h3 className={`font-semibold ${themeClasses.text}`}>Serviço em andamento</h3>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>
                      {serviceStartTime && `Iniciado há ${Math.floor((new Date().getTime() - serviceStartTime.getTime()) / 60000)} min`}
                    </p>
                    {selectedDestination && (
                      <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                        📍 {selectedDestination.address.split(',')[0]}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleScreenTransition('service-tracking')}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Ver Status
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja cancelar o serviço ativo?')) {
                        ServiceTrackingManager.clearActiveService()
                        setActiveServiceId(null)
                        setServiceStartTime(null)
                        setSelectedDestination(null)
                      }
                    }}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                    title="Cancelar serviço"
                  >
                    ❌
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mensagem quando não há serviço ativo */}
          {!activeServiceId && (
            <div className={`${themeClasses.bgCard} ${themeClasses.border} border rounded-lg p-4 mb-6 shadow-sm text-center`}>
              <p className={`${themeClasses.textSecondary}`}>
                Nenhum serviço solicitado no momento
              </p>
            </div>
          )}

          {/* Hero section */}
          <div className="bg-green-500 text-white rounded-lg p-4 md:p-6 mb-4 md:mb-6 flex items-center">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Agende já o seu<br />
                serviço sem sair<br />
                de casa
              </h2>
              <button 
                onClick={() => handleScreenTransition('service-create')}
                className="bg-white text-green-500 px-4 md:px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm md:text-base"
              >
                Serviços
              </button>
            </div>
            <div className="w-20 h-20 md:w-32 md:h-32 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 ml-4">
              <svg viewBox="0 0 100 100" className="w-20 h-24">
                {/* Celular com chat */}
                <rect x="25" y="10" width="50" height="80" rx="8" fill="#FFF" stroke="#333" strokeWidth="2"/>
                <rect x="30" y="15" width="40" height="60" fill="#F8F9FA"/>
                <circle cx="50" cy="20" r="2" fill="#333"/>
                
                {/* Avatar do usuário */}
                <circle cx="40" cy="30" r="4" fill="#E8F5E8"/>
                <rect x="37" y="27" width="6" height="3" fill="#4CAF50"/>
                <rect x="37" y="31" width="6" height="6" fill="#4CAF50"/>
                
                {/* Mensagens de chat */}
                <rect x="32" y="40" width="12" height="3" rx="1" fill="#FF69B4"/>
                <rect x="32" y="45" width="8" height="3" rx="1" fill="#CCC"/>
                <rect x="50" y="50" width="15" height="3" rx="1" fill="#4CAF50"/>
                <rect x="55" y="55" width="10" height="3" rx="1" fill="#4CAF50"/>
                <rect x="32" y="60" width="10" height="3" rx="1" fill="#CCC"/>
                
                {/* Botão home */}
                <circle cx="50" cy="82" r="3" fill="#333"/>
              </svg>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400 transition-colors duration-200" />
            <input
              type="text"
              placeholder="Solicite seu serviço"
              onClick={handleServiceRequest}
              className="w-full pl-10 pr-4 py-4 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all duration-200 hover:border-blue-400 hover:shadow-lg shadow-sm bg-white/80 backdrop-blur-sm"
            />
          </div>

          {/* Service cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {serviceCards.map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedEstablishmentType(service.id)
                  handleScreenTransition('establishments-list')
                }}
                className={`${themeClasses.bgCard} p-4 md:p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 text-center group ${themeClasses.border} border backdrop-blur-sm`}
              >
                <div className="group-hover:animate-pulse transition-all duration-300">
                  {service.image}
                </div>
                <p className={`font-semibold group-hover:text-green-500 transition-colors duration-300 ${themeClasses.text}`}>{service.name}</p>
              </button>
            ))}
          </div>

        </div>
      </div>
      
      <NotificationSidebar
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onClearAll={handleClearAllNotifications}
      />
      </>
    )
  }

  // Profile Setup Screen
  if (currentScreen === 'profile-setup') {
    return (
      <div className={`min-h-screen bg-gray-800 flex transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        {/* Left side - Illustration */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-64 h-64 bg-green-500 rounded-lg flex items-center justify-center mb-8 mx-auto">
              <div className="text-white">
                <div className="w-32 h-32 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Package className="w-16 h-16" />
                </div>
                <div className="flex justify-center space-x-4">
                  <div className="w-8 h-1 bg-white rounded"></div>
                  <div className="w-8 h-1 bg-white bg-opacity-50 rounded"></div>
                </div>
              </div>
            </div>
            <FacilitaLogo />
          </div>
        </div>

        {/* Right side - Profile form */}
        <div className="flex-1 bg-white p-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 bg-blue-200 rounded-full flex items-center justify-center mx-auto overflow-hidden">
                  {profileData.foto ? (
                    <img 
                      src={URL.createObjectURL(profileData.foto)} 
                      alt="Foto do perfil" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-blue-600" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors cursor-pointer">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <h2 className="text-xl font-bold text-gray-800">{loggedUser?.nome || 'Luiz Inacio Lula da Silva'}</h2>
              <p className="text-gray-600">Complete seu perfil</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm mb-2">CPF *</label>
                <input
                  type="text"
                  value={profileData.cpf}
                  onChange={(e) => handleCPFChange(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  maxLength={14}
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-2">Tipo de Necessidade *</label>
                <select
                  value={profileData.necessidade}
                  onChange={(e) => setProfileData({...profileData, necessidade: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecione sua necessidade</option>
                  <option value="IDOSO">Idoso</option>
                  <option value="DEF_MOTORA">Deficiência motora</option>
                  <option value="DEF_VISUAL">Deficiência visual</option>
                  <option value="DEF_AUDITIVA">Deficiência auditiva</option>
                  <option value="DEF_INTELECTUAL">Deficiência intelectual</option>
                </select>
              </div>

              <div className="relative">
                <label className="block text-gray-700 text-sm mb-2">Endereço (opcional)</label>
                <input
                  type="text"
                  value={profileData.endereco}
                  onChange={async (e) => {
                    const value = e.target.value
                    setProfileData({...profileData, endereco: value})
                    
                    // Buscar sugestões de endereço quando digitar mais de 3 caracteres
                    if (value.length > 3) {
                      setIsSearchingAddress(true)
                      setShowAddressSuggestions(true)
                      
                      try {
                        // Usar API do Nominatim para buscar endereços no Brasil
                        const response = await fetch(
                          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=br&limit=5&addressdetails=1`,
                          {
                            headers: {
                              'User-Agent': 'FacilitaApp/1.0'
                            }
                          }
                        )
                        
                        if (response.ok) {
                          const data = await response.json()
                          setAddressSuggestions(data)
                        }
                      } catch (error) {
                        console.error('Erro ao buscar endereços:', error)
                      } finally {
                        setIsSearchingAddress(false)
                      }
                    } else {
                      setShowAddressSuggestions(false)
                      setAddressSuggestions([])
                    }
                  }}
                  onBlur={() => {
                    // Delay para permitir clique na sugestão
                    setTimeout(() => setShowAddressSuggestions(false), 200)
                  }}
                  onFocus={() => {
                    if (addressSuggestions.length > 0) {
                      setShowAddressSuggestions(true)
                    }
                  }}
                  placeholder="Digite seu endereço"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                
                {/* Sugestões de endereço */}
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setProfileData({...profileData, endereco: suggestion.display_name})
                          setShowAddressSuggestions(false)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-200 last:border-b-0 transition-colors"
                      >
                        <div className="text-sm text-gray-800">{suggestion.display_name}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {isSearchingAddress && (
                  <div className="absolute right-3 top-10 text-gray-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-1">Digite para ver sugestões de endereços</p>
              </div>


              <button
                onClick={handleProfileSetup}
                disabled={!profileData.cpf || !profileData.necessidade}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  profileData.cpf && profileData.necessidade
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Completar Perfil
              </button>
              
              <p className="text-xs text-gray-500 text-center">
                * Campos obrigatórios
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentScreen === 'service-provider') {
    return (
      <div className={`min-h-screen bg-gray-100 flex flex-col transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        <div className="bg-green-500 text-white p-4 md:p-6 text-center relative">
          <button
            onClick={() => handleScreenTransition('account-type')}
            className="absolute left-4 top-4 md:left-6 md:top-6 text-white hover:text-gray-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg md:text-xl font-bold">Tipo de conta</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Prestador de Serviço</h2>
          <p className="text-sm md:text-base text-gray-600 mb-2 px-4">
            Este aplicativo de delivery foi desenvolvido exclusivamente para uso em dispositivos
          </p>
          <p className="text-sm md:text-base text-gray-600 mb-2 px-4">móveis (celulares).</p>
          <p className="text-sm md:text-base text-gray-600 mb-8 px-4">
            Por favor, acesse pelo seu{' '}
            <span className="text-green-500 font-semibold">smartphone</span>{' '}
            para continuar utilizando.
          </p>

          <UserIcon />

          <button
            onClick={handleServiceProviderSubmit}
            disabled={isLoading}
            className="bg-green-500 text-white px-8 md:px-12 py-3 rounded-full font-semibold hover:bg-green-600 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? 'Cadastrando...' : 'Voltar'}
          </button>
        </div>
      </div>
    )
  }

  if (currentScreen === 'account-type') {
    return (
      <div className={`min-h-screen bg-gray-100 flex flex-col transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        <div className="bg-green-500 text-white p-4 md:p-6 text-center relative">
          <button
            onClick={() => handleScreenTransition('cadastro')}
            className="absolute left-4 top-4 md:left-6 md:top-6 text-white hover:text-gray-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg md:text-2xl font-bold px-4">Qual tipo de conta deseja criar?</h1>
          <p className="text-green-100 mt-2 text-sm md:text-base px-4">Escolha a opção que mais combina com seu perfil.</p>
        </div>

        <div className="flex-1 flex flex-col justify-center p-4 md:p-8 space-y-4 md:space-y-6">
          <div
            onClick={() => setSelectedAccountType('CONTRATANTE')}
            className={`bg-white rounded-lg p-4 md:p-6 shadow-md cursor-pointer transition-all hover:shadow-lg ${
              selectedAccountType === 'CONTRATANTE' ? 'ring-2 ring-green-500 bg-green-50' : ''
            }`}
          >
            <div className="flex flex-col md:flex-row items-center md:space-x-4 space-y-4 md:space-y-0">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-12 h-12">
                  {/* Pessoa com camisa verde acenando */}
                  <circle cx="50" cy="85" r="15" fill="#E8F5E8"/>
                  <circle cx="50" cy="35" r="12" fill="#FFDBCB"/>
                  <path d="M45 30 Q50 25 55 30" fill="#8B4513"/>
                  <circle cx="47" cy="33" r="1" fill="#333"/>
                  <circle cx="53" cy="33" r="1" fill="#333"/>
                  <path d="M48 37 Q50 39 52 37" fill="none" stroke="#333" strokeWidth="1"/>
                  <rect x="42" y="47" width="16" height="20" fill="#4CAF50"/>
                  <rect x="35" y="52" width="8" height="12" fill="#FFDBCB"/>
                  <rect x="57" y="52" width="8" height="12" fill="#FFDBCB"/>
                  <circle cx="30" cy="45" r="3" fill="#FFDBCB"/>
                  <rect x="42" y="67" width="6" height="15" fill="#333"/>
                  <rect x="52" y="67" width="6" height="15" fill="#333"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 text-center md:text-left">Contratante</h3>
                <p className="text-sm md:text-base text-gray-600 text-center md:text-left">
                  Quero contratar prestadores de serviço para minhas necessidades.
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedAccountType('PRESTADOR')}
            className={`bg-white rounded-lg p-4 md:p-6 shadow-md cursor-pointer transition-all hover:shadow-lg ${
              selectedAccountType === 'PRESTADOR' ? 'ring-2 ring-green-500 bg-green-50' : ''
            }`}
          >
            <div className="flex flex-col md:flex-row items-center md:space-x-4 space-y-4 md:space-y-0">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-12 h-12">
                  {/* Pessoa com camisa verde acenando */}
                  <circle cx="50" cy="85" r="15" fill="#E8F5E8"/>
                  <circle cx="50" cy="35" r="12" fill="#FFDBCB"/>
                  <path d="M45 30 Q50 25 55 30" fill="#8B4513"/>
                  <circle cx="47" cy="33" r="1" fill="#333"/>
                  <circle cx="53" cy="33" r="1" fill="#333"/>
                  <path d="M48 37 Q50 39 52 37" fill="none" stroke="#333" strokeWidth="1"/>
                  <rect x="42" y="47" width="16" height="20" fill="#4CAF50"/>
                  <rect x="35" y="52" width="8" height="12" fill="#FFDBCB"/>
                  <rect x="57" y="52" width="8" height="12" fill="#FFDBCB"/>
                  <circle cx="30" cy="45" r="3" fill="#FFDBCB"/>
                  <rect x="42" y="67" width="6" height="15" fill="#333"/>
                  <rect x="52" y="67" width="6" height="15" fill="#333"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 text-center md:text-left">Prestador de Serviço</h3>
                <p className="text-sm md:text-base text-gray-600 text-center md:text-left">
                  Quero oferecer meus serviços e encontrar clientes.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <button
            onClick={handleAccountTypeSubmit}
            disabled={!selectedAccountType || isLoading}
            className="w-full bg-green-500 text-white py-3 md:py-4 rounded-full text-base md:text-lg font-semibold hover:bg-green-600 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? 'Processando...' : 'Entrar'}
          </button>
        </div>
      </div>
    )
  }

  if (currentScreen === 'verification') {
    return (
      <div className={`min-h-screen bg-gray-800 flex flex-col md:flex-row transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 relative order-2 md:order-1">
          <div className="absolute top-4 left-4 md:top-8 md:left-8">
            <FacilitaLogo />
          </div>
          <div className="flex-1 flex items-center justify-center p-4 md:p-8">
            <img 
              src="/undraw_order-delivered_puaw 3.png" 
              alt="Ilustração de entrega" 
              className="w-full max-w-md h-auto object-contain"
            />
          </div>
        </div>
        
        <div className="w-full md:w-1/2 bg-gray-700 min-h-screen p-4 md:p-8 flex flex-col justify-center relative order-1 md:order-2 overflow-hidden">
          <img
            src="./Vector copy.png"
            alt="Decoração da tela de verificação de código"
            className="absolute top-0 right-0 transform -scale-x-100 opacity-20 w-64 h-auto pointer-events-none"
          />
          
          <div className="relative z-10 text-center">
            <h2 className="text-xl md:text-2xl text-white font-bold mb-2">Recuperação de senha</h2>
            <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8 px-4">
              Informe o código de 5 dígitos que foi<br />
              enviado para o sms *********
            </p>

            <div className="flex justify-center space-x-2 md:space-x-3 mb-4 px-4">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                 onChange={(e) => {
                   handleCodeChange(index, e.target.value)
                   clearError('verificationCode')
                 }}
                  className="w-10 h-10 md:w-12 md:h-12 bg-gray-600 text-white text-center text-lg md:text-xl rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              ))}
            </div>
           {errors.verificationCode && (
             <p className="text-red-500 text-sm mb-2 text-center">{errors.verificationCode}</p>
           )}

            <p className="text-red-400 text-sm mb-2">Código não foi enviado?</p>
            <p className="text-gray-400 text-sm mb-6 md:mb-8">
              Reenviar o código em {countdown} segundos.
            </p>

            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 px-4">
              <button
                onClick={() => handleScreenTransition('recovery')}
                className="flex-1 bg-transparent border border-green-500 text-green-500 py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-green-500 hover:text-white transition-colors"
              >
                Tentar outro método
              </button>
              <button
                onClick={handleVerification}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-green-600 transition-colors"
              >
                Verificar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentScreen === 'recovery') {
    return (
      <div className={`min-h-screen bg-gray-800 flex flex-col md:flex-row transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 relative order-2 md:order-1">
          <div className="absolute top-4 left-4 md:top-8 md:left-8">
            <FacilitaLogo />
          </div>
          <div className="flex-1 flex items-center justify-center p-4 md:p-8">
            <img 
              src="/undraw_order-delivered_puaw 3.png" 
              alt="Ilustração de entrega" 
              className="w-full max-w-md h-auto object-contain"
            />
          </div>
        </div>
        
        <div className="w-full md:w-1/2 bg-gray-700 min-h-screen p-4 md:p-8 flex flex-col justify-center relative order-1 md:order-2 overflow-hidden">
          <img
            src="./Vector copy.png"
            alt="Decoração da tela de recuperação de senha"
            className="absolute top-0 right-0 transform -scale-x-100 opacity-20 w-64 h-auto pointer-events-none"
          />
          
          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl text-white font-bold mb-2">Recuperar senha</h2>
            <p className="text-sm md:text-base text-gray-400 mb-4">
              Digite seu e-mail ou telefone para<br />
              recuperar sua senha
            </p>
            <div className="bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg p-3 mb-6">
              <p className="text-blue-300 text-xs">
                📱 <strong>Formatos aceitos:</strong><br />
                • <strong>E-mail:</strong> usuario@exemplo.com<br />
                • <strong>Telefone:</strong> 11987654321, (11) 98765-4321, +55 11 98765-4321<br />
                <span className="text-blue-200">ℹ️ O sistema normaliza automaticamente qualquer formato de telefone</span>
              </p>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-gray-400 text-sm mb-2">E-mail ou Telefone</label>
                <div className="relative">
                  <input
                    type="text"
                    value={recoveryContact}
                   onChange={(e) => {
                     const value = e.target.value
                     setRecoveryContact(value)
                     clearError('recoveryContact')
                     
                     // Log para mostrar como o telefone será normalizado
                     if (value && !value.includes('@')) {
                       const normalized = normalizePhoneNumber(value)
                       console.log('Telefone digitado:', value)
                       console.log('Telefone normalizado:', normalized)
                       console.log('Válido:', isValidPhone(value))
                     }
                   }}
                    placeholder="exemplo@email.com ou 11987654321"
                    className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg pr-10 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <Mail className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
               {errors.recoveryContact && (
                 <p className="text-red-500 text-sm mt-1">{errors.recoveryContact}</p>
               )}
               
               {/* Mostrar preview da normalização do telefone */}
               {recoveryContact && !recoveryContact.includes('@') && (
                 <div className="mt-2 text-xs">
                   {isValidPhone(recoveryContact) ? (
                     <p className="text-green-400">
                       ✅ Telefone válido: {normalizePhoneNumber(recoveryContact)}
                     </p>
                   ) : recoveryContact.length > 3 ? (
                     <p className="text-yellow-400">
                       ⚠️ Formato: {normalizePhoneNumber(recoveryContact)} (precisa ter 11 dígitos)
                     </p>
                   ) : null}
                 </div>
               )}
              </div>

              <button
                onClick={handleRecoverySubmit}
                className="w-full bg-green-500 text-white py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-green-600 transition-colors"
              >
                Enviar código
              </button>

              <p className="text-center text-gray-400 text-sm">
                Lembrou da senha?{' '}
                <button
                  onClick={() => handleScreenTransition('login')}
                  className="text-green-500 hover:underline"
                >
                  Voltar ao login
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentScreen === 'success') {
    return (
      <div className={`min-h-screen bg-gray-800 flex items-center justify-center transition-all duration-300 ${
        isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white border-l-0 border-t-0 transform rotate-45"></div>
          </div>
          <h2 className="text-2xl text-white font-bold mb-2">Criado com sucesso!</h2>
          <p className="text-gray-400">Redirecionando para o login...</p>
        </div>
      </div>
    )
  }

  // Generic Establishments List Screen
  if (currentScreen === 'establishments-list') {
    const establishments = nearbyPlaces.length > 0 ? nearbyPlaces : getEstablishmentsByType(selectedEstablishmentType)
    const typeNames = {
      'farmacia': 'Farmácias',
      'mercado': 'Mercados',
      'restaurante': 'Restaurantes',
      'posto': 'Postos de Combustível',
      'banco': 'Bancos',
      'hospital': 'Hospitais',
      'shopping': 'Shopping Centers',
      'correios': 'Correios'
    }
    
    const typeName = typeNames[selectedEstablishmentType as keyof typeof typeNames] || 'Estabelecimentos'

    return (
      <div className={`min-h-screen ${themeClasses.bg} transition-all duration-500 ${
        isTransitioning ? 'opacity-0 translate-y-full' : 'opacity-100 translate-y-0'
      }`}>
        {/* Header com animação */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 relative shadow-lg animate-slideDown">
          <button
            onClick={() => handleScreenTransition('home')}
            className="absolute left-4 top-4 text-white hover:text-gray-200 transition-all duration-300 hover:scale-110"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-center text-xl font-bold animate-fadeIn">{typeName}</h1>
          <p className="text-center text-green-100 text-sm mt-1 animate-fadeIn animation-delay-200">
            {userLocation ? `Próximos a ${userLocation.address.split(',')[0]}` : 'Estabelecimentos próximos a você'}
          </p>
          
          {/* Botão para atualizar localização */}
          <button
            onClick={() => {
              getUserLocation()
              if (userLocation) {
                searchNearbyPlaces(userLocation.lat, userLocation.lng, selectedEstablishmentType)
              }
            }}
            className="absolute right-4 top-4 text-white hover:text-gray-200 transition-all duration-300 hover:scale-110"
            disabled={loadingPlaces}
          >
            {loadingPlaces ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <MapPin className="w-6 h-6" />
            )}
          </button>
        </div>
        
        {/* Barra de busca por CEP */}
        <div className="p-4 bg-white border-b">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Digite seu CEP para buscar próximo a você"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              onKeyPress={async (e) => {
                if (e.key === 'Enter') {
                  const cep = e.currentTarget.value.replace(/\D/g, '')
                  if (cep.length === 8) {
                    const addressData = await fetchAddressFromCEP(cep)
                    if (addressData) {
                      // Simular coordenadas baseadas no endereço (em produção, usar geocoding)
                      const lat = -23.5505 + (Math.random() - 0.5) * 0.1
                      const lng = -46.6333 + (Math.random() - 0.5) * 0.1
                      setUserLocation({ lat, lng, address: addressData.address })
                      searchNearbyPlaces(lat, lng, selectedEstablishmentType)
                    }
                  }
                }
              }}
            />
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading indicator */}
        {loadingPlaces && (
          <div className="p-8 text-center">
            <div className="inline-flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Buscando estabelecimentos próximos...</span>
            </div>
          </div>
        )}
        
        {/* Content com animações escalonadas */}
        <div className="p-4 space-y-4">
          {establishments.map((establishment, index) => (
            <div 
              key={establishment.id} 
              className={`${themeClasses.bgCard} rounded-xl p-4 shadow-md border ${themeClasses.border} flex items-center space-x-4 
                hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1
                animate-slideUp cursor-pointer group`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => {
                // Definir origem automaticamente quando selecionar estabelecimento
                setSelectedOriginLocation(establishment.address)
                setPickupLocation({
                  address: establishment.address,
                  lat: establishment.lat || -23.5505,
                  lng: establishment.lon || establishment.lng || -46.6333
                })
                // Navegar para seleção de destino
                handleScreenTransition('service-create')
              }}
            >
              {/* Logo/Imagem com animação */}
              <div className="relative w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                {establishment.image ? (
                  <img 
                    src={establishment.image} 
                    alt={establishment.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback para ícone se imagem não carregar
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <svg className="w-8 h-8 text-gray-400 group-hover:text-green-500 transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v1.586l8 8 8-8V5a2 2 0 00-2-2H4zm2 8a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                  </svg>
                )}
                
                {/* Badge de status */}
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  establishment.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></div>
              </div>
              
              {/* Info com animações */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold ${themeClasses.text} mb-1 group-hover:text-green-600 transition-colors duration-300 truncate`}>
                  {establishment.name}
                </h3>
                <div className={`flex items-center text-sm ${themeClasses.textSecondary} mb-2`}>
                  <MapPin className="w-4 h-4 mr-1 text-green-500 group-hover:animate-bounce" />
                  <span className="truncate">{establishment.address}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current group-hover:animate-spin" />
                    <span className={`text-sm ${themeClasses.textSecondary} ml-1`}>
                      {typeof establishment.rating === 'number' ? establishment.rating.toFixed(1) : establishment.rating}
                    </span>
                  </div>
                  <div className={`flex items-center text-sm ${themeClasses.textSecondary}`}>
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{establishment.distance}{typeof establishment.distance === 'number' ? ' km' : ''}</span>
                  </div>
                </div>
                
                {/* Informações adicionais se disponíveis */}
                {establishment.phone && (
                  <div className={`flex items-center text-xs ${themeClasses.textSecondary} mt-1`}>
                    <Phone className="w-3 h-3 mr-1" />
                    <span>{establishment.phone}</span>
                  </div>
                )}
              </div>

              {/* Seta indicativa com animação */}
              <div className="text-green-500 group-hover:translate-x-2 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
          
          {!loadingPlaces && establishments.length === 0 && (
            <div className="text-center py-12 animate-fadeIn">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum estabelecimento encontrado</h3>
              <p className="text-gray-600 mb-4">Tente buscar por CEP ou permita o acesso à sua localização.</p>
              <button
                onClick={getUserLocation}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Usar Minha Localização
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }


  // Supermarket List Screen
  if (currentScreen === 'supermarket-list') {
    const supermarkets = [
      {
        id: 1,
        name: 'Carrefour',
        address: 'Washington Luís, 1415 - São Paulo - SP',
        rating: 4.7,
        image: '/carrefour-logo.png'
      },
      {
        id: 2,
        name: 'Atacadão',
        address: 'Avenida Alzira Soares, 400',
        rating: 4.7,
        image: '/atacadao-logo.png'
      },
      {
        id: 3,
        name: 'Mercado Extra',
        address: 'Rua São Fernando, 1135 — Jardim do Golf I',
        rating: 4.7,
        image: '/extra-logo.png'
      },
      {
        id: 4,
        name: 'Atacadão',
        address: 'Avenida Alzira Soares, 400',
        rating: 4.7,
        image: '/atacadao-logo.png'
      },
      {
        id: 5,
        name: 'Atacadão',
        address: 'Avenida Alzira Soares, 400',
        rating: 4.7,
        image: '/atacadao-logo.png'
      }
    ]

    return (
      <div className={`min-h-screen bg-gray-100 transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        {/* Header */}
        <div className="bg-white shadow-sm p-4 relative">
          <button
            onClick={() => handleScreenTransition('home')}
            className="absolute left-4 top-4 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-center text-xl font-bold text-gray-800">Mercado</h1>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {supermarkets.map((supermarket) => (
            <div key={supermarket.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex items-center space-x-4">
              {/* Logo placeholder */}
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v1.586l8 8 8-8V5a2 2 0 00-2-2H4zm2 8a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                </svg>
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-1">{supermarket.name}</h3>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <MapPin className="w-4 h-4 mr-1 text-green-500" />
                  <span>{supermarket.address}</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 ml-1">{supermarket.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (currentScreen === 'cadastro') {
    return (
      <div className={`min-h-screen bg-gray-800 flex flex-col md:flex-row transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        {/* Coluna da Esquerda (Imagem e Logo) */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 relative order-2 md:order-1">
          <FacilitaLogo className="mb-8" />
          <img 
            src="/undraw_order-delivered_puaw 3.png" 
            alt="Ilustração de entrega" 
            className="w-full max-w-md xl:max-w-lg 2xl:max-w-xl h-auto object-contain"
          />
        </div>
  
        {/* Coluna da Direita (Formulário) */}
        <div className="w-full md:w-1/2 bg-gray-700 min-h-screen p-6 xl:p-12 flex flex-col justify-center relative order-1 md:order-2 overflow-hidden">
          <img
            src="./Vector copy.png"
            alt="Decoração da tela de cadastro de usuário"
            className="absolute top-0 right-0 transform -scale-x-100 opacity-20 w-64 h-auto pointer-events-none"
          />
          <div className="relative z-10 w-full max-w-md xl:max-w-lg 2xl:max-w-xl mx-auto">
            <h1 className="text-4xl md:text-5xl xl:text-6xl text-white font-bold mb-8 text-center">Cadastro</h1>
            <div className="space-y-3 xl:space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Nome</label>
                <div className="relative">
                  <input
                    type="text"
                    value={userData.nome}
                    onChange={(e) => {
                      setUserData({...userData, nome: e.target.value})
                      clearError('nome')
                    }}
                    className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <User className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.nome && (
                  <p className="text-red-500 text-sm mt-1">{errors.nome}</p>
                )}
              </div>
    
              <div>
                <label className="block text-gray-400 text-sm mb-2">E-mail</label>
                <div className="relative">
                  <input
                    type="email"
                    value={userData.email}
                    onChange={(e) => {
                      setUserData({...userData, email: e.target.value})
                      clearError('email')
                    }}
                    className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <Mail className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
    
              <div>
                <label className="block text-gray-400 text-sm mb-2">Confirmar Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={userData.confirmarEmail}
                    onChange={(e) => {
                      setUserData({...userData, confirmarEmail: e.target.value})
                      clearError('confirmarEmail')
                    }}
                    className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <Mail className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.confirmarEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmarEmail}</p>
                )}
              </div>
    
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={userData.senha}
                      onChange={(e) => {
                        setUserData({...userData, senha: e.target.value})
                        clearError('senha')
                      }}
                      className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 h-5 w-5 text-gray-400"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                  {errors.senha && (
                    <p className="text-red-500 text-sm mt-1">{errors.senha}</p>
                  )}
                </div>
    
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Confirmar Senha</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={userData.confirmarSenha}
                      onChange={(e) => {
                        setUserData({...userData, confirmarSenha: e.target.value})
                        clearError('confirmarSenha')
                      }}
                      className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 h-5 w-5 text-gray-400"
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                  {errors.confirmarSenha && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmarSenha}</p>
                  )}
                </div>
              </div>
  
              <div>
                <label className="block text-gray-400 text-sm mb-2">Telefone</label>
                <div className="relative">
                  <input
                    type="text"
                    value={userData.telefone}
                    onChange={(e) => {
                      const formattedPhone = formatPhone(e.target.value)
                      setUserData({...userData, telefone: formattedPhone})
                      clearError('telefone')
                    }}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <Phone className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.telefone && (
                  <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>
                )}
              </div>

              
      
              <div className="flex justify-center">
                <button
                  onClick={handleCadastro}
                  className="bg-green-500 text-white py-3 px-16 rounded-full font-semibold hover:bg-green-600 transition-colors"
                >
                  Próximo
                </button>
              </div>
    
              <p className="text-center text-gray-400 text-sm">
                Já possui uma conta?{' '}
                <button
                  onClick={() => handleScreenTransition('login')}
                  className="text-green-500 hover:underline"
                >
                  Entrar
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Landing Page Screen
  if (currentScreen === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 overflow-hidden relative">
        {/* Elementos decorativos animados */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
          {/* Logo animado */}
          <div className="mb-8 animate-fade-in-down">
            <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 shadow-2xl">
              <Package className="w-20 h-20 text-white animate-bounce" />
            </div>
          </div>

          {/* Título principal */}
          <h1 className="text-5xl md:text-7xl font-bold text-white text-center mb-4 animate-fade-in-up">
            Facilita
          </h1>
          
          {/* Subtítulo */}
          <p className="text-xl md:text-2xl text-white/90 text-center mb-2 animate-fade-in-up delay-200">
            Entregas rápidas e seguras
          </p>
          
          <p className="text-lg md:text-xl text-white/80 text-center mb-12 max-w-2xl animate-fade-in-up delay-300">
            Conectamos você aos melhores prestadores de serviço da sua região. 
            Peça, acompanhe e receba com facilidade!
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl w-full animate-fade-in-up delay-400">
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 hover:bg-white/30">
              <Zap className="w-12 h-12 text-white mx-auto mb-3" />
              <h3 className="text-white font-semibold text-lg mb-2">Rápido</h3>
              <p className="text-white/80 text-sm">Entregas em tempo recorde</p>
            </div>
            
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 hover:bg-white/30">
              <Shield className="w-12 h-12 text-white mx-auto mb-3" />
              <h3 className="text-white font-semibold text-lg mb-2">Seguro</h3>
              <p className="text-white/80 text-sm">Pagamentos protegidos</p>
            </div>
            
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 hover:bg-white/30">
              <MapPin className="w-12 h-12 text-white mx-auto mb-3" />
              <h3 className="text-white font-semibold text-lg mb-2">Rastreável</h3>
              <p className="text-white/80 text-sm">Acompanhe em tempo real</p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md animate-fade-in-up delay-500">
            <button
              onClick={() => handleScreenTransition('login')}
              className="flex-1 bg-white text-green-600 px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Entrar
            </button>
            
            <button
              onClick={() => handleScreenTransition('cadastro')}
              className="flex-1 bg-green-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 hover:bg-green-800 flex items-center justify-center gap-2 border-2 border-white/30"
            >
              <UserPlus className="w-5 h-5" />
              Cadastrar
            </button>
          </div>

          {/* Estatísticas */}
          <div className="mt-16 grid grid-cols-3 gap-8 text-center animate-fade-in-up delay-600">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">500+</div>
              <div className="text-white/80 text-sm">Entregas</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">4.8★</div>
              <div className="text-white/80 text-sm">Avaliação</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">100+</div>
              <div className="text-white/80 text-sm">Prestadores</div>
            </div>
          </div>
        </div>

        {/* Animações CSS */}
        <style>{`
          @keyframes fade-in-down {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fade-in-down {
            animation: fade-in-down 0.6s ease-out;
          }
          
          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out;
          }
          
          .delay-200 {
            animation-delay: 0.2s;
            opacity: 0;
            animation-fill-mode: forwards;
          }
          
          .delay-300 {
            animation-delay: 0.3s;
            opacity: 0;
            animation-fill-mode: forwards;
          }
          
          .delay-400 {
            animation-delay: 0.4s;
            opacity: 0;
            animation-fill-mode: forwards;
          }
          
          .delay-500 {
            animation-delay: 0.5s;
            opacity: 0;
            animation-fill-mode: forwards;
          }
          
          .delay-600 {
            animation-delay: 0.6s;
            opacity: 0;
            animation-fill-mode: forwards;
          }
        `}</style>
      </div>
    )
  }

  // Login Screen
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-800' : 'bg-gray-800'} flex flex-col md:flex-row transition-all duration-300 ${
      isTransitioning ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-0'
    }`}>
      {/* Coluna da Esquerda (Imagem e Logo) */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 relative order-2 md:order-1">
        <FacilitaLogo className="mb-8" />
        <img 
          src="/undraw_order-delivered_puaw 3.png" 
          alt="Ilustração de entrega" 
          className="w-full max-w-md xl:max-w-lg 2xl:max-w-xl h-auto object-contain"
        />
      </div>
      
      {/* Coluna da Direita (Formulário) */}
      <div className="w-full md:w-1/2 bg-gray-700 min-h-screen p-8 flex flex-col justify-center relative order-1 md:order-2 overflow-hidden">
        {/* Toggle de tema */}
        <button
          onClick={toggleTheme}
          className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 hover:scale-110 z-20 ${
            isDarkMode ? 'bg-yellow-500 text-white' : 'bg-gray-600 text-gray-300'
          }`}
          title={isDarkMode ? 'Modo claro' : 'Modo escuro'}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <img
          src="./Vector copy.png"
          alt="Decoração da tela de login do usuário"
          className="absolute top-0 right-0 transform -scale-x-100 opacity-20 w-64 h-auto pointer-events-none"
        />
        
        <div className="relative z-10 w-full max-w-md xl:max-w-lg 2xl:max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl text-white font-bold mb-4 text-center">Entrar no Facilita</h2>
          <p className="text-sm md:text-base text-gray-400 mb-6 text-center">
            Não possui uma conta?{' '}
            <button
              onClick={() => handleScreenTransition('cadastro')}
              className="text-green-400 hover:underline"
            >
              Cadastre-se
            </button>
          </p>

          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">E-mail ou Telefone</label>
              <div className="relative">
                <input
                  type="text"
                  value={loginData.login}
                 onChange={(e) => {
                   setLoginData({...loginData, login: e.target.value})
                   clearError('loginEmail')
                 }}
                  placeholder="Digite seu e-mail ou telefone"
                  className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg pr-10 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Mail className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
             {errors.loginEmail && (
               <p className="text-red-500 text-sm mt-1">{errors.loginEmail}</p>
             )}
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Senha</label>
              <div className="relative">
                <input
                  type="password"
                  value={loginData.senha}
                 onChange={(e) => {
                   setLoginData({...loginData, senha: e.target.value})
                   clearError('loginSenha')
                 }}
                  className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg pr-10 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••••"
                />
                <Lock className="absolute right-3 top-3.h-5 w-5 text-gray-400" />
              </div>
             {errors.loginSenha && (
               <p className="text-red-500 text-sm mt-1">{errors.loginSenha}</p>
             )}
              <button
                onClick={() => handleScreenTransition('recovery')}
                className="text-green-400 text-sm mt-1 hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mr-2 accent-green-500"
              />
              <span className="text-gray-400 text-sm">
                Li e estou de acordo com a{' '}
                <button
                  onClick={() => setShowTermsModal(true)}
                  className="text-green-400 hover:underline"
                >
                  Termo de Uso
                </button>
                {' '}e{' '}
                <button
                  onClick={() => setShowTermsModal(true)}
                  className="text-green-400 hover:underline"
                >
                  Política de Privacidade
                </button>
              </span>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoginLoading}
              className={`w-full py-3 rounded-lg text-sm md:text-base font-semibold transition-colors flex items-center justify-center ${
                isLoginLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              {isLoginLoading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span className="ml-2">Entrando...</span>
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </div>
        </div>
      </div>

      
      {showTermsModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTermsModal(false)
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] md:max-h-[80vh] overflow-hidden animate-slideUp relative">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-bold">
                  Termos de Uso e Política de Privacidade
                </h2>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="max-h-60 md:max-h-96 overflow-y-auto text-xs md:text-sm text-gray-700 leading-relaxed space-y-3 md:space-y-4 mb-4 md:mb-6 pr-2">
                <p>
                  O presente Termo tem por finalidade estabelecer as regras de comportamento e de utilização dos Termos de Uso da aplicação Facilita, bem como suas funcionalidades, sendo reconhecido como parte de uma solução tecnológica que permite o controle de recebimento e expedição dos serviços oferecidos, contratados e destinados a facilitar o sistema e utilizar as funcionalidades da aplicação, sendo livre para aceitar as condições e utilizar os serviços oferecidos. Neste, as condições são apresentadas, portanto, o sistema solicitará se o usuário concorda ou não com os presentes termos.
                </p>
                
                <p>
                  A aplicação disponibiliza das mais principais de acesso, o usuário concorrente, para a pessoa responsável por solicitar os serviços, o prestador de serviços, responsável pelas soluções e oferta de contratados cidades de acordo como usuário contratante, sobre cadastro no aplicativo, disponibilizando recursos específicos de acessibilidade para todos, pessoas com deficiência ou usuários que não apresentam tais necessidades.
                </p>
                
                <p>
                  O Facilita atua exclusivamente como uma plataforma intermediadora, aproximando contratantes e prestadores, não sendo responsável pelos produtos adquiridos pela qualidade dos itens especificados na mesma execução direta dos serviços. Para maior transparência com a segurança, a plataforma implementa sistemas de verificação, entrega da documentação dos usuários, sobre funcionalidades de avaliação para a funcionalidade de acordo pelos contratantes acerca de sua experiência.
                </p>
                
                <p>
                  Por pagamentos realizados pelo contratante ocorrem unicamente por meio do cartão digital interno do aplicativo, do qual o usuário poderá adicionar ou subtrair valores. Antes disso, após de contabilizar cidades em configuração de acordo com prestador, disponibilizando recursos específicos de acessibilidade poderão pessoas com deficiência ou usuários que não apresentam tais necessidades como regras estabelecidas pela plataforma.
                </p>
              </div>

              <div className="flex items-center mb-4 space-x-2">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="accent-green-500 w-4 h-4"
                />
                <span className="text-xs md:text-sm text-gray-700">
                  Li e estou de acordo com{' '}
                  <span className="text-green-500">Termo de Uso</span> e{' '}
                  <span className="text-green-500">Política de Privacidade</span>
                </span>
              </div>

              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="flex-1 py-3 rounded-lg font-semibold transition-colors bg-gray-300 text-gray-700 hover:bg-gray-400 text-sm md:text-base"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleTermsAccept}
                  disabled={!termsAccepted}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors text-sm md:text-base ${
                    termsAccepted 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para completar perfil do contratante */}
      <CompleteProfileModal
        isOpen={showCompleteProfileModal}
        onComplete={() => {
          console.log('✅ Usuário escolheu completar perfil')
          setShowCompleteProfileModal(false)
          handleScreenTransition('profile-setup')
        }}
        onSkip={() => {
          console.log('⏭️ Usuário escolheu pular perfil - voltando para home')
          setShowCompleteProfileModal(false)
          // Voltar para home se o usuário pular
          if (currentScreen === 'service-create') {
            handleScreenTransition('home')
          }
        }}
        userName={loggedUser?.nome || 'Usuário'}
      />

      {/* Sidebar de Notificações */}
      <NotificationSidebar
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onClearAll={handleClearAllNotifications}
      />

      {/* Toast de Nova Notificação */}
      {showNotificationToast && (
        <div className="fixed top-4 right-4 z-50 animate-slideDown">
          <div className="bg-white rounded-lg shadow-2xl p-4 max-w-sm border-l-4 border-green-500 flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Nova Notificação</h4>
              <p className="text-sm text-gray-600">{notificationToastMessage}</p>
            </div>
            <button
              onClick={() => setShowNotificationToast(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
  
}

export default App
