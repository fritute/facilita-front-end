import React from 'react'
import { Bell, User, MapPin, ShoppingCart, Package, Building2 } from 'lucide-react'

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
  hasUnreadNotifications
}) => {
  const serviceCards = [
    {
      id: 'farmacia',
      name: 'Farmácia',
      icon: '💊',
      color: 'bg-green-100',
      image: (
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          <circle cx="50" cy="50" r="40" fill="#E8F5E8"/>
          <rect x="40" y="30" width="20" height="40" fill="#4CAF50" rx="2"/>
          <rect x="30" y="40" width="40" height="20" fill="#4CAF50" rx="2"/>
        </svg>
      )
    },
    {
      id: 'mercado',
      name: 'Mercado',
      icon: '🛒',
      color: 'bg-blue-100',
      image: (
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          <circle cx="50" cy="50" r="40" fill="#E3F2FD"/>
          <path d="M30 40 L35 60 L65 60 L70 40 Z" fill="#DC2626"/>
          <circle cx="40" cy="65" r="3" fill="#333"/>
          <circle cx="60" cy="65" r="3" fill="#333"/>
        </svg>
      )
    },
    {
      id: 'correios',
      name: 'Correios',
      icon: '📦',
      color: 'bg-orange-100',
      image: (
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          <circle cx="50" cy="50" r="40" fill="#FFF3E0"/>
          <rect x="30" y="35" width="40" height="30" fill="#FF8C00" rx="2"/>
          <path d="M30 50 L50 40 L70 50" stroke="#8B4513" strokeWidth="2" fill="none"/>
        </svg>
      )
    },
    {
      id: 'shopping',
      name: 'Shopping',
      icon: '🛍️',
      color: 'bg-purple-100',
      image: (
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          <circle cx="50" cy="50" r="40" fill="#F3E5F5"/>
          <rect x="35" y="40" width="30" height="25" fill="#9C27B0" rx="2"/>
          <path d="M40 40 Q50 30 60 40" stroke="#9C27B0" strokeWidth="2" fill="none"/>
        </svg>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-green-500 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
              <User className="w-6 h-6 text-green-500" />
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
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-green-500"></span>
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
          <div className="bg-white border border-green-300 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">Serviço em andamento</h3>
                <p className="text-sm text-gray-600">
                  {selectedDestination?.address || 'Destino não especificado'}
                </p>
                {serviceStartTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    Iniciado há {Math.floor((Date.now() - serviceStartTime) / 60000)} min
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={onServiceTracking}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
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
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm text-center">
            <p className="text-gray-600">Nenhum serviço solicitado no momento</p>
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
            <button
              onClick={onServiceClick}
              className="bg-white text-green-500 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Serviços
            </button>
          </div>
          <div className="w-32 h-32 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <Package className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* Cards de serviços */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {serviceCards.map((card) => (
            <button
              key={card.id}
              onClick={() => onServiceCardClick(card.id)}
              className={`${card.color} rounded-lg p-6 text-center hover:shadow-lg transition-all transform hover:scale-105`}
            >
              <div className="flex justify-center mb-3">{card.image}</div>
              <p className="font-semibold text-gray-800">{card.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HomeScreen
