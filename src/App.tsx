import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';

interface UserData {
  nome: string;
  email: string;
  confirmarEmail: string;
  senha: string;
  confirmarSenha: string;
  telefone: string;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'cadastro' | 'success' | 'recovery' | 'verification'>('login');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recoveryContact, setRecoveryContact] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '']);
  const [countdown, setCountdown] = useState(27);
  
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

  const handleScreenTransition = (newScreen: 'login' | 'cadastro' | 'success' | 'recovery' | 'verification') => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen(newScreen);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  const handleLogin = () => {
    if (!termsAccepted) {
      setShowTermsModal(true);
      return;
    }
    // Lógica de login aqui
    console.log('Login realizado');
  };

  const handleTermsAccept = () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
  };

  const handleCadastro = () => {
    handleScreenTransition('success');
    setTimeout(() => {
      handleScreenTransition('login');
    }, 2000);
  };

  const handleRecoverySubmit = () => {
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
    // Lógica de verificação
    console.log('Código verificado:', verificationCode.join(''));
    handleScreenTransition('login');
  };

  const FacilitaLogo = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center">
        <img src="/logotcc 1.png" alt="Facilita Logo" className="h-16" />
      </div>
    </div>
  );

  const Illustration = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="relative max-w-md">
        <img 
          src="/undraw_order-delivered_puaw 3.png" 
          alt="Ilustração de entrega" 
          className="w-full h-auto"
        />
      </div>
    </div>
  );

  if (currentScreen === 'verification') {
    return (
      <div className={`min-h-screen bg-gray-800 flex transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        <div className="flex-1 flex items-center justify-center p-8 relative">
          <div className="absolute top-8 left-8">
            <FacilitaLogo />
          </div>
          <div className="max-w-md mt-16">
            <img 
              src="/undraw_order-delivered_puaw 3.png" 
              alt="Ilustração de entrega" 
              className="w-full h-auto"
            />
          </div>
        </div>
        
        <div className="flex-1 bg-gray-700 p-8 max-w-md flex flex-col justify-center">
          <div className="bg-green-500 absolute top-0 right-0 w-48 h-48 rounded-bl-full"></div>
          
          <div className="relative z-10 text-center">
            <h2 className="text-2xl text-white font-bold mb-2">Recuperação de senha</h2>
            <p className="text-gray-400 mb-8">
              Informe o código de 5 dígitos que foi<br />
              enviado para o sms *********
            </p>

            <div className="flex justify-center space-x-3 mb-4">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  className="w-12 h-12 bg-gray-600 text-white text-center text-xl rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              ))}
            </div>

            <p className="text-red-400 text-sm mb-2">Código não foi enviado?</p>
            <p className="text-gray-400 text-sm mb-8">
              Reenviar o código em {countdown} segundos.
            </p>

            <div className="flex space-x-4">
              <button
                onClick={() => handleScreenTransition('recovery')}
                className="flex-1 bg-transparent border border-green-500 text-green-500 py-3 rounded-lg font-semibold hover:bg-green-500 hover:text-white transition-colors"
              >
                Tentar outro método
              </button>
              <button
                onClick={handleVerification}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
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
      <div className={`min-h-screen bg-gray-800 flex transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        <div className="flex-1 flex items-center justify-center p-8 relative">
          <div className="absolute top-8 left-8">
            <FacilitaLogo />
          </div>
          <div className="max-w-md mt-16">
            <img 
              src="/undraw_order-delivered_puaw 3.png" 
              alt="Ilustração de entrega" 
              className="w-full h-auto"
            />
          </div>
        </div>
        
        <div className="flex-1 bg-gray-700 p-8 max-w-md flex flex-col justify-center">
          <div className="bg-green-500 absolute top-0 right-0 w-48 h-48 rounded-bl-full"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl text-white font-bold mb-2">Recuperar senha</h2>
            <p className="text-gray-400 mb-8">
              Digite seu e-mail ou telefone para<br />
              recuperar sua senha
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-gray-400 text-sm mb-2">E-mail ou Telefone</label>
                <div className="relative">
                  <input
                    type="text"
                    value={recoveryContact}
                    onChange={(e) => setRecoveryContact(e.target.value)}
                    placeholder="Digite seu e-mail ou telefone"
                    className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <Mail className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <button
                onClick={handleRecoverySubmit}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
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
      <div className={`min-h-screen bg-gray-800 flex transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}>
        <div className="flex-1 p-8 max-w-md">
          <h2 className="text-2xl text-white font-bold mb-8">Cadastro</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Nome</label>
              <div className="relative">
                <input
                  type="text"
                  value={userData.nome}
                  onChange={(e) => setUserData({...userData, nome: e.target.value})}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <User className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">E-mail</label>
              <div className="relative">
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({...userData, email: e.target.value})}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Mail className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Confirmar Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={userData.confirmarEmail}
                  onChange={(e) => setUserData({...userData, confirmarEmail: e.target.value})}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Mail className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={userData.senha}
                    onChange={(e) => setUserData({...userData, senha: e.target.value})}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 h-5 w-5 text-gray-400"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Confirmar Senha</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={userData.confirmarSenha}
                    onChange={(e) => setUserData({...userData, confirmarSenha: e.target.value})}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 h-5 w-5 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Telefone</label>
              <div className="relative">
                <input
                  type="tel"
                  value={userData.telefone}
                  onChange={(e) => setUserData({...userData, telefone: e.target.value})}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Phone className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <button
              onClick={handleCadastro}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
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

        <div className="flex-1 flex flex-col justify-end items-end p-8">
          <div className="absolute top-8 right-8">
            <FacilitaLogo />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="relative max-w-sm">
              <img 
                src="/undraw_order-delivered_puaw 3.png" 
                alt="Ilustração de entrega" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-800 flex transition-all duration-300 ${
      isTransitioning ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-0'
    }`}>
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute top-8 left-8">
          <FacilitaLogo />
        </div>
        <div className="max-w-md mt-16">
          <img 
            src="/undraw_order-delivered_puaw 3.png" 
            alt="Ilustração de entrega" 
            className="w-full h-auto"
          />
        </div>
      </div>
      
      <div className="flex-1 bg-gray-700 p-8 max-w-md flex flex-col justify-center">
        <div className="bg-green-500 absolute top-0 right-0 w-48 h-48 rounded-bl-full"></div>
        
        <div className="relative z-10">
          <h2 className="text-3xl text-white font-bold mb-2">Entrar no Facilita</h2>
          <p className="text-gray-400 mb-8">
            Não possui uma conta?{' '}
            <button
              onClick={() => handleScreenTransition('cadastro')}
              className="text-green-400 hover:underline"
            >
              Cadastre-se
            </button>
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">E-mail</label>
              <div className="relative">
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Mail className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Senha</label>
              <div className="relative">
                <input
                  type="password"
                  value={loginData.senha}
                  onChange={(e) => setLoginData({...loginData, senha: e.target.value})}
                  className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••••"
                />
                <Lock className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
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
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Termos */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden animate-slideUp">
            <div className="p-6">
              <h2 className="text-xl font-bold text-center mb-4">
                Termos de Uso e Política de Privacidade
              </h2>
              
              <div className="max-h-96 overflow-y-auto text-sm text-gray-700 leading-relaxed space-y-4 mb-6">
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

              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mr-2 accent-green-500"
                />
                <span className="text-sm text-gray-700">
                  Li e estou de acordo com{' '}
                  <span className="text-green-500">Termo de Uso</span> e{' '}
                  <span className="text-green-500">Política de Privacidade</span>
                </span>
              </div>

              <button
                onClick={handleTermsAccept}
                disabled={!termsAccepted}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
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
      )}
    </div>
  );
}

export default App;