// Serviço para gerenciar fluxo completo de pagamentos
import { facilitaApi } from './apiService'
import { notificationService } from './notificationService'
import { walletPersistenceService } from './walletPersistenceService'

export interface WalletData {
  id: number
  id_usuario: number
  chave_pagbank: string
  saldo: number
  data_criacao: string
}

export interface RechargeData {
  valor: number
  qr_code?: string
  qr_code_url?: string
  id_transacao?: string
}

export interface TransactionData {
  id_carteira: number
  tipo: 'ENTRADA' | 'SAIDA'
  valor: number
  descricao: string
}

export interface PaymentFlowResult {
  success: boolean
  data?: any
  message?: string
  nextStep?: string
  requiresRecharge?: boolean
}

class PaymentFlowService {
  
  /**
   * 1. Criar carteira digital
   */
  async createWallet(chavePagbank: string, saldoInicial: number = 0): Promise<PaymentFlowResult> {
    try {
      const walletData = {
        chave_pagbank: chavePagbank,
        saldo: saldoInicial
      }
      
      const response = await facilitaApi.createWallet(walletData)
      
      if (response.success) {
        const walletData = response.data as WalletData
        
        // Salvar carteira no localStorage
        walletPersistenceService.saveWalletData(
          walletData.id_usuario,
          walletData,
          walletData.saldo
        )
        
        notificationService.showSuccess(
          'Carteira criada',
          'Sua carteira digital foi criada com sucesso!'
        )
        
        return {
          success: true,
          data: response.data,
          nextStep: 'wallet-ready',
          message: 'Carteira criada com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao criar carteira'
      }
    } catch (error) {
      notificationService.showError('Erro', 'Falha ao criar carteira digital')
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 2. Obter dados da carteira
   */
  async getMyWallet(userId?: number): Promise<PaymentFlowResult> {
    try {
      // Primeiro tentar carregar do localStorage
      if (userId) {
        const localData = walletPersistenceService.loadWalletData(userId)
        if (localData) {
          console.log('💰 Carteira carregada do localStorage')
          return {
            success: true,
            data: localData.walletData,
            message: 'Carteira carregada do cache local'
          }
        }
      }
      
      // Se não encontrou localmente, buscar do servidor
      const response = await facilitaApi.getMyWallet()
      
      if (response.success) {
        const walletData = response.data as WalletData
        
        // Sincronizar com localStorage
        walletPersistenceService.syncWithServer(walletData)
        
        return {
          success: true,
          data: response.data,
          message: 'Carteira carregada com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao carregar carteira'
      }
    } catch (error) {
      // Em caso de erro de rede, tentar carregar do localStorage
      if (userId) {
        const localData = walletPersistenceService.loadWalletData(userId)
        if (localData) {
          console.log('📱 Usando dados locais devido a erro de rede')
          return {
            success: true,
            data: localData.walletData,
            message: 'Carteira carregada do cache local (offline)'
          }
        }
      }
      
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 3. Verificar se tem saldo suficiente
   */
  async checkSufficientBalance(serviceValue: number): Promise<PaymentFlowResult> {
    try {
      const walletResponse = await this.getMyWallet()
      
      if (!walletResponse.success) {
        return walletResponse
      }
      
      const wallet = walletResponse.data as WalletData
      const hasSufficientBalance = wallet.saldo >= serviceValue
      
      if (hasSufficientBalance) {
        return {
          success: true,
          data: { wallet, serviceValue, hasSufficientBalance: true },
          nextStep: 'payment-ready',
          message: 'Saldo suficiente para pagamento'
        }
      } else {
        const missingAmount = serviceValue - wallet.saldo
        
        notificationService.showWarning(
          'Saldo insuficiente',
          `Você precisa de mais R$ ${missingAmount.toFixed(2)} para pagar este serviço.`
        )
        
        return {
          success: false,
          data: { wallet, serviceValue, missingAmount, hasSufficientBalance: false },
          nextStep: 'recharge-needed',
          requiresRecharge: true,
          message: `Saldo insuficiente. Faltam R$ ${missingAmount.toFixed(2)}`
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao verificar saldo'
      }
    }
  }

  /**
   * 4. Solicitar recarga via PIX
   */
  async requestRecharge(valor: number): Promise<PaymentFlowResult> {
    try {
      const rechargeData = { valor }
      const response = await facilitaApi.requestRecharge(rechargeData)
      
      if (response.success) {
        notificationService.showInfo(
          'Recarga solicitada',
          'QR Code gerado. Escaneie para fazer o pagamento via PIX.'
        )
        
        return {
          success: true,
          data: response.data,
          nextStep: 'awaiting-payment',
          message: 'QR Code gerado para recarga'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao solicitar recarga'
      }
    } catch (error) {
      notificationService.showError('Erro', 'Falha ao solicitar recarga')
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 5. Pagar serviço com carteira
   */
  async payServiceWithWallet(serviceId: string | number): Promise<PaymentFlowResult> {
    try {
      const paymentData = {
        id_servico: Number(serviceId),
        servico_id: Number(serviceId), // Fallback caso a API use este campo
        metodo_pagamento: 'carteira',
        tipo_pagamento: 'CARTEIRA_DIGITAL'
      }
      
      const response = await facilitaApi.payWithWallet(paymentData)
      
      if (response.success) {
        // Atualizar saldo local após pagamento
        const paymentResult = response.data as any
        if (paymentResult?.novo_saldo !== undefined) {
          const userId = paymentResult.id_usuario || paymentResult.contratante?.id_usuario
          if (userId) {
            this.updateLocalBalance(userId, paymentResult.novo_saldo)
          }
        }
        
        notificationService.showSuccess(
          'Pagamento realizado',
          'Serviço pago com sucesso via carteira digital!'
        )
        
        return {
          success: true,
          data: response.data,
          nextStep: 'payment-completed',
          message: 'Pagamento realizado com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao processar pagamento'
      }
    } catch (error) {
      notificationService.showError('Erro', 'Falha ao processar pagamento')
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 6. Registrar transação manual
   */
  async createTransaction(transactionData: TransactionData): Promise<PaymentFlowResult> {
    try {
      const response = await facilitaApi.createTransaction(transactionData)
      
      if (response.success) {
        const tipoTexto = transactionData.tipo === 'ENTRADA' ? 'Crédito' : 'Débito'
        
        notificationService.showSuccess(
          'Transação registrada',
          `${tipoTexto} de R$ ${transactionData.valor.toFixed(2)} registrado com sucesso.`
        )
        
        return {
          success: true,
          data: response.data,
          message: 'Transação registrada com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao registrar transação'
      }
    } catch (error) {
      notificationService.showError('Erro', 'Falha ao registrar transação')
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 7. Obter histórico de transações
   */
  async getWalletTransactions(walletId: string): Promise<PaymentFlowResult> {
    try {
      const response = await facilitaApi.getWalletTransactions(walletId)
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Transações carregadas com sucesso'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Erro ao carregar transações'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erro de conexão'
      }
    }
  }

  /**
   * 8. Fluxo completo de pagamento
   */
  async executePaymentFlow(serviceId: string | number, serviceValue: number): Promise<PaymentFlowResult> {
    try {
      // 1. Verificar saldo suficiente
      const balanceCheck = await this.checkSufficientBalance(serviceValue)
      
      if (!balanceCheck.success) {
        // Se não tem saldo suficiente, retornar com opção de recarga
        return balanceCheck
      }
      
      // 2. Se tem saldo suficiente, processar pagamento
      const paymentResult = await this.payServiceWithWallet(serviceId)
      
      return paymentResult
      
    } catch (error) {
      notificationService.showError('Erro', 'Falha no fluxo de pagamento')
      return {
        success: false,
        message: 'Erro no fluxo de pagamento'
      }
    }
  }

  /**
   * 9. Fluxo de recarga automática
   */
  async executeRechargeFlow(missingAmount: number): Promise<PaymentFlowResult> {
    try {
      // Adicionar uma margem de segurança ao valor da recarga
      const rechargeAmount = Math.ceil(missingAmount * 1.1) // 10% a mais
      
      // Solicitar recarga
      const rechargeResult = await this.requestRecharge(rechargeAmount)
      
      if (rechargeResult.success) {
        return {
          success: true,
          data: rechargeResult.data,
          nextStep: 'awaiting-payment',
          message: `Recarga de R$ ${rechargeAmount.toFixed(2)} solicitada. Escaneie o QR Code para pagar.`
        }
      }
      
      return rechargeResult
      
    } catch (error) {
      notificationService.showError('Erro', 'Falha no fluxo de recarga')
      return {
        success: false,
        message: 'Erro no fluxo de recarga'
      }
    }
  }

  /**
   * 10. Verificar se carteira existe
   */
  async checkWalletExists(): Promise<PaymentFlowResult> {
    try {
      const response = await this.getMyWallet()
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          nextStep: 'wallet-ready',
          message: 'Carteira encontrada'
        }
      } else {
        return {
          success: false,
          nextStep: 'create-wallet',
          message: 'Carteira não encontrada. É necessário criar uma carteira.'
        }
      }
    } catch (error) {
      return {
        success: false,
        nextStep: 'create-wallet',
        message: 'Erro ao verificar carteira'
      }
    }
  }

  /**
   * 11. Fluxo completo: verificar carteira + pagamento
   */
  async executeCompletePaymentFlow(serviceId: string | number, serviceValue: number): Promise<PaymentFlowResult> {
    try {
      // 1. Verificar se carteira existe
      const walletCheck = await this.checkWalletExists()
      
      if (!walletCheck.success) {
        notificationService.showWarning(
          'Carteira necessária',
          'Você precisa criar uma carteira digital para pagar serviços.'
        )
        return walletCheck
      }
      
      // 2. Executar fluxo de pagamento
      return await this.executePaymentFlow(serviceId, serviceValue)
      
    } catch (error) {
      notificationService.showError('Erro', 'Falha no fluxo completo de pagamento')
      return {
        success: false,
        message: 'Erro no fluxo completo de pagamento'
      }
    }
  }

  /**
   * 12. Atualizar saldo localmente
   */
  updateLocalBalance(userId: number, newBalance: number): void {
    walletPersistenceService.updateBalance(newBalance)
    console.log(`💰 Saldo local atualizado para usuário ${userId}: R$ ${newBalance.toFixed(2)}`)
  }

  /**
   * 13. Obter saldo local
   */
  getLocalBalance(): number {
    return walletPersistenceService.loadBalance()
  }

  /**
   * 14. Verificar se tem dados locais
   */
  hasLocalWallet(userId?: number): boolean {
    return walletPersistenceService.hasWalletData(userId)
  }

  /**
   * 15. Limpar dados locais
   */
  clearLocalWallet(userId?: number): void {
    walletPersistenceService.clearWalletData(userId)
  }

  /**
   * 16. Migrar dados antigos
   */
  migrateOldWalletData(): void {
    walletPersistenceService.migrateOldData()
  }

  /**
   * 17. Obter resumo da carteira
   */
  getWalletSummary(): {
    hasWallet: boolean
    balance: number
    lastUpdate: string | null
    userId: number | null
  } {
    return walletPersistenceService.getWalletSummary()
  }

  /**
   * 18. Sincronizar saldo após transação
   */
  async syncBalanceAfterTransaction(userId: number, transactionValue: number, transactionType: 'ENTRADA' | 'SAIDA'): Promise<void> {
    try {
      const currentBalance = this.getLocalBalance()
      const newBalance = transactionType === 'ENTRADA' 
        ? currentBalance + transactionValue 
        : currentBalance - transactionValue

      this.updateLocalBalance(userId, newBalance)
      
      console.log(`💳 Saldo sincronizado após ${transactionType}: R$ ${newBalance.toFixed(2)}`)
    } catch (error) {
      console.error('Erro ao sincronizar saldo:', error)
    }
  }
}

export const paymentFlowService = new PaymentFlowService()
export default paymentFlowService
