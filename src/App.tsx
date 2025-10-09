import React, { useState, useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowLeft, Camera, MapPin, Search, Star, Clock, CreditCard, Copy, Home, FileText, MessageSquare, UserIcon as UserIconLucide, ShoppingCart, Truck, Package, Users, Sun, Moon } from 'lucide-react'
import QRCode from 'qrcode'
import LocationMap from './LocationMap'
import ServiceTracking from './components/ServiceTracking'
import ServiceRating from './components/ServiceRating'
import CompleteProfileModal from './components/CompleteProfileModal'
import LoadingSpinner from './components/LoadingSpinner'
import { ServiceTrackingManager } from './utils/serviceTrackingUtils'

type Screen = "login" | "cadastro" | "success" | "recovery" | "location-select" | "service-tracking" | "supermarket-list" | "establishments-list" | "service-rating" | "verification" | "account-type" | "service-provider" | "profile-setup" | "home" | "service-create" | "waiting-driver" | "payment" | "service-confirmed" | "tracking" | "profile" | "orders"

// Adicione esta interface antes da função App
interface ServiceTrackingProps {
  onBack: () => void
  entregador: Entregador
  destination: {
    address: string
    lat: number
    lng: number
  }
}

interface Entregador {
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
  nome: string
  email: string
  telefone: string
  tipo_conta: 'CONTRATANTE' | 'PRESTADOR'
  foto?: string
}

