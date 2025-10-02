# 📱 Como testar a videochamada no celular

## 🚀 **Configuração para teste mobile**

### 1️⃣ **Iniciar servidor para rede local**

```bash
npm run dev-mobile
```

**Ou alternativamente:**
```bash
npm run dev
```

### 2️⃣ **Acessar no celular**

**Seu IP local:** `10.107.144.12`

**URLs para testar:**
- **Principal:** `http://10.107.144.12:3000`
- **Alternativa:** `http://10.107.144.12:5173` (se usar npm run dev)

---

## 📲 **Passo a passo no celular:**

### **Preparação:**
1. **Conecte o celular** na mesma rede Wi-Fi do Mac
2. **Abra o navegador** no celular (Chrome/Safari)
3. **Digite o IP:** `http://10.107.144.12:3000`

### **Teste da videochamada:**
1. **Navegue até** Service Tracking
2. **Clique em** "Conversar"
3. **Clique no ícone** 📹 de vídeo
4. **Permita** câmera e microfone quando solicitado
5. **Videochamada iniciada!**

---

## 🔄 **Cenários de teste:**

### **Cenário 1: Duas pessoas, dois dispositivos**
- **Mac:** Acesse `http://localhost:5173`
- **Celular:** Acesse `http://10.107.144.12:3000`
- **Ambos:** Entrem na mesma sala de vídeo

### **Cenário 2: Mesmo dispositivo, duas abas**
- **Aba 1:** Inicie videochamada
- **Aba 2:** Copie o link que aparece no chat
- **Resultado:** Duas câmeras na mesma chamada

### **Cenário 3: Cliente vs Prestador**
- **Mac (Cliente):** Inicia videochamada
- **Celular (Prestador):** Recebe link no chat
- **Ambos:** Conectados na videochamada

---

## 🛠️ **Troubleshooting:**

### **❌ Não consegue acessar no celular?**

1. **Verifique a rede Wi-Fi:**
```bash
# No Mac, confirme seu IP:
ifconfig | grep "inet " | grep -v 127.0.0.1
```

2. **Teste conectividade:**
```bash
# No celular, acesse primeiro:
http://10.107.144.12:3000/ping
```

3. **Firewall do Mac:**
   - **Sistema** → **Configurações** → **Rede** → **Firewall**
   - **Desabilite temporariamente** para teste

### **❌ Câmera não funciona no celular?**

1. **Permissões do navegador:**
   - **Chrome:** Configurações → Privacidade → Configurações do site → Câmera
   - **Safari:** Configurações → Safari → Câmera

2. **HTTPS necessário:**
   - Alguns navegadores exigem HTTPS para câmera
   - Use **ngrok** se necessário (veja abaixo)

### **❌ Audio/vídeo com problemas?**

1. **Qualidade da rede Wi-Fi**
2. **Feche outros apps** que usam câmera
3. **Teste em rede 4G/5G** se Wi-Fi estiver lenta

---

## 🌐 **Alternativa com HTTPS (ngrok):**

### **Se precisar de HTTPS:**

1. **Instale ngrok:**
```bash
brew install ngrok
```

2. **Inicie o túnel:**
```bash
# Em um terminal separado:
ngrok http 3000
```

3. **Use a URL HTTPS:**
```
https://abc123.ngrok.io
```

---

## 🎯 **Fluxo de teste recomendado:**

### **Teste 1: Funcionalidade básica**
1. **Celular:** Acesse o app
2. **Navegue** pelas telas
3. **Teste** responsividade
4. **Verifique** se tudo carrega

### **Teste 2: Chat**
1. **Abra** o chat
2. **Envie** mensagens
3. **Teste** scroll e interface

### **Teste 3: Videochamada solo**
1. **Inicie** videochamada no celular
2. **Teste** controles (mute, câmera)
3. **Verifique** se sua imagem aparece

### **Teste 4: Videochamada com duas pessoas**
1. **Mac:** Inicia chamada
2. **Celular:** Entra via link do chat
3. **Teste** comunicação real

---

## 📊 **Monitoramento:**

### **Console do navegador (celular):**
- **Chrome:** Menu → Mais ferramentas → Ferramentas do desenvolvedor
- **Safari:** Configurações → Avançado → Inspetor web

### **Logs importantes:**
```
✅ Entrou na videochamada
👤 Participante entrou
🔴 Erro ao acessar câmera
```

---

## 🎉 **Resultado esperado:**

- ✅ **App carrega** no celular
- ✅ **Interface responsiva** funciona
- ✅ **Chat** funciona normalmente
- ✅ **Videochamada** conecta entre dispositivos
- ✅ **Câmera do celular** aparece na chamada
- ✅ **Audio bidirecional** funcionando

---

**🚀 Comando para iniciar:**
```bash
npm run dev-mobile
```

**📱 URL no celular:**
```
http://10.107.144.12:3000
```

**Agora teste a videochamada entre Mac e celular!** 🎯
