import React, { useState, useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowLeft, Camera, MapPin, Search, Star, Clock, CreditCard, Copy, Home, FileText, MessageSquare, UserIcon as UserIconLucide, ShoppingCart, Truck, Package, Users } from 'lucide-react'
import QRCode from 'qrcode'
import LocationMap from './LocationMap'
import AddressInput from './components/AddressInput'
import ServiceTracking from './components/ServiceTracking'

type Screen = "login" | "cadastro" | "success" | "recovery" | "location-select" | "service-tracking";

// Adicione esta interface antes da função App
interface ServiceTrackingProps {
  onBack: () => void;
  entregador: Entregador;
  destination: {
    address: string;
    lat: number;
    lng: number;
  };
}

interface Entregador {
  nome: string;
  telefone: string;
  veiculo: string;
  placa: string;
  rating: number;
  tempoEstimado: string;
  distancia: string;
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
  const [currentScreen, setCurrentScreen] = useState<
  'login' | 'cadastro' | 'success' | 'recovery' | 'verification' | 
  'account-type' | 'service-provider' | 'profile-setup' | 'home' | 
  'location-select' | 'service-create' | 'waiting-driver' | 
  'tracking' | 'service-confirmed' | 'payment'
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
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [loggedUser, setLoggedUser] = useState<LoggedUser | null>(null)
  const [profileData, setProfileData] = useState({
    endereco: '',
    mercado: '',
    necessidades: ''
  })
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [selectedServiceType, setSelectedServiceType] = useState<string>('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [pixCode, setPixCode] = useState<string>('')
  const [driverFound, setDriverFound] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  
  
  const handleAddressSelection = (address: any) => {
    setSelectedAddress(address);
    console.log("Endereço selecionado:", address);
  };
  const [selectedDestination, setSelectedDestination] = useState<{address: string, lat: number, lng: number} | null>(null);

  const handleStartTracking = (destination: {address: string, lat: number, lng: number}) => {
    setSelectedDestination(destination);
    handleScreenTransition('service-tracking');
  };

  
  
  if (currentScreen === 'tracking') {
    return (
      <ServiceTracking
        onBack={() => handleScreenTransition('home')} // Função para voltar
        entregador={entregadorData} // Seu estado de entregador
        destination={{
            address: 'Rua Exemplo, 123', // Exemplo de endereço
            lat: -23.55052, 
            lng: -46.63330
        }} 
      />
    );
  }

  const [entregadorData, setEntregadorData] = useState({
    nome: 'João Silva',
    telefone: '(11) 99999-9999',
    veiculo: 'Honda CG 160',
    placa: 'ABC1D23',
    rating: 4.8,
    tempoEstimado: '15',
    distancia: '2.5 km'
  });

  const [loginData, setLoginData] = useState({
    email: '',
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
      generateQRCode('facilita@pagbank.com', 119.99)
    }
  }, [currentScreen])

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