function App() {
  // 🔧 MODO DESENVOLVEDOR: Mude aqui para testar diferentes telas
  // 'waiting-driver', 'payment', 'service-tracking', 'service-confirmed', etc.
  const [currentScreen, setCurrentScreen] = useState<
  'login' | 'cadastro' | 'success' | 'recovery' | 'verification' | 
  'account-type' | 'service-provider' | 'profile-setup' | 'home' | 
  'location-select' | 'service-create' | 'waiting-driver' | 
  'tracking' | 'service-confirmed' | 'payment' | 'service-tracking' | 'profile' | 'orders' | 'service-rating' | 'supermarket-list' | 'establishments-list'
  >('login')  
  

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
  const [orderFilter, setOrderFilter] = useState<'TODOS' | 'EM_ANDAMENTO' | 'ENTREGUE' | 'CANCELADO'>('TODOS')
  const [ordersInitialized, setOrdersInitialized] = useState(false)
  const [serviceRating, setServiceRating] = useState<number>(0)
  const [serviceComment, setServiceComment] = useState<string>('')
  const [serviceCompletionTime, setServiceCompletionTime] = useState<Date | null>(null)
  const [selectedEstablishmentType, setSelectedEstablishmentType] = useState<string>('')
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null)
  const [serviceStartTime, setServiceStartTime] = useState<Date | null>(null)

  // Função para buscar estabelecimentos por tipo usando Google Places API
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
      'transporte': [
        {
          id: 1,
          name: 'Uber',
          address: 'Serviço de transporte por aplicativo',
          rating: 4.2,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-uber-photo',
          distance: 'Disponível',
          isOpen: true
        },
        {
          id: 2,
          name: '99',
          address: 'Serviço de transporte por aplicativo',
          rating: 4.1,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-99-photo',
          distance: 'Disponível',
          isOpen: true
        }
      ],
      'servicos': [
        {
          id: 1,
          name: 'Salão Bella Vista',
          address: 'Rua das Flores, 123 - São Paulo - SP',
          rating: 4.8,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-salao-photo',
          distance: '0.4 km',
          isOpen: true
        },
        {
          id: 2,
          name: 'Oficina do João',
          address: 'Av. Industrial, 456 - São Paulo - SP',
          rating: 4.5,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqH8ZQvz8yKxL-oficina-photo',
          distance: '1.0 km',
          isOpen: true
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
    bg: isDarkMode ? 'bg-gray-900' : 'bg-gray-100',
    bgCard: isDarkMode ? 'bg-gray-800' : 'bg-white',
    bgPrimary: isDarkMode ? 'bg-gray-800' : 'bg-green-500',
    text: isDarkMode ? 'text-white' : 'text-gray-800',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    input: isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
  }
  
  const handleAddressSelection = (address: any) => {
    setSelectedAddress(address)
    console.log("Endereço selecionado:", address)
  }
  const [selectedDestination, setSelectedDestination] = useState<{address: string, lat: number, lng: number} | null>(null)

  const handleStartTracking = (destination: {address: string, lat: number, lng: number}) => {
    console.log('🚀 Iniciando novo tracking para:', destination.address)
    
    setSelectedDestination(destination)
    
    // Define origem do prestador se não existir (usa origem selecionada como fallback)
    const originPosition = driverOrigin || 
      (pickupLocation ? { lat: pickupLocation.lat, lng: pickupLocation.lng } : 
       { lat: -23.5324859, lng: -46.7916801 }) // Fallback Carapicuíba/SP
    
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
    
    console.log('💾 Salvando novo serviço:', serviceId)
    ServiceTrackingManager.saveActiveService(serviceState)
    setActiveServiceId(serviceId)
    setServiceStartTime(new Date())
    
    handleScreenTransition('service-tracking')
  }

  // Função chamada quando o serviço é concluído automaticamente
  const handleServiceCompleted = () => {
    console.log('🎉 Serviço concluído! Redirecionando para avaliação...')
    setServiceCompletionTime(new Date())
    
    // Finalizar serviço ativo no gerenciador
    ServiceTrackingManager.completeActiveService()
    
    // Limpar estado local
    setActiveServiceId(null)
    setServiceStartTime(null)
    
    // Redirecionar para avaliação
    setTimeout(() => {
      handleScreenTransition('service-rating')
    }, 1000)
  }

  // Função para limpar serviços antigos na inicialização
  const cleanupOldServices = () => {
    const activeService = ServiceTrackingManager.loadActiveService()
    if (activeService) {
      // Se o serviço está marcado como concluído, limpar
      if (activeService.isServiceCompleted) {
        console.log('🧹 Limpando serviço concluído...')
        ServiceTrackingManager.clearActiveService()
      }
    }
  }

  
  const [entregadorData, setEntregadorData] = useState({
    nome: 'João Silva',
    telefone: '(11) 99999-9999',
    veiculo: 'Honda CG 160',
    placa: 'ABC1D23',
    rating: 4.8,
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

  // Service cards with images
  const serviceCards = [
    { 
      id: 'farmacia', 
      name: 'Farmácia', 
      image: (
        <div className="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-12 h-12">
            {/* Farmácia - Médicos com cruz verde */}
            <circle cx="20" cy="30" r="8" fill="#4CAF50"/>
            <rect x="16" y="40" width="8" height="20" fill="#4CAF50"/>
            <circle cx="80" cy="35" r="8" fill="#FF69B4"/>
            <rect x="76" y="45" width="8" height="18" fill="#FF69B4"/>
            <rect x="40" y="20" width="20" height="20" rx="10" fill="#E8F5E8"/>
            <rect x="47" y="25" width="6" height="10" fill="#4CAF50"/>
            <rect x="42" y="28" width="16" height="4" fill="#4CAF50"/>
            <rect x="15" y="70" width="70" height="8" fill="#4CAF50"/>
          </svg>
        </div>
      )
    },
    { 
      id: 'mercado', 
      name: 'Mercado', 
      image: (
        <div className="w-16 h-16 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-12 h-12">
            {/* Carrinho de compras vermelho */}
            <rect x="25" y="35" width="35" height="25" fill="#DC2626" stroke="#B91C1C" strokeWidth="2"/>
            <rect x="20" y="30" width="45" height="8" fill="#EF4444"/>
            <circle cx="30" cy="70" r="4" fill="#333"/>
            <circle cx="55" cy="70" r="4" fill="#333"/>
            <rect x="15" y="25" width="8" height="20" fill="#333"/>
            <rect x="65" y="35" width="3" height="15" fill="#333"/>
            
            {/* Produtos no carrinho */}
            <rect x="28" y="40" width="8" height="6" fill="#4CAF50"/>
            <rect x="38" y="38" width="6" height="8" fill="#FF9800"/>
            <rect x="46" y="42" width="10" height="4" fill="#2196F3"/>
            <circle cx="52" cy="48" r="3" fill="#F44336"/>
            
            {/* Alça do carrinho */}
            <path d="M65 35 Q75 30 75 40 Q75 50 65 45" fill="none" stroke="#333" strokeWidth="2"/>
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
            {/* Caixa de correios realista */}
            <rect x="25" y="40" width="50" height="35" fill="#FF8C00" stroke="#D2691E" strokeWidth="2"/>
            <rect x="20" y="35" width="60" height="8" fill="#8B4513"/>
            <rect x="30" y="45" width="12" height="8" fill="#FFF"/>
            <rect x="58" y="45" width="12" height="8" fill="#FFF"/>
            <text x="36" y="51" fontSize="6" fill="#000">📦</text>
            <text x="64" y="51" fontSize="6" fill="#000">♻️</text>
            <rect x="40" y="60" width="20" height="3" fill="#8B4513"/>
            <circle cx="30" cy="78" r="2" fill="#228B22"/>
            <circle cx="70" cy="78" r="2" fill="#228B22"/>
          </svg>
        </div>
      )
    },
    { 
      id: 'shopping', 
      name: 'Shopping', 
      image: (
        <div className="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-12 h-12">
            {/* Cesta de compras verde */}
            <rect x="25" y="40" width="50" height="30" fill="#22C55E" stroke="#16A34A" strokeWidth="2"/>
            <rect x="20" y="35" width="60" height="8" fill="#15803D"/>
            
            {/* Grade da cesta */}
            <line x1="30" y1="40" x2="30" y2="70" stroke="#16A34A" strokeWidth="1"/>
            <line x1="35" y1="40" x2="35" y2="70" stroke="#16A34A" strokeWidth="1"/>
            <line x1="40" y1="40" x2="40" y2="70" stroke="#16A34A" strokeWidth="1"/>
            <line x1="45" y1="40" x2="45" y2="70" stroke="#16A34A" strokeWidth="1"/>
            <line x1="50" y1="40" x2="50" y2="70" stroke="#16A34A" strokeWidth="1"/>
            <line x1="55" y1="40" x2="55" y2="70" stroke="#16A34A" strokeWidth="1"/>
            <line x1="60" y1="40" x2="60" y2="70" stroke="#16A34A" strokeWidth="1"/>
            <line x1="65" y1="40" x2="65" y2="70" stroke="#16A34A" strokeWidth="1"/>
            <line x1="70" y1="40" x2="70" y2="70" stroke="#16A34A" strokeWidth="1"/>
            
            <line x1="25" y1="45" x2="75" y2="45" stroke="#16A34A" strokeWidth="1"/>
            <line x1="25" y1="50" x2="75" y2="50" stroke="#16A34A" strokeWidth="1"/>
            <line x1="25" y1="55" x2="75" y2="55" stroke="#16A34A" strokeWidth="1"/>
            <line x1="25" y1="60" x2="75" y2="60" stroke="#16A34A" strokeWidth="1"/>
            <line x1="25" y1="65" x2="75" y2="65" stroke="#16A34A" strokeWidth="1"/>
            
            {/* Alças da cesta */}
            <path d="M20 35 Q15 30 15 40 Q15 50 20 45" fill="none" stroke="#333" strokeWidth="2"/>
            <path d="M80 35 Q85 30 85 40 Q85 50 80 45" fill="none" stroke="#333" strokeWidth="2"/>
            
            {/* Produtos na cesta */}
            <rect x="30" y="48" width="8" height="6" fill="#FFF"/>
            <rect x="40" y="52" width="6" height="8" fill="#FFF"/>
            <circle cx="60" cy="55" r="4" fill="#FFF"/>
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
      const response = await fetch('https://servidor-facilita.onrender.com/v1/facilita/pagamento/pagbank', {
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

  // Removido: useEffect de waiting-driver (agora criamos o serviço antes de ir para pagamento)

  // Generate PIX QR Code when payment screen loads
  useEffect(() => {
    if (currentScreen === 'payment') {
      const amount = servicePrice > 0 ? servicePrice : 119.99
      generatePagBankPayment(amount)
    }
  }, [currentScreen])

  // Verificar serviço ativo quando entrar na tela Home
  useEffect(() => {
    if (currentScreen === 'home' && !activeServiceId) {
      const activeService = ServiceTrackingManager.loadActiveService()
      if (activeService && !activeService.isServiceCompleted) {
        console.log('🚚 Serviço ativo detectado na Home, redirecionando para tracking...')
        console.log('📍 Posição atual do motorista:', activeService.driverPosition)
        
        setActiveServiceId(activeService.serviceId)
        setServiceStartTime(new Date(activeService.serviceStartTime))
        setSelectedDestination(activeService.destination)
        setEntregadorData(activeService.entregador)
        
        // Restaurar origem se disponível
        if (activeService.originalOrigin) {
          setDriverOrigin(activeService.originalOrigin)
        }
        
        // Redirecionar automaticamente para o tracking
        setTimeout(() => {
          handleScreenTransition('service-tracking')
        }, 500)
      }
    }
  }, [currentScreen, activeServiceId])

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
        
        // Verificar se existe serviço ativo em andamento
        const activeService = ServiceTrackingManager.loadActiveService()
        if (activeService && !activeService.isServiceCompleted) {
          console.log('🚚 Serviço ativo encontrado ao carregar página, redirecionando para tracking...')
          console.log('📍 Restaurando posição do motorista:', activeService.driverPosition)
          console.log('📊 Progresso atual:', activeService.progress)
          
          // Restaurar dados do serviço
          setSelectedDestination(activeService.destination)
          setEntregadorData(activeService.entregador)
          setServiceStartTime(new Date(activeService.serviceStartTime))
          setActiveServiceId(activeService.serviceId)
          
          // Restaurar origem se disponível
          if (activeService.originalOrigin) {
            setDriverOrigin(activeService.originalOrigin)
          }
          
          // Forçar redirecionamento para tracking
          setCurrentScreen('service-tracking')
          return
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
      throw new Error('Acesso negado - permissões insuficientes')
    }

    return response
  }

  // Função para validar email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
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
      
      setProfileData({...profileData, foto: file})
    }
  }


  // Função para limpar erro específico
  const clearError = (field: keyof ValidationErrors) => {
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }))
  }

  const handleScreenTransition = (newScreen: 'login' | 'cadastro' | 'success' | 'recovery' | 'verification' | 'account-type' | 'service-provider' | 'profile-setup' | 'home' | 'location-select' | 'service-create' | 'waiting-driver' | 'payment' | 'service-tracking' | 'service-confirmed' | 'tracking' | 'profile' | 'orders' | 'service-rating' | 'supermarket-list' | 'establishments-list') => {
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
      
      const response = await fetch('https://servidor-facilita.onrender.com/v1/facilita/usuario/login', {
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
          
          const user: LoggedUser = {
            id: data.usuario.id,
            nome: data.usuario.nome,
            email: data.usuario.email,
            telefone: data.usuario.telefone,
            tipo_conta: data.usuario.tipo_conta
          }
          
          // Armazenar usuário no localStorage também
          localStorage.setItem('loggedUser', JSON.stringify(user))
          
          setLoggedUser(user)
          console.log('👤 Usuário logado:', user)
          console.log('🆔 ID armazenado no state:', user.id)
          
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
      const response = await fetch('https://servidor-facilita.onrender.com/v1/facilita/usuario/register', {
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
            tipo_conta: selectedAccountType
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
            const loginResponse = await fetch('https://servidor-facilita.onrender.com/v1/facilita/usuario/login', {
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
                tipo_conta: selectedAccountType
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
      const response = await fetch('https://servidor-facilita.onrender.com/v1/facilita/usuario/register', {
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
      
      const response = await fetch('https://servidor-facilita.onrender.com/v1/facilita/usuario/recuperar-senha', {
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

      const response = await fetch('https://servidor-facilita.onrender.com/v1/facilita/usuario/redefinir-senha', {
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
      // Monta payload - o backend pode pegar id_usuario do token JWT
      // Mas vamos enviar explicitamente também para garantir
      const payload = {
        id_usuario: loggedUser.id, // ID do usuário logado
        id_localizacao: 1, // Fixo por enquanto
        necessidade: profileData.necessidade.toUpperCase(),
        cpf: profileData.cpf.replace(/\D/g, ''),
      }
      
      // Payload alternativo sem id_usuario (caso o backend pegue do token)
      const payloadSemId = {
        id_localizacao: 1,
        necessidade: profileData.necessidade.toUpperCase(),
        cpf: profileData.cpf.replace(/\D/g, ''),
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
      let response = await fetchWithAuth('https://servidor-facilita.onrender.com/v1/facilita/contratante/register', {
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
        response = await fetchWithAuth('https://servidor-facilita.onrender.com/v1/facilita/contratante/register', {
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
          tipo_conta: usuarioCompleto?.tipo_conta || loggedUser.tipo_conta
        }
        
        setLoggedUser(updatedUser)
        localStorage.setItem('loggedUser', JSON.stringify(updatedUser))
        console.log('✅ Usuário atualizado com dados completos:', updatedUser)
        console.log('✅ ID do usuário:', updatedUser.id)
        console.log('✅ ID do contratante:', updatedUser.id_contratante)
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

  // Tela de loading durante o login
  if (isLoginLoading) {
    return (
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
    )
  }

  // Tela de loading durante criação de serviço
  if (isLoading && currentScreen === 'service-create') {
    return (
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
      // TEMPORÁRIO: Pular pagamento e ir direto para confirmação
      // para verificar se o pedido está sendo enviado ao banco
      handleScreenTransition('service-confirmed')
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

  // Função para obter localização atual ou usar localização padrão
  const getCurrentLocationId = async () => {
    try {
      // Tentar obter localização via geolocalização do navegador
      if (navigator.geolocation) {
        return new Promise<number>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords
              console.log('📍 Localização obtida:', { latitude, longitude })
              
              // Aqui você pode implementar lógica para determinar o ID da localização
              // baseado nas coordenadas (ex: consultar API de regiões)
              // Por enquanto, usar ID baseado na região de São Paulo
              if (latitude >= -24 && latitude <= -23 && longitude >= -47 && longitude <= -46) {
                resolve(1) // Região da Grande São Paulo
              } else {
                resolve(2) // Outras regiões
              }
            },
            (error) => {
              console.warn('⚠️ Erro ao obter geolocalização:', error.message)
              resolve(1) // ID padrão em caso de erro
            },
            { timeout: 5000, enableHighAccuracy: false }
          )
        })
      } else {
        console.warn('⚠️ Geolocalização não suportada pelo navegador')
        return 1
      }
    } catch (error) {
      console.warn('⚠️ Erro na geolocalização:', error)
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
          // { id: 10, id_usuario: 32, necessidade: "...", usuario: {...} }
          // O campo "id" aqui JÁ É o id_contratante!
          const idContratante = contratanteData?.id
          const idUsuario = contratanteData?.id_usuario || contratanteData?.usuario?.id
          
          console.log('🔍 Extraindo IDs da resposta:')
          console.log('  - contratanteData.id (id_contratante):', contratanteData?.id)
          console.log('  - contratanteData.id_usuario:', contratanteData?.id_usuario)
          console.log('  - contratanteData.usuario.id:', contratanteData?.usuario?.id)
          console.log('  - ID do contratante extraído:', idContratante)
          
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
          
          // Salvar o id_contratante para uso futuro
          const updatedUser = {
            ...loggedUser,
            id_contratante: idContratante
          }
          setLoggedUser(updatedUser)
          localStorage.setItem('loggedUser', JSON.stringify(updatedUser))
          console.log('✅ ID do contratante salvo:', idContratante)
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

  // Função para mapear tipo de serviço para categoria
  const getServiceCategoryId = (description: string) => {
    const desc = description.toLowerCase()
    
    // Mapeamento de palavras-chave para IDs de categoria
    if (desc.includes('farmácia') || desc.includes('remédio') || desc.includes('medicamento')) {
      return 2 // Categoria Farmácia
    } else if (desc.includes('mercado') || desc.includes('compra') || desc.includes('supermercado')) {
      return 3 // Categoria Mercado
    } else if (desc.includes('correio') || desc.includes('encomenda') || desc.includes('pacote')) {
      return 4 // Categoria Correios
    } else if (desc.includes('shopping') || desc.includes('loja') || desc.includes('compra')) {
      return 5 // Categoria Shopping
    } else if (desc.includes('uber') || desc.includes('transporte') || desc.includes('viagem')) {
      return 6 // Categoria Transporte
    }
    
    return 1 // Categoria padrão (Geral)
  }

  // Função para obter nome da categoria pelo ID
  const getCategoryName = (id: number) => {
    const categories: { [key: number]: string } = {
      1: 'Geral',
      2: 'Farmácia',
      3: 'Mercado',
      4: 'Correios',
      5: 'Shopping',
      6: 'Transporte'
    }
    return categories[id] || 'Desconhecida'
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
            console.log('ℹ️ Erro 404 - Possíveis causas:')
            console.log('   • ID do contratante não existe no banco:', contratanteId)
            console.log('   • Rota da API incorreta')
            console.log('   • Contratante não tem pedidos')
            console.log('   • Problema na autenticação')
            setUserOrders([])
          } else {
            console.error('❌ Erro ao buscar pedidos:', response.status, errorData)
            alert(`Erro ao buscar pedidos: ${errorData.message || 'Erro desconhecido'}`)
          }
        } catch (e) {
          console.error('❌ Erro ao fazer parse da resposta de erro:', e)
          alert('Erro ao buscar pedidos. Tente novamente.')
        }
        
        // Se não conseguiu buscar da API, tentar fallback local
        if (response.status !== 404) {
          const savedService = localStorage.getItem('currentService')
          if (savedService) {
            try {
              const service = JSON.parse(savedService)
              setUserOrders([service])
            } catch (e) {
              setUserOrders([])
            }
          } else {
            setUserOrders([])
          }
        }
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
      
      // Fallback: buscar do localStorage apenas se não for erro de auth
      const savedService = localStorage.getItem('currentService')
      if (savedService) {
        try {
          const service = JSON.parse(savedService)
          setUserOrders([service])
          console.log('💾 Usando pedido salvo localmente (fallback):', service)
        } catch (e) {
          console.error('Erro ao parsear serviço salvo:', e)
          setUserOrders([])
        }
      } else {
        setUserOrders([])
      }
      
      alert('Erro ao buscar pedidos. Verifique sua conexão e tente novamente.')
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
      // Obter IDs necessários
      console.log('🔍 Obtendo ID do contratante...')
      console.log('🔍 loggedUser.id (usuario):', loggedUser?.id)
      console.log('🔍 loggedUser.id_contratante:', loggedUser?.id_contratante)
      
      const id_contratante = await getContratanteId()
      console.log('✅ ID do contratante obtido:', id_contratante)
      
      const id_localizacao = await getCurrentLocationId()
      
      const descricaoServico = serviceDescription || selectedServiceType || 'Serviço de entrega personalizado'
      const id_categoria = getServiceCategoryId(descricaoServico)
      
      // Validar dados antes de enviar
      if (!id_contratante || id_contratante <= 0) {
        console.error('❌ ID do contratante inválido:', id_contratante)
        alert('Erro: ID do contratante não foi obtido corretamente. Tente fazer login novamente.')
        return false
      }
      
      if (!id_categoria || id_categoria <= 0) {
        console.error('❌ ID da categoria inválido:', id_categoria)
        alert('Erro: Categoria do serviço não foi identificada.')
        return false
      }
      
      if (!id_localizacao || id_localizacao <= 0) {
        console.error('❌ ID da localização inválido:', id_localizacao)
        alert('Erro: Localização não foi obtida.')
        return false
      }
      
      if (!descricaoServico || descricaoServico.trim().length < 3) {
        console.error('❌ Descrição do serviço inválida:', descricaoServico)
        alert('Erro: Descrição do serviço deve ter pelo menos 3 caracteres.')
        return false
      }

      const serviceData = {
        id_contratante: Number(id_contratante),
        id_prestador: 2, // ID fixo por enquanto (ainda não tem sistema de seleção de prestador)
        id_categoria: Number(id_categoria),
        id_localizacao: Number(id_localizacao),
        descricao: descricaoServico.trim(),
        status: 'PENDENTE'
      }

      console.log('=== CRIAÇÃO DE SERVIÇO ===')
      console.log('📤 Payload para API:', serviceData)
      console.log('⚠️ IMPORTANTE: id_contratante deve ser o ID da tabela CONTRATANTE, não da tabela USUARIO')
      console.log('📊 Comparação:', {
        id_usuario: loggedUser?.id,
        id_contratante_enviado: id_contratante,
        id_contratante_salvo: loggedUser?.id_contratante
      })
      console.log('🗺 Localizações:', {
        origem: pickupLocation,
        destino: deliveryLocation,
        id_localizacao: id_localizacao
      })
      console.log('🏷️ Categoria detectada:', {
        descricao: descricaoServico,
        id_categoria: id_categoria,
        categoria_nome: getCategoryName(id_categoria)
      })
      console.log('✅ Validação dos dados:')
      console.log('  - id_contratante válido:', typeof id_contratante === 'number' && id_contratante > 0)
      console.log('  - id_categoria válido:', typeof id_categoria === 'number' && id_categoria > 0)
      console.log('  - id_localizacao válido:', typeof id_localizacao === 'number' && id_localizacao > 0)
      console.log('  - descricao válida:', typeof descricaoServico === 'string' && descricaoServico.length >= 3)
      console.log('==========================')

      console.log('📤 Enviando requisição para API...')
      console.log('🌐 URL:', 'https://servidor-facilita.onrender.com/v1/facilita/servico')
      console.log('📋 Payload:', JSON.stringify(serviceData, null, 2))
      
      const response = await fetchWithAuth('https://servidor-facilita.onrender.com/v1/facilita/servico', {
        method: 'POST',
        body: JSON.stringify(serviceData)
      })

      console.log('📥 Resposta recebida:')
      console.log('  - Status:', response.status)
      console.log('  - Status Text:', response.statusText)
      console.log('  - OK:', response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Serviço criado com sucesso!')
        console.log('📋 Resposta completa:', JSON.stringify(data, null, 2))
        
        // A API retorna: { status_code: 201, message: "...", data: { id: ... } }
        // Extrair ID do serviço de vários formatos possíveis
        let serviceId = data.id || 
                       data.servico_id || 
                       data.service_id ||
                       data.data?.id ||  // Dentro de "data"
                       data.data?.servico_id
        
        // Se a resposta for um objeto com propriedade 'servico' ou 'service'
        if (!serviceId && data.servico) {
          serviceId = data.servico.id
        }
        if (!serviceId && data.service) {
          serviceId = data.service.id
        }
        if (!serviceId && data.data?.servico) {
          serviceId = data.data.servico.id
        }
        
        console.log('🔍 Tentando extrair ID do serviço:')
        console.log('  - data.id:', data.id)
        console.log('  - data.data?.id:', data.data?.id)
        console.log('  - data.servico?.id:', data.servico?.id)
        console.log('  - ID extraído:', serviceId)
        
        if (!serviceId) {
          console.error('❌ ID do serviço não encontrado na resposta:', data)
          alert('Erro: Serviço criado mas ID não foi retornado. Entre em contato com o suporte.')
          return false
        }
        
        console.log('🆔 ID do serviço criado:', serviceId)
        setCreatedServiceId(serviceId)
        
        // Salvar dados do serviço no localStorage para referência
        const serviceInfo = {
          id: serviceId,
          id_contratante: serviceData.id_contratante,
          id_prestador: serviceData.id_prestador,
          id_categoria: serviceData.id_categoria,
          id_localizacao: serviceData.id_localizacao,
          descricao: serviceData.descricao,
          status: 'PENDENTE',
          preco: servicePrice > 0 ? servicePrice : 119.99,
          origem: pickupLocation,
          destino: deliveryLocation,
          createdAt: new Date().toISOString(),
          userId: loggedUser?.email
        }
        localStorage.setItem('currentService', JSON.stringify(serviceInfo))
        
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
            errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.'
          } else {
            errorMessage = errorData.message || `Erro ${response.status}: ${response.statusText}`
          }
          
          alert(`Erro ao criar serviço: ${errorMessage}`)
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
      
      const response = await fetchWithAuth('https://servidor-facilita.onrender.com/v1/facilita/pagamento', {
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
    return (
      <ServiceRating
        onBack={() => handleScreenTransition('service-tracking')}
        onFinish={() => handleScreenTransition('home')}
        entregador={entregadorData}
        serviceCompletionTime={serviceCompletionTime || new Date()}
        serviceStartTime={serviceStartTime || new Date(Date.now() - 300000)} // 5 min atrás como exemplo
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

              {qrCodeUrl ? (
                <div className="text-center mb-4">
                  <img src={qrCodeUrl} alt="QR Code PIX" className="mx-auto mb-2" style={{ width: '200px', height: '200px' }} />
                  <div className="bg-gray-100 p-2 rounded flex items-center justify-between">
                    <span className="text-xs text-gray-600 truncate flex-1">
                      {pixCode.substring(0, 30)}...
                    </span>
                    <button
                      onClick={copyPixCode}
                      className="ml-2 text-green-500 hover:text-green-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Gerando QR Code PIX...</p>
                </div>
              )}

              <div className="text-xs text-gray-600 space-y-1">
                <p>Instruções</p>
                <p>1. O tempo para você pagar é de 30 minutos</p>
                <p>2. Abra o aplicativo do seu banco ou instituição financeira e entre no Área Pix</p>
                <p>3. Escolha a opção pagar com QR Code e aponte para o código ou cole o código</p>
                <p>4. Confirme as informações e finalize o pagamento</p>
                <p>5. Volte para o site ou volte e clique em "Recebi o pagamento" Pronto!</p>
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
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                isLoading 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isLoading ? 'Processando...' : 'Realize o Pagamento'}
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
                  <p className="text-xs text-blue-500">Entregador • {entregadorData.nome}</p>
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs ml-1">{entregadorData.rating}</span>
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
            <span className="font-medium">{entregadorData.nome}</span>
          </div>
          <div className="flex justify-between">
            <span>Data</span>
            <span className="font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex justify-between">
            <span>Hora</span>
            <span className="font-medium">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {pickupLocation && deliveryLocation && (
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
      <div className={`min-h-screen bg-gray-100 transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        <div className="bg-green-500 text-white p-4 relative">
          <button
            onClick={() => handleScreenTransition('location-select')}
            className="absolute left-4 top-4 text-white hover:text-gray-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-center text-lg font-bold">Monte o seu serviço</h1>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Descreva o que você precisa e<br />
              escolha como deseja receber
            </h2>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center flex-1">
                  <MapPin className="w-5 h-5 text-blue-500 mr-2" />
                  <div className="flex-1">
                    <p className="font-semibold">Buscar em (Origem)</p>
                    <p className="text-gray-600 text-sm">{selectedOriginLocation || 'Clique para selecionar'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsSelectingOrigin(true)
                    handleScreenTransition('location-select')
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                >
                  {selectedOriginLocation ? 'Alterar' : 'Selecionar'}
                </button>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <MapPin className="w-5 h-5 text-green-500 mr-2" />
                    <div className="flex-1">
                      <p className="font-semibold">Entregar em (Destino)</p>
                      <p className="text-gray-600 text-sm">{selectedLocation || 'Clique para selecionar'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsSelectingOrigin(false)
                      handleScreenTransition('location-select')
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors"
                  >
                    {selectedLocation ? 'Alterar' : 'Selecionar'}
                  </button>
                </div>
              </div>
            </div>
            {pickupLocation && deliveryLocation && (
              <div className="bg-blue-50 p-3 rounded-lg mt-4">
                <p className="text-sm font-semibold text-blue-800 mb-1">Estimativa de Preço</p>
                <p className="text-xs text-blue-600">Distância: {calculateDistance(pickupLocation.lat, pickupLocation.lng, deliveryLocation.lat, deliveryLocation.lng).toFixed(2)} km</p>
                <p className="text-lg font-bold text-blue-800">R$ {calculatePrice(calculateDistance(pickupLocation.lat, pickupLocation.lng, deliveryLocation.lat, deliveryLocation.lng)).toFixed(2)}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="font-semibold mb-4">Pedido</h3>
            
            <div className="mb-6">
              <div className="flex items-start mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="text-white text-sm">✏️</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">Preciso que alguém me acompanhe até o hospital</p>
                  <textarea
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="Descreva detalhadamente o que você precisa..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {predefinedServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedServiceType(service.id)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    selectedServiceType === service.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-green-300'
                  }`}
                >
                  <p className="font-medium text-sm">{service.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{service.category}</p>
                </button>
              ))}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Transporte</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-gray-300 rounded-lg text-center">
                  <p className="text-sm font-medium">Buscar remédios na farmácia</p>
                </div>
                <div className="p-3 border border-green-500 bg-green-50 rounded-lg text-center">
                  <p className="text-sm font-medium">Acompanhar em consultas médicas</p>
                </div>
              </div>
            </div>
          </div>
          <button
          //AQUI
          onClick={handleServiceCreate} 
           className="w-full bg-green-500 text-white py-4 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors"
          >
            Confirmar Serviço
          </button>
        </div>
      </div>
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
    // Usar pedidos reais ou dados de exemplo apenas se não houver pedidos reais
    const rawOrders = userOrders.length > 0 ? userOrders : [
      {
        id: 'exemplo-1',
        descricao: 'Entrega de medicamentos - Drogasil',
        status: 'ENTREGUE',
        preco: 25.90,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        origem: 'Drogasil - Rua Augusta, 1234',
        destino: 'Rua das Flores, 123 - Apto 45'
      },
      {
        id: 'exemplo-2',
        descricao: 'Compras no Carrefour',
        status: 'EM_ANDAMENTO',
        preco: 89.50,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        origem: 'Carrefour - Washington Luís, 1415',
        destino: 'Av. Paulista, 567 - Sala 12'
      },
      {
        id: 'exemplo-3',
        descricao: 'Serviço de limpeza',
        status: 'CANCELADO',
        preco: 120.00,
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
        origem: 'Salão Bella Vista',
        destino: 'Rua da Consolação, 890'
      },
      {
        id: 'exemplo-4',
        descricao: 'Entrega de documentos',
        status: 'PENDENTE',
        preco: 35.00,
        createdAt: new Date().toISOString(),
        origem: 'Escritório Central',
        destino: 'Banco do Brasil - Agência 1234'
      }
    ];

    // Aplicar filtros e ordenação
    const displayOrders = getFilteredAndSortedOrders(rawOrders);
    const orderCounts = getOrderCounts(rawOrders);

    console.log('📊 Exibindo pedidos:', {
      userOrdersCount: userOrders.length,
      rawOrdersCount: rawOrders.length,
      displayOrdersCount: displayOrders.length,
      isShowingExamples: userOrders.length === 0,
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
                  {userOrders.length === 0 && (
                    <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                      📋 Exibindo dados de exemplo - Nenhum pedido real encontrado
                    </p>
                  )}
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

  // Profile Screen
  if (currentScreen === 'profile') {
    return (
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
        <div className="max-w-2xl mx-auto p-6">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Outras Configurações</h3>
            
            <div className="space-y-4">
              <button className="w-full flex items-center justify-between py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
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
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Home Screen
  if (currentScreen === 'home') {
    return (
      <div className={`min-h-screen ${themeClasses.bg} flex transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        {/* Sidebar */}
        <div className="w-64 bg-gradient-to-b from-green-500 to-green-600 text-white p-4 animate-slideInLeft shadow-xl">
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
              onClick={() => handleScreenTransition('orders')}
              className="w-full flex items-center p-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <FileText className="w-5 h-5 mr-3" />
              <span>Pedidos</span>
            </button>
            <button className="w-full flex items-center p-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors">
              <MessageSquare className="w-5 h-5 mr-3" />
              <span>Carteira</span>
            </button>
            <button 
              onClick={() => handleScreenTransition('profile')}
              className="w-full flex items-center p-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <UserIconLucide className="w-5 h-5 mr-3" />
              <span>Perfil</span>
            </button>
          </nav>
          
          {/* Botão de logout */}
          <div className="mt-8 pt-4 border-t border-white border-opacity-20">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center p-3 hover:bg-red-500 hover:bg-opacity-20 rounded-lg transition-colors text-red-200 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-3" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 animate-slideInRight">
          <div className="flex justify-between items-center mb-6">
            <div></div>
            <div className="flex items-center space-x-4">
              {/* Toggle de tema */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                  isDarkMode ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}
                title={isDarkMode ? 'Modo claro' : 'Modo escuro'}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <ShoppingCart className={`w-6 h-6 ${themeClasses.textSecondary}`} />
              <Mail className={`w-6 h-6 ${themeClasses.textSecondary}`} />
              <div className="relative">
                <svg className={`w-6 h-6 ${themeClasses.textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h10a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

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

          {/* Botão para testar tracking (apenas em desenvolvimento) */}
          {!activeServiceId && (
            <div className={`${themeClasses.bgCard} ${themeClasses.border} border rounded-lg p-4 mb-6 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-semibold ${themeClasses.text}`}>Teste de Tracking</h3>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                    Simular um serviço para testar o rastreamento
                  </p>
                </div>
                <button
                  onClick={() => {
                    const testDestination = {
                      address: 'Rua de Teste, 123 - São Paulo - SP',
                      lat: -23.5505 + (Math.random() - 0.5) * 0.01,
                      lng: -46.6333 + (Math.random() - 0.5) * 0.01
                    }
                    handleStartTracking(testDestination)
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  🚀 Testar
                </button>
              </div>
            </div>
          )}

          {/* Hero section */}
          <div className="bg-green-500 text-white rounded-lg p-6 mb-6 flex items-center">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                Agende já o seu<br />
                serviço sem sair<br />
                de casa
              </h2>
              <button className="bg-white text-green-500 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Serviços
              </button>
            </div>
            <div className="w-32 h-32 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
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
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Solicite seu serviço"
              onClick={handleServiceRequest}
              className="w-full pl-10 pr-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* Service cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {serviceCards.map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedEstablishmentType(service.id)
                  handleScreenTransition('establishments-list')
                }}
                className={`${themeClasses.bgCard} p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:rotate-1 text-center group ${themeClasses.border} border`}
              >
                <div className="group-hover:animate-bounce">
                  {service.image}
                </div>
                <p className={`font-semibold group-hover:text-green-500 transition-colors duration-300 ${themeClasses.text}`}>{service.name}</p>
              </button>
            ))}
          </div>

          {/* Additional service cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[...serviceCards].map((service, index) => (
              <button
                key={`${service.id}-${index}`}
                onClick={() => {
                  setSelectedEstablishmentType(service.id)
                  handleScreenTransition('establishments-list')
                }}
                className={`${themeClasses.bgCard} p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:rotate-1 text-center group ${themeClasses.border} border`}
              >
                <div className="group-hover:animate-bounce">
                  {service.image}
                </div>
                <p className={`font-semibold group-hover:text-green-500 transition-colors duration-300 ${themeClasses.text}`}>{service.name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
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

              <div>
                <label className="block text-gray-700 text-sm mb-2">Endereço (opcional)</label>
                <input
                  type="text"
                  value={profileData.endereco}
                  onChange={(e) => setProfileData({...profileData, endereco: e.target.value})}
                  placeholder="Seu endereço completo"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Usado para encontrar prestadores próximos</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Dados que serão enviados:</h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• <strong>CPF:</strong> {profileData.cpf || 'Não informado'}</li>
                  <li>• <strong>Necessidade:</strong> {profileData.necessidade || 'Não selecionada'}</li>
                  <li>• <strong>ID Localização:</strong> 1 (padrão)</li>
                </ul>
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
            className="bg-green-500 text-white px-8 md:px-12 py-3 rounded-full font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="w-full bg-green-500 text-white py-3 md:py-4 rounded-full text-base md:text-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    const establishments = getEstablishmentsByType(selectedEstablishmentType)
    const typeNames = {
      'farmacia': 'Farmácias',
      'mercado': 'Mercados',
      'transporte': 'Transporte',
      'servicos': 'Serviços'
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
            Estabelecimentos próximos a você
          </p>
        </div>

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
                  lat: -23.5505, // Coordenadas exemplo para São Paulo
                  lng: -46.6333
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
                    <span className={`text-sm ${themeClasses.textSecondary} ml-1`}>{establishment.rating}</span>
                  </div>
                  <div className={`flex items-center text-sm ${themeClasses.textSecondary}`}>
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{establishment.distance}</span>
                  </div>
                </div>
              </div>

              {/* Seta indicativa com animação */}
              <div className="text-green-500 group-hover:translate-x-2 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
          
          {establishments.length === 0 && (
            <div className="text-center py-12 animate-fadeIn">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum estabelecimento encontrado</h3>
              <p className="text-gray-600">Tente novamente ou escolha outro tipo de serviço.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Service Rating Screen (Static)
  if (currentScreen === 'service-rating') {
    return (
      <div className={`min-h-screen ${themeClasses.bg} transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-y-full' : 'opacity-100 translate-y-0'
      }`}>
        {/* Header */}
        <div className="bg-green-500 text-white p-4 relative shadow-lg">
          <button
            onClick={() => handleScreenTransition('home')}
            className="absolute left-4 top-4 text-white hover:text-gray-200 transition-all duration-300 hover:scale-110"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-center text-xl font-bold">Avaliar Serviço</h1>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center justify-center p-6 space-y-6">
          {/* Avatar do prestador */}
          <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg">
            <img 
              src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" 
              alt="Prestador" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Nome e descrição */}
          <div className="text-center">
            <h2 className={`text-xl font-bold ${themeClasses.text} mb-2`}>José Silva</h2>
            <p className={`${themeClasses.textSecondary} mb-1`}>
              Sua opinião ajuda a melhorar a experiência de todos.
            </p>
            <p className={`text-sm ${themeClasses.textSecondary}`}>
              Acompanhamento: +55 (11) 99999-9999
            </p>
          </div>

          {/* Estrelas de avaliação */}
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className="transition-all duration-200 hover:scale-110"
              >
                <Star 
                  className="w-8 h-8 text-yellow-400 fill-current hover:text-yellow-500" 
                />
              </button>
            ))}
          </div>

          {/* Comentário */}
          <div className="w-full max-w-md">
            <textarea
              placeholder="Deixe um comentário sobre o serviço (opcional)"
              className={`w-full p-4 rounded-lg border ${themeClasses.input} ${themeClasses.border} resize-none h-24`}
              maxLength={200}
            />
          </div>

          {/* Botão de finalizar */}
          <button
            onClick={() => {
              // Limpar serviço ativo e voltar para home
              setActiveServiceId(null)
              setServiceStartTime(null)
              handleScreenTransition('home')
            }}
            className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-lg"
          >
            Finalizar Avaliação
          </button>
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
    </div>
  )
  
}

export default App
