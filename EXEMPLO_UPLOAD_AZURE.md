# 📤 Upload de Imagens para Azure Blob Storage

## 🚀 Como Usar

### Método 1: Função Simplificada (Recomendado)
```tsx
import { uploadImage } from './services/uploadImageToAzure'

// Em um componente React
const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (!file) return

  const result = await uploadImage(file)
  
  if (typeof result === 'string') {
    console.log('✅ URL da imagem:', result)
    // Usar a URL: result
  } else {
    console.error('❌ Erro no upload')
  }
}

// JSX
<input type="file" accept="image/*" onChange={handleUpload} />
```

### Método 2: Função Completa (Customizável)
```tsx
import { uploadImageToAzure } from './services/uploadImageToAzure'

const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (!file) return

  const uploadParams = {
    file: file,
    storageAccount: 'facilitafotos',
    sasToken: 'sp=racwl&st=2025-11-13T16:28:15Z&se=2025-12-07T00:43:15Z&sv=2024-11-04&sr=c&sig=bW5swH8DkIoXu3xJWptj4v%2FqoyEUVSjAHAUp0Bq56l4%3D',
    containerName: 'fotosfacilita',
  }

  const result = await uploadImageToAzure(uploadParams)
  
  if (typeof result === 'string') {
    console.log('✅ URL:', result)
  } else {
    console.error('❌ Erro')
  }
}
```

## 📋 Exemplo Completo de Componente

```tsx
import React, { useState } from 'react'
import { uploadImage } from './services/uploadImageToAzure'

export const ImageUploader: React.FC = () => {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const result = await uploadImage(file)
      
      if (typeof result === 'string') {
        setImageUrl(result)
        console.log('✅ Upload concluído:', result)
      } else {
        console.error('❌ Falha no upload')
      }
    } catch (error) {
      console.error('❌ Erro:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleUpload}
        disabled={uploading}
      />
      
      {uploading && <p>Enviando...</p>}
      
      {imageUrl && (
        <div>
          <p>✅ Upload concluído!</p>
          <img src={imageUrl} alt="Upload" style={{ maxWidth: '300px' }} />
          <p>URL: {imageUrl}</p>
        </div>
      )}
    </div>
  )
}
```

## 🔧 Configuração

### Dados do Azure
- **Storage Account**: `facilitafotos`
- **Container**: `fotosfacilita`
- **SAS Token**: Válido até 07/12/2025
- **URL Base**: `https://facilitafotos.blob.core.windows.net/fotosfacilita`

### Formato do Nome do Arquivo
```
{timestamp}-{nome-original}
Exemplo: 1699876543210-foto.jpg
```

## ✅ Retorno da Função

```typescript
// Sucesso: retorna URL pública da imagem
"https://facilitafotos.blob.core.windows.net/fotosfacilita/1699876543210-foto.jpg"

// Erro: retorna false
false
```

## 🎯 Tipos Suportados

A função aceita qualquer tipo de arquivo, mas é recomendado usar:
- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`

## 🔒 Segurança

⚠️ **IMPORTANTE**: O SAS Token expira em **07/12/2025**. Após essa data, será necessário gerar um novo token no Azure Portal.

## 📝 Notas

1. O nome do arquivo é prefixado com timestamp para evitar conflitos
2. O Content-Type é detectado automaticamente do arquivo
3. A função é assíncrona (use `await` ou `.then()`)
4. Em caso de erro, retorna `false` em vez de lançar exceção
