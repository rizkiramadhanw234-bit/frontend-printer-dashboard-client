import { create } from 'zustand'
import wsService from '../services/ws'

export const useWebSocketStore = create((set, get) => ({
  isConnected: false,
  connectionStatus: 'disconnected',
  lastMessage: null,
  lastUpdateTime: 0,
  error: null,

  connect: () => {
    const cleanupConnection = wsService.subscribeToConnection((data) => {
      if (data.type === 'connected') {
        set({ 
          isConnected: true, 
          connectionStatus: 'connected',
          error: null,
          lastUpdateTime: Date.now()
        })
      } else if (data.type === 'disconnected') {
        set({ 
          isConnected: false, 
          connectionStatus: 'disconnected',
          lastUpdateTime: Date.now()
        })
      } else if (data.type === 'error') {
        set({ 
          isConnected: false, 
          connectionStatus: 'error',
          error: data.error,
          lastUpdateTime: Date.now()
        })
      }
    })

    const cleanupPrinters = wsService.subscribeToPrinters((data) => {
      set({
        lastMessage: { ...data, receivedAt: new Date().toISOString() },
        lastUpdateTime: Date.now()
      })
    })

    return () => {
      cleanupConnection?.()
      cleanupPrinters?.()
    }
  },

  disconnect: () => {
    wsService.disconnect()
    set({
      isConnected: false,
      connectionStatus: 'disconnected',
      lastUpdateTime: Date.now()
    })
  },

  sendPrinterCommand: (command, printerName, data = {}) => {
    const now = Date.now()
    const lastUpdate = get().lastUpdateTime

    if (now - lastUpdate < 1000) {
      console.log('Rate limited')
      return false
    }

    set({ lastUpdateTime: now })
    return wsService.send({
      type: 'printer_command',
      command,
      printer: printerName,
      timestamp: new Date().toISOString(),
      ...data
    })
  },

  reset: () => {
    set({
      isConnected: false,
      connectionStatus: 'disconnected',
      lastMessage: null,
      lastUpdateTime: 0,
      error: null
    })
  }
}))