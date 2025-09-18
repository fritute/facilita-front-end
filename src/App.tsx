import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowLeft } from 'lucide-react';

interface ValidationErrors {
  nome?: string;
  email?: string;
  confirmarEmail?: string;
  senha?: string;
  confirmarSenha?: string;
  telefone?: string;
  loginEmail?: string;
  loginSenha?: string;
  recoveryContact?: string;
  verificationCode?: string;
}

interface UserData {
  nome: string;
  email: string;
  confirmarEmail: string;
  senha: string;
  confirmarSenha: string;
  telefone: string;
}

interface RegisterData {
  nome: string;
  senha_hash: string;
  email: string;
  telefone: string;
  tipo_conta: 'CONTRATANTE' | 'PRESTADOR';
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'cadastro' | 'success' | 'recovery' | 'verification' | 'account-type' | 'service-provider'>('login');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recoveryContact, setRecoveryContact] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '']);
  const [countdown, setCountdown] = useState(27);
  const [selectedAccountType, setSelectedAccountType] = useState<'CONTRATANTE' | 'PRESTADOR' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  const [loginData, setLoginData] = useState({
    email: 'seuemeil@gmail.com',
    senha: ''
  });

  const [userData, setUserData] = useState<UserData>({
    nome: 'Katiê Bueno',
    email: 'seuemeil@gmail.com',
    confirmarEmail: 'seuemeil@gmail.com',
    senha: '',
    confirmarSenha: '',
    telefone: '(11) 90000-1234'
  });

  // Função para validar email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Função para validar nome (não pode conter números)
  const validateName = (name: string): boolean => {
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
    return nameRegex.test(name) && name.trim().length > 0;
  };

  // Função para validar telefone
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  // Função para validar senha
  const validatePassword = (password: string): boolean => {
    return password.length >= 6 && password.length <= 20;
  };

  // Função para limpar erro específico
  const clearError = (field: keyof ValidationErrors) => {
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  };

  const handleScreenTransition = (newScreen: 'login' | 'cadastro' | 'success' | 'recovery' | 'verification' | 'account-type' | 'service-provider') => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen(newScreen);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  const handleLogin = () => {
    const newErrors: ValidationErrors = {};

    // Validar email
    if (!validateEmail(loginData.email)) {
      newErrors.loginEmail = 'Endereço de e-mail inválido';
    }

    // Validar senha
    if (!loginData.senha) {
      newErrors.loginSenha = 'Senha incorreta';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!termsAccepted) {
      setShowTermsModal(true);
      return;
    }

    setErrors({});
    // Lógica de login aqui
    console.log('Login realizado');
  };

  const handleTermsAccept = () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
  };

  const handleCadastro = () => {
    const newErrors: ValidationErrors = {};

    // Validar nome
    if (!validateName(userData.nome)) {
      newErrors.nome = 'Nome inexistente';
    }

    // Validar email
    if (!validateEmail(userData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar confirmação de email
    if (userData.email !== userData.confirmarEmail) {
      newErrors.confirmarEmail = 'Os e-mails não coincidem';
    }

    // Validar senha
    if (!validatePassword(userData.senha)) {
      newErrors.senha = 'Sua senha tem que ser de 6 a 20 caracteres';
    }

    // Validar confirmação de senha
    if (userData.senha !== userData.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem';
    }

    // Validar telefone
    if (!validatePhone(userData.telefone)) {
      newErrors.telefone = 'Telefone inválido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Validações básicas
    if (userData.email !== userData.confirmarEmail) {
      alert('Os e-mails não coincidem');
      return;
    }
    if (userData.senha !== userData.confirmarSenha) {
      alert('As senhas não coincidem');
      return;
    }
    if (!userData.nome || !userData.email || !userData.senha || !userData.telefone) {
      alert('Todos os campos são obrigatórios');
      return;
    }

    setErrors({});
    handleScreenTransition('account-type');
  };

  const handleAccountTypeSubmit = async () => {
    if (!selectedAccountType) {
      alert('Selecione um tipo de conta');
      return;
    }

    if (selectedAccountType === 'PRESTADOR') {
      handleScreenTransition('service-provider');
      return;
    }

    setIsLoading(true);

    const registerData: RegisterData = {
      nome: userData.nome,
      senha_hash: userData.senha,
      email: userData.email,
      telefone: userData.telefone.replace(/\D/g, ''), 
      tipo_conta: selectedAccountType
    };

    try {
      const response = await fetch('http://localhost:8080/v1/facilita/usuario/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData)
      });

      if (response.ok) {
        handleScreenTransition('success');
        setTimeout(() => {
          handleScreenTransition('login');
        }, 2000);
      } else {
        const errorData = await response.json();
        alert(`Erro no cadastro: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      if (error instanceof Error && error.message === 'Failed to fetch') {
        alert('Erro de conexão: Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:8080');
      } else {
        alert('Erro de conexão. Verifique se o servidor está rodando.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceProviderSubmit = async () => {
    setIsLoading(true);

    const registerData: RegisterData = {
      nome: userData.nome,
      senha_hash: userData.senha,
      email: userData.email,
      telefone: userData.telefone.replace(/\D/g, ''),
      tipo_conta: 'PRESTADOR'
    };

    try {
      const response = await fetch('http://localhost:8080/v1/facilita/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData)
      });

      if (response.ok) {
        handleScreenTransition('success');
        setTimeout(() => {
          handleScreenTransition('login');
        }, 2000);
      } else {
        const errorData = await response.json();
        alert(`Erro no cadastro: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      if (error instanceof Error && error.message === 'Failed to fetch') {
        alert('Erro de conexão: Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:8080');
      } else {
        alert('Erro de conexão. Verifique se o servidor está rodando.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverySubmit = () => {
    const newErrors: ValidationErrors = {};

    // Validar se é email ou telefone
    const isEmail = recoveryContact.includes('@');
    const isPhone = /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(recoveryContact);

    if (!isEmail && !isPhone) {
      newErrors.recoveryContact = 'Digite um e-mail ou telefone válido';
      setErrors(newErrors);
      return;
    }

    if (isEmail && !validateEmail(recoveryContact)) {
      newErrors.recoveryContact = 'Endereço de e-mail inválido';
      setErrors(newErrors);
      return;
    }

    setErrors({});
    // Simular envio do código
    handleScreenTransition('verification');
    // Iniciar countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 27;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      
      // Auto focus next input
      if (value && index < 4) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleVerification = () => {
    const code = verificationCode.join('');
    
    if (code.length !== 5 || !/^\d{5}$/.test(code)) {
      setErrors({ verificationCode: 'Código inválido' });
      return;
    }

    setErrors({});
    // Lógica de verificação
    console.log('Código verificado:', verificationCode.join(''));
    handleScreenTransition('login');
  };

  const FacilitaLogo = () => (
    <div className="flex items-center justify-center mt-8 xl:mt-0">
      <div className="flex items-center">
        <img src="/logotcc 1.png" alt="Facilita Logo" className="facilita-logo w-[400px] h-auto" />
      </div>
    </div>
  );



  const UserIcon = () => (
    <div className="w-24 h-24 bg-green-200 rounded-full flex items-center justify-center mb-4">
      <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center">
        <User className="w-8 h-8 text-green-800" />
      </div>
    </div>
  );

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
    );
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
    );
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
          <div className=" flex-1 flex items-center justify-center p-8
">
            <img 
              src="/undraw_order-delivered_puaw 3.png" 
              alt="Ilustração de entrega" 
              className="w-[700px] h-auto"
            />
          </div>
        </div>
        
        <div className="w-1/2 bg-gray-700 h-screen p-4 md:p-8 flex flex-col justify-center relative order-1 md:order-2">
          <div className="bg-green-500 absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 rounded-bl-full">
          <img
                       src="./Vector.png"
                        alt="Decoração"
                       className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 object-contain"
            />

          </div>
          
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
                   handleCodeChange(index, e.target.value);
                   clearError('verificationCode');
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
    );
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
          <div className="bg-green-500 absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 rounded-bl-full"></div>
          
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
                     setRecoveryContact(e.target.value);
                     clearError('recoveryContact');
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
    );
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
    );
  }

  if (currentScreen === 'cadastro') {
    return (
      <div className={`min-h-screen bg-gray-800 flex flex-col xl:flex-row transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        <div className="flex-1 p-4 md:p-8 w-full xl:max-w-lg xl:ml-[15%] xl:mt-[5%]  order-2 xl:order-1">
          <h2 className="text-xl md:text-2xl text-white font-bold mb-6 md:mb-8">Cadastro</h2>
          
          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Nome</label>
              <div className="relative">
                <input
                  type="text"
                  value={userData.nome}
                 onChange={(e) => {
                   setUserData({...userData, nome: e.target.value});
                   clearError('nome');
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
                   setUserData({...userData, email: e.target.value});
                   clearError('email');
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
                   setUserData({...userData, confirmarEmail: e.target.value});
                   clearError('confirmarEmail');
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
                     setUserData({...userData, senha: e.target.value});
                     clearError('senha');
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
                     setUserData({...userData, confirmarSenha: e.target.value});
                     clearError('confirmarSenha');
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
                  type="tel"
                  value={userData.telefone}
                 onChange={(e) => {
                   setUserData({...userData, telefone: e.target.value});
                   clearError('telefone');
                 }}
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
    );
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
        <div className="bg-green-500 absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 rounded-bl-full"></div>
        
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
                   setLoginData({...loginData, email: e.target.value});
                   clearError('loginEmail');
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
                   setLoginData({...loginData, senha: e.target.value});
                   clearError('loginSenha');
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
              setShowTermsModal(false);
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
  );
}

export default App;