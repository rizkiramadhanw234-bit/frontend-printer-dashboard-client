import { useEffect } from 'react'
import { useWebSocketStore } from '../store/ws.store'

export const useWebSocket = () => {
  const { 
    isConnected, 
    connectionStatus, 
    lastMessage, 
    error, 
    connect, 
    disconnect, 
    sendPrinterCommand 
  } = useWebSocketStore()

  useEffect(() => {
    const cleanup = connect()
    return () => {
      cleanup?.()
      disconnect()
    }
  }, [])

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    error,
    sendPrinterCommand
  }
}