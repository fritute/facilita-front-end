import { uploadImage } from '../services/uploadImageToAzure'
import { API_ENDPOINTS } from '../config/constants'

// ProfilePhotoHandler carregado


export const handleProfilePhotoUpload = async (
  file: File,
  loggedUser: any,
  setLoggedUser: (user: any) => void,
  showSuccess: (title: string, message: string) => void,
  showError: (title: string, message: string) => void
): Promise<boolean> => {
  try {
    // Iniciando upload da foto do perfil
    
    // Upload para Azure Blob Storage
    const imageUrl = await uploadImage(file)
    
    if (typeof imageUrl !== 'string') {
      // Upload para Azure falhou
      showError('Erro no upload', 'Não foi possível fazer upload da imagem para o Azure')
      return false
    }
    
    // Imagem enviada para Azure com sucesso
    
    // 2. Atualizar perfil no backend com a URL da imagem
    const token = localStorage.getItem('authToken')
    if (!token) {
      // Token de autenticação não encontrado
      showError('Erro de autenticação', 'Token não encontrado. Faça login novamente.')
      return false
    }
    
    // Enviando URL da foto para o backend
    
    // CORREÇÃO: Enviar apenas a URL da foto, não todos os dados do usuário
    const payload = {
      foto_perfil: imageUrl
    }
    
    // Payload enviado para o backend
    
    const response = await fetch(API_ENDPOINTS.UPDATE_PROFILE, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    // Status da resposta do backend
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido')
      // Erro ao atualizar perfil no backend
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      
      // Se erro 500, pode ser problema no servidor
      if (response.status === 500) {
        // Erro 500: Problema no servidor backend
        showError('Erro no servidor', 'Problema no servidor. A foto foi enviada para o Azure, mas não foi salva no perfil.')
      } else if (response.status === 401 || response.status === 403) {
        // Erro de autenticação
        showError('Erro de autenticação', 'Sessão expirada. Faça login novamente.')
      } else {
        showError('Erro ao atualizar', `Não foi possível atualizar a foto do perfil (${response.status}): ${errorData.message || 'Erro desconhecido'}`)
      }
      
      return false
    }
    
    // Foto enviada para o backend com sucesso
    
    // Verificar se o backend salvou corretamente
    
    const profileResponse = await fetch(API_ENDPOINTS.PROFILE, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    let finalPhotoUrl = imageUrl // Usar URL do Azure como padrão
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      // Perfil verificado
      
      if (profileData.foto_perfil) {
        // Foto confirmada no backend
        finalPhotoUrl = profileData.foto_perfil
      } else {
        // Foto não encontrada no backend, usando URL do Azure
      }
    } else {
      // Não foi possível verificar o perfil, usando URL do Azure
    }
    
    // 4. Atualizar estado local e localStorage com a URL final
    const updatedUser = {
      ...loggedUser,
      foto: finalPhotoUrl
    }
    
    setLoggedUser(updatedUser)
    localStorage.setItem('loggedUser', JSON.stringify(updatedUser))
    
    // Upload completo
    
    showSuccess('Foto atualizada', 'Sua foto de perfil foi atualizada com sucesso!')
    return true
    
  } catch (error) {
    // Erro inesperado ao fazer upload da foto
    showError('Erro no upload', 'Ocorreu um erro inesperado ao fazer upload da foto. Tente novamente.')
    return false
  }
}