  const handleScreenTransition = (newScreen: 'login' | 'cadastro' | 'success' | 'recovery' | 'verification' | 'account-type' | 'service-provider' | 'profile-setup' | 'home' | 'location-select' | 'service-create' | 'waiting-driver' | 'payment') => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentScreen(newScreen)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 50)
    }, 300)
  }

  const handleLogin = () => {
    const newErrors: ValidationErrors = {}

    // Validar email
    if (!validateEmail(loginData.email)) {
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
    
    // Simulate successful login for contractor
    const mockUser: LoggedUser = {
      nome: userData.nome,
      email: loginData.email,
      telefone: userData.telefone,
      tipo_conta: 'CONTRATANTE'
    }
    
    setLoggedUser(mockUser)
    handleScreenTransition('profile-setup')
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

    if (selectedAccountType === 'PRESTADOR') {
      handleScreenTransition('service-provider')
      return
    }

    setIsLoading(true)

    const registerData: RegisterData = {
      nome: userData.nome,
      senha_hash: userData.senha,
      email: userData.email,
      telefone: userData.telefone.replace(/\D/g, ''), 
      tipo_conta: selectedAccountType
    }

    try {
      const response = await fetch('https://server-facilita.onrender.com/v1/facilita/usuario/register', {
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
      const response = await fetch('https://server-facilita.onrender.com/v1/facilita/usuario/register', {
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

  const handleRecoverySubmit = () => {
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
    // Simular envio do código
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

  const handleVerification = () => {
    const code = verificationCode.join('')
    
    if (code.length !== 5 || !/^\d{5}$/.test(code)) {
      setErrors({ verificationCode: 'Código inválido' })
      return
    }

    setErrors({})
    // Lógica de verificação
    console.log('Código verificado:', verificationCode.join(''))
    handleScreenTransition('login')
  }

  const handleProfileSetup = () => {
    if (!profileData.endereco || !profileData.mercado || !profileData.necessidades) {
      alert('Preencha todos os campos')
      return
    }
    handleScreenTransition('home')
  }

  const handleServiceRequest = () => {
    handleScreenTransition('location-select')
  }

const handleLocationSelect = (address: string, lat: number, lng: number) => {
  setSelectedLocation(address);
  setSelectedDestination({ address, lat, lng });
  handleScreenTransition('service-create');
};


const handleServiceCreate = () => {
  if (!serviceDescription && !selectedServiceType) {
    alert('Selecione um serviço ou descreva o que precisa');
    return;
  }

  if (selectedDestination) {
    handleStartTracking(selectedDestination);
  } else {
    // Fallback com coordenadas padrão (Carapicuíba)
    handleStartTracking({
      address: selectedLocation || 'Carapicuíba, SP',
      lat: -23.5235,
      lng: -46.8401
    });
  }
};

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode)
    alert('Código PIX copiado!')
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
                    <p className="font-bold text-lg">R$ 291,76</p>
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

              {qrCodeUrl && (
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
                <span className="font-semibold">R$ 119,99</span>
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
                <span>R$ 119,99</span>
              </div>
            </div>

            <button
            onClick={() => handleScreenTransition('service-confirmed')}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
>
  Realize o Pagamento
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
  
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Serviço Confirmada</h2>
          <p className="text-gray-600 mb-6">Obrigado por escolher a Facilita</p>
  
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
                    <p className="text-xs text-blue-500">Entregador • Kaike Bueno</p>
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs ml-1">4.7</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="font-bold text-lg">R$ 291,76</p>
            </div>
          </div>
  
          {/* Detalhes */}
          <div className="mt-6 w-full max-w-md text-sm text-gray-600 space-y-2">
            <div className="flex justify-between">
              <span>Nome</span>
              <span className="font-medium">Kaike Bueno</span>
            </div>
            <div className="flex justify-between">
              <span>Data</span>
              <span className="font-medium">22 Ago 2024</span>
            </div>
            <div className="flex justify-between">
              <span>Hora</span>
              <span className="font-medium">10:00 AM</span>
            </div>
            <div className="flex justify-between">
              <span>Pagamento</span>
              <span className="font-medium text-green-600">Confirmado</span>
            </div>
          </div>
  
          <button
            onClick={() => handleScreenTransition('home')}
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
            <div className="flex items-center mb-4">
              <MapPin className="w-5 h-5 text-green-500 mr-2" />
              <div>
                <p className="font-semibold">Entregar em</p>
                <p className="text-gray-600 text-sm">{selectedLocation}</p>
              </div>
            </div>
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
            onClick={() => handleScreenTransition('waiting-driver')}
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
  


  // Home Screen
  if (currentScreen === 'home') {
    return (
      <div className={`min-h-screen bg-gray-100 flex transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        {/* Sidebar */}
        <div className="w-64 bg-green-500 text-white p-4">
          <div className="flex items-center mb-8">
            <img src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" alt="User" className="w-10 h-10 rounded-full mr-3" />
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
            <button className="w-full flex items-center p-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors">
              <FileText className="w-5 h-5 mr-3" />
              <span>Pedidos</span>
            </button>
            <button className="w-full flex items-center p-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors">
              <MessageSquare className="w-5 h-5 mr-3" />
              <span>Carteira</span>
            </button>
            <button className="w-full flex items-center p-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors">
              <UserIconLucide className="w-5 h-5 mr-3" />
              <span>Perfil</span>
            </button>
          </nav>
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
                <label className="block text-gray-700 text-sm mb-2">Endereço</label>
                <input
                  type="text"
                  value={profileData.endereco}
                  onChange={(e) => setProfileData({...profileData, endereco: e.target.value})}
                  placeholder="Endereço completo"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-2">Preferência de Serviços</label>
                <select
                  value={profileData.mercado}
                  onChange={(e) => setProfileData({...profileData, mercado: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Mercado</option>
                  <option value="farmacia">Farmácia</option>
                  <option value="mercado">Mercado</option>
                  <option value="correios">Correios</option>
                  <option value="shopping">Shopping</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-2">Necessidades Especiais</label>
                <select
                  value={profileData.necessidades}
                  onChange={(e) => setProfileData({...profileData, necessidades: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Idoso</option>
                  <option value="mobilidade">Problemas de mobilidade</option>
                  <option value="visual">Deficiência visual</option>
                  <option value="auditiva">Deficiência auditiva</option>
                  <option value="nenhuma">Nenhuma</option>
                </select>
              </div>

              <button
                onClick={handleProfileSetup}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
              >
                Finalizar
              </button>
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
              <label className="block text-gray-400 text-sm mb-2">E-mail</label>
              <div className="relative">
                <input
                  type="email"
                  value={loginData.email}
                 onChange={(e) => {
                   setLoginData({...loginData, email: e.target.value})
                   clearError('loginEmail')
                 }}
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
              className="w-full bg-green-500 text-white py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-green-600 transition-colors"
            >
              Entrar
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
    </div>
    
  )
  
}

export default App
