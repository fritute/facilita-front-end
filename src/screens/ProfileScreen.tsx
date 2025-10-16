import React from 'react'
import { ArrowLeft, Bell, User, Camera, Lock, LogOut } from 'lucide-react'

interface ProfileScreenProps {
  userName: string
  userEmail: string
  userPhone: string
  userAddress: string
  profilePhoto: string | null
  hasUnreadNotifications: boolean
  onBack: () => void
  onNotificationClick: () => void
  onPhotoChange: (file: File) => void
  onChangePassword: () => void
  onLogout: () => void
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userName,
  userEmail,
  userPhone,
  userAddress,
  profilePhoto,
  hasUnreadNotifications,
  onBack,
  onNotificationClick,
  onPhotoChange,
  onChangePassword,
  onLogout
}) => {
  const handlePhotoClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        onPhotoChange(file)
      }
    }
    input.click()
  }

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Header */}
      <div className="bg-green-500 text-white p-4 relative">
        <button
          onClick={onBack}
          className="absolute left-4 top-4 text-white hover:text-gray-200"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold">Perfil</h1>
        </div>
        <button
          onClick={onNotificationClick}
          className="absolute right-4 top-4 text-white hover:text-gray-200 relative"
        >
          <Bell className="w-6 h-6" />
          {hasUnreadNotifications && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col items-center text-center">
            {/* Profile Photo */}
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {profilePhoto ? (
                  <img 
                    src={profilePhoto} 
                    alt="Foto do perfil" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <button 
                onClick={handlePhotoClick}
                className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full shadow-lg hover:bg-green-600 transition-colors"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{userName}</h2>
            <p className="text-gray-600">{userEmail}</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações Pessoais</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Nome</label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-800">{userName}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">E-mail</label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-800">{userEmail}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-800">{userPhone || 'Não informado'}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Endereço</label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-800">{userAddress || 'Não informado'}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ações</h3>
          
          {/* Alterar Senha */}
          <button 
            onClick={onChangePassword}
            className="w-full flex items-center justify-between py-3 px-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 transform hover:scale-[1.01] hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <Lock className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium text-blue-800">Alterar Senha</span>
            </div>
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Sair */}
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-between py-3 px-4 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 transform hover:scale-[1.01] hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
              <span className="font-medium text-red-800">Sair</span>
            </div>
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileScreen
