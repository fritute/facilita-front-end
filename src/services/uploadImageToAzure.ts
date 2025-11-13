interface UploadParams {
  file: File
  storageAccount: string
  sasToken: string
  containerName: string
}

export async function uploadImageToAzure(uploadParams: UploadParams): Promise<string | boolean> {
  const { file, storageAccount, sasToken, containerName } = uploadParams

  const blobName = `${Date.now()}-${file.name}`
  const baseUrl = `https://${storageAccount}.blob.core.windows.net/${containerName}/${blobName}`
  const uploadUrl = `${baseUrl}?${sasToken}`

  const options = {
    method: "PUT",
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  }

  const response = await fetch(uploadUrl, options)

  if (response.ok) {
    return baseUrl
  } else {
    return response.ok
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
  return uploadImageToAzure({
    file,
    ...azureConfig
  })
}
