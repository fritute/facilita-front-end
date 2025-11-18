// Componente para mostrar status da conexão WebSocket
import React from 'react'
import { Wifi, WifiOff } from 'lucide-react'

interface WebSocketStatusProps {
  isConnected: boolean
  className?: string
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ isConnected, className = '' }) => {
  const isWhiteText = className.includes('text-white')
  
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {isConnected ? (
        <>
          <Wifi className={`w-3 h-3 ${isWhiteText ? 'text-green-300' : 'text-green-500'}`} />
          <span className={`text-xs ${isWhiteText ? 'text-green-200' : 'text-green-600'}`}>
            Tempo real
          </span>
        </>
      ) : (
        <>
          <WifiOff className={`w-3 h-3 ${isWhiteText ? 'text-orange-300' : 'text-orange-500'}`} />
          <span className={`text-xs ${isWhiteText ? 'text-orange-200' : 'text-orange-600'}`}>
            Offline
          </span>
        </>
      )}
    </div>
  )
}

export default WebSocketStatus
