// Componente para mostrar status de login
import React from 'react'

interface LoginStatusProps {
  isLoggedIn: boolean
  userName?: string
  onLoginClick: () => void
}

const LoginStatus: React.FC<LoginStatusProps> = ({ isLoggedIn, userName, onLoginClick }) => {
  if (isLoggedIn) {
    return (
      <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium">
          Logado como {userName || 'Usuário'}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-2 rounded-lg">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-sm font-medium">Não logado</span>
      </div>
      <button
        onClick={onLoginClick}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Fazer Login
      </button>
    </div>
  )
}

export default LoginStatus
