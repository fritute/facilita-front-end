# ✅ ENDPOINTS DE RECARGA CONFIRMADOS

## 🎯 **Endpoints Corretos Configurados:**

### **1. Solicitar Recarga**
```
POST https://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net/v1/facilita/recarga/solicitar
```
**Payload:**
```json
{
  "valor": 200.00,
  "metodo": "PIX"
}
```

### **2. Confirmar Recarga (Webhook)**
```
POST https://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net/v1/facilita/pagamento/webhook
```
**Payload:**
```json
{
  "id": "recarga_id",
  "status": "PAID",
  "valor": 200.00
}
```

## 🔧 **Configuração no Código:**

### **constants.ts (Linha 53-56)**
```typescript
WALLET_RECHARGE: `${API_BASE_URL}/recarga/solicitar`,
PAYMENT_WEBHOOK: `${API_BASE_URL}/pagamento/webhook`,
```

### **App.tsx - Função requestRecharge()**
```typescript
const response = await fetch(API_ENDPOINTS.WALLET_RECHARGE, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    valor: rechargeAmount,
    metodo: 'PIX'
  })
})
```

### **App.tsx - Função confirmSandboxPayment()**
```typescript
const webhookResponse = await fetch(API_ENDPOINTS.PAYMENT_WEBHOOK, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: rechargeData.id,
    status: 'PAID',
    valor: rechargeAmount
  })
})
```

## ✅ **Status:**
- **Endpoints**: Corretos ✅
- **Payload**: Simplificado (só valor + método) ✅
- **Headers**: Authorization + Content-Type ✅
- **Métodos**: POST para ambos ✅

## 🚀 **Pronto para usar!**
A recarga de carteira está configurada corretamente com os endpoints fornecidos e payload mínimo necessário.
