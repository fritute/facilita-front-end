import React from 'react'
import { ArrowLeft, FileText } from 'lucide-react'

interface Order {
  id: string
  descricao: string
  status: string
  preco: number
  createdAt: string
  origem?: string
  destino?: string
}

interface OrdersScreenProps {
  orders: Order[]
  loading: boolean
  onBack: () => void
  onRefresh: () => void
  getStatusColor: (status: string) => string
  formatStatus: (status: string) => string
}

const OrdersScreen: React.FC<OrdersScreenProps> = ({
  orders,
  loading,
  onBack,
  onRefresh,
  getStatusColor,
  formatStatus
}) => {
  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Header */}
      <div className="bg-green-500 text-white p-4 relative">
        <button
          onClick={onBack}
          className="absolute left-4 top-4 text-white hover:text-gray-200"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold">Meus Pedidos</h1>
        </div>
        <button
          onClick={onRefresh}
          className="absolute right-4 top-4 text-white hover:text-gray-200 transition-colors"
          disabled={loading}
          title="Atualizar pedidos"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando seus pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-600 mb-6">Você ainda não fez nenhum pedido. Que tal começar agora?</p>
            <button
              onClick={onBack}
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              Fazer Primeiro Pedido
            </button>
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Histórico de Pedidos</h2>
              </div>
              <span className="text-sm text-gray-600">{orders.length} pedido(s)</span>
            </div>

            {orders.map((order, index) => {
              const isActive = order.status === 'EM_ANDAMENTO' || order.status === 'PENDENTE'
              
              return (
                <div key={order.id || index} className={`bg-white rounded-lg shadow-md p-4 md:p-6 hover:shadow-lg transition-shadow border border-gray-200 ${
                  isActive ? 'ring-2 ring-orange-200 bg-gradient-to-r from-orange-50 to-transparent' : ''
                } relative`}>
                  {/* Indicador de pedido ativo */}
                  {isActive && (
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                      {order.status === 'EM_ANDAMENTO' ? '🚚 A CAMINHO' : '⏳ PENDENTE'}
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {order.descricao || 'Serviço'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          getStatusColor(order.status || 'PENDENTE')
                        }`}>
                          {formatStatus(order.status || 'PENDENTE')}
                        </span>
                      </div>
                      
                      {order.id && (
                        <p className="text-sm text-gray-600 mb-2 truncate">ID: {order.id}</p>
                      )}
                      
                      {order.createdAt && (
                        <p className="text-sm text-gray-600 mb-2">
                          Data: {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                      
                      {(order.origem || order.destino) && (
                        <div className="text-sm text-gray-600 space-y-1">
                          {order.origem && (
                            <p className="truncate">📍 <strong>De:</strong> {order.origem}</p>
                          )}
                          {order.destino && (
                            <p className="truncate">📍 <strong>Para:</strong> {order.destino}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-green-600">
                        R$ {order.preco?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersScreen
