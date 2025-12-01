interface UploadParams {
  file: File
  storageAccount: string
  sasToken: string
  containerName: string
}

export async function uploadImageToAzure(uploadParams: UploadParams): Promise<string | boolean> {
  const { file, storageAccount, sasToken, containerName } = uploadParams

  // Iniciando upload para Azure Blob Storage

  const blobName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const baseUrl = `https://${storageAccount}.blob.core.windows.net/${containerName}/${blobName}`
  const uploadUrl = `${baseUrl}?${sasToken}`

  // Configurando upload

  const options = {
    method: "PUT",
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  }

  // Enviando arquivo para Azure

  try {
    const response = await fetch(uploadUrl, options)
    
    // Resposta do Azure recebida

    if (response.ok) {
      // Upload para Azure bem-sucedido
      return baseUrl
    } else {
      // Upload para Azure falhou
      
      return false
    }
  } catch (error) {
    // Erro de rede ao fazer upload para Azure
    return false
  }
}

// Configuração pré-definida para facilitar o uso
export const azureConfig = {
  storageAccount: import.meta.env?.VITE_AZURE_STORAGE_ACCOUNT || 'storage',
  sasToken: import.meta.env?.VITE_AZURE_SAS_TOKEN || '',
  containerName: import.meta.env?.VITE_AZURE_CONTAINER || 'images',
}

// Função simplificada para upload direto
export async function uploadImage(file: File): Promise<string | boolean> {
  // uploadImage chamada
  
  return uploadImageToAzure({
    file,
    ...azureConfig
  })
}
