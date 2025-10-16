import React from 'react'
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center p-4 overflow-x-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 animate-fadeIn">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🚀</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Criar Conta</h1>
          <p className="text-gray-600 text-sm md:text-base">Preencha seus dados para começar</p>
        </div>

        {signupError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {signupError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={signupData.nome}
                onChange={(e) => onDataChange('nome', e.target.value)}
                placeholder="Seu nome completo"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={signupData.email}
                onChange={(e) => onDataChange('email', e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Telefone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={signupData.telefone}
                onChange={(e) => onDataChange('telefone', e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Tipo de Usuário</label>
            <select
              value={signupData.tipo_usuario}
              onChange={(e) => onDataChange('tipo_usuario', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="CONTRATANTE">Contratante (Solicitar serviços)</option>
              <option value="PRESTADOR">Prestador (Oferecer serviços)</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={signupData.senha}
                onChange={(e) => onDataChange('senha', e.target.value)}
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

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Confirmar Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={onToggleConfirmPassword}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            onClick={onSignup}
            disabled={isLoading}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Criando conta...' : 'Criar Conta'}
          </button>

          <div className="text-center">
            <span className="text-gray-600 text-sm">Já tem uma conta? </span>
            <button
              onClick={onGoToLogin}
              className="text-green-600 hover:text-green-700 font-semibold text-sm"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupScreen
