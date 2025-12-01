// Serviço para persistir dados da carteira digital no localStorage
import { WalletData } from './paymentFlowService'

interface PersistedWalletData {
  walletData: WalletData
  saldo: number
  lastUpdate: string
  userId: number
}

class WalletPersistenceService {
  private readonly WALLET_KEY = 'facilita_wallet_data'
  private readonly BALANCE_KEY = 'facilita_wallet_balance'
  private readonly USER_WALLETS_KEY = 'facilita_user_wallets'

  /**
   * Salvar dados da carteira no localStorage
   */
  saveWalletData(userId: number, walletData: WalletData, saldo: number): void {
    try {
      const persistedData: PersistedWalletData = {
        walletData,
        saldo,
        lastUpdate: new Date().toISOString(),
        userId
      }

      // Salvar dados principais da carteira
      localStorage.setItem(this.WALLET_KEY, JSON.stringify(persistedData))
      
      // Salvar saldo separadamente para acesso rápido
      localStorage.setItem(this.BALANCE_KEY, saldo.toString())
      
      // Salvar no histórico de carteiras por usuário
      this.saveToUserWallets(userId, persistedData)
      
      console.log('💾 Carteira salva no localStorage:', { userId, saldo })
    } catch (error) {
      console.error('Erro ao salvar carteira:', error)
    }
  }

  /**
   * Carregar dados da carteira do localStorage
   */
  loadWalletData(userId?: number): PersistedWalletData | null {
    try {
      const savedData = localStorage.getItem(this.WALLET_KEY)
      
      if (!savedData) {
        console.log('📭 Nenhuma carteira encontrada no localStorage')
        return null
      }

      const persistedData: PersistedWalletData = JSON.parse(savedData)
      
      // Se userId foi fornecido, verificar se é do usuário correto
      if (userId && persistedData.userId !== userId) {
        console.log('👤 Carteira de outro usuário encontrada, buscando carteira específica...')
        return this.loadUserWallet(userId)
      }

      console.log('💰 Carteira carregada do localStorage:', {
        userId: persistedData.userId,
        saldo: persistedData.saldo,
        lastUpdate: persistedData.lastUpdate
      })

      return persistedData
    } catch (error) {
      console.error('Erro ao carregar carteira:', error)
      return null
    }
  }

  /**
   * Carregar apenas o saldo
   */
  loadBalance(): number {
    try {
      const savedBalance = localStorage.getItem(this.BALANCE_KEY)
      return savedBalance ? parseFloat(savedBalance) : 0
    } catch (error) {
      console.error('Erro ao carregar saldo:', error)
      return 0
    }
  }

  /**
   * Atualizar apenas o saldo
   */
  updateBalance(newBalance: number): void {
    try {
      localStorage.setItem(this.BALANCE_KEY, newBalance.toString())
      
      // Atualizar também nos dados completos se existirem
      const savedData = localStorage.getItem(this.WALLET_KEY)
      if (savedData) {
        const persistedData: PersistedWalletData = JSON.parse(savedData)
        persistedData.saldo = newBalance
        persistedData.lastUpdate = new Date().toISOString()
        localStorage.setItem(this.WALLET_KEY, JSON.stringify(persistedData))
      }
      
      console.log('💰 Saldo atualizado:', newBalance)
    } catch (error) {
      console.error('Erro ao atualizar saldo:', error)
    }
  }

  /**
   * Salvar carteira específica do usuário
   */
  private saveToUserWallets(userId: number, walletData: PersistedWalletData): void {
    try {
      const userWallets = this.getUserWallets()
      userWallets[userId] = walletData
      localStorage.setItem(this.USER_WALLETS_KEY, JSON.stringify(userWallets))
    } catch (error) {
      console.error('Erro ao salvar carteira do usuário:', error)
    }
  }

  /**
   * Carregar carteira específica do usuário
   */
  private loadUserWallet(userId: number): PersistedWalletData | null {
    try {
      const userWallets = this.getUserWallets()
      return userWallets[userId] || null
    } catch (error) {
      console.error('Erro ao carregar carteira do usuário:', error)
      return null
    }
  }

