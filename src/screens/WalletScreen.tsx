import React from 'react'
import { ArrowLeft, Bell, Eye, Plus } from 'lucide-react'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
}

interface WalletScreenProps {
  balance: number
  onBack: () => void
  onNotificationClick: () => void
  onProfileClick: () => void
  hasUnreadNotifications: boolean
  profilePhoto: string | null
  userName: string
}

const WalletScreen: React.FC<WalletScreenProps> = ({
  balance,
  onBack,
  onNotificationClick,
  onProfileClick,
  hasUnreadNotifications,
  profilePhoto,
  userName
}) => {
  // Dados estáticos de transações
  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'income',
      amount: 200.00,
      description: 'Recarga via Pix',
      category: 'Recarga'
    },
    {
      id: '2',
      type: 'expense',
      amount: 80.00,
      description: 'José Silva',
      category: 'Farmacia'
    },
    {
      id: '3',
      type: 'expense',
      amount: 15.50,
      description: 'Daniela Borges',
      category: 'Farmacia'
    },
    {
      id: '4',
      type: 'expense',
      amount: 23.50,
      description: 'Daniela Borges',
      category: 'Farmacia'
    }
  ]

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between shadow-sm">
        <button onClick={onBack} className="text-gray-800 hover:text-gray-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-800">Saldo Total</span>
          <button className="text-gray-400 hover:text-gray-600">
            <Eye className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={onNotificationClick}
          className="relative text-gray-800 hover:text-gray-600"
        >
          <Bell className="w-6 h-6" />
          {hasUnreadNotifications && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </button>
      </div>

      {/* Profile Section */}
      <div className="flex items-center justify-end p-4">
        <button 
          onClick={onProfileClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-sm font-medium text-gray-800">Perfil</span>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-green-500 flex items-center justify-center">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-semibold text-sm">{getInitials(userName)}</span>
            )}
          </div>
        </button>
      </div>

      {/* Cards Section - Horizontal Scroll */}
      <div className="px-4 mb-6">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {/* Balance Card */}
          <div className="flex-shrink-0 w-64">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 shadow-lg relative overflow-hidden h-40">
              {/* Card decorative elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mt-12"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white opacity-10 rounded-full -ml-10 -mb-10"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="text-white text-xs mb-1 flex items-center justify-between">
                  <span className="text-lg font-bold">R$ {balance.toFixed(2)}</span>
                  <div className="flex gap-1">
                    <div className="w-6 h-4 bg-white bg-opacity-30 rounded"></div>
                    <div className="w-6 h-4 bg-white bg-opacity-30 rounded"></div>
                  </div>
                </div>
                
                <div className="text-white text-xs opacity-80">Saldo disponível</div>
              </div>
            </div>
          </div>

          {/* Add Card Button */}
          <div className="flex-shrink-0 w-64">
            <button className="w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-green-500 hover:bg-green-50 transition-all">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-600 font-medium">Adicionar cartão</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <button className="bg-green-600 text-white text-sm py-2.5 px-6 rounded-full font-medium hover:bg-green-700 transition-colors shadow-md">
            Adicionar saldo
          </button>
          <button className="bg-green-600 text-white text-sm py-2.5 px-6 rounded-full font-medium hover:bg-green-700 transition-colors shadow-md">
            Sacar
          </button>
        </div>
      </div>

      {/* Transactions */}
      <div className="px-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Transações</h2>
        
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {transaction.type === 'income' ? (
                      <>
                        <path d="M12 5v14M5 12l7-7 7 7" />
                      </>
                    ) : (
                      <>
                        <path d="M12 19V5M5 12l7 7 7-7" />
                      </>
                    )}
                  </svg>
                </div>
                <div>
                  <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">{transaction.description}</p>
                </div>
              </div>
              
              <button className="bg-green-500 text-white text-xs py-2 px-4 rounded-full font-medium hover:bg-green-600 transition-colors">
                {transaction.category}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WalletScreen
