import React from 'react'
import { Bell, Eye, Plus } from 'lucide-react'

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
  hasWallet: boolean
  onCreateWallet: () => void
  walletData: any
  onRecharge: () => void
  onWithdraw: () => void
  transactions: any[]
  loadingTransactions: boolean
  onTestWallet?: () => void
  isDarkMode?: boolean
  themeClasses?: any
}

const WalletScreen: React.FC<WalletScreenProps> = ({
  balance,
  onBack,
  onNotificationClick,
  onProfileClick,
  hasUnreadNotifications,
  profilePhoto,
  userName,
  hasWallet,
  onCreateWallet,
  walletData,
  onRecharge,
  onWithdraw,
  transactions: apiTransactions,
  loadingTransactions,
  onTestWallet,
  isDarkMode = false,
  themeClasses = {
    bg: 'bg-gray-100',
    bgCard: 'bg-white',
    bgSecondary: 'bg-gray-50',
    text: 'text-gray-800',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200'
  }
}) => {
  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Usar transações da API ou dados estáticos como fallback
  const transactions: Transaction[] = apiTransactions.length > 0 ? apiTransactions.map(t => ({
    id: t.id.toString(),
    type: t.tipo === 'ENTRADA' ? 'income' as const : 'expense' as const,
    amount: parseFloat(t.valor),
    description: t.descricao,
    category: t.tipo === 'ENTRADA' ? 'Recarga' : 'Serviço'
  })) : [
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

  // Se não tem carteira, mostrar tela de criação
  if (!hasWallet) {
    return (
      <div className={`min-h-screen ${themeClasses.bg} overflow-x-hidden pb-20`}>
        {/* Header */}
        <div className={`${themeClasses.bgCard} p-4 flex items-center justify-between shadow-sm`}>
          <button onClick={onBack} className={`${themeClasses.text} hover:opacity-70`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className={`text-lg font-bold ${themeClasses.text}`}>Carteira Digital</h1>
          <div className="w-6"></div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </div>
          
          <h2 className={`text-2xl font-bold ${themeClasses.text} mb-3 text-center`}>
            Crie sua Carteira Digital
          </h2>
          
          <p className={`${themeClasses.textSecondary} text-center mb-8 max-w-sm`}>
            Para usar a carteira digital e receber pagamentos, você precisa criar sua carteira integrada com o PagBank.
          </p>

          <button
            onClick={onCreateWallet}
            className="bg-green-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors shadow-lg"
          >
            Criar Carteira Digital
          </button>

          <div className={`mt-12 ${themeClasses.bgCard} rounded-2xl p-6 shadow-sm max-w-sm`}>
            <h3 className={`font-bold ${themeClasses.text} mb-4`}>Benefícios:</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className={`text-sm ${themeClasses.textSecondary}`}>Receba pagamentos instantaneamente</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className={`text-sm ${themeClasses.textSecondary}`}>Integração segura com PagBank</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className={`text-sm ${themeClasses.textSecondary}`}>Acompanhe todas suas transações</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className={`text-sm ${themeClasses.textSecondary}`}>Saque quando quiser</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg} overflow-x-hidden pb-20`}>
      {/* Header */}
      <div className={`${themeClasses.bgCard} p-4 flex items-center justify-between shadow-sm`}>
        <button onClick={onBack} className={`${themeClasses.text} hover:opacity-70`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${themeClasses.text}`}>Saldo Total</span>
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
                  <span className="text-lg font-bold">R$ {formatCurrency(balance)}</span>
                  <div className="flex gap-1">
                    <div className="w-6 h-4 bg-white bg-opacity-30 rounded"></div>
                    <div className="w-6 h-4 bg-white bg-opacity-30 rounded"></div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-white text-xs opacity-80">Saldo disponível</div>
                  {walletData?.chave_pagbank && (
                    <div className="text-white text-xs opacity-60">
                      PagBank: {walletData.chave_pagbank}
                    </div>
                  )}
                </div>
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
          <button 
            onClick={onRecharge}
            className="bg-green-600 text-white text-sm py-2.5 px-6 rounded-full font-medium hover:bg-green-700 transition-colors shadow-md"
          >
            Adicionar saldo
          </button>
          <button 
            onClick={onWithdraw}
            className="bg-green-600 text-white text-sm py-2.5 px-6 rounded-full font-medium hover:bg-green-700 transition-colors shadow-md"
          >
            Sacar
          </button>
          {onTestWallet && (
            <button 
              onClick={onTestWallet}
              className="bg-blue-600 text-white text-sm py-2.5 px-4 rounded-full font-medium hover:bg-blue-700 transition-colors shadow-md"
            >
              🔍 Teste
            </button>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Transações</h2>
          {loadingTransactions && (
            <div className="text-sm text-gray-500">Carregando...</div>
          )}
        </div>
        
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
                  <span className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'} R$ {formatCurrency(transaction.amount)}
                  </span>
                  <p className="text-sm text-gray-600">{transaction.description}</p>
                </div>
              </div>
              
              <button className="bg-green-500 text-white text-xs py-2 px-4 rounded-full font-medium hover:bg-green-600 transition-colors">
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WalletScreen
