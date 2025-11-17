interface UploadParams {
  file: File
  storageAccount: string
  sasToken: string
  containerName: string
}

export async function uploadImageToAzure(uploadParams: UploadParams): Promise<string | boolean> {
  const { file, storageAccount, sasToken, containerName } = uploadParams

  console.log('🚀 Iniciando upload para Azure Blob Storage')
  console.log('📁 Arquivo:', file.name, 'Tipo:', file.type, 'Tamanho:', (file.size / 1024).toFixed(2), 'KB')
  console.log('🏢 Storage Account:', storageAccount)
  console.log('📦 Container:', containerName)
  console.log('🔑 SAS Token presente:', sasToken ? 'Sim' : 'Não')

  const blobName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const baseUrl = `https://${storageAccount}.blob.core.windows.net/${containerName}/${blobName}`
  const uploadUrl = `${baseUrl}?${sasToken}`

  console.log('🔗 Nome do blob:', blobName)
  console.log('🔗 URL base:', baseUrl)
  console.log('🔗 URL de upload:', uploadUrl.substring(0, 100) + '...')

  const options = {
    method: "PUT",
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  }

  console.log('📤 Enviando arquivo para Azure...')
  console.log('📜 Headers:', options.headers)

  try {
    const response = await fetch(uploadUrl, options)
    
    console.log('📥 Resposta do Azure:')
    console.log('   Status:', response.status)
    console.log('   Status Text:', response.statusText)
    console.log('   OK:', response.ok)

    if (response.ok) {
      console.log('✅ Upload para Azure bem-sucedido!')
      console.log('🔗 URL da imagem:', baseUrl)
      return baseUrl
    } else {
      console.error('❌ Upload para Azure falhou:')
      console.error('   Status:', response.status)
      console.error('   Status Text:', response.statusText)
      
      // Tentar ler o corpo da resposta para mais detalhes
      try {
        const errorText = await response.text()
        console.error('   Detalhes do erro:', errorText)
      } catch (e) {
        console.error('   Não foi possível ler detalhes do erro')
      }
      
      return false
    }
  } catch (error) {
    console.error('❌ Erro de rede ao fazer upload para Azure:', error)
    return false
  }
}

// Configuração pré-definida para facilitar o uso
export const azureConfig = {
  storageAccount: 'facilitafotos',
  sasToken: 'sp=racwl&st=2025-11-13T16:28:15Z&se=2025-12-07T00:43:15Z&sv=2024-11-04&sr=c&sig=bW5swH8DkIoXu3xJWptj4v%2FqoyEUVSjAHAUp0Bq56l4%3D',
  containerName: 'fotosfacilita',
}

// Função simplificada para upload direto
export async function uploadImage(file: File): Promise<string | boolean> {
  console.log('📸 uploadImage chamada com arquivo:', file.name)
  console.log('🔧 Usando configuração:', {
    storageAccount: azureConfig.storageAccount,
    containerName: azureConfig.containerName,
    sasTokenPresent: azureConfig.sasToken ? 'Sim' : 'Não'
  })
  
  return uploadImageToAzure({
    file,
    ...azureConfig
  })
}
