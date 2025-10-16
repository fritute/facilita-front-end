import React from 'react'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fadeIn">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🚀</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Bem-vindo de volta!</h1>
          <p className="text-gray-600">Entre na sua conta para continuar</p>
        </div>

        {loginError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {loginError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            onClick={onForgotPassword}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Esqueceu sua senha?
          </button>

          <button
            onClick={onLogin}
            disabled={isLoading}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="text-center">
            <span className="text-gray-600">Não tem uma conta? </span>
            <button
              onClick={onGoToSignup}
              className="text-green-600 hover:text-green-700 font-semibold"
            >
              Cadastre-se
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen
