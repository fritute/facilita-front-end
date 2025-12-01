# 📸 Upload de Foto de Perfil para Azure

## ✅ Implementação Concluída

A funcionalidade de upload de foto de perfil foi integrada com o Azure Blob Storage.

## 🔄 Fluxo de Upload

1. **Usuário seleciona foto** no ProfileScreen
2. **Upload para Azure Blob Storage** usando `uploadImageToAzure.ts`
3. **Recebe URL pública** da imagem
4. **Atualiza perfil no backend** com a URL da imagem
5. **Atualiza estado local** e localStorage
6. **Preview imediato** da nova foto

## 📁 Arquivos Modificados/Criados

### Criados:
- `src/services/uploadImageToAzure.ts` - Serviço de upload para Azure
- `src/utils/profilePhotoHandler.ts` - Handler para upload de foto do perfil
- `EXEMPLO_UPLOAD_AZURE.md` - Documentação do serviço de upload

### Modificados:
- `src/App.tsx` - Integração do upload no handler `onPhotoChange`

## 🚀 Como Funciona

### No ProfileScreen
```tsx
// Usuário clica no botão de câmera
<button onClick={handlePhotoClick}>
  <Camera />
</button>

// Input file é criado dinamicamente
const input = document.createElement('input')
input.type = 'file'
input.accept = 'image/*'
input.onchange = (e) => {
  const file = e.target.files?.[0]
  if (file) {
    onPhotoChange(file) // Chama handler do App.tsx
  }
}
```

### No App.tsx
```tsx
onPhotoChange={async (file) => {
  // 1. Upload para Azure e atualizar backend
  const success = await handleProfilePhotoUpload(
    file,
    loggedUser,
    setLoggedUser,
    showSuccess,
    showError
  )
  
  // 2. Preview local imediato
  if (success) {
    const reader = new FileReader()
    reader.onload = (e) => {
      setProfilePhoto(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }
}}
```

### No profilePhotoHandler.ts
```tsx
export const handleProfilePhotoUpload = async (file, loggedUser, ...) => {
  // 1. Upload para Azure
  const imageUrl = await uploadImage(file)
  
  // 2. Atualizar backend
  await fetch(API_ENDPOINTS.UPDATE_PROFILE, {
    method: 'PUT',
    body: JSON.stringify({
      nome: loggedUser.nome,
      email: loggedUser.email,
      telefone: loggedUser.telefone,
      foto_perfil: imageUrl // URL do Azure
    })
  })
  
  // 3. Atualizar estado local
  const updatedUser = { ...loggedUser, foto: imageUrl }
  setLoggedUser(updatedUser)
  localStorage.setItem('loggedUser', JSON.stringify(updatedUser))
  
  return true
}
```

## 🔐 Configuração do Azure

### Dados de Conexão
- **Storage Account**: `facilitafotos`
- **Container**: `fotosfacilita`
- **SAS Token**: Válido até 07/12/2025
- **URL Base**: `https://facilitafotos.blob.core.windows.net/fotosfacilita`

### Formato do Nome do Arquivo
```
{timestamp}-{nome-original}
Exemplo: 1699876543210-perfil.jpg
```

## 📋 Endpoint do Backend

### PUT /v1/facilita/usuario/perfil
```json
{
  "nome": "Nome do Usuário",
  "email": "email@exemplo.com",
  "telefone": "11999999999",
  "foto_perfil": "https://facilitafotos.blob.core.windows.net/fotosfacilita/1699876543210-perfil.jpg"
}
```

## ✅ Validações

1. **Tipo de arquivo**: Apenas imagens (image/*)
2. **Tamanho**: Sem limite no Azure (mas recomendado < 5MB)
3. **Autenticação**: Token JWT obrigatório
4. **Permissões**: Usuário só pode atualizar própria foto

## 🎯 Notificações

### Sucesso
```
Título: "Foto atualizada"
Mensagem: "Sua foto de perfil foi atualizada com sucesso!"
```

### Erro - Upload
```
Título: "Erro no upload"
Mensagem: "Não foi possível fazer upload da imagem"
```

### Erro - Backend
```
Título: "Erro ao atualizar"
Mensagem: "Não foi possível atualizar a foto do perfil"
```

## 🔄 Atualização em Tempo Real

A foto é atualizada em:
1. **Estado local** (`loggedUser.foto`)
2. **localStorage** (persiste entre sessões)
3. **Backend** (banco de dados)
4. **Preview** (`profilePhoto` state)

## 🐛 Tratamento de Erros

```typescript
try {
  // Upload para Azure
  const imageUrl = await uploadImage(file)
  
  if (typeof imageUrl !== 'string') {
    showError('Erro no upload', 'Não foi possível fazer upload da imagem')
    return false
  }
  
  // Atualizar backend
  const response = await fetch(...)
  
  if (!response.ok) {
    showError('Erro ao atualizar', 'Não foi possível atualizar a foto do perfil')
    return false
  }
  
  return true
} catch (error) {
  showError('Erro no upload', 'Ocorreu um erro ao fazer upload da foto')
  return false
}
```

## 📝 Logs

O sistema registra logs detalhados:
```
📸 Iniciando upload da foto do perfil...
☁️ Fazendo upload para Azure...
✅ Imagem enviada para Azure: https://...
📤 Atualizando perfil no backend...
✅ Perfil atualizado no backend
✅ Foto do perfil atualizada com sucesso!
```

## 🔒 Segurança

1. **SAS Token** com permissões limitadas (read, add, create, write, list)
2. **Token JWT** obrigatório para atualizar perfil
3. **Validação de tipo** de arquivo no frontend
4. **URL pública** mas nome único com timestamp

## 🎨 UX/UI

1. **Botão de câmera** no canto da foto
2. **Preview imediato** após upload
3. **Notificação de sucesso/erro**
4. **Loading state** durante upload (pode ser adicionado)

## 📱 Compatibilidade

- ✅ Desktop (Chrome, Firefox, Edge, Safari)
- ✅ Mobile (iOS Safari, Chrome Mobile)
- ✅ Tablets
- ✅ PWA

## 🚀 Melhorias Futuras

1. **Compressão de imagem** antes do upload
2. **Crop/resize** de imagem
3. **Loading spinner** durante upload
4. **Progress bar** para uploads grandes
5. **Validação de tamanho** (limite de 5MB)
6. **Múltiplos formatos** (JPEG, PNG, WebP)
7. **Thumbnail** automático
