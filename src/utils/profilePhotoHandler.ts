import { uploadImage } from '../services/uploadImageToAzure'
import { API_ENDPOINTS } from '../config/constants'

// Log de debug para verificar configuração
console.log('🔧 ProfilePhotoHandler carregado')
console.log('🔗 Endpoint de atualização:', API_ENDPOINTS.UPDATE_PROFILE)

// Função auxiliar para validar URL da imagem do Azure
const validateImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const isAzureBlob = url.includes('blob.core.windows.net')
    const isValidAzure = url.includes('facilitafotos.blob.core.windows.net')
    
    console.log('🔍 Validando URL da imagem:')
    console.log('   URL:', url)
    console.log('   HTTPS:', isHttps)
    console.log('   Azure Blob:', isAzureBlob)
    console.log('   Azure válido:', isValidAzure)
    
    return isHttps && isAzureBlob && isValidAzure
  } catch (error) {
    console.error('❌ Erro ao validar URL:', error)
    return false
  }
}

export const handleProfilePhotoUpload = async (
  file: File,
  loggedUser: any,
  setLoggedUser: (user: any) => void,
  showSuccess: (title: string, message: string) => void,
  showError: (title: string, message: string) => void
): Promise<boolean> => {
  try {
    console.log('📸 Iniciando upload da foto do perfil...')
    console.log('📁 Arquivo:', file.name, 'Tamanho:', (file.size / 1024).toFixed(2), 'KB')
    
    // 1. Upload para Azure Blob Storage
    console.log('☁️ Fazendo upload para Azure...')
    const imageUrl = await uploadImage(file)
    
    if (typeof imageUrl !== 'string') {
      console.error('❌ Upload para Azure falhou:', imageUrl)
      showError('Erro no upload', 'Não foi possível fazer upload da imagem para o Azure')
      return false
    }
    
    console.log('✅ Imagem enviada para Azure com sucesso!')
    console.log('🔗 URL da imagem no Azure:', imageUrl)
    
    // 2. Atualizar perfil no backend com a URL da imagem
    const token = localStorage.getItem('authToken')
    if (!token) {
      console.error('❌ Token de autenticação não encontrado')
      showError('Erro de autenticação', 'Token não encontrado. Faça login novamente.')
      return false
    }
    
    console.log('📤 Enviando URL da foto para o backend...')
    console.log('🔗 URL que será enviada:', imageUrl)
    console.log('👤 Usuário:', loggedUser?.nome)
    
    // CORREÇÃO: Enviar apenas a URL da foto, não todos os dados do usuário
    const payload = {
      foto_perfil: imageUrl
    }
    
    console.log('📦 Payload enviado para o backend:', payload)
    console.log('🌐 Endpoint:', API_ENDPOINTS.UPDATE_PROFILE)
    
    const response = await fetch(API_ENDPOINTS.UPDATE_PROFILE, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    console.log('📥 Status da resposta do backend:', response.status)
    console.log('📥 Response OK:', response.ok)
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido')
      console.error('❌ Erro ao atualizar perfil no backend:')
      console.error('   Status:', response.status)
      console.error('   Resposta:', errorText)
      console.error('   URL enviada:', imageUrl)
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      
      // Se erro 500, pode ser problema no servidor
      if (response.status === 500) {
        console.error('❌ Erro 500: Problema no servidor backend')
        showError('Erro no servidor', 'Problema no servidor. A foto foi enviada para o Azure, mas não foi salva no perfil.')
      } else if (response.status === 401 || response.status === 403) {
        console.error('❌ Erro de autenticação')
        showError('Erro de autenticação', 'Sessão expirada. Faça login novamente.')
      } else {
        showError('Erro ao atualizar', `Não foi possível atualizar a foto do perfil (${response.status}): ${errorData.message || 'Erro desconhecido'}`)
      }
      
      return false
    }
    
    console.log('✅ Foto enviada para o backend com sucesso!')
    
    // 3. Verificar se o backend salvou corretamente buscando o perfil atualizado
    console.log('🔍 Verificando se a foto foi salva no backend...')
    
    const profileResponse = await fetch(API_ENDPOINTS.PROFILE, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    let finalPhotoUrl = imageUrl // Usar URL do Azure como padrão
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      console.log('📥 Perfil verificado:')
      console.log('   Nome:', profileData.nome)
      console.log('   Email:', profileData.email)
      console.log('   Foto no backend:', profileData.foto_perfil ? 'Presente' : 'Ausente')
      
      if (profileData.foto_perfil) {
        console.log('✅ Foto confirmada no backend:', profileData.foto_perfil.substring(0, 50) + '...')
        finalPhotoUrl = profileData.foto_perfil
      } else {
        console.warn('⚠️ Foto não encontrada no backend, usando URL do Azure')
      }
    } else {
      console.warn('⚠️ Não foi possível verificar o perfil, usando URL do Azure')
      console.warn('   Status da verificação:', profileResponse.status)
    }
    
    // 4. Atualizar estado local e localStorage com a URL final
    const updatedUser = {
      ...loggedUser,
      foto: finalPhotoUrl
    }
    
    setLoggedUser(updatedUser)
    localStorage.setItem('loggedUser', JSON.stringify(updatedUser))
    
    console.log('✅ Upload completo!')
    console.log('🔗 URL final salva:', finalPhotoUrl)
    console.log('💾 Usuário atualizado no localStorage')
    
    showSuccess('Foto atualizada', 'Sua foto de perfil foi atualizada com sucesso!')
    return true
    
  } catch (error) {
    console.error('❌ Erro inesperado ao fazer upload da foto:', error)
    showError('Erro no upload', 'Ocorreu um erro inesperado ao fazer upload da foto. Tente novamente.')
    return false
  }
}
