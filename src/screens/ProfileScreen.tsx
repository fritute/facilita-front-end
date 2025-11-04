import React, { useState, useEffect } from 'react'
import { ArrowLeft, Bell, User, Camera, Lock, LogOut, Edit2, Check, X, Trash2 } from 'lucide-react'

interface ProfileScreenProps {
  userName: string
  userEmail: string
  userPhone: string
  userAddress: string
  profilePhoto: string | null
  notificationsEnabled: boolean
  onBack: () => void
  onPhotoChange: (file: File) => void
  onChangePassword: () => void
  onLogout: () => void
  onDeleteAccount: () => void
  onUpdateProfile: (name: string, email: string) => Promise<void>
  onToggleNotifications: (enabled: boolean) => void
  isDarkMode?: boolean
  themeClasses?: any
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userName,
  userEmail,
  userPhone,
  userAddress,
  profilePhoto,
  notificationsEnabled,
  onBack,
  onPhotoChange,
  onChangePassword,
  onLogout,
  onDeleteAccount,
  onUpdateProfile,
  onToggleNotifications,
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
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [editedName, setEditedName] = useState(userName)
  const [editedEmail, setEditedEmail] = useState(userEmail)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)

  // Atualizar os estados quando as props mudarem
  useEffect(() => {
    setEditedName(userName)
    setEditedEmail(userEmail)
  }, [userName, userEmail])

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

  const handleSaveChanges = async () => {
    if (!editedName.trim() || !editedEmail.trim()) {
      setUpdateError('Nome e email são obrigatórios')
      return
    }

    setIsUpdating(true)
    setUpdateError('')
    setUpdateSuccess(false)
    
    try {
      await onUpdateProfile(editedName.trim(), editedEmail.trim())
      setIsEditingName(false)
      setIsEditingEmail(false)
      setUpdateSuccess(true)
      
      // Esconder mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setUpdateSuccess(false)
      }, 3000)
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error)
      setUpdateError(error.message || 'Erro ao atualizar perfil. Tente novamente.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedName(userName)
    setEditedEmail(userEmail)
    setIsEditingName(false)
    setIsEditingEmail(false)
    setUpdateError('')
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg} overflow-x-hidden`}>
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
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        {/* Profile Header */}
        <div className={`${themeClasses.bgCard} rounded-xl shadow-lg p-6 md:p-8`}>
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
            <h2 className={`text-2xl font-bold ${themeClasses.text} mb-1`}>{editedName}</h2>
            <p className={themeClasses.textSecondary}>{editedEmail}</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className={`${themeClasses.bgCard} rounded-xl shadow-lg p-6 md:p-8 space-y-4`}>
          <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Informações Pessoais</h3>
          
          {/* Error Message */}
          {updateError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {updateError}
            </div>
          )}

          {/* Success Message */}
          {updateSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Perfil atualizado com sucesso!
            </div>
          )}

          {/* Nome */}
          <div>
            <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Nome</label>
            <div className="relative">
              {isEditingName ? (
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className={`w-full p-3 ${themeClasses.bgSecondary} rounded-lg border-2 border-green-500 focus:outline-none ${themeClasses.text}`}
                  autoFocus
                />
              ) : (
                <div className={`p-3 ${themeClasses.bgSecondary} rounded-lg flex items-center justify-between`}>
                  <p className={themeClasses.text}>{editedName}</p>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-gray-400 hover:text-green-500 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* E-mail */}
          <div>
            <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>E-mail</label>
            <div className="relative">
              {isEditingEmail ? (
                <input
                  type="email"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  className={`w-full p-3 ${themeClasses.bgSecondary} rounded-lg border-2 border-green-500 focus:outline-none ${themeClasses.text}`}
                />
              ) : (
                <div className={`p-3 ${themeClasses.bgSecondary} rounded-lg flex items-center justify-between`}>
                  <p className={themeClasses.text}>{editedEmail}</p>
                  <button
                    onClick={() => setIsEditingEmail(true)}
                    className="text-gray-400 hover:text-green-500 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          {(isEditingName || isEditingEmail) && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveChanges}
                disabled={isUpdating}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                {isUpdating ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isUpdating}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Cancelar
              </button>
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Telefone</label>
            <div className={`p-3 ${themeClasses.bgSecondary} rounded-lg`}>
              <p className={themeClasses.text}>{userPhone || 'Não informado'}</p>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Endereço</label>
            <div className={`p-3 ${themeClasses.bgSecondary} rounded-lg`}>
              <p className={themeClasses.text}>{userAddress || 'Não informado'}</p>
            </div>
          </div>
        </div>

        {/* Other Configurations */}
        <div className={`${themeClasses.bgCard} rounded-xl shadow-lg p-6 md:p-8 space-y-4`}>
          <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Outras Configurações</h3>
          
          {/* Notificações */}
          <div className={`flex items-center justify-between py-3 px-4 ${themeClasses.bgSecondary} rounded-lg`}>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <Bell className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <span className={`font-medium ${themeClasses.text} block`}>Notificações</span>
                <span className={`text-xs ${themeClasses.textSecondary}`}>Receber alertas e avisos</span>
              </div>
            </div>
            <button
              onClick={() => onToggleNotifications(!notificationsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationsEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className={`${themeClasses.bgCard} rounded-xl shadow-lg p-6 md:p-8 space-y-3`}>
          <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Ações</h3>
          
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

          {/* Deletar Conta */}
          <button 
            onClick={onDeleteAccount}
            className="w-full flex items-center justify-between py-3 px-4 bg-gray-50 hover:bg-gray-100 border-2 border-red-200 hover:border-red-300 rounded-lg transition-all duration-200 transform hover:scale-[1.01] hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center mr-3">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-left">
                <span className="font-medium text-red-800 block">Deletar Conta</span>
                <span className="text-xs text-red-600">Esta ação é irreversível</span>
              </div>
            </div>
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileScreen
