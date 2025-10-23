import React from 'react'
import { Users, Home, Shield, Zap, LogIn, UserPlus, Package, Truck } from 'lucide-react'

interface LandingScreenProps {
  onLogin: () => void
  onSignup: () => void
}

const LandingScreen: React.FC<LandingScreenProps> = ({ onLogin, onSignup }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 overflow-hidden relative">
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      {/* Gradient overlays */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-500/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]"></div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Content */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24">
          {/* Logo with dots */}
          <div className="mb-8 animate-fade-in-down">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white">
                Facilita
              </h1>
              <div className="grid grid-cols-4 gap-1">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-2 h-2 rounded-full bg-green-500"
                    style={{
                      animation: `pulse 2s ease-in-out infinite`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  ></div>
                ))}
              </div>
            </div>
            <p className="text-gray-400 text-lg">Delivery & Services</p>
          </div>

          {/* Main heading */}
          <div className="mb-8 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Serviços de Entrega
            </h2>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Acessíveis para Todos
            </h3>
          </div>

          {/* Description */}
          <div className="mb-8 animate-fade-in-up delay-200">
            <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-4">
              Plataforma inclusiva de entregas e serviços pensada especialmente para <span className="text-green-400 font-semibold">pessoas com deficiência</span>, <span className="text-green-400 font-semibold">idosos</span> e todos que precisam de mais comodidade no dia a dia.
            </p>
            <p className="text-gray-400 text-base md:text-lg">
              Facilitamos sua vida com entregas de farmácia, mercado, correios e muito mais, tudo no conforto da sua casa.
            </p>
          </div>

          {/* Features badges */}
          <div className="grid grid-cols-2 gap-4 mb-12 animate-fade-in-up delay-300">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Inclusivo</div>
                <div className="text-gray-400 text-xs">Para todos</div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Conforto</div>
                <div className="text-gray-400 text-xs">Em casa</div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Seguro</div>
                <div className="text-gray-400 text-xs">Confiável</div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Rápido</div>
                <div className="text-gray-400 text-xs">Ágil</div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-400">
            <button
              onClick={onLogin}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-green-500/50 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Entrar
            </button>
            
            <button
              onClick={onSignup}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Cadastrar
            </button>
          </div>
        </div>

        {/* Right side - Preview mockup */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-8 animate-fade-in-right">
          <div className="relative">
            {/* Browser mockup */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-500">
              {/* Browser header */}
              <div className="bg-gray-900/80 px-4 py-3 flex items-center gap-2 border-b border-white/10">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 bg-gray-800/50 rounded px-3 py-1 text-xs text-gray-400 ml-4">
                  facilita.app
                </div>
              </div>
              
              {/* Content preview */}
              <div className="p-8 bg-gradient-to-br from-green-500/20 to-blue-500/20">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Package className="w-8 h-8 text-green-400" />
                    <div className="h-4 bg-white/20 rounded w-32"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-white/10 rounded w-full"></div>
                    <div className="h-3 bg-white/10 rounded w-3/4"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <Truck className="w-6 h-6 text-blue-400 mb-2" />
                    <div className="h-2 bg-white/20 rounded w-16"></div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <Shield className="w-6 h-6 text-green-400 mb-2" />
                    <div className="h-2 bg-white/20 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-8 -right-8 w-20 h-20 bg-green-500/30 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-blue-500/30 rounded-full blur-xl animate-pulse delay-1000"></div>
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
        
        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        
        .animate-fade-in-right {
          animation: fade-in-right 1s ease-out;
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
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
}

export default LandingScreen