  /**
   * Obter todas as carteiras de usuários
   */
  private getUserWallets(): Record<number, PersistedWalletData> {
    try {
      const saved = localStorage.getItem(this.USER_WALLETS_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch (error) {
      console.error('Erro ao obter carteiras dos usuários:', error)
      return {}
    }
  }

  /**
   * Verificar se existe carteira salva
   */
  hasWalletData(userId?: number): boolean {
    if (userId) {
      const userWallets = this.getUserWallets()
      return !!userWallets[userId]
    }
    
    return !!localStorage.getItem(this.WALLET_KEY)
  }

  /**
   * Limpar dados da carteira
   */
  clearWalletData(userId?: number): void {
    try {
      if (userId) {
        // Limpar carteira específica do usuário
        const userWallets = this.getUserWallets()
        delete userWallets[userId]
        localStorage.setItem(this.USER_WALLETS_KEY, JSON.stringify(userWallets))
        
        // Se for o usuário atual, limpar também os dados principais
        const currentData = this.loadWalletData()
        if (currentData && currentData.userId === userId) {
          localStorage.removeItem(this.WALLET_KEY)
          localStorage.removeItem(this.BALANCE_KEY)
        }
      } else {
        // Limpar todos os dados
        localStorage.removeItem(this.WALLET_KEY)
        localStorage.removeItem(this.BALANCE_KEY)
        localStorage.removeItem(this.USER_WALLETS_KEY)
      }
      
      console.log('🗑️ Dados da carteira limpos')
    } catch (error) {
      console.error('Erro ao limpar dados da carteira:', error)
    }
  }

  /**
   * Sincronizar com dados do servidor
   */
  syncWithServer(serverWalletData: WalletData): void {
    try {
      const userId = serverWalletData.id_usuario
      const serverBalance = serverWalletData.saldo
      
      // Verificar se há dados locais
      const localData = this.loadWalletData(userId)
      
      if (!localData) {
        // Não há dados locais, salvar dados do servidor
        this.saveWalletData(userId, serverWalletData, serverBalance)
        console.log('🔄 Dados do servidor salvos localmente')
        return
      }

      // Comparar timestamps para decidir qual usar
      const localTime = new Date(localData.lastUpdate).getTime()
      const serverTime = new Date(serverWalletData.data_criacao).getTime()
      
      if (serverTime > localTime) {
        // Dados do servidor são mais recentes
        this.saveWalletData(userId, serverWalletData, serverBalance)
        console.log('🔄 Dados locais atualizados com dados do servidor')
      } else {
        // Dados locais são mais recentes ou iguais
        console.log('📱 Mantendo dados locais (mais recentes)')
      }
    } catch (error) {
      console.error('Erro ao sincronizar com servidor:', error)
    }
  }

  /**
   * Obter resumo dos dados persistidos
   */
  getWalletSummary(): {
    hasWallet: boolean
    balance: number
    lastUpdate: string | null
    userId: number | null
  } {
    const data = this.loadWalletData()
    
    return {
      hasWallet: !!data,
      balance: data?.saldo || 0,
      lastUpdate: data?.lastUpdate || null,
      userId: data?.userId || null
    }
  }

  /**
   * Migrar dados antigos se necessário
   */
  migrateOldData(): void {
    try {
      // Verificar se há dados antigos em outras chaves
      const oldWalletKey = 'walletData'
      const oldBalanceKey = 'walletBalance'
      
      const oldWallet = localStorage.getItem(oldWalletKey)
      const oldBalance = localStorage.getItem(oldBalanceKey)
      
      if (oldWallet || oldBalance) {
        console.log('🔄 Migrando dados antigos da carteira...')
        
        if (oldWallet) {
          try {
            const walletData = JSON.parse(oldWallet)
            const balance = oldBalance ? parseFloat(oldBalance) : walletData.saldo || 0
            
            if (walletData.id_usuario) {
              this.saveWalletData(walletData.id_usuario, walletData, balance)
            }
          } catch (e) {
            console.error('Erro ao migrar dados antigos:', e)
          }
        }
        
        // Remover dados antigos
        localStorage.removeItem(oldWalletKey)
        localStorage.removeItem(oldBalanceKey)
        
        console.log('✅ Migração concluída')
      }
    } catch (error) {
      console.error('Erro na migração:', error)
    }
  }
}

export const walletPersistenceService = new WalletPersistenceService()
export default walletPersistenceService
