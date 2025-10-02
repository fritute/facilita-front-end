import React, { useState, useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowLeft, Camera, MapPin, Search, Star, Clock, CreditCard, Copy, Home, FileText, MessageSquare, UserIcon as UserIconLucide, ShoppingCart, Truck, Package, Users } from 'lucide-react'
import QRCode from 'qrcode'
import LocationMap from './LocationMap'
import ServiceTracking from './components/ServiceTracking'
import ServiceRating from './components/ServiceRating'
import CompleteProfileModal from './components/CompleteProfileModal'
import LoadingSpinner from './components/LoadingSpinner'

type Screen = "login" | "cadastro" | "success" | "recovery" | "location-select" | "service-tracking"

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
  nome: string
  email: string
  telefone: string
  tipo_conta: 'CONTRATANTE' | 'PRESTADOR'
  foto?: string
}

interface ServiceRequest {
  id: string
  description: string
  location: string
  price: number
  status: 'pending' | 'accepted' | 'in_progress' | 'completed'
}

function App() {
  // 🔧 MODO DESENVOLVEDOR: Mude aqui para testar diferentes telas
  // 'waiting-driver', 'payment', 'service-tracking', 'service-confirmed', etc.
  const [currentScreen, setCurrentScreen] = useState<
  'login' | 'cadastro' | 'success' | 'recovery' | 'verification' | 
  'account-type' | 'service-provider' | 'profile-setup' | 'home' | 
  'location-select' | 'service-create' | 'waiting-driver' | 
  'tracking' | 'service-confirmed' | 'payment' | 'service-tracking' | 'profile' | 'orders' | 'service-rating'
  >('home')  
  

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
    endereco: '' // Para capturar endereço e gerar id_localizacao
  })
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [selectedOriginLocation, setSelectedOriginLocation] = useState<string>('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [selectedServiceType, setSelectedServiceType] = useState<string>('')
  const [isSelectingOrigin, setIsSelectingOrigin] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [pixCode, setPixCode] = useState<string>('')
  const [driverFound, setDriverFound] = useState(false)
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
  const [serviceRating, setServiceRating] = useState<number>(0)
  const [serviceComment, setServiceComment] = useState<string>('')
  const [serviceCompletionTime, setServiceCompletionTime] = useState<Date | null>(null)
  
  const handleAddressSelection = (address: any) => {
    setSelectedAddress(address)
    console.log("Endereço selecionado:", address)
  }
  const [selectedDestination, setSelectedDestination] = useState<{address: string, lat: number, lng: number} | null>(null)

  const handleStartTracking = (destination: {address: string, lat: number, lng: number}) => {
    setSelectedDestination(destination)
    // Define origem do prestador se não existir (usa origem selecionada como fallback)
    if (!driverOrigin) {
      if (pickupLocation) {
        setDriverOrigin({ lat: pickupLocation.lat, lng: pickupLocation.lng })
      } else {
        // Fallback para uma posição padrão (Carapicuíba/SP)
        setDriverOrigin({ lat: -23.5324859, lng: -46.7916801 })
      }
    }
    handleScreenTransition('service-tracking')
  }

  // Função chamada quando o serviço é concluído automaticamente
  const handleServiceCompleted = () => {
    console.log('🎉 Serviço concluído! Redirecionando para avaliação...')
    setServiceCompletionTime(new Date())
    handleScreenTransition('service-rating')
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

  // Mock service cards
  const serviceCards = [
    { id: 'farmacia', name: 'Farmácia', icon: '💊' },
    { id: 'mercado', name: 'Mercado', icon: '🛒' },
    { id: 'correios', name: 'Correios', icon: '📦' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️' }
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

  // Simulate driver search
  useEffect(() => {
    if (currentScreen === 'waiting-driver') {
      const timer = setTimeout(() => {
        setDriverFound(true)
        setTimeout(() => {
          handleScreenTransition('payment')
        }, 2000)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [currentScreen])

  // Generate PIX QR Code when payment screen loads
  useEffect(() => {
    if (currentScreen === 'payment') {
      const amount = servicePrice > 0 ? servicePrice : 119.99
      generatePagBankPayment(amount)
    }
  }, [currentScreen])

  // Recuperar usuário logado do localStorage ao carregar a página
  useEffect(() => {
    const storedUser = localStorage.getItem('loggedUser')
    const storedToken = localStorage.getItem('authToken')
    
    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser)
        setLoggedUser(user)
        console.log('👤 Usuário recuperado do localStorage:', user)
        console.log('🔑 Token recuperado:', storedToken)
        
        // Redirecionar para Home se usuário está logado
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
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    }

    console.log('Fazendo requisição para:', url)
    console.log('Com token:', token ? 'Sim' : 'Não')

    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Interceptar erro 401
    if (response.status === 401) {
      console.error('❌ ERRO 401 - Não autorizado na URL:', url)
      console.error('Token usado:', token)
      alert('Sessão expirada. Faça login novamente.')
      localStorage.removeItem('authToken')
      localStorage.removeItem('loggedUser')
      handleScreenTransition('login')
    }

    return response
  }

  // Função para validar email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
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

  // Função para validar senha
  const validatePassword = (password: string): boolean => {
    return password.length >= 6 && password.length <= 20
  }

  // Função para limpar erro específico
  const clearError = (field: keyof ValidationErrors) => {
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }))
  }

  const handleScreenTransition = (newScreen: 'login' | 'cadastro' | 'success' | 'recovery' | 'verification' | 'account-type' | 'service-provider' | 'profile-setup' | 'home' | 'location-select' | 'service-create' | 'waiting-driver' | 'payment' | 'service-tracking' | 'service-confirmed' | 'tracking' | 'profile' | 'orders' | 'service-rating') => {
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
          const user: LoggedUser = {
            nome: data.usuario.nome,
            email: data.usuario.email,
            telefone: data.usuario.telefone,
            tipo_conta: data.usuario.tipo_conta
          }
          
          // Armazenar usuário no localStorage também
          localStorage.setItem('loggedUser', JSON.stringify(user))
          
          setLoggedUser(user)
          console.log('👤 Usuário logado:', user)
          
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
    if (!validatePassword(userData.senha)) {
      newErrors.senha = 'Sua senha tem que ser de 6 a 20 caracteres'
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

    // Cadastro do usuário (independente do tipo) com payload exato exigido

    setIsLoading(true)

    const registerData = {
      nome: userData.nome,
      email: userData.email,
      telefone: userData.telefone.replace(/\D/g, ''),
      senha_hash: userData.senha,
    }

    console.log('📤 Enviando cadastro:', { ...registerData, senha_hash: '***' })

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
        // Após cadastrado, direciona conforme tipo de conta escolhido
        if (selectedAccountType === 'CONTRATANTE') {
          handleScreenTransition('profile-setup')
        } else {
          handleScreenTransition('home')
        }
      } else {
        const errorData = await response.json()
        console.error('❌ Erro no cadastro:', errorData)
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

  const handleRecoverySubmit = async () => {
    const newErrors: ValidationErrors = {}

    // Validar se é email ou telefone
    const isEmail = recoveryContact.includes('@')
    const isPhone = /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(recoveryContact)

    if (!isEmail && !isPhone) {
      newErrors.recoveryContact = 'Digite um e-mail ou telefone válido'
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
        ? { email: recoveryContact }
        : { telefone: recoveryContact.replace(/\D/g, '') }

      console.log('Enviando requisição de recuperação:', payload)
      
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
          ? { email: recoveryContact }
          : { telefone: recoveryContact.replace(/\D/g, '') }
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

    try {
      // Monta payload exatamente como solicitado
      const payload = {
        id_localizacao: 1, // Fixo por enquanto
        necessidade: profileData.necessidade.toUpperCase(),
        cpf: profileData.cpf.replace(/\D/g, ''),
      }

      console.log('📤 Enviando dados do contratante:', payload)

      const response = await fetchWithAuth('https://servidor-facilita.onrender.com/v1/facilita/contratante/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Erro ao registrar contratante:', errorData)
        alert(`Falha ao completar perfil de contratante: ${errorData.message || response.status}`)
        return
      }

      alert('Perfil de contratante salvo com sucesso!')
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

    try {
      // Tentar buscar dados do contratante
      const response = await fetchWithAuth('https://servidor-facilita.onrender.com/v1/facilita/contratante/me')
      
      console.log('📥 Resposta da API /contratante/me:', {
        status: response.status,
        ok: response.ok
      })
      
      if (response.status === 404) {
        // Contratante não tem perfil completo
        console.log('❌ Contratante sem perfil completo, mostrando modal')
        setShowCompleteProfileModal(true)
      } else if (response.ok) {
        // Contratante já tem perfil completo
        const data = await response.json()
        console.log('✅ Contratante com perfil completo:', data)
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
  if (!serviceDescription && !selectedServiceType) {
    alert('Selecione um serviço ou descreva o que precisa')
    return
  }
  
  // Verificar se origem e destino foram selecionados
  if (!pickupLocation) {
    alert('Selecione o local de origem (de onde buscar)')
    return
  }
  
  if (!deliveryLocation) {
    alert('Selecione o local de entrega (para onde levar)')
    return
  }
  
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
  
  // Ir para a tela de procurar motorista
  handleScreenTransition('waiting-driver')
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
      // Tentar buscar dados do contratante logado
      const response = await fetchWithAuth('https://servidor-facilita.onrender.com/v1/facilita/contratante/me')
      if (response.ok) {
        const data = await response.json()
        return data.id || data.id_contratante || 3 // fallback para ID 3
      }
    } catch (error) {
      console.warn('Não foi possível obter ID do contratante, usando ID padrão')
    }
    return 3 // ID fixo como fallback
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

  // Função para buscar pedidos do usuário
  const fetchUserOrders = async () => {
    if (!loggedUser) {
      console.warn('Usuário não logado, não é possível buscar pedidos')
      return
    }

    setOrdersLoading(true)
    
    try {
      console.log('📋 Buscando pedidos do usuário...')
      
      // Primeiro, tentar buscar via API de serviços
      const response = await fetchWithAuth('https://servidor-facilita.onrender.com/v1/facilita/servico')
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Pedidos obtidos da API:', data)
        
        // Se a resposta for um array, usar diretamente
        // Se for um objeto com propriedade 'servicos' ou similar, extrair
        const orders = Array.isArray(data) ? data : (data.servicos || data.services || [])
        
        // Filtrar pedidos do usuário atual (se necessário)
        const userOrders = orders.filter((order: any) => {
          // Filtrar por ID do contratante se disponível
          return true // Por enquanto, mostrar todos (a API deve filtrar por usuário)
        })
        
        setUserOrders(userOrders)
      } else {
        console.error('❌ Erro ao buscar pedidos:', response.status)
        
        // Fallback: buscar do localStorage
        const savedService = localStorage.getItem('currentService')
        if (savedService) {
          try {
            const service = JSON.parse(savedService)
            setUserOrders([service])
            console.log('💾 Usando pedido salvo localmente:', service)
          } catch (e) {
            console.error('Erro ao parsear serviço salvo:', e)
            setUserOrders([])
          }
        } else {
          setUserOrders([])
        }
      }
    } catch (error) {
      console.error('❌ Erro na requisição de pedidos:', error)
      
      // Fallback: buscar do localStorage
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
    if (!pickupLocation || !deliveryLocation || !loggedUser) {
      console.error('Dados insuficientes para criar serviço')
      return false
    }

    try {
      // Obter IDs necessários
      const id_contratante = await getContratanteId()
      const id_localizacao = await getCurrentLocationId()
      
      const descricaoServico = serviceDescription || selectedServiceType || 'Serviço de entrega personalizado'
      const id_categoria = getServiceCategoryId(descricaoServico)
      
      const serviceData = {
        id_contratante: id_contratante,
        id_prestador: 2, // ID fixo por enquanto (ainda não tem sistema de seleção de prestador)
        id_categoria: id_categoria,
        id_localizacao: id_localizacao,
        descricao: descricaoServico,
        status: 'PENDENTE'
      }

      console.log('=== CRIAÇÃO DE SERVIÇO ===')
      console.log('📤 Payload para API:', serviceData)
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
      console.log('==========================')

      const response = await fetchWithAuth('https://servidor-facilita.onrender.com/v1/facilita/servico', {
        method: 'POST',
        body: JSON.stringify(serviceData)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Serviço criado com sucesso:', data)
        const serviceId = data.id || data.servico_id || data.service_id || 'unknown'
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
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Erro ao criar serviço:', errorData)
        alert(`Erro ao criar serviço: ${errorData.message || 'Erro desconhecido'}`)
        return false
      }
    } catch (error) {
      console.error('❌ Erro na requisição de criação de serviço:', error)
      alert('Erro de conexão ao criar serviço.')
      return false
    }
  }

  // Função para confirmar pagamento e criar serviço
  const handlePaymentConfirmation = async () => {
    setIsLoading(true)
    
    try {
      console.log('💳 Iniciando processo de pagamento e criação de serviço...')
      
      // Simular processamento do pagamento (em produção, aqui seria a validação do PIX)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Criar o serviço via API
      const serviceCreated = await createService()
      
      if (serviceCreated) {
        console.log('✅ Pagamento confirmado e serviço criado!')
        // Se o serviço foi criado com sucesso, ir para tela de confirmação
        handleScreenTransition('service-confirmed')
      } else {
        console.error('❌ Falha na criação do serviço')
      }
    } catch (error) {
      console.error('Erro no processo de confirmação:', error)
      alert('Erro no processo de pagamento. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const FacilitaLogo = () => (
    <div className="flex items-center justify-center mt-8 xl:mt-0">
      <div className="flex items-center">
        <img src="/logotcc 1.png" alt="Facilita Logo" className="facilita-logo w-[400px] h-auto" />
      </div>
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
        serviceCompletionTime={serviceCompletionTime}
        serviceStartTime={new Date(Date.now() - 300000)} // 5 min atrás como exemplo
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-700 font-medium">Serviço criado com sucesso!</p>
            <p className="text-xs text-green-600">ID: {createdServiceId}</p>
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

        {/* BOTÃO SEGUIR CORRIGIDO */}
        <button
          onClick={() => handleScreenTransition('service-tracking')}
          className="mt-8 px-8 py-3 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
        >
          Seguir
        </button>
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
          
          {!driverFound ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Procurando motorista...</h2>
              <p className="text-gray-600 mb-6">Aguarde enquanto encontramos o melhor prestador para você</p>
              <div className="flex justify-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-2 border-white border-l-0 border-t-0 transform rotate-45"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Motorista encontrado!</h2>
              <p className="text-gray-600">Redirecionando para o pagamento...</p>
            </>
          )}
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
    // Buscar pedidos quando a tela for carregada
    if (userOrders.length === 0 && !ordersLoading) {
      fetchUserOrders()
    }

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
            <h1 className="text-lg font-bold">Meus Pedidos</h1>
          </div>
          <button
            onClick={fetchUserOrders}
            className="absolute right-4 top-4 text-white hover:text-gray-200"
            disabled={ordersLoading}
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
          ) : userOrders.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum pedido encontrado</h3>
              <p className="text-gray-600 mb-6">Você ainda não fez nenhum pedido.</p>
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
                <h2 className="text-2xl font-bold text-gray-800">Histórico de Pedidos</h2>
                <span className="text-sm text-gray-600">{userOrders.length} pedido(s)</span>
              </div>

              {userOrders.map((order, index) => (
                <div key={order.id || index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-800 mr-3">
                          {order.descricao || 'Serviço'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          getStatusColor(order.status || 'PENDENTE')
                        }`}>
                          {formatStatus(order.status || 'PENDENTE')}
                        </span>
                      </div>
                      
                      {order.id && (
                        <p className="text-sm text-gray-600 mb-2">ID: {order.id}</p>
                      )}
                      
                      {order.createdAt && (
                        <p className="text-sm text-gray-600 mb-2">
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
              ))}
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
      <div className={`min-h-screen bg-gray-100 flex transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        {/* Sidebar */}
        <div className="w-64 bg-green-500 text-white p-4">
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
        <div className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <div></div>
            <div className="flex items-center space-x-4">
              <ShoppingCart className="w-6 h-6 text-gray-600" />
              <Mail className="w-6 h-6 text-gray-600" />
            </div>
          </div>

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
              <div className="w-16 h-24 bg-white rounded-lg"></div>
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
                onClick={handleServiceRequest}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-4xl mb-3">{service.icon}</div>
                <p className="font-semibold">{service.name}</p>
              </button>
            ))}
          </div>

          {/* Additional service cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[...serviceCards].map((service, index) => (
              <button
                key={`${service.id}-${index}`}
                onClick={handleServiceRequest}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-4xl mb-3">{service.icon}</div>
                <p className="font-semibold">{service.name}</p>
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
                <div className="w-24 h-24 bg-blue-200 rounded-full flex items-center justify-center mx-auto">
                  <User className="w-12 h-12 text-blue-600" />
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
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
                  <option value="MOBILIDADE">Problemas de mobilidade</option>
                  <option value="VISUAL">Deficiência visual</option>
                  <option value="AUDITIVA">Deficiência auditiva</option>
                  <option value="NENHUMA">Nenhuma necessidade especial</option>
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
              <UserIcon />
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
              <UserIcon />
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
        <div className="w-1/2 flex items-center justify-center p-4 md:p-8 relative order-2 md:order-1">
          <div className="absolute top-4 left-4 md:top-8 md:left-8">
            <FacilitaLogo />
          </div>
          <div className=" flex-1 flex items-center justify-center p-8">
            <img 
              src="/undraw_order-delivered_puaw 3.png" 
              alt="Ilustração de entrega" 
              className="w-[700px] h-auto"
            />
          </div>
        </div>
        
        <div className="w-1/2 bg-gray-700 h-screen p-4 md:p-8 flex flex-col justify-center relative order-1 md:order-2">
          <img
            src="./Vector copy.png"
            alt="Decoração"
            className="absolute top-0 right-0 w-32 h-24 md:w-40 md:h-32"
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
        <div className="w-1/2 flex items-center justify-center p-4 md:p-8 relative order-2 md:order-1">
          <div className="absolute top-4 left-4 md:top-8 md:left-8">
            <FacilitaLogo />
          </div>
          <div className=" flex-1 flex items-center justify-center p-8 
">
            <img 
              src="/undraw_order-delivered_puaw 3.png" 
              alt="Ilustração de entrega" 
              className="w-[700px] h-auto
"
            />
          </div>
        </div>
        
        <div className="w-1/2 bg-gray-700 h-screen p-4 md:p-8 flex flex-col justify-center relative order-1 md:order-2">
          <img
            src="./Vector copy.png"
            alt="Decoração"
            className="absolute top-0 right-0 w-32 h-24 md:w-40 md:h-32 object-cover"
          />
          
          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl text-white font-bold mb-2">Recuperar senha</h2>
            <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8">
              Digite seu e-mail ou telefone para<br />
              recuperar sua senha
            </p>

            <div className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-gray-400 text-sm mb-2">E-mail ou Telefone</label>
                <div className="relative">
                  <input
                    type="text"
                    value={recoveryContact}
                   onChange={(e) => {
                     setRecoveryContact(e.target.value)
                     clearError('recoveryContact')
                   }}
                    placeholder="Digite seu e-mail ou telefone"
                    className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg pr-10 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <Mail className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
               {errors.recoveryContact && (
                 <p className="text-red-500 text-sm mt-1">{errors.recoveryContact}</p>
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

  if (currentScreen === 'cadastro') {
    return (
      <div className={`min-h-screen bg-gray-800 flex flex-col xl:flex-row transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        <div className="flex-1 p-4 md:p-8 w-full xl:max-w-lg xl:ml-[15%] xl:mt-[5%]  order-2 xl:order-1">
          <h2 className="text-xl md:text-2xl text-white font-bold mb-6 md:mb-8">Cadastro</h2>
          
          <div className="space-y-4 md:space-y-6">
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
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg pr-10 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg pr-10 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg pr-10 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg pr-10 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg pr-10 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    setUserData({...userData, telefone: e.target.value})
                    clearError('telefone')
                  }}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg pr-10 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Phone className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
              {errors.telefone && (
                <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>
              )}
            </div>
     
  
            <button
              onClick={handleCadastro}
              className="w-full bg-green-500 text-white py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-green-600 transition-colors"
            >
              Próximo
            </button>
  
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
  
        <div className="flex-1 flex flex-col justify-end items-end p-8 order-1 xl:order-2">
          <div className="absolute top-4 right-4 md:top-8 md:right-8">
            <FacilitaLogo />
          </div>
          <div className=" flex-1 flex items-center justify-center p-8 transform translate-x-[-300px] translate-y-[10px] cadastro-image">
            <div className="relative max-w-xs md:max-w-sm">
              <img 
                src="/undraw_order-delivered_puaw 3.png" 
                alt="Ilustração de entrega" 
                className="w-[1000px] h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-800 flex flex-col md:flex-row transition-all duration-300 ${
      isTransitioning ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-0'
    }`}>
      <div className="w-1/2 flex items-center justify-center p-4 md:p-8 relative order-2 md:order-1 ">
        <div className="absolute top-4 left-4 md:top-8 md:left-8">
          <FacilitaLogo />
        </div>
        <div className=" flex-1 flex items-center justify-center p-8">
          <img 
            src="/undraw_order-delivered_puaw 3.png" 
            alt="Ilustração de entrega" 
            className="w-[700px] h-auto move-down"
          />
        </div>
      </div>
      
      <div className="flex-1 bg-gray-700 h-screen p-4 md:p-8 flex flex-col justify-center relative order-1 md:order-2 move-right">
        <img
          src="./Vector copy.png"
          alt="Decoração"
          className="absolute top-0 right-0 w-32 h-24 md:w-40 md:h-32 object-cover"
        />
        
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl text-white font-bold mb-2">Entrar no Facilita</h2>
          <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8">
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
                <Lock className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
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
          console.log('⏭️ Usuário escolheu pular perfil')
          setShowCompleteProfileModal(false)
        }}
        userName={loggedUser?.nome || 'Usuário'}
      />
    </div>
  )
  
}

export default App
