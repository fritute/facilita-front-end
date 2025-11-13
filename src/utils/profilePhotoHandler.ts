import { uploadImage } from '../services/uploadImageToAzure'
import { API_ENDPOINTS } from '../config/constants'

export const handleProfilePhotoUpload = async (
  file: File,
  loggedUser: any,
  setLoggedUser: (user: any) => void,
  showSuccess: (title: string, message: string) => void,
  showError: (title: string, message: string) => void
): Promise<boolean> => {
  try {
    console.log('📸 Iniciando upload da foto do perfil...')
    
    // 1. Upload para Azure Blob Storage
    console.log('☁️ Fazendo upload para Azure...')
    const imageUrl = await uploadImage(file)
    
    if (typeof imageUrl !== 'string') {
      showError('Erro no upload', 'Não foi possível fazer upload da imagem')
      return false
    }
    
    console.log('✅ Imagem enviada para Azure:', imageUrl)
    
    // 2. Atualizar perfil no backend com a URL da imagem
    const token = localStorage.getItem('authToken')
    if (!token) {
      showError('Erro de autenticação', 'Token não encontrado')
      return false
    }
    
    console.log('📤 Atualizando perfil no backend...')
    console.log('📤 URL da foto:', imageUrl)
    
    const payload = { foto_perfil: imageUrl }
    console.log('📦 Payload:', payload)
    
    const response = await fetch(API_ENDPOINTS.UPDATE_PROFILE, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    console.log('📥 Status da resposta:', response.status)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ Erro ao atualizar perfil:', errorData)
      showError('Erro ao atualizar', `Não foi possível atualizar a foto do perfil (${response.status})`)
      return false
    }
    
    console.log('✅ Perfil atualizado no backend')
    
    // 3. Buscar perfil atualizado do backend para confirmar
    const profileResponse = await fetch(API_ENDPOINTS.PROFILE, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    let finalPhotoUrl = imageUrl
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      console.log('📥 Perfil atualizado recebido:', profileData)
      console.log('📸 foto_perfil do backend:', profileData.foto_perfil)
      
      // Usar foto do backend se existir, senão usar a URL do Azure
      finalPhotoUrl = profileData.foto_perfil || imageUrl
    } else {
      console.warn('⚠️ Não foi possível buscar perfil, usando URL do Azure')
    }
    
    // 4. Atualizar estado local e localStorage
    const updatedUser = {
      ...loggedUser,
      foto: finalPhotoUrl
    }
    
    setLoggedUser(updatedUser)
    localStorage.setItem('loggedUser', JSON.stringify(updatedUser))
    console.log('✅ Foto salva localmente:', finalPhotoUrl)
    
    showSuccess('Foto atualizada', 'Sua foto de perfil foi atualizada!')
    return true
  } catch (error) {
    console.error('❌ Erro ao fazer upload da foto:', error)
    showError('Erro no upload', 'Ocorreu um erro ao fazer upload da foto')
    return false
  }
}
