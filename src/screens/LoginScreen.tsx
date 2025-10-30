import React from 'react'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'

interface LoginScreenProps {
  loginEmail: string
  loginPassword: string
  showPassword: boolean
  loginError: string
  isLoading: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onTogglePassword: () => void
  onLogin: () => void
  onForgotPassword: () => void
  onGoToSignup: () => void
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  loginEmail,
  loginPassword,
  showPassword,
  loginError,
  isLoading,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onLogin,
  onForgotPassword,
  onGoToSignup
}) => {
  // Garantir que não haja scroll na página
  React.useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [])

  return (
    <div className="h-screen w-screen bg-black overflow-hidden fixed top-0 left-0 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-green-900/50 to-black animate-gradient-shift"></div>
      
      {/* Matrix-style grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.1)_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:40px_40px] lg:bg-[size:50px_50px] xl:bg-[size:60px_60px] animate-pulse-slow"></div>
      
      {/* Floating particles - limitado à área visível */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 md:w-1.5 md:h-1.5 lg:w-2 lg:h-2 bg-green-400 rounded-full animate-float"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          ></div>
        ))}
      </div>
      
      {/* Neon gradient overlays - limitados à área visível */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] xl:w-[600px] xl:h-[600px] bg-gradient-radial from-green-500/30 via-green-400/10 to-transparent rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px] xl:blur-[140px] animate-pulse-glow -mr-[150px] -mt-[150px] sm:-mr-[200px] sm:-mt-[200px] lg:-mr-[250px] lg:-mt-[250px] xl:-mr-[300px] xl:-mt-[300px]"></div>
      <div className="absolute bottom-0 left-0 w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] lg:w-[450px] lg:h-[450px] xl:w-[550px] xl:h-[550px] bg-gradient-radial from-cyan-500/20 via-blue-400/10 to-transparent rounded-full blur-[60px] sm:blur-[80px] lg:blur-[100px] xl:blur-[120px] animate-pulse-glow-delayed -ml-[125px] -mb-[125px] sm:-ml-[175px] sm:-mb-[175px] lg:-ml-[225px] lg:-mb-[225px] xl:-ml-[275px] xl:-mb-[275px]"></div>
      
      {/* Container principal fixo sem rolagem */}
      <div className="relative z-10 bg-gradient-to-br from-white/5 via-green-500/5 to-white/5 backdrop-blur-2xl border border-green-400/30 rounded-3xl shadow-[0_0_50px_rgba(34,197,94,0.3)] w-full max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl p-6 sm:p-8 lg:p-10 xl:p-12 animate-fade-in-up hover:shadow-[0_0_80px_rgba(34,197,94,0.5)] transition-all duration-500 mx-4">
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          {/* Logo futurístico */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-5">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-green-400 via-cyan-400 to-green-400 bg-clip-text text-transparent animate-text-glow">
              FACILITA
            </h1>
            <div className="grid grid-cols-4 gap-1 lg:gap-1.5">
              {[...Array(16)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 h-1 lg:w-1.5 lg:h-1.5 xl:w-2 xl:h-2 rounded-full bg-gradient-to-r from-green-400 to-cyan-400 shadow-[0_0_10px_rgba(34,197,94,0.8)]"
                  style={{
                    animation: `matrix-pulse 1.5s ease-in-out infinite`,
                    animationDelay: `${i * 0.05}s`
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          {/* Linha de energia */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-green-400 to-transparent mb-3 sm:mb-4 lg:mb-5 animate-energy-flow"></div>
          <h2 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-2 lg:mb-3 animate-text-flicker">ACESSO AUTORIZADO</h2>
          <p className="text-green-300 font-mono text-xs sm:text-sm lg:text-base xl:text-lg tracking-wider animate-typing">Iniciando protocolo de autenticação...</p>
        </div>

        {loginError && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-300 px-4 py-3 rounded-lg mb-4">
            {loginError}
          </div>
        )}

        <div className="space-y-4 sm:space-y-6 lg:space-y-7">
          <div>
            <label className="block text-white text-xs sm:text-sm lg:text-base font-medium mb-2">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-2.5 sm:top-3 lg:top-3.5 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-400 group-focus-within:text-cyan-400 transition-colors duration-300" />
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="usuario@facilita.net"
                className="w-full pl-9 sm:pl-10 lg:pl-12 pr-4 py-2.5 sm:py-3 lg:py-4 bg-black/30 backdrop-blur-sm border border-green-400/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.3)] text-white placeholder-green-300/50 transition-all duration-300 font-mono text-sm lg:text-base"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-cyan-400/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          <div>
            <label className="block text-white text-xs sm:text-sm lg:text-base font-medium mb-2">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-2.5 sm:top-3 lg:top-3.5 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-400 group-focus-within:text-cyan-400 transition-colors duration-300" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 sm:pl-10 lg:pl-12 pr-11 sm:pr-12 lg:pr-14 py-2.5 sm:py-3 lg:py-4 bg-black/30 backdrop-blur-sm border border-green-400/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.3)] text-white placeholder-green-300/50 transition-all duration-300 font-mono text-sm lg:text-base"
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute right-3 top-2.5 sm:top-3 lg:top-3.5 text-green-400 hover:text-cyan-400 transition-colors duration-200 hover:scale-110 transform"
              >
                {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              </button>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-cyan-400/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          <button
            onClick={onForgotPassword}
            className="text-xs sm:text-sm lg:text-base text-green-400 hover:text-cyan-400 font-mono tracking-wider transition-all duration-200 hover:scale-105 transform"
          >
            {'>'} RECUPERAR_ACESSO.exe
          </button>

          <button
            onClick={onLogin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-500 via-green-400 to-cyan-500 hover:from-green-400 hover:via-cyan-400 hover:to-green-500 text-black py-3 sm:py-4 lg:py-5 rounded-xl font-bold text-base sm:text-lg lg:text-xl shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:shadow-[0_0_50px_rgba(34,197,94,0.8)] transform hover:scale-105 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 lg:gap-3 font-mono tracking-wider animate-button-glow"
          >
            <LogIn className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            {isLoading ? '>>> PROCESSANDO...' : '>>> INICIAR_SESSÃO'}
          </button>

          <div className="text-center">
            <span className="text-gray-400 font-mono text-xs sm:text-sm lg:text-base">NOVO_USUÁRIO? </span>
            <button
              onClick={onGoToSignup}
              className="text-green-400 hover:text-cyan-400 font-mono font-semibold transition-all duration-200 hover:scale-105 transform tracking-wider text-xs sm:text-sm lg:text-base"
            >
              {'>'} CRIAR_CONTA.exe
            </button>
          </div>
        </div>
      </div>

      {/* Removidos elementos decorativos que poderiam causar rolagem */}
      <style dangerouslySetInnerHTML={{
        __html: `
          html, body, #root { 
            overflow: hidden; 
            height: 100%;
            margin: 0;
            padding: 0;
          }
          * {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          *::-webkit-scrollbar {
            display: none;  /* Chrome, Safari and Opera */
          }
        `
      }} />

      {/* Animações CSS Futurísticas */}
      <style>{`
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
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes matrix-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes text-glow {
          0%, 100% { text-shadow: 0 0 10px rgba(34,197,94,0.5); }
          50% { text-shadow: 0 0 20px rgba(34,197,94,1), 0 0 30px rgba(34,197,94,0.8); }
        }
        
        @keyframes text-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes typing {
          from { width: 0; }
          to { width: 100%; }
        }
        
        @keyframes energy-flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
        
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        
        @keyframes pulse-glow-delayed {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        
        @keyframes pulse-ring-delayed {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        
        @keyframes corner-glow {
          0%, 100% { box-shadow: 0 0 5px rgba(34,197,94,0.3); }
          50% { box-shadow: 0 0 15px rgba(34,197,94,0.8); }
        }
        
        @keyframes button-glow {
          0%, 100% { box-shadow: 0 0 30px rgba(34,197,94,0.5); }
          50% { box-shadow: 0 0 50px rgba(34,197,94,0.8), 0 0 70px rgba(34,197,94,0.6); }
        }
        
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
        .animate-gradient-shift { animation: gradient-shift 8s ease infinite; background-size: 400% 400%; }
        .animate-pulse-slow { animation: pulse 4s ease-in-out infinite; }
        .animate-text-glow { animation: text-glow 2s ease-in-out infinite; }
        .animate-text-flicker { animation: text-flicker 3s ease-in-out infinite; }
        .animate-typing { animation: typing 2s steps(40, end); }
        .animate-energy-flow { animation: energy-flow 2s linear infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-scan { animation: scan 3s linear infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-pulse-glow-delayed { animation: pulse-glow-delayed 3s ease-in-out infinite 1.5s; }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
        .animate-spin-reverse { animation: spin-reverse 8s linear infinite; }
        .animate-pulse-ring { animation: pulse-ring 2s ease-out infinite; }
        .animate-pulse-ring-delayed { animation: pulse-ring-delayed 2s ease-out infinite 1s; }
        .animate-corner-glow { animation: corner-glow 2s ease-in-out infinite; }
        .animate-button-glow { animation: button-glow 2s ease-in-out infinite; }
        
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  )
}

export default LoginScreen
