import React from 'react'
import { Mail, Lock, User, Phone, Eye, EyeOff, UserPlus } from 'lucide-react'

interface SignupScreenProps {
  signupData: {
    nome: string
    email: string
    senha: string
    telefone: string
    tipo_usuario: string
  }
  confirmPassword: string
  showPassword: boolean
  showConfirmPassword: boolean
  signupError: string
  isLoading: boolean
  onDataChange: (field: string, value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onTogglePassword: () => void
  onToggleConfirmPassword: () => void
  onSignup: () => void
  onGoToLogin: () => void
}

const SignupScreen: React.FC<SignupScreenProps> = ({
  signupData,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  signupError,
  isLoading,
  onDataChange,
  onConfirmPasswordChange,
  onTogglePassword,
  onToggleConfirmPassword,
  onSignup,
  onGoToLogin
}) => {
  return (
    <div className="min-h-screen bg-black overflow-hidden relative flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-green-900/50 to-black animate-gradient-shift"></div>
      
      {/* Matrix-style grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.1)_1px,transparent_1px)] bg-[size:30px_30px] animate-pulse-slow"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          ></div>
        ))}
      </div>
      
      {/* Neon gradient overlays */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-green-500/30 via-green-400/10 to-transparent rounded-full blur-[100px] animate-pulse-glow"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-cyan-500/20 via-blue-400/10 to-transparent rounded-full blur-[80px] animate-pulse-glow-delayed"></div>
      
      {/* Scanning lines */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent h-2 animate-scan"></div>

      <div className="relative z-10 bg-gradient-to-br from-white/5 via-green-500/5 to-white/5 backdrop-blur-2xl border border-green-400/30 rounded-3xl shadow-[0_0_50px_rgba(34,197,94,0.3)] w-full max-w-md p-6 md:p-8 animate-fade-in-up hover:shadow-[0_0_80px_rgba(34,197,94,0.5)] transition-all duration-500">
        <div className="text-center mb-6">
          {/* Logo futurístico */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 via-cyan-400 to-green-400 bg-clip-text text-transparent animate-text-glow">
              FACILITA
            </h1>
            <div className="grid grid-cols-4 gap-1">
              {[...Array(16)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 h-1 rounded-full bg-gradient-to-r from-green-400 to-cyan-400 shadow-[0_0_10px_rgba(34,197,94,0.8)]"
                  style={{
                    animation: `matrix-pulse 1.5s ease-in-out infinite`,
                    animationDelay: `${i * 0.05}s`
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          {/* Linha de energia */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-green-400 to-transparent mb-4 animate-energy-flow"></div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2 animate-text-flicker">REGISTRO DE NOVO USUÁRIO</h2>
          <p className="text-green-300 font-mono text-sm tracking-wider animate-typing">Iniciando protocolo de cadastramento...</p>
        </div>

        {signupError && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
            {signupError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Nome Completo</label>
            <div className="relative group">
              <User className="absolute left-3 top-3 w-5 h-5 text-green-400 group-focus-within:text-cyan-400 transition-colors duration-300" />
              <input
                type="text"
                value={signupData.nome}
                onChange={(e) => onDataChange('nome', e.target.value)}
                placeholder="Nome_Completo.txt"
                className="w-full pl-10 pr-4 py-3 bg-black/30 backdrop-blur-sm border border-green-400/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.3)] text-white placeholder-green-300/50 transition-all duration-300 font-mono"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-cyan-400/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-green-400 group-focus-within:text-cyan-400 transition-colors duration-300" />
              <input
                type="email"
                value={signupData.email}
                onChange={(e) => onDataChange('email', e.target.value)}
                placeholder="usuario@facilita.net"
                className="w-full pl-10 pr-4 py-3 bg-black/30 backdrop-blur-sm border border-green-400/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.3)] text-white placeholder-green-300/50 transition-all duration-300 font-mono"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-cyan-400/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Telefone</label>
            <div className="relative group">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-green-400 group-focus-within:text-cyan-400 transition-colors duration-300" />
              <input
                type="tel"
                value={signupData.telefone}
                onChange={(e) => onDataChange('telefone', e.target.value)}
                placeholder="+55_11_99999-9999"
                className="w-full pl-10 pr-4 py-3 bg-black/30 backdrop-blur-sm border border-green-400/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.3)] text-white placeholder-green-300/50 transition-all duration-300 font-mono"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-cyan-400/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Tipo de Usuário</label>
            <select
              value={signupData.tipo_usuario}
              onChange={(e) => onDataChange('tipo_usuario', e.target.value)}
              className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-green-400/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.3)] text-white transition-all duration-300 font-mono"
            >
              <option value="CONTRATANTE" className="bg-gray-900 text-green-300">CONTRATANTE.exe (Solicitar serviços)</option>
              <option value="PRESTADOR" className="bg-gray-900 text-green-300">PRESTADOR.exe (Oferecer serviços)</option>
            </select>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-green-400 group-focus-within:text-cyan-400 transition-colors duration-300" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={signupData.senha}
                onChange={(e) => onDataChange('senha', e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-12 py-3 bg-black/30 backdrop-blur-sm border border-green-400/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.3)] text-white placeholder-green-300/50 transition-all duration-300 font-mono"
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute right-3 top-3 text-green-400 hover:text-cyan-400 transition-colors duration-200 hover:scale-110 transform"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-cyan-400/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Confirmar Senha</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-green-400 group-focus-within:text-cyan-400 transition-colors duration-300" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-12 py-3 bg-black/30 backdrop-blur-sm border border-green-400/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.3)] text-white placeholder-green-300/50 transition-all duration-300 font-mono"
              />
              <button
                type="button"
                onClick={onToggleConfirmPassword}
                className="absolute right-3 top-3 text-green-400 hover:text-cyan-400 transition-colors duration-200 hover:scale-110 transform"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-cyan-400/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          <button
            onClick={onSignup}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-500 via-green-400 to-cyan-500 hover:from-green-400 hover:via-cyan-400 hover:to-green-500 text-black py-4 rounded-xl font-bold text-lg shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:shadow-[0_0_50px_rgba(34,197,94,0.8)] transform hover:scale-105 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 font-mono tracking-wider animate-button-glow"
          >
            <UserPlus className="w-5 h-5" />
            {isLoading ? '>>> PROCESSANDO...' : '>>> CRIAR_USUÁRIO'}
          </button>

          <div className="text-center">
            <span className="text-gray-400 font-mono text-sm">JÁ_POSSUI_CONTA? </span>
            <button
              onClick={onGoToLogin}
              className="text-green-400 hover:text-cyan-400 font-mono font-semibold text-sm transition-all duration-200 hover:scale-105 transform tracking-wider"
            >
              {'>'} LOGIN.exe
            </button>
          </div>
        </div>
      </div>

      {/* Holographic elements */}
      <div className="absolute top-10 left-10 w-32 h-32 border border-green-400/30 rounded-full animate-spin-slow">
        <div className="absolute inset-4 border border-cyan-400/20 rounded-full animate-spin-reverse"></div>
      </div>
      <div className="absolute bottom-10 right-10 w-24 h-24 border border-green-400/30 rounded-full animate-pulse-ring">
        <div className="absolute inset-2 border border-cyan-400/20 rounded-full animate-pulse-ring-delayed"></div>
      </div>
      
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-green-400/50 animate-corner-glow"></div>
      <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-green-400/50 animate-corner-glow"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-green-400/50 animate-corner-glow"></div>
      <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-green-400/50 animate-corner-glow"></div>

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

export default SignupScreen
