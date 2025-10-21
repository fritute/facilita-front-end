import React from 'react'
import { Bell, User, MapPin } from 'lucide-react'

interface HomeScreenProps {
  userName: string
  userAddress: string
  activeServiceId: string | null
  serviceStartTime: number | null
  selectedDestination: { address: string; lat: number; lng: number } | null
  onNotificationClick: () => void
  onProfileClick: () => void
  onServiceClick: () => void
  onServiceTracking: () => void
  onCancelService: () => void
  onServiceCardClick: (type: string) => void
  hasUnreadNotifications: boolean
  isDarkMode?: boolean
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  userName,
  userAddress,
  activeServiceId,
  serviceStartTime,
  selectedDestination,
  onNotificationClick,
  onProfileClick,
  onServiceClick,
  onServiceTracking,
  onCancelService,
  onServiceCardClick,
  hasUnreadNotifications,
  isDarkMode = false
}) => {
  const serviceCards = [
    {
      id: 'farmacia',
      name: 'Farmácia',
      icon: '💊',
      color: isDarkMode ? 'bg-gray-800' : 'bg-gray-100',
      image: (
        <svg viewBox="0 0 200 150" className="w-full h-32">
          {/* Fundo com planta */}
          <ellipse cx="40" cy="120" rx="15" ry="8" fill="#8B4513"/>
          <rect x="38" y="90" width="4" height="30" fill="#654321"/>
          <path d="M30 90 Q40 70 50 90" fill="#2E7D32"/>
          <path d="M28 95 Q40 75 52 95" fill="#43A047"/>
          
          {/* Médicos */}
          <g transform="translate(80, 60)">
            {/* Médico 1 */}
            <circle cx="0" cy="0" r="12" fill="#FFE0B2"/>
            <rect x="-8" y="12" width="16" height="30" fill="white" rx="2"/>
            <rect x="-10" y="15" width="20" height="25" fill="#4CAF50" rx="2"/>
            <line x1="-8" y1="20" x2="-15" y2="30" stroke="#FFE0B2" strokeWidth="3"/>
            <line x1="8" y1="20" x2="15" y2="30" stroke="#FFE0B2" strokeWidth="3"/>
            <rect x="-12" y="42" width="10" height="18" fill="#1976D2" rx="1"/>
            <rect x="2" y="42" width="10" height="18" fill="#1976D2" rx="1"/>
          </g>
          
          {/* Médica 2 */}
          <g transform="translate(140, 60)">
            <circle cx="0" cy="0" r="12" fill="#FFE0B2"/>
            <path d="M-8 -5 Q0 -15 8 -5" fill="#8D6E63"/>
            <rect x="-8" y="12" width="16" height="30" fill="white" rx="2"/>
            <rect x="-10" y="15" width="20" height="25" fill="#4CAF50" rx="2"/>
            <line x1="-8" y1="20" x2="-15" y2="30" stroke="#FFE0B2" strokeWidth="3"/>
            <line x1="8" y1="20" x2="15" y2="30" stroke="#FFE0B2" strokeWidth="3"/>
            <rect x="-12" y="42" width="10" height="18" fill="#1976D2" rx="1"/>
            <rect x="2" y="42" width="10" height="18" fill="#1976D2" rx="1"/>
          </g>
          
          {/* Coração com batimento */}
          <g transform="translate(110, 30)">
            <circle cx="0" cy="0" r="25" fill="#4CAF50"/>
            <path d="M-8 -3 L-8 8 L0 0 L8 8 L8 -3" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="-5" cy="-5" r="4" fill="white"/>
            <circle cx="5" cy="-5" r="4" fill="white"/>
          </g>
        </svg>
      )
    },
    {
      id: 'mercado',
      name: 'Mercado',
      icon: '🛒',
      color: isDarkMode ? 'bg-gray-800' : 'bg-gray-100',
      image: (
        <svg viewBox="0 0 200 150" className="w-full h-32">
          {/* Pessoa */}
          <g transform="translate(100, 50)">
            <circle cx="0" cy="0" r="15" fill="#8D6E63"/>
            <rect x="-12" y="15" width="24" height="35" fill="#424242" rx="3"/>
            <rect x="-15" y="18" width="30" height="30" fill="#616161" rx="2"/>
            <line x1="-12" y1="25" x2="-25" y2="40" stroke="#8D6E63" strokeWidth="4" strokeLinecap="round"/>
            <line x1="12" y1="25" x2="25" y2="35" stroke="#8D6E63" strokeWidth="4" strokeLinecap="round"/>
            <rect x="-15" y="50" width="12" height="25" fill="#1976D2" rx="2"/>
            <rect x="3" y="50" width="12" height="25" fill="#1976D2" rx="2"/>
          </g>
          
          {/* Carrinho de compras */}
          <g transform="translate(60, 70)">
            <path d="M0 0 L5 0 L10 25 L35 25 L40 5 L15 5" stroke="#DC2626" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="15" cy="30" r="3" fill="#333"/>
            <circle cx="30" cy="30" r="3" fill="#333"/>
            <rect x="12" y="8" width="20" height="15" fill="none" stroke="#DC2626" strokeWidth="2"/>
          </g>
          
          {/* Folha decorativa */}
          <path d="M140 110 Q145 100 150 110" fill="#4CAF50"/>
          <path d="M145 110 L145 105" stroke="#2E7D32" strokeWidth="1"/>
        </svg>
      )
    },
    {
      id: 'correios',
      name: 'Correios',
      icon: '📦',
      color: isDarkMode ? 'bg-gray-800' : 'bg-gray-100',
      image: (
        <svg viewBox="0 0 200 150" className="w-full h-32">
          {/* Caixa grande */}
          <g transform="translate(100, 60)">
            <rect x="-35" y="-25" width="70" height="60" fill="#FF9800" rx="3"/>
            <rect x="-35" y="-25" width="70" height="15" fill="#F57C00"/>
            <rect x="-30" y="-20" width="60" height="50" fill="#FFB74D" rx="2"/>
            
            {/* Fita adesiva */}
            <rect x="-35" y="10" width="70" height="8" fill="#FDD835"/>
            <line x1="0" y1="-25" x2="0" y2="35" stroke="#FDD835" strokeWidth="8"/>
            
            {/* Código de barras */}
            <g transform="translate(-20, 0)">
              <rect x="0" y="0" width="2" height="15" fill="#333"/>
              <rect x="4" y="0" width="3" height="15" fill="#333"/>
              <rect x="9" y="0" width="2" height="15" fill="#333"/>
              <rect x="13" y="0" width="4" height="15" fill="#333"/>
              <rect x="19" y="0" width="2" height="15" fill="#333"/>
              <rect x="23" y="0" width="3" height="15" fill="#333"/>
              <rect x="28" y="0" width="2" height="15" fill="#333"/>
              <rect x="32" y="0" width="4" height="15" fill="#333"/>
            </g>
            
            {/* Símbolo de reciclagem */}
            <g transform="translate(45, 15)">
              <circle cx="0" cy="0" r="12" fill="#4CAF50" opacity="0.9"/>
              <path d="M-4 -6 L-4 6 L0 3 L4 6 L4 -6 L0 -3 Z" fill="white"/>
              <path d="M-6 0 L6 0 M0 -6 L0 6" stroke="white" strokeWidth="1.5"/>
            </g>
          </g>
        </svg>
      )
    },
    {
      id: 'shopping',
      name: 'Shopping',
      icon: '🛍️',
      color: isDarkMode ? 'bg-gray-800' : 'bg-gray-100',
      image: (
        <svg viewBox="0 0 200 150" className="w-full h-32">
          {/* Pessoa com sacolas */}
          <g transform="translate(100, 60)">
            {/* Cabeça */}
            <circle cx="0" cy="-20" r="15" fill="#8D6E63"/>
            <path d="M-10 -30 Q0 -40 10 -30" fill="#424242"/>
            
            {/* Corpo */}
            <ellipse cx="0" cy="10" rx="18" ry="25" fill="#E91E63"/>
            <path d="M-15 0 Q-10 -5 -5 0" fill="#C2185B"/>
            <path d="M5 0 Q10 -5 15 0" fill="#C2185B"/>
            
            {/* Braço esquerdo com sacola */}
            <line x1="-15" y1="5" x2="-30" y2="15" stroke="#8D6E63" strokeWidth="5" strokeLinecap="round"/>
            <path d="M-35 15 L-40 35 L-25 35 L-30 15 Z" fill="#4CAF50"/>
            <path d="M-35 15 Q-32.5 10 -30 15" stroke="#4CAF50" strokeWidth="2" fill="none"/>
            
            {/* Braço direito com sacola */}
            <line x1="15" y1="5" x2="30" y2="15" stroke="#8D6E63" strokeWidth="5" strokeLinecap="round"/>
            <path d="M25 15 L20 35 L35 35 L30 15 Z" fill="#2196F3"/>
            <path d="M25 15 Q27.5 10 30 15" stroke="#2196F3" strokeWidth="2" fill="none"/>
            
            {/* Pernas */}
            <rect x="-10" y="35" width="8" height="25" fill="#1976D2" rx="2"/>
            <rect x="2" y="35" width="8" height="25" fill="#1976D2" rx="2"/>
            
            {/* Sapatos */}
            <ellipse cx="-6" cy="62" rx="6" ry="3" fill="#424242"/>
            <ellipse cx="6" cy="62" rx="6" ry="3" fill="#424242"/>
          </g>
        </svg>
      )
    }
  ]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Header */}
      <div className={`text-white p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-green-500'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <User className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-green-500'}`} />
            </div>
            <div>
              <p className="text-sm opacity-90">Olá,</p>
              <p className="font-bold">{userName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onNotificationClick}
              className="relative text-white hover:text-gray-200 transition-colors"
            >
              <Bell className="w-6 h-6" />
              {hasUnreadNotifications && (
                <span className={`absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 ${isDarkMode ? 'border-emerald-600' : 'border-green-500'}`}></span>
              )}
            </button>
            <button
              onClick={onProfileClick}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>

        {userAddress && (
          <div className="flex items-center text-sm opacity-90">
            <MapPin className="w-4 h-4 mr-2" />
            <p className="truncate">{userAddress}</p>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Serviço ativo */}
        {activeServiceId && (
          <div className={`rounded-lg p-4 mb-6 shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border border-emerald-700' : 'bg-white border border-green-300'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Serviço em andamento</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {selectedDestination?.address || 'Destino não especificado'}
                </p>
                {serviceStartTime && (
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Iniciado há {Math.floor((Date.now() - serviceStartTime) / 60000)} min
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={onServiceTracking}
                  className={`text-white px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-green-500 hover:bg-green-600'}`}
                >
                  Ver Status
                </button>
                <button
                  onClick={onCancelService}
                  className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  title="Cancelar serviço"
                >
                  ❌
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mensagem quando não há serviço */}
        {!activeServiceId && (
          <div className={`rounded-lg p-4 mb-6 shadow-sm text-center transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Nenhum serviço solicitado no momento</p>
          </div>
        )}

        {/* Hero section */}
        <div className={`text-white rounded-2xl p-8 mb-6 flex items-center justify-between shadow-lg transition-colors duration-300 ${isDarkMode ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-green-500'}`}>
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-4 leading-tight">
              Agende já o seu<br />
              serviço sem sair<br />
              de casa
            </h2>
            <button
              onClick={onServiceClick}
              className={`px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-md ${isDarkMode ? 'bg-gray-800 text-emerald-400 hover:bg-gray-700' : 'bg-white text-green-600 hover:bg-gray-100'}`}
            >
              Serviços
            </button>
          </div>
          <div className={`w-40 h-40 rounded-3xl flex items-center justify-center shadow-xl transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Ilustração de celular */}
            <svg viewBox="0 0 100 140" className="w-32 h-32">
              {/* Celular */}
              <rect x="20" y="10" width="60" height="120" rx="8" fill="#1F2937"/>
              <rect x="25" y="20" width="50" height="100" rx="4" fill="white"/>
              
              {/* Notch */}
              <rect x="40" y="12" width="20" height="4" rx="2" fill="#374151"/>
              
              {/* Avatar */}
              <circle cx="50" cy="45" r="12" fill="#E5E7EB"/>
              <circle cx="50" cy="42" r="8" fill="#10B981"/>
              <path d="M42 50 Q50 46 58 50" fill="#10B981"/>
              
              {/* Mensagens */}
              <rect x="32" y="62" width="25" height="8" rx="4" fill="#FCA5A5"/>
              <rect x="60" y="62" width="8" height="8" rx="2" fill="#10B981"/>
              
              <rect x="32" y="73" width="8" height="6" rx="3" fill="#E5E7EB"/>
              <rect x="43" y="73" width="25" height="6" rx="3" fill="#E5E7EB"/>
              
              <rect x="32" y="82" width="8" height="6" rx="3" fill="#E5E7EB"/>
              <rect x="43" y="82" width="20" height="6" rx="3" fill="#10B981"/>
            </svg>
          </div>
        </div>

        {/* Barra de busca */}
        <div className="mb-6">
          <div className={`rounded-xl p-4 flex items-center gap-3 shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-200'}`}>
            <svg className={`w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Solicite seu serviço"
              className={`bg-transparent flex-1 outline-none transition-colors duration-300 ${isDarkMode ? 'text-gray-200 placeholder-gray-500' : 'text-gray-700 placeholder-gray-500'}`}
            />
          </div>
        </div>

        {/* Cards de serviços */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {serviceCards.map((card) => (
            <button
              key={card.id}
              onClick={() => onServiceCardClick(card.id)}
              className={`${card.color} rounded-2xl p-8 text-center hover:shadow-xl transition-all transform hover:scale-105 ${isDarkMode ? 'border border-gray-700' : 'border border-gray-200'} min-h-[160px]`}
            >
              <div className="flex justify-center mb-4">{card.image}</div>
              <p className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{card.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HomeScreen
