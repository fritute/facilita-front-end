# Instruções para Adicionar Decoração na Tela de Cadastro

## ✅ Telas já corrigidas:
- **Login**: Decoração adicionada com sucesso ✓
- **Recuperação de senha**: Decoração adicionada com sucesso ✓

## 📝 Para adicionar na tela de CADASTRO:

### Localização no arquivo:
Procure por `if (currentScreen === 'cadastro')` no arquivo `App.tsx` (aproximadamente linha 3190)

### Passo 1: Encontre esta linha:
```jsx
<div className="flex-1 p-4 md:p-8 w-full xl:max-w-lg xl:ml-[15%] xl:mt-[10%]  order-2 xl:order-1">
```

### Passo 2: Substitua por:
```jsx
<div className="flex-1 p-4 md:p-8 w-full max-w-2xl mx-auto order-2 xl:order-1 flex flex-col justify-center relative overflow-hidden">
```

### Passo 3: Logo após essa linha, ANTES do `<h2>`, adicione:
```jsx
<img
  src="./Vector copy.png"
  alt="Decoração"
  className="absolute top-0 right-0 transform -scale-x-100 opacity-20 w-64 h-auto pointer-events-none"
/>
```

### Passo 4: No `<h2>` e na `<div>` do formulário, adicione `relative z-10`:
```jsx
<h2 className="text-xl md:text-2xl text-white font-bold mb-6 md:mb-8 relative z-10">Cadastro</h2>

<div className="space-y-4 md:space-y-6 relative z-10">
```

## 🎨 Resultado esperado:
A tela de cadastro terá a mesma decoração sutil no canto superior direito, igual às telas de login e recuperação de senha.

## ✨ Benefícios aplicados:
- Decoração visual consistente em todas as telas
- Layout responsivo e centralizado
- Elementos não saem mais da tela
- Melhor proporção em mobile e desktop
